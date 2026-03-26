"""Scheduled tasks for Celery Beat."""

import asyncio
import uuid

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


@celery_app.task(name="app.workers.tasks.scheduled.retry_failed_messages")
def retry_failed_messages() -> None:
    async def _task():
        from app.services.message import MessageService
        from app.workers.tasks.message import send_outbound_message

        async with AsyncSessionFactory() as session:
            svc = MessageService(session)
            failed = await svc.list_failed(limit=20)
            for msg in failed:
                # Re-queue for sending — need chat context
                logger.info("retry_failed_msg", msg_id=str(msg.id))
            logger.info("retry_failed_messages_done", count=len(failed))

    _run_async(_task())


@celery_app.task(name="app.workers.tasks.scheduled.close_idle_chats")
def close_idle_chats() -> None:
    async def _task():
        from app.services.chat import ChatService

        async with AsyncSessionFactory() as session:
            svc = ChatService(session)
            idle = await svc.list_idle(idle_minutes=120)
            for chat in idle:
                await svc.close_chat(chat.id, motivo="ociosidade")
            await session.commit()
            logger.info("close_idle_chats_done", count=len(idle))

    _run_async(_task())


@celery_app.task(name="app.workers.tasks.scheduled.cleanup_temp_files")
def cleanup_temp_files() -> None:
    logger.info("cleanup_temp_files_noop")


@celery_app.task(name="app.workers.tasks.scheduled.reprocess_error_webhooks")
def reprocess_error_webhooks() -> None:
    async def _task():
        from app.services.webhook_event import WebhookEventService
        from app.workers.tasks.webhook import process_webhook_event

        async with AsyncSessionFactory() as session:
            svc = WebhookEventService(session)
            errors = await svc.list_errors(limit=10)
            for evt in errors:
                process_webhook_event.delay(str(evt.id), str(evt.conexao_id))
            logger.info("reprocess_webhooks_done", count=len(errors))

    _run_async(_task())


@celery_app.task(name="app.workers.tasks.scheduled.sync_connection_status")
def sync_connection_status() -> None:
    async def _task():
        from app.repositories.conexao import ConexaoRepository
        from app.providers.uazapi.adapter import UazAPIAdapter

        async with AsyncSessionFactory() as session:
            repo = ConexaoRepository(session)
            connections = await repo.list_active()
            adapter = UazAPIAdapter()
            for conn in connections:
                try:
                    status = await adapter.get_instance_status(token=conn.token_ref or "")
                    logger.info("connection_status", conexao_id=str(conn.id), status=status.get("status"))
                except Exception as e:
                    logger.warning("connection_status_error", conexao_id=str(conn.id), error=str(e))

    _run_async(_task())

@celery_app.task(name="app.workers.tasks.scheduled.reschedule_orphaned_cadences")
def reschedule_orphaned_cadences() -> None:
    """
    Recuperação pós-rebuild: reenfileira steps de cadência cuja task Celery desapareceu
    do Redis (ex: Redis reiniciado sem persistência, volume apagado).

    Lógica: qualquer execução ativa cujo `proximo_step_em` já passou
    está órfã — a task que a dispararia já foi perdida. A própria task
    só executa se `step_atual < step_index` (guarda de idempotência), então
    reagendar execuções que ainda não foram processadas é seguro.
    """
    async def _task():
        from datetime import datetime, timezone

        from sqlalchemy import select

        from app.domain.models.models import CadenceExecucao
        from app.domain.enums.enums import StatusCadenceExecucao
        from app.repositories.cadence import CadenceExecucaoRepository
        from app.workers.tasks.cadence import execute_cadence_step

        async with AsyncSessionFactory() as session:
            now = datetime.now(timezone.utc)
            stmt = (
                select(CadenceExecucao)
                .where(
                    CadenceExecucao.status == StatusCadenceExecucao.ATIVA.value,
                    CadenceExecucao.proximo_step_em.isnot(None),
                    CadenceExecucao.proximo_step_em <= now,
                )
            )
            result = await session.execute(stmt)
            orphans = result.scalars().all()

            repo = CadenceExecucaoRepository(session)
            for execucao in orphans:
                next_step = execucao.step_atual + 1  # step_atual=-1 → dispara step 0
                task = execute_cadence_step.apply_async(
                    args=[str(execucao.id), next_step],
                    countdown=0,
                )
                await repo.update_fields(execucao.id, proximo_celery_task_id=task.id)
                logger.info(
                    "cadence_orphan_rescheduled",
                    execucao_id=str(execucao.id),
                    next_step=next_step,
                )

            await session.commit()
            logger.info("reschedule_orphaned_cadences_done", count=len(orphans))

    _run_async(_task())