"""Webhook endpoint for UazAPI. Uses webhook_secret_ref for auth."""

from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps.auth import DBSession
from app.core.logging import get_logger
from app.domain.enums.enums import Provedor
from app.repositories.conexao import ConexaoRepository
from app.services.webhook_event import WebhookEventService
from app.workers.tasks.webhook import process_webhook_event

logger = get_logger(__name__)

router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/uazapi/{secret}", status_code=status.HTTP_200_OK)
async def receive_uazapi_webhook(
    secret: str,
    request: Request,
    session: DBSession,
) -> dict[str, str]:
    # 1. Identify connection by secret
    conexao_repo = ConexaoRepository(session)
    conexao = await conexao_repo.get_by_webhook_secret(secret)
    if not conexao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")

    # 2. Parse raw payload
    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    # 3. Extract event_id for dedup
    from app.providers.uazapi.mapper import extract_event_id, extract_event_type
    evento_externo_id = extract_event_id(payload)
    tipo_evento = extract_event_type(payload)

    # 4. Save raw event
    webhook_svc = WebhookEventService(session)
    event, is_new = await webhook_svc.save_event(
        conexao_id=conexao.id,
        provedor=Provedor.UAZAPI,
        payload=payload,
        evento_externo_id=evento_externo_id,
        tipo_evento=tipo_evento,
    )
    await session.commit()

    # 5. Dispatch async processing if new
    if is_new:
        process_webhook_event.delay(str(event.id), str(conexao.id))
        logger.info("webhook_dispatched", event_id=str(event.id), conexao_id=str(conexao.id))
    else:
        logger.info("webhook_duplicate_skipped", event_id=str(event.id))

    return {"status": "received"}
