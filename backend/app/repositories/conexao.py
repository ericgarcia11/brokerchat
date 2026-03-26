import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.models import Conexao
from app.repositories.base import BaseRepository


class ConexaoRepository(BaseRepository[Conexao]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Conexao)

    async def get_by_webhook_secret(self, secret: str) -> Conexao | None:
        stmt = select(Conexao).where(Conexao.webhook_secret_ref == secret, Conexao.ativo == True)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_empresa(self, empresa_id: uuid.UUID) -> Sequence[Conexao]:
        stmt = select(Conexao).where(Conexao.empresa_id == empresa_id).order_by(Conexao.nome)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_active(self) -> Sequence[Conexao]:
        stmt = select(Conexao).where(Conexao.ativo == True)
        result = await self.session.execute(stmt)
        return result.scalars().all()
