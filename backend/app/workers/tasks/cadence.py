"""Cadence step execution task — drives the outbound follow-up sequence."""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from app.core.celery_app import celery_app
from app.core.logging import get_logger
from app.workers.db import AsyncSessionFactory

logger = get_logger(__name__)


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _execute_step(execucao_id: str, step_index: int) -> None:
    from app.domain.enums.enums import StatusCadenceExecucao
    from app.repositories.cadence import CadenceExecucaoRepository
    from app.repositories.conexao import ConexaoRepository
    from app.repositories.contato import ContatoRepository
    from app.services.uazapi import UazapiService

    async with AsyncSessionFactory() as session:
        repo = CadenceExecucaoRepository(session)
        execucao = await repo.get_by_id(uuid.UUID(execucao_id))

        if not execucao:
            logger.error("cadence_execucao_not_found", execucao_id=execucao_id)
            return

        current_status = (
            execucao.status.value
            if hasattr(execucao.status, "value")
            else execucao.status
        )
        if current_status != StatusCadenceExecucao.ATIVA.value:
            logger.info(
                "cadence_step_skipped_inactive",
                execucao_id=execucao_id,
                status=current_status,
            )
            return

        # Idempotency guard: skip if this step was already sent (prevents double-send
        # when Redis task is still alive AND the recovery Beat task also fires it)
        if execucao.step_atual >= step_index:
            logger.info(
                "cadence_step_already_sent",
                execucao_id=execucao_id,
                step_index=step_index,
                step_atual=execucao.step_atual,
            )
            return

        fluxo = execucao.fluxo
        steps: list[dict] = fluxo.steps or []

        # Resolve the message to send for this step
        if step_index == 0:
            mensagem = fluxo.mensagem_inicial
        else:
            step_data = next(
                (s for s in steps if s.get("ordem") == step_index),
                steps[step_index - 1] if step_index - 1 < len(steps) else None,
            )
            if not step_data:
                # No more steps — mark as concluded
                await repo.update_fields(
                    execucao.id,
                    status=StatusCadenceExecucao.CONCLUIDA.value,
                    encerrada_em=datetime.now(timezone.utc),
                )
                await session.commit()
                logger.info("cadence_finished_no_more_steps", execucao_id=execucao_id)
                return
            mensagem = step_data.get("mensagem", "")

        if not mensagem:
            logger.warning("cadence_empty_message", execucao_id=execucao_id, step_index=step_index)

        # Fetch conexao and contato
        conexao_repo = ConexaoRepository(session)
        conexao = await conexao_repo.get_by_id(execucao.conexao_id)
        if not conexao:
            logger.error("cadence_conexao_not_found", conexao_id=str(execucao.conexao_id))
            return

        contato_repo = ContatoRepository(session)
        contato = await contato_repo.get_by_id(execucao.contato_id)
        if not contato:
            logger.error("cadence_contato_not_found", contato_id=str(execucao.contato_id))
            return

        if contato.opt_out:
            logger.info("cadence_opt_out_skipped", contato_id=str(contato.id))
            await repo.update_fields(
                execucao.id,
                status=StatusCadenceExecucao.CANCELADA.value,
                encerrada_em=datetime.now(timezone.utc),
            )
            await session.commit()
            return

        # Send message
        uazapi_svc = UazapiService(session)
        try:
            await uazapi_svc.adapter.send_text(
                token=conexao.token_ref or "",
                phone=contato.telefone_e164,
                text=mensagem,
            )
            logger.info("cadence_message_sent", execucao_id=execucao_id, step_index=step_index)
        except Exception as exc:
            logger.error("cadence_send_failed", execucao_id=execucao_id, error=str(exc))
            raise

        # Update current step
        await repo.update_fields(execucao.id, step_atual=step_index)

        # Schedule next step
        next_index = step_index + 1
        next_step_data = next(
            (s for s in steps if s.get("ordem") == next_index),
            steps[next_index - 1] if next_index - 1 < len(steps) else None,
        )

        if next_step_data:
            delay = int(next_step_data.get("delay_segundos", 86400))
            proximo_em = datetime.now(timezone.utc) + timedelta(seconds=delay)
            task = execute_cadence_step.apply_async(
                args=[execucao_id, next_index],
                countdown=delay,
            )
            await repo.update_fields(
                execucao.id,
                proximo_celery_task_id=task.id,
                proximo_step_em=proximo_em,
            )
            logger.info(
                "cadence_next_step_scheduled",
                execucao_id=execucao_id,
                next_index=next_index,
                delay_segundos=delay,
                proximo_em=proximo_em.isoformat(),
            )
        else:
            # Last step was just sent — mark as concluded
            await repo.update_fields(
                execucao.id,
                status=StatusCadenceExecucao.CONCLUIDA.value,
                encerrada_em=datetime.now(timezone.utc),
                proximo_celery_task_id=None,
                proximo_step_em=None,
            )
            logger.info("cadence_finished", execucao_id=execucao_id)

        await session.commit()


@celery_app.task(
    name="app.workers.tasks.cadence.execute_cadence_step",
    bind=True,
    max_retries=3,
    default_retry_delay=120,
    acks_late=True,
)
def execute_cadence_step(self, execucao_id: str, step_index: int) -> None:
    try:
        _run_async(_execute_step(execucao_id, step_index))
    except Exception as exc:
        logger.error(
            "cadence_step_task_error",
            execucao_id=execucao_id,
            step_index=step_index,
            error=str(exc),
        )
        self.retry(exc=exc)
