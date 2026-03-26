"""Message sending tasks."""

import asyncio
import uuid

from app.core.celery_app import celery_app
from app.core.logging import get_logger
from app.domain.enums.enums import StatusEnvio
from app.workers.db import AsyncSessionFactory

logger = get_logger(__name__)


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _send_outbound(msg_id: str, conexao_id: str, phone: str) -> None:
    from app.repositories.conexao import ConexaoRepository
    from app.repositories.mensagem import MensagemRepository
    from app.services.uazapi import UazapiService
    from app.services.message import MessageService

    async with AsyncSessionFactory() as session:
        msg_repo = MensagemRepository(session)
        msg = await msg_repo.get_by_id(uuid.UUID(msg_id))
        if not msg:
            logger.error("outbound_msg_not_found", msg_id=msg_id)
            return

        conexao_repo = ConexaoRepository(session)
        conexao = await conexao_repo.get_by_id(uuid.UUID(conexao_id))
        if not conexao:
            logger.error("conexao_not_found", conexao_id=conexao_id)
            return

        uazapi_svc = UazapiService(session)
        msg_svc = MessageService(session)

        try:
            if msg.midia_url:
                result = await uazapi_svc.adapter.send_media(
                    token=conexao.token_ref or "",
                    phone=phone,
                    media_url=msg.midia_url,
                    caption=msg.texto,
                )
            elif msg.texto:
                result = await uazapi_svc.adapter.send_text(
                    token=conexao.token_ref or "",
                    phone=phone,
                    text=msg.texto,
                )
            else:
                logger.warning("outbound_no_content", msg_id=msg_id)
                return

            external_id = result.get("key", {}).get("id") or result.get("id")
            await msg_svc.update_status(
                msg.id, StatusEnvio.ENVIADA,
                external_id=str(external_id) if external_id else None,
            )
            await session.commit()
            logger.info("outbound_sent", msg_id=msg_id, external_id=external_id)

        except Exception as e:
            await msg_svc.update_status(msg.id, StatusEnvio.FALHA)
            await session.commit()
            logger.error("outbound_send_failed", msg_id=msg_id, error=str(e))
            raise


@celery_app.task(
    name="app.workers.tasks.message.send_outbound_message",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def send_outbound_message(self, msg_id: str, conexao_id: str, phone: str) -> None:
    try:
        _run_async(_send_outbound(msg_id, conexao_id, phone))
    except Exception as exc:
        logger.error("outbound_task_retry", msg_id=msg_id, error=str(exc))
        self.retry(exc=exc)
