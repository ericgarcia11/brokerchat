import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.models import Imovel
from app.domain.enums.enums import LinhaNegocio
from app.repositories.crud import ImovelRepository


class PropertyService:
    def __init__(self, session: AsyncSession):
        self.repo = ImovelRepository(session)
        self.session = session

    async def search(
        self,
        empresa_id: uuid.UUID,
        cidade: str | None = None,
        bairro: str | None = None,
        linha_negocio: LinhaNegocio | None = None,
        preco_min: float | None = None,
        preco_max: float | None = None,
        quartos_min: int | None = None,
        limit: int = 10,
    ) -> Sequence[Imovel]:
        stmt = select(Imovel).where(Imovel.empresa_id == empresa_id, Imovel.ativo == True)

        if cidade:
            stmt = stmt.where(Imovel.cidade.ilike(f"%{cidade}%"))
        if bairro:
            stmt = stmt.where(Imovel.bairro.ilike(f"%{bairro}%"))
        if linha_negocio:
            stmt = stmt.where(Imovel.linha_negocio == linha_negocio)
        if preco_min is not None and linha_negocio == LinhaNegocio.VENDA:
            stmt = stmt.where(Imovel.preco_venda >= preco_min)
        if preco_max is not None and linha_negocio == LinhaNegocio.VENDA:
            stmt = stmt.where(Imovel.preco_venda <= preco_max)
        if preco_min is not None and linha_negocio == LinhaNegocio.ALUGUEL:
            stmt = stmt.where(Imovel.preco_aluguel >= preco_min)
        if preco_max is not None and linha_negocio == LinhaNegocio.ALUGUEL:
            stmt = stmt.where(Imovel.preco_aluguel <= preco_max)
        if quartos_min is not None:
            stmt = stmt.where(Imovel.quartos >= quartos_min)

        stmt = stmt.limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
