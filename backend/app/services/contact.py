import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums.enums import Provedor
from app.domain.models.models import Contato
from app.repositories.contato import ContatoRepository


class ContactService:
    def __init__(self, session: AsyncSession):
        self.repo = ContatoRepository(session)
        self.session = session

    async def find_or_create(
        self,
        empresa_id: uuid.UUID,
        telefone_e164: str,
        nome: str | None = None,
        whatsapp_id: str | None = None,
        origem: str = "whatsapp",
    ) -> tuple[Contato, bool]:
        contato, created = await self.repo.find_or_create(
            empresa_id=empresa_id,
            telefone_e164=telefone_e164,
            nome=nome,
            whatsapp_id=whatsapp_id,
            origem=origem,
        )
        if not created:
            await self.repo.update_fields(
                contato.id,
                ultimo_contato_em=datetime.now(timezone.utc),
                origem_atual=origem,
            )
        return contato, created

    async def get(self, contato_id: uuid.UUID) -> Contato | None:
        return await self.repo.get_by_id(contato_id)

    async def get_by_telefone(self, empresa_id: uuid.UUID, telefone: str) -> Contato | None:
        return await self.repo.get_by_telefone(empresa_id, telefone)
