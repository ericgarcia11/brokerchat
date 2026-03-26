import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums.enums import LinhaNegocio, StatusOportunidade
from app.domain.models.models import Oportunidade
from app.repositories.oportunidade import OportunidadeRepository


class OpportunityService:
    def __init__(self, session: AsyncSession):
        self.repo = OportunidadeRepository(session)
        self.session = session

    async def get_or_create(
        self,
        empresa_id: uuid.UUID,
        contato_id: uuid.UUID,
        linha_negocio: LinhaNegocio,
        filial_id: uuid.UUID | None = None,
        equipe_id: uuid.UUID | None = None,
        conexao_origem_id: uuid.UUID | None = None,
        origem: str | None = None,
    ) -> tuple[Oportunidade, bool]:
        existing = await self.repo.get_latest_open(empresa_id, contato_id)
        if existing:
            return existing, False

        opp = Oportunidade(
            empresa_id=empresa_id,
            contato_id=contato_id,
            linha_negocio=linha_negocio,
            filial_id=filial_id,
            equipe_id=equipe_id,
            conexao_origem_id=conexao_origem_id,
            origem=origem or "whatsapp",
            status=StatusOportunidade.ABERTA,
        )
        await self.repo.create(opp)
        return opp, True

    async def update_qualification(
        self,
        oportunidade_id: uuid.UUID,
        **kwargs,
    ) -> Oportunidade | None:
        allowed = {
            "interesse_cidade", "interesse_bairro", "orcamento_min",
            "orcamento_max", "quartos_min", "observacoes", "status",
        }
        filtered = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not filtered:
            return await self.repo.get_by_id(oportunidade_id)
        return await self.repo.update_fields(oportunidade_id, **filtered)
