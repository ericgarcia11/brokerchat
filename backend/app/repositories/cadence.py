import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums.enums import StatusCadenceExecucao
from app.domain.models.models import CadenceExecucao, CadenceFluxo
from app.repositories.base import BaseRepository


class CadenceFluxoRepository(BaseRepository[CadenceFluxo]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CadenceFluxo)

    async def list_by_empresa(
        self, empresa_id: uuid.UUID, ativo: bool | None = None
    ) -> Sequence[CadenceFluxo]:
        stmt = select(CadenceFluxo).where(CadenceFluxo.empresa_id == empresa_id)
        if ativo is not None:
            stmt = stmt.where(CadenceFluxo.ativo == ativo)
        stmt = stmt.order_by(CadenceFluxo.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()


class CadenceExecucaoRepository(BaseRepository[CadenceExecucao]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CadenceExecucao)

    async def get_ativa_by_contato(
        self, contato_id: uuid.UUID, empresa_id: uuid.UUID
    ) -> CadenceExecucao | None:
        stmt = (
            select(CadenceExecucao)
            .where(
                CadenceExecucao.contato_id == contato_id,
                CadenceExecucao.empresa_id == empresa_id,
                CadenceExecucao.status == StatusCadenceExecucao.ATIVA.value,
            )
            .order_by(CadenceExecucao.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_fluxo(
        self, fluxo_id: uuid.UUID, offset: int = 0, limit: int = 50
    ) -> Sequence[CadenceExecucao]:
        stmt = (
            select(CadenceExecucao)
            .where(CadenceExecucao.fluxo_id == fluxo_id)
            .order_by(CadenceExecucao.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_by_contato(
        self, contato_id: uuid.UUID, empresa_id: uuid.UUID
    ) -> Sequence[CadenceExecucao]:
        stmt = (
            select(CadenceExecucao)
            .where(
                CadenceExecucao.contato_id == contato_id,
                CadenceExecucao.empresa_id == empresa_id,
            )
            .order_by(CadenceExecucao.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
