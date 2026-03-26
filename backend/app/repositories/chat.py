import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums.enums import StatusChat, CHAT_STATUS_ATIVOS
from app.domain.models.models import Chat
from app.repositories.base import BaseRepository


class ChatRepository(BaseRepository[Chat]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Chat)

    async def get_active_chat(
        self,
        empresa_id: uuid.UUID,
        contato_id: uuid.UUID,
        conexao_id: uuid.UUID,
    ) -> Chat | None:
        stmt = select(Chat).where(
            Chat.empresa_id == empresa_id,
            Chat.contato_id == contato_id,
            Chat.conexao_id == conexao_id,
            Chat.status.in_([s.value for s in CHAT_STATUS_ATIVOS]),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_active_by_empresa(self, empresa_id: uuid.UUID) -> Sequence[Chat]:
        stmt = select(Chat).where(
            Chat.empresa_id == empresa_id,
            Chat.status.in_([s.value for s in CHAT_STATUS_ATIVOS]),
        ).order_by(Chat.ultima_mensagem_em.desc().nullslast())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_idle(self, idle_minutes: int = 60) -> Sequence[Chat]:
        from datetime import datetime, timedelta, timezone
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=idle_minutes)
        stmt = select(Chat).where(
            Chat.status.in_([s.value for s in CHAT_STATUS_ATIVOS]),
            Chat.ultima_mensagem_em < cutoff,
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
