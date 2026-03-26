import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.models import Contato
from app.repositories.base import BaseRepository


class ContatoRepository(BaseRepository[Contato]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Contato)

    async def get_by_telefone(self, empresa_id: uuid.UUID, telefone_e164: str) -> Contato | None:
        stmt = select(Contato).where(
            Contato.empresa_id == empresa_id,
            Contato.telefone_e164 == telefone_e164,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_or_create(
        self,
        empresa_id: uuid.UUID,
        telefone_e164: str,
        nome: str | None = None,
        whatsapp_id: str | None = None,
        origem: str | None = None,
    ) -> tuple[Contato, bool]:
        existing = await self.get_by_telefone(empresa_id, telefone_e164)
        if existing:
            return existing, False
        contato = Contato(
            empresa_id=empresa_id,
            telefone_e164=telefone_e164,
            nome=nome,
            whatsapp_id=whatsapp_id,
            origem_inicial=origem,
            origem_atual=origem,
        )
        await self.create(contato)
        return contato, True
