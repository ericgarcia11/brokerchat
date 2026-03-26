"""Webhook processing task: the main async pipeline."""

import asyncio
import uuid

from app.core.celery_app import celery_app
from app.core.logging import get_logger
from app.domain.enums.enums import (
    AcaoRoteamento,
    LinhaNegocio,
    Provedor,
    StatusChat,
    StatusEnvio,
)
from app.providers.uazapi.mapper import parse_webhook
from app.workers.db import AsyncSessionFactory

logger = get_logger(__name__)


def _run_async(coro):
    """Helper to run async code from sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _process_webhook(event_id: str, conexao_id: str) -> None:
    from app.repositories.conexao import ConexaoRepository
    from app.repositories.evento_webhook import EventoWebhookRepository
    from app.services.contact import ContactService
    from app.services.chat import ChatService
    from app.services.message import MessageService
    from app.services.webhook_event import WebhookEventService
    from app.services.routing import RoutingService
    from app.services.opportunity import OpportunityService
    from app.services.agent_execution import AgentExecutionService
    from app.services.uazapi import UazapiService
    from app.repositories.crud import AgenteIARepository

    async with AsyncSessionFactory() as session:
        try:
            event_repo = EventoWebhookRepository(session)
            event = await event_repo.get_by_id(uuid.UUID(event_id))
            if not event:
                logger.error("webhook_event_not_found", event_id=event_id)
                return

            conexao_repo = ConexaoRepository(session)
            conexao = await conexao_repo.get_by_id(uuid.UUID(conexao_id))
            if not conexao:
                logger.error("conexao_not_found", conexao_id=conexao_id)
                return

            # Parse webhook payload
            parsed = parse_webhook(event.payload)

            # Skip if from_me or not a message event
            if parsed["from_me"] or parsed["event_type"] != "message":
                webhook_svc = WebhookEventService(session)
                await webhook_svc.mark_ignored(event.id)
                await session.commit()
                return

            sender_phone = parsed["sender_phone"]
            if not sender_phone:
                logger.warning("webhook_no_sender_phone", event_id=event_id)
                webhook_svc = WebhookEventService(session)
                await webhook_svc.mark_ignored(event.id)
                await session.commit()
                return

            # Find or create contact
            contact_svc = ContactService(session)
            contato, _ = await contact_svc.find_or_create(
                empresa_id=conexao.empresa_id,
                telefone_e164=sender_phone,
                nome=parsed["sender_name"],
                whatsapp_id=sender_phone,
                origem="whatsapp",
            )

            # Cancel any active cadence for this lead and capture the configured action
            acao_cadencia: str | None = None
            try:
                from app.services.cadence import CadenceService
                cadence_svc = CadenceService(session)
                acao_cadencia = await cadence_svc.handle_lead_response(
                    contato_id=contato.id,
                    empresa_id=conexao.empresa_id,
                )
            except Exception as _ce:
                logger.warning("cadence_check_error", error=str(_ce))

            # Check for active chat
            chat_svc = ChatService(session)
            chat = await chat_svc.get_active_chat(
                empresa_id=conexao.empresa_id,
                contato_id=contato.id,
                conexao_id=conexao.id,
            )

            msg_svc = MessageService(session)

            if chat:
                # Save message to existing chat
                await msg_svc.save_inbound(
                    chat_id=chat.id,
                    texto=parsed["message_text"],
                    tipo=parsed["message_type"],
                    provedor=Provedor.UAZAPI,
                    mensagem_externa_id=parsed["event_id"],
                    mensagem_pai_externa_id=parsed["quoted_id"],
                    midia_url=parsed["media_url"],
                    payload=parsed["raw"],
                )
                await chat_svc.update_last_message(chat.id)

                # Apply cadence action when lead responds (e.g. hand off to human)
                if acao_cadencia in ("notificar_responsavel", "transferir_humano"):
                    await chat_svc.handoff_to_human(chat.id)
                    logger.info("cadence_action_handoff", acao=acao_cadencia, chat_id=str(chat.id))

                # If chat has an agent and is not waiting for human, run agent
                if (
                    chat.agente_ia_id
                    and chat.status in (StatusChat.ABERTO, StatusChat.AGUARDANDO_LEAD)
                    and acao_cadencia not in ("notificar_responsavel", "transferir_humano")
                ):
                    agente_repo = AgenteIARepository(session)
                    agente = await agente_repo.get_by_id(chat.agente_ia_id)
                    if agente and agente.ativo:
                        agent_svc = AgentExecutionService(session)
                        result = await agent_svc.run(chat, agente, parsed["message_text"] or "")

                        # Send response back
                        if result.get("response_text"):
                            uazapi_svc = UazapiService(session)
                            await uazapi_svc.send_text(
                                conexao=conexao,
                                phone=sender_phone,
                                chat_id=chat.id,
                                text=result["response_text"],
                            )
            else:
                # Evaluate routing rules
                routing_svc = RoutingService()
                decision = routing_svc.evaluate(
                    conexao=conexao,
                    message_text=parsed["message_text"],
                    contact=contato,
                    has_active_chat=False,
                )

                if decision.acao == AcaoRoteamento.IGNORAR:
                    webhook_svc = WebhookEventService(session)
                    await webhook_svc.mark_ignored(event.id)
                    await session.commit()
                    return

                # Create opportunity
                opp_svc = OpportunityService(session)
                linha = LinhaNegocio.VENDA  # default
                if decision.equipe_destino_id:
                    # Could query equipe to get linha, using default for now
                    pass
                opp, _ = await opp_svc.get_or_create(
                    empresa_id=conexao.empresa_id,
                    contato_id=contato.id,
                    linha_negocio=linha,
                    filial_id=conexao.filial_id,
                    equipe_id=decision.equipe_destino_id,
                    conexao_origem_id=conexao.id,
                    origem="whatsapp",
                )

                # Open chat
                status_chat = StatusChat.ABERTO
                if decision.acao == AcaoRoteamento.ENCAMINHAR_HUMANO:
                    status_chat = StatusChat.AGUARDANDO_HUMANO

                chat = await chat_svc.open_chat(
                    empresa_id=conexao.empresa_id,
                    contato_id=contato.id,
                    conexao_id=conexao.id,
                    filial_id=conexao.filial_id,
                    equipe_id=decision.equipe_destino_id,
                    agente_ia_id=decision.agente_ia_destino_id,
                    oportunidade_id=opp.id,
                    status=status_chat,
                    origem_abertura="webhook",
                )

                # Save the inbound message
                await msg_svc.save_inbound(
                    chat_id=chat.id,
                    texto=parsed["message_text"],
                    tipo=parsed["message_type"],
                    provedor=Provedor.UAZAPI,
                    mensagem_externa_id=parsed["event_id"],
                    midia_url=parsed["media_url"],
                    payload=parsed["raw"],
                )
                await chat_svc.update_last_message(chat.id)

                # Apply cadence action when lead responds (e.g. hand off to human)
                if acao_cadencia in ("notificar_responsavel", "transferir_humano"):
                    await chat_svc.handoff_to_human(chat.id)
                    logger.info("cadence_action_handoff", acao=acao_cadencia, chat_id=str(chat.id))

                # Run agent if applicable
                if (
                    decision.acao == AcaoRoteamento.ABRIR_CHAT
                    and decision.agente_ia_destino_id
                    and acao_cadencia not in ("notificar_responsavel", "transferir_humano")
                ):
                    agente_repo = AgenteIARepository(session)
                    agente = await agente_repo.get_by_id(decision.agente_ia_destino_id)
                    if agente and agente.ativo:
                        agent_svc = AgentExecutionService(session)
                        result = await agent_svc.run(chat, agente, parsed["message_text"] or "")

                        if result.get("response_text"):
                            uazapi_svc = UazapiService(session)
                            await uazapi_svc.send_text(
                                conexao=conexao,
                                phone=sender_phone,
                                chat_id=chat.id,
                                text=result["response_text"],
                            )

            # Mark event processed
            webhook_svc = WebhookEventService(session)
            await webhook_svc.mark_processed(event.id)
            await session.commit()

        except Exception as e:
            logger.error("webhook_processing_error", event_id=event_id, error=str(e), exc_info=True)
            try:
                webhook_svc = WebhookEventService(session)
                await webhook_svc.mark_error(uuid.UUID(event_id))
                await session.commit()
            except Exception:
                pass
            raise


@celery_app.task(
    name="app.workers.tasks.webhook.process_webhook_event",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def process_webhook_event(self, event_id: str, conexao_id: str) -> None:
    try:
        _run_async(_process_webhook(event_id, conexao_id))
    except Exception as exc:
        logger.error("webhook_task_retry", event_id=event_id, error=str(exc))
        self.retry(exc=exc)
