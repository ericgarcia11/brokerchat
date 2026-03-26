"""initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── empresas ──
    op.create_table(
        "empresas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── filiais ──
    op.create_table(
        "filiais",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("cidade", sa.String(100), nullable=False),
        sa.Column("estado", sa.String(2), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── equipes ──
    op.create_table(
        "equipes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("filial_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("filiais.id"), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("linha_negocio", sa.String(20), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── usuarios ──
    op.create_table(
        "usuarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("equipe_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipes.id"), nullable=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("telefone_e164", sa.String(20), nullable=True),
        sa.Column("papel", sa.String(20), nullable=False, server_default="atendente"),
        sa.Column("senha_hash", sa.String(255), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── agentes_ia ──
    op.create_table(
        "agentes_ia",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("equipe_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipes.id"), nullable=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("tipo", sa.String(30), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False, server_default="openai"),
        sa.Column("graph_id", sa.String(100), nullable=False),
        sa.Column("versao_prompt", sa.String(20), nullable=False, server_default="v1"),
        sa.Column("prompt_sistema", sa.Text(), nullable=True),
        sa.Column("configuracao", postgresql.JSONB(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── conexoes ──
    op.create_table(
        "conexoes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("filial_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("filiais.id"), nullable=True),
        sa.Column("equipe_padrao_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipes.id"), nullable=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("canal", sa.String(20), nullable=False, server_default="whatsapp"),
        sa.Column("provedor", sa.String(20), nullable=False, server_default="uazapi"),
        sa.Column("telefone_e164", sa.String(20), nullable=False),
        sa.Column("identificador_externo", sa.String(255), nullable=True),
        sa.Column("token_ref", sa.String(500), nullable=True),
        sa.Column("webhook_secret_ref", sa.String(255), nullable=False),
        sa.Column("configuracao", postgresql.JSONB(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_unique_constraint("uq_conexao_empresa_telefone", "conexoes", ["empresa_id", "telefone_e164"])

    # ── regras_roteamento ──
    op.create_table(
        "regras_roteamento",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conexao_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conexoes.id"), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("prioridade", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("ativa", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("acao", sa.String(30), nullable=False),
        sa.Column("iniciar_chat", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("equipe_destino_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipes.id"), nullable=True),
        sa.Column("agente_ia_destino_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agentes_ia.id"), nullable=True),
        sa.Column("condicoes", postgresql.JSONB(), nullable=True),
        sa.Column("stop_on_match", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── contatos ──
    op.create_table(
        "contatos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("nome", sa.String(255), nullable=True),
        sa.Column("telefone_e164", sa.String(20), nullable=False),
        sa.Column("whatsapp_id", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("cidade_interesse", sa.String(100), nullable=True),
        sa.Column("origem_inicial", sa.String(100), nullable=True),
        sa.Column("origem_atual", sa.String(100), nullable=True),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("opt_out", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("ultimo_contato_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_unique_constraint("uq_contato_empresa_telefone", "contatos", ["empresa_id", "telefone_e164"])

    # ── oportunidades ──
    op.create_table(
        "oportunidades",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("contato_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contatos.id"), nullable=False),
        sa.Column("filial_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("filiais.id"), nullable=True),
        sa.Column("equipe_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipes.id"), nullable=True),
        sa.Column("usuario_responsavel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("conexao_origem_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conexoes.id"), nullable=True),
        sa.Column("linha_negocio", sa.String(20), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="aberta"),
        sa.Column("origem", sa.String(100), nullable=True),
        sa.Column("interesse_cidade", sa.String(100), nullable=True),
        sa.Column("interesse_bairro", sa.String(100), nullable=True),
        sa.Column("orcamento_min", sa.Numeric(14, 2), nullable=True),
        sa.Column("orcamento_max", sa.Numeric(14, 2), nullable=True),
        sa.Column("quartos_min", sa.Integer(), nullable=True),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── chats ──
    op.create_table(
        "chats",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("contato_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contatos.id"), nullable=False),
        sa.Column("conexao_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conexoes.id"), nullable=False),
        sa.Column("filial_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("filiais.id"), nullable=True),
        sa.Column("equipe_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("equipes.id"), nullable=True),
        sa.Column("agente_ia_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agentes_ia.id"), nullable=True),
        sa.Column("usuario_responsavel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("oportunidade_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("oportunidades.id"), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="aberto"),
        sa.Column("origem_abertura", sa.String(100), nullable=True),
        sa.Column("motivo_encerramento", sa.String(255), nullable=True),
        sa.Column("graph_thread_id", sa.String(255), nullable=True),
        sa.Column("contexto_resumido", postgresql.JSONB(), nullable=True),
        sa.Column("iniciado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ultima_mensagem_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("encerrado_em", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_chat_ativo_empresa_contato_conexao",
        "chats",
        ["empresa_id", "contato_id", "conexao_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('aberto', 'aguardando_lead', 'aguardando_humano')"),
    )

    # ── mensagens ──
    op.create_table(
        "mensagens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("chat_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chats.id"), nullable=False),
        sa.Column("direcao", sa.String(10), nullable=False),
        sa.Column("autor_tipo", sa.String(20), nullable=False),
        sa.Column("autor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("provedor", sa.String(20), nullable=True),
        sa.Column("mensagem_externa_id", sa.String(255), nullable=True),
        sa.Column("mensagem_pai_externa_id", sa.String(255), nullable=True),
        sa.Column("tipo", sa.String(20), nullable=False, server_default="texto"),
        sa.Column("texto", sa.Text(), nullable=True),
        sa.Column("midia_url", sa.String(1024), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("status_envio", sa.String(20), nullable=False, server_default="pendente"),
        sa.Column("criada_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_mensagem_provedor_externa_id",
        "mensagens",
        ["provedor", "mensagem_externa_id"],
        unique=True,
        postgresql_where=sa.text("mensagem_externa_id IS NOT NULL"),
    )

    # ── eventos_webhook ──
    op.create_table(
        "eventos_webhook",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conexao_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conexoes.id"), nullable=False),
        sa.Column("provedor", sa.String(20), nullable=False),
        sa.Column("evento_externo_id", sa.String(255), nullable=True),
        sa.Column("tipo_evento", sa.String(100), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=True),
        sa.Column("recebido_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("processado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="recebido"),
    )
    op.create_index(
        "ix_evento_provedor_externo_id",
        "eventos_webhook",
        ["provedor", "evento_externo_id"],
        unique=True,
        postgresql_where=sa.text("evento_externo_id IS NOT NULL"),
    )

    # ── imoveis ──
    op.create_table(
        "imoveis",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=False),
        sa.Column("filial_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("filiais.id"), nullable=True),
        sa.Column("codigo_externo", sa.String(100), nullable=True),
        sa.Column("titulo", sa.String(500), nullable=False),
        sa.Column("linha_negocio", sa.String(20), nullable=False),
        sa.Column("cidade", sa.String(100), nullable=False),
        sa.Column("bairro", sa.String(100), nullable=True),
        sa.Column("preco_venda", sa.Numeric(14, 2), nullable=True),
        sa.Column("preco_aluguel", sa.Numeric(14, 2), nullable=True),
        sa.Column("quartos", sa.Integer(), nullable=True),
        sa.Column("banheiros", sa.Integer(), nullable=True),
        sa.Column("vagas", sa.Integer(), nullable=True),
        sa.Column("area_m2", sa.Numeric(10, 2), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── interesses_imovel ──
    op.create_table(
        "interesses_imovel",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("oportunidade_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("oportunidades.id"), nullable=False),
        sa.Column("imovel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("imoveis.id"), nullable=False),
        sa.Column("grau_interesse", sa.String(10), nullable=False, server_default="medio"),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("interesses_imovel")
    op.drop_table("imoveis")
    op.drop_table("eventos_webhook")
    op.drop_table("mensagens")
    op.drop_table("chats")
    op.drop_table("oportunidades")
    op.drop_table("contatos")
    op.drop_table("regras_roteamento")
    op.drop_table("conexoes")
    op.drop_table("agentes_ia")
    op.drop_table("usuarios")
    op.drop_table("equipes")
    op.drop_table("filiais")
    op.drop_table("empresas")
