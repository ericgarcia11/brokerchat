"""Cadence execution service — starts, cancels and handles lead-response actions."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery_app import celery_app
from app.core.logging import get_logger
from app.domain.enums.enums import StatusCadenceExecucao
from app.domain.models.models import CadenceExecucao
from app.repositories.cadence import CadenceExecucaoRepository, CadenceFluxoRepository

logger = get_logger(__name__)


class CadenceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.fluxo_repo = CadenceFluxoRepository(session)
        self.exec_repo = CadenceExecucaoRepository(session)

    async def iniciar_execucao(
        self,
        fluxo_id: uuid.UUID,
        empresa_id: uuid.UUID,
        contato_id: uuid.UUID,
        conexao_id: uuid.UUID,
        oportunidade_id: uuid.UUID | None = None,
    ) -> CadenceExecucao:
        fluxo = await self.fluxo_repo.get_by_id(fluxo_id)
        if not fluxo or not fluxo.ativo:
            raise ValueError(f"Fluxo {fluxo_id} não encontrado ou inativo")

        execucao = CadenceExecucao(
            fluxo_id=fluxo_id,
            empresa_id=empresa_id,
            contato_id=contato_id,
            conexao_id=conexao_id,
            oportunidade_id=oportunidade_id,
            step_atual=-1,  # nada enviado ainda
            status=StatusCadenceExecucao.ATIVA,
        )
        await self.exec_repo.create(execucao)
        await self.session.flush()

        # Schedule step 0 (mensagem_inicial) immediately
        from app.workers.tasks.cadence import execute_cadence_step

        task = execute_cadence_step.apply_async(
            args=[str(execucao.id), 0],
            countdown=0,
        )
        await self.exec_repo.update_fields(
            execucao.id,
            proximo_celery_task_id=task.id,
            # Fonte de verdade para recuperação pós-rebuild
            proximo_step_em=datetime.now(timezone.utc),
        )
        logger.info("cadence_started", execucao_id=str(execucao.id), fluxo_id=str(fluxo_id))
        return execucao

    async def cancelar_execucao(self, execucao_id: uuid.UUID) -> CadenceExecucao | None:
        execucao = await self.exec_repo.get_by_id(execucao_id)
        if not execucao:
            return None
        if execucao.status != StatusCadenceExecucao.ATIVA:
            return execucao

        if execucao.proximo_celery_task_id:
            celery_app.control.revoke(execucao.proximo_celery_task_id, terminate=True)
            logger.info("cadence_task_revoked", task_id=execucao.proximo_celery_task_id)

        return await self.exec_repo.update_fields(
            execucao_id,
            status=StatusCadenceExecucao.CANCELADA.value,
            encerrada_em=datetime.now(timezone.utc),
        )

    async def handle_lead_response(
        self,
        contato_id: uuid.UUID,
        empresa_id: uuid.UUID,
    ) -> str | None:
        """
        Called when a lead sends a message.
        Cancels the active cadência (if any) and returns its ação configured for this step.
        Returns None if no active cadência exists.
        Possible return values: continuar_ia | notificar_responsavel | encerrar_cadencia | transferir_humano
        """
        execucao = await self.exec_repo.get_ativa_by_contato(contato_id, empresa_id)
        if not execucao:
            return None

        fluxo = execucao.fluxo
        steps = fluxo.steps or []
        step_atual = execucao.step_atual

        # Determine the action for the current step, falling back to the fluxo global
        acao: str = fluxo.acao_resposta if isinstance(fluxo.acao_resposta, str) else fluxo.acao_resposta.value
        if step_atual >= 1:
            step_data = next((s for s in steps if s.get("ordem") == step_atual), None)
            if step_data and step_data.get("acao_se_responder"):
                acao = step_data["acao_se_responder"]

        await self.cancelar_execucao(execucao.id)
        logger.info(
            "cadence_cancelled_by_response",
            execucao_id=str(execucao.id),
            contato_id=str(contato_id),
            acao=acao,
        )
        return acao
