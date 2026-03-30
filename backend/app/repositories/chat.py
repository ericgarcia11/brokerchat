import uuid
from typing import Sequence

from sqlalchemy import func, select
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

    async def get_by_wa_chat_id(
        self,
        conexao_id: uuid.UUID,
        wa_chat_id: str,
    ) -> Chat | None:
        stmt = select(Chat).where(
            Chat.conexao_id == conexao_id,
            Chat.wa_chat_id == wa_chat_id,
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

    async def list_inbox(
        self,
        empresa_id: uuid.UUID,
        conexao_id: uuid.UUID | None = None,
        status_list: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[Sequence[Chat], int]:
        """Return paginated chats for the inbox with total count."""
        base = select(Chat).where(Chat.empresa_id == empresa_id)
        if conexao_id:
            base = base.where(Chat.conexao_id == conexao_id)
        if status_list:
            base = base.where(Chat.status.in_(status_list))

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        base = base.order_by(Chat.ultima_mensagem_em.desc().nullslast()).offset(offset).limit(limit)
        result = await self.session.execute(base)
        return result.scalars().all(), total

    async def list_idle(self, idle_minutes: int = 60) -> Sequence[Chat]:
        from datetime import datetime, timedelta, timezone
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=idle_minutes)
        stmt = select(Chat).where(
            Chat.status.in_([s.value for s in CHAT_STATUS_ATIVOS]),
            Chat.ultima_mensagem_em < cutoff,
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
