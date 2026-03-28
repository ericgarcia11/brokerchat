"""Seed script: populates initial data for development/staging."""

import uuid
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.domain.enums.enums import (
    AcaoRoteamento,
    Canal,
    LinhaNegocio,
    Provedor,
    TipoAgente,
)
from app.domain.models.models import (
    AgenteIA,
    Conexao,
    Empresa,
    Equipe,
    Filial,
    RegraRoteamento,
    Usuario,
)
from app.core.security import hash_password
from app.graphs.prompts.agent_prompts import PROMPTS


# Deterministic UUIDs for seeds
EMPRESA_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
USUARIO_ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000099")
FILIAL_SOROCABA_ID = uuid.UUID("00000000-0000-0000-0000-000000000010")
FILIAL_BC_ID = uuid.UUID("00000000-0000-0000-0000-000000000011")
EQUIPE_VENDAS_SOROCABA_ID = uuid.UUID("00000000-0000-0000-0000-000000000020")
EQUIPE_ALUGUEL_SOROCABA_ID = uuid.UUID("00000000-0000-0000-0000-000000000021")
EQUIPE_VENDAS_BC_ID = uuid.UUID("00000000-0000-0000-0000-000000000022")
AGENTE_TRIAGEM_SOROCABA_ID = uuid.UUID("00000000-0000-0000-0000-000000000030")
AGENTE_VENDAS_SOROCABA_ID = uuid.UUID("00000000-0000-0000-0000-000000000031")
AGENTE_ALUGUEL_SOROCABA_ID = uuid.UUID("00000000-0000-0000-0000-000000000032")
AGENTE_VENDAS_BC_ID = uuid.UUID("00000000-0000-0000-0000-000000000033")
CONEXAO_SOROCABA_VENDAS_ID = uuid.UUID("00000000-0000-0000-0000-000000000040")
CONEXAO_SOROCABA_ALUGUEL_ID = uuid.UUID("00000000-0000-0000-0000-000000000041")
CONEXAO_BC_VENDAS_ID = uuid.UUID("00000000-0000-0000-0000-000000000042")


async def seed(session: AsyncSession) -> None:
    # Check if already seeded
    result = await session.execute(select(Empresa).where(Empresa.id == EMPRESA_ID))
    if result.scalar_one_or_none():
        print("Seeds already applied, skipping.")
        return

    # ── Empresa ──
    empresa = Empresa(id=EMPRESA_ID, nome="Salu Imóveis", slug="salu-imoveis")
    session.add(empresa)

    # ── Filiais ──
    filial_sorocaba = Filial(id=FILIAL_SOROCABA_ID, empresa_id=EMPRESA_ID, nome="Filial Sorocaba", cidade="Sorocaba", estado="SP")
    filial_bc = Filial(id=FILIAL_BC_ID, empresa_id=EMPRESA_ID, nome="Filial Balneário Camboriú", cidade="Balneário Camboriú", estado="SC")
    session.add_all([filial_sorocaba, filial_bc])

    # ── Equipes ──
    equipe_vendas_sorocaba = Equipe(id=EQUIPE_VENDAS_SOROCABA_ID, empresa_id=EMPRESA_ID, filial_id=FILIAL_SOROCABA_ID, nome="Vendas Sorocaba", linha_negocio=LinhaNegocio.VENDA)
    equipe_aluguel_sorocaba = Equipe(id=EQUIPE_ALUGUEL_SOROCABA_ID, empresa_id=EMPRESA_ID, filial_id=FILIAL_SOROCABA_ID, nome="Aluguel Sorocaba", linha_negocio=LinhaNegocio.ALUGUEL)
    equipe_vendas_bc = Equipe(id=EQUIPE_VENDAS_BC_ID, empresa_id=EMPRESA_ID, filial_id=FILIAL_BC_ID, nome="Vendas BC", linha_negocio=LinhaNegocio.VENDA)
    session.add_all([equipe_vendas_sorocaba, equipe_aluguel_sorocaba, equipe_vendas_bc])

    # Flush parent entities first so FK constraints are satisfied
    await session.flush()

    # ── Agentes IA ──
    agente_triagem_sorocaba = AgenteIA(
        id=AGENTE_TRIAGEM_SOROCABA_ID, empresa_id=EMPRESA_ID, equipe_id=None,
        nome="Triagem Sorocaba", tipo=TipoAgente.TRIAGEM, graph_id="triagem_sorocaba",
        prompt_sistema=PROMPTS["triagem_sorocaba"],
    )
    agente_vendas_sorocaba = AgenteIA(
        id=AGENTE_VENDAS_SOROCABA_ID, empresa_id=EMPRESA_ID, equipe_id=EQUIPE_VENDAS_SOROCABA_ID,
        nome="Vendas Sorocaba", tipo=TipoAgente.VENDAS, graph_id="vendas_sorocaba",
        prompt_sistema=PROMPTS["vendas_sorocaba"],
    )
    agente_aluguel_sorocaba = AgenteIA(
        id=AGENTE_ALUGUEL_SOROCABA_ID, empresa_id=EMPRESA_ID, equipe_id=EQUIPE_ALUGUEL_SOROCABA_ID,
        nome="Aluguel Sorocaba", tipo=TipoAgente.ALUGUEL, graph_id="aluguel_sorocaba",
        prompt_sistema=PROMPTS["aluguel_sorocaba"],
    )
    agente_vendas_bc = AgenteIA(
        id=AGENTE_VENDAS_BC_ID, empresa_id=EMPRESA_ID, equipe_id=EQUIPE_VENDAS_BC_ID,
        nome="Vendas BC", tipo=TipoAgente.VENDAS, graph_id="vendas_bc",
        prompt_sistema=PROMPTS["vendas_bc"],
    )
    session.add_all([agente_triagem_sorocaba, agente_vendas_sorocaba, agente_aluguel_sorocaba, agente_vendas_bc])

    # ── Conexões ──
    conexao_sorocaba_vendas = Conexao(
        id=CONEXAO_SOROCABA_VENDAS_ID, empresa_id=EMPRESA_ID, filial_id=FILIAL_SOROCABA_ID,
        equipe_padrao_id=EQUIPE_VENDAS_SOROCABA_ID,
        nome="WhatsApp Sorocaba Vendas", canal=Canal.WHATSAPP, provedor=Provedor.UAZAPI,
        telefone_e164="+5515999990001", webhook_secret_ref="secret-sorocaba-vendas",
        token_ref="token-sorocaba-vendas",
    )
    conexao_sorocaba_aluguel = Conexao(
        id=CONEXAO_SOROCABA_ALUGUEL_ID, empresa_id=EMPRESA_ID, filial_id=FILIAL_SOROCABA_ID,
        equipe_padrao_id=EQUIPE_ALUGUEL_SOROCABA_ID,
        nome="WhatsApp Sorocaba Aluguel", canal=Canal.WHATSAPP, provedor=Provedor.UAZAPI,
        telefone_e164="+5515999990002", webhook_secret_ref="secret-sorocaba-aluguel",
        token_ref="token-sorocaba-aluguel",
    )
    conexao_bc_vendas = Conexao(
        id=CONEXAO_BC_VENDAS_ID, empresa_id=EMPRESA_ID, filial_id=FILIAL_BC_ID,
        equipe_padrao_id=EQUIPE_VENDAS_BC_ID,
        nome="WhatsApp BC Vendas", canal=Canal.WHATSAPP, provedor=Provedor.UAZAPI,
        telefone_e164="+5547999990001", webhook_secret_ref="secret-bc-vendas",
        token_ref="token-bc-vendas",
    )
    session.add_all([conexao_sorocaba_vendas, conexao_sorocaba_aluguel, conexao_bc_vendas])

    await session.flush()

    # ── Regras de Roteamento ──

    # Sorocaba Vendas: triagem -> abrir chat com agente triagem
    regras = [
        RegraRoteamento(
            conexao_id=CONEXAO_SOROCABA_VENDAS_ID,
            nome="Triagem padrão Sorocaba Vendas",
            prioridade=10,
            acao=AcaoRoteamento.ABRIR_CHAT,
            equipe_destino_id=EQUIPE_VENDAS_SOROCABA_ID,
            agente_ia_destino_id=AGENTE_TRIAGEM_SOROCABA_ID,
            condicoes=None,
            stop_on_match=True,
        ),
        # Sorocaba Aluguel: triagem -> abrir chat com agente aluguel
        RegraRoteamento(
            conexao_id=CONEXAO_SOROCABA_ALUGUEL_ID,
            nome="Aluguel padrão Sorocaba",
            prioridade=10,
            acao=AcaoRoteamento.ABRIR_CHAT,
            equipe_destino_id=EQUIPE_ALUGUEL_SOROCABA_ID,
            agente_ia_destino_id=AGENTE_ALUGUEL_SOROCABA_ID,
            condicoes=None,
            stop_on_match=True,
        ),
        # BC Vendas: abrir chat com agente vendas BC
        RegraRoteamento(
            conexao_id=CONEXAO_BC_VENDAS_ID,
            nome="Vendas padrão BC",
            prioridade=10,
            acao=AcaoRoteamento.ABRIR_CHAT,
            equipe_destino_id=EQUIPE_VENDAS_BC_ID,
            agente_ia_destino_id=AGENTE_VENDAS_BC_ID,
            condicoes=None,
            stop_on_match=True,
        ),
        # Sorocaba Vendas: opt-out -> ignorar
        RegraRoteamento(
            conexao_id=CONEXAO_SOROCABA_VENDAS_ID,
            nome="Ignorar opt-out",
            prioridade=1,
            acao=AcaoRoteamento.IGNORAR,
            condicoes={"opt_out": True},
            stop_on_match=True,
        ),
        # Sorocaba Aluguel: opt-out -> ignorar
        RegraRoteamento(
            conexao_id=CONEXAO_SOROCABA_ALUGUEL_ID,
            nome="Ignorar opt-out",
            prioridade=1,
            acao=AcaoRoteamento.IGNORAR,
            condicoes={"opt_out": True},
            stop_on_match=True,
        ),
        # BC: opt-out -> ignorar
        RegraRoteamento(
            conexao_id=CONEXAO_BC_VENDAS_ID,
            nome="Ignorar opt-out",
            prioridade=1,
            acao=AcaoRoteamento.IGNORAR,
            condicoes={"opt_out": True},
            stop_on_match=True,
        ),
    ]
    session.add_all(regras)

    # ── Usuário Admin ──
    admin = Usuario(
        id=USUARIO_ADMIN_ID,
        empresa_id=EMPRESA_ID,
        nome="Administrador",
        email="admin@salu.com",
        login="admin@salu.com",
        senha_hash=hash_password("admin123"),
        papel="admin",
    )
    session.add(admin)

    await session.commit()
    print("Seeds applied successfully!")


async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
