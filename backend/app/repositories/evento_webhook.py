import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.models import EventoWebhook
from app.domain.enums.enums import StatusWebhook
from app.repositories.base import BaseRepository


class EventoWebhookRepository(BaseRepository[EventoWebhook]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, EventoWebhook)

    async def get_by_external_id(self, provedor: str, evento_externo_id: str) -> EventoWebhook | None:
        stmt = select(EventoWebhook).where(
            EventoWebhook.provedor == provedor,
            EventoWebhook.evento_externo_id == evento_externo_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_hash(self, payload_hash: str) -> EventoWebhook | None:
        stmt = select(EventoWebhook).where(EventoWebhook.payload_hash == payload_hash)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_errors(self, limit: int = 50) -> list[EventoWebhook]:
        stmt = (
            select(EventoWebhook)
            .where(EventoWebhook.status == StatusWebhook.ERRO.value)
            .order_by(EventoWebhook.recebido_em.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
