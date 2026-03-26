import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.models import Mensagem
from app.domain.enums.enums import StatusEnvio
from app.repositories.base import BaseRepository


class MensagemRepository(BaseRepository[Mensagem]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Mensagem)

    async def get_by_external_id(self, provedor: str, mensagem_externa_id: str) -> Mensagem | None:
        stmt = select(Mensagem).where(
            Mensagem.provedor == provedor,
            Mensagem.mensagem_externa_id == mensagem_externa_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_chat(self, chat_id: uuid.UUID, limit: int = 100) -> Sequence[Mensagem]:
        stmt = (
            select(Mensagem)
            .where(Mensagem.chat_id == chat_id)
            .order_by(Mensagem.criada_em.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_failed(self, limit: int = 50) -> Sequence[Mensagem]:
        stmt = (
            select(Mensagem)
            .where(Mensagem.status_envio == StatusEnvio.FALHA.value)
            .order_by(Mensagem.criada_em.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
