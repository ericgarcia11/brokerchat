import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.models import Oportunidade
from app.domain.enums.enums import StatusOportunidade
from app.repositories.base import BaseRepository


class OportunidadeRepository(BaseRepository[Oportunidade]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Oportunidade)

    async def get_latest_open(self, empresa_id: uuid.UUID, contato_id: uuid.UUID) -> Oportunidade | None:
        stmt = (
            select(Oportunidade)
            .where(
                Oportunidade.empresa_id == empresa_id,
                Oportunidade.contato_id == contato_id,
                Oportunidade.status.in_([
                    StatusOportunidade.ABERTA.value,
                    StatusOportunidade.QUALIFICANDO.value,
                    StatusOportunidade.EM_ATENDIMENTO.value,
                ]),
            )
            .order_by(Oportunidade.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_contato(self, contato_id: uuid.UUID) -> Sequence[Oportunidade]:
        stmt = select(Oportunidade).where(Oportunidade.contato_id == contato_id).order_by(Oportunidade.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
