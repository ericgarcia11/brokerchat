import hashlib
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.domain.enums.enums import Provedor, StatusWebhook
from app.domain.models.models import EventoWebhook
from app.repositories.evento_webhook import EventoWebhookRepository

logger = get_logger(__name__)


class WebhookEventService:
    def __init__(self, session: AsyncSession):
        self.repo = EventoWebhookRepository(session)
        self.session = session

    @staticmethod
    def _hash_payload(payload: dict) -> str:
        import json
        raw = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(raw.encode()).hexdigest()

    async def save_event(
        self,
        conexao_id: uuid.UUID,
        provedor: Provedor,
        payload: dict,
        evento_externo_id: str | None = None,
        tipo_evento: str | None = None,
    ) -> tuple[EventoWebhook, bool]:
        """Returns (event, is_new). If duplicate, returns existing with is_new=False."""
        if evento_externo_id:
            existing = await self.repo.get_by_external_id(provedor.value, evento_externo_id)
            if existing:
                logger.info("webhook_duplicate_by_id", external_id=evento_externo_id)
                return existing, False

        payload_hash = self._hash_payload(payload)
        existing_by_hash = await self.repo.get_by_hash(payload_hash)
        if existing_by_hash:
            logger.info("webhook_duplicate_by_hash", hash=payload_hash)
            return existing_by_hash, False

        event = EventoWebhook(
            conexao_id=conexao_id,
            provedor=provedor,
            evento_externo_id=evento_externo_id,
            tipo_evento=tipo_evento,
            payload=payload,
            payload_hash=payload_hash,
        )
        await self.repo.create(event)
        return event, True

    async def mark_processed(self, event_id: uuid.UUID) -> None:
        await self.repo.update_fields(
            event_id,
            status=StatusWebhook.PROCESSADO,
            processado_em=datetime.now(timezone.utc),
        )

    async def mark_error(self, event_id: uuid.UUID) -> None:
        await self.repo.update_fields(event_id, status=StatusWebhook.ERRO)

    async def mark_ignored(self, event_id: uuid.UUID) -> None:
        await self.repo.update_fields(event_id, status=StatusWebhook.IGNORADO)

    async def list_errors(self, limit: int = 50) -> list[EventoWebhook]:
        return await self.repo.list_errors(limit)
