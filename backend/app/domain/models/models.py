import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.enums.enums import (
    AcaoRespostaLead,
    AcaoRoteamento,
    AutorTipo,
    Canal,
    DirecaoMensagem,
    GrauInteresse,
    LinhaNegocio,
    PapelUsuario,
    Provedor,
    StatusCadenceExecucao,
    StatusChat,
    StatusEnvio,
    StatusOportunidade,
    StatusWebhook,
    TipoAgente,
    TipoMensagem,
)


def _text_enum(enum_cls):
    """Create a non-native SQLAlchemy Enum that stores .value (lowercase) instead of .name."""
    return Enum(
        enum_cls,
        values_callable=lambda e: [m.value for m in e],
        native_enum=False,
        create_constraint=False,
    )


# ──────────────────────────────────────────────────────────
# Empresa
# ──────────────────────────────────────────────────────────
class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    filiais: Mapped[list["Filial"]] = relationship(back_populates="empresa", lazy="selectin")
    equipes: Mapped[list["Equipe"]] = relationship(back_populates="empresa", lazy="selectin")


# ──────────────────────────────────────────────────────────
# Filial
# ──────────────────────────────────────────────────────────
class Filial(Base):
    __tablename__ = "filiais"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    cidade: Mapped[str] = mapped_column(String(100), nullable=False)
    estado: Mapped[str] = mapped_column(String(2), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    empresa: Mapped["Empresa"] = relationship(back_populates="filiais")


# ──────────────────────────────────────────────────────────
# Equipe
# ──────────────────────────────────────────────────────────
class Equipe(Base):
    __tablename__ = "equipes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    filial_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("filiais.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    linha_negocio: Mapped[LinhaNegocio] = mapped_column(_text_enum(LinhaNegocio), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    empresa: Mapped["Empresa"] = relationship(back_populates="equipes")
    filial: Mapped["Filial"] = relationship()


# ──────────────────────────────────────────────────────────
# Usuário
# ──────────────────────────────────────────────────────────
class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    equipe_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipes.id"), nullable=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    login: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    telefone_e164: Mapped[str | None] = mapped_column(String(20), nullable=True)
    papel: Mapped[PapelUsuario] = mapped_column(_text_enum(PapelUsuario), nullable=False, default=PapelUsuario.ATENDENTE)
    senha_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ──────────────────────────────────────────────────────────
# Agente IA
# ──────────────────────────────────────────────────────────
class AgenteIA(Base):
    __tablename__ = "agentes_ia"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    equipe_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipes.id"), nullable=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[TipoAgente] = mapped_column(_text_enum(TipoAgente), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), default="openai", nullable=False)
    graph_id: Mapped[str] = mapped_column(String(100), nullable=False)
    versao_prompt: Mapped[str] = mapped_column(String(20), default="v1", nullable=False)
    prompt_sistema: Mapped[str | None] = mapped_column(Text, nullable=True)
    configuracao: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ──────────────────────────────────────────────────────────
# Conexão (WhatsApp via UazAPI)
# ──────────────────────────────────────────────────────────
class Conexao(Base):
    __tablename__ = "conexoes"
    __table_args__ = (
        UniqueConstraint("empresa_id", "telefone_e164", name="uq_conexao_empresa_telefone"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    filial_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("filiais.id"), nullable=True)
    equipe_padrao_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipes.id"), nullable=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    canal: Mapped[Canal] = mapped_column(_text_enum(Canal), default=Canal.WHATSAPP, nullable=False)
    provedor: Mapped[Provedor] = mapped_column(_text_enum(Provedor), default=Provedor.UAZAPI, nullable=False)
    telefone_e164: Mapped[str] = mapped_column(String(20), nullable=False)
    identificador_externo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    token_ref: Mapped[str | None] = mapped_column(String(500), nullable=True)
    webhook_secret_ref: Mapped[str] = mapped_column(String(255), nullable=False, default=lambda: uuid.uuid4().hex)
    configuracao: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # UazAPI live-status fields (populated via sync)
    uazapi_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    profile_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    profile_pic_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    regras: Mapped[list["RegraRoteamento"]] = relationship(back_populates="conexao", lazy="selectin", order_by="RegraRoteamento.prioridade")


# ──────────────────────────────────────────────────────────
# Regra de Roteamento
# ──────────────────────────────────────────────────────────
class RegraRoteamento(Base):
    __tablename__ = "regras_roteamento"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conexao_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conexoes.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    prioridade: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    acao: Mapped[AcaoRoteamento] = mapped_column(_text_enum(AcaoRoteamento), nullable=False)
    iniciar_chat: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    equipe_destino_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipes.id"), nullable=True)
    agente_ia_destino_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("agentes_ia.id"), nullable=True)
    condicoes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    stop_on_match: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conexao: Mapped["Conexao"] = relationship(back_populates="regras")


# ──────────────────────────────────────────────────────────
# Contato
# ──────────────────────────────────────────────────────────
class Contato(Base):
    __tablename__ = "contatos"
    __table_args__ = (
        UniqueConstraint("empresa_id", "telefone_e164", name="uq_contato_empresa_telefone"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    nome: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefone_e164: Mapped[str] = mapped_column(String(20), nullable=False)
    whatsapp_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cidade_interesse: Mapped[str | None] = mapped_column(String(100), nullable=True)
    origem_inicial: Mapped[str | None] = mapped_column(String(100), nullable=True)
    origem_atual: Mapped[str | None] = mapped_column(String(100), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    opt_out: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ultimo_contato_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ──────────────────────────────────────────────────────────
# Oportunidade
# ──────────────────────────────────────────────────────────
class Oportunidade(Base):
    __tablename__ = "oportunidades"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    contato_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contatos.id"), nullable=False)
    filial_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("filiais.id"), nullable=True)
    equipe_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipes.id"), nullable=True)
    usuario_responsavel_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    conexao_origem_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("conexoes.id"), nullable=True)
    linha_negocio: Mapped[LinhaNegocio] = mapped_column(_text_enum(LinhaNegocio), nullable=False)
    status: Mapped[StatusOportunidade] = mapped_column(_text_enum(StatusOportunidade), default=StatusOportunidade.ABERTA, nullable=False)
    origem: Mapped[str | None] = mapped_column(String(100), nullable=True)
    interesse_cidade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    interesse_bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    orcamento_min: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    orcamento_max: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    quartos_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ──────────────────────────────────────────────────────────
# Chat
# ──────────────────────────────────────────────────────────
class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = (
        Index(
            "ix_chat_ativo_empresa_contato_conexao",
            "empresa_id", "contato_id", "conexao_id",
            unique=True,
            postgresql_where=__import__("sqlalchemy").text(
                "status IN ('aberto', 'aguardando_lead', 'aguardando_humano')"
            ),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    contato_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contatos.id"), nullable=False)
    conexao_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conexoes.id"), nullable=False)
    filial_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("filiais.id"), nullable=True)
    equipe_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipes.id"), nullable=True)
    agente_ia_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("agentes_ia.id"), nullable=True)
    usuario_responsavel_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    oportunidade_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("oportunidades.id"), nullable=True)
    status: Mapped[StatusChat] = mapped_column(_text_enum(StatusChat), default=StatusChat.ABERTO, nullable=False)
    origem_abertura: Mapped[str | None] = mapped_column(String(100), nullable=True)
    motivo_encerramento: Mapped[str | None] = mapped_column(String(255), nullable=True)
    graph_thread_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contexto_resumido: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    iniciado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ultima_mensagem_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    encerrado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ──────────────────────────────────────────────────────────
# Mensagem
# ──────────────────────────────────────────────────────────
class Mensagem(Base):
    __tablename__ = "mensagens"
    __table_args__ = (
        Index(
            "ix_mensagem_provedor_externa_id",
            "provedor", "mensagem_externa_id",
            unique=True,
            postgresql_where=__import__("sqlalchemy").text("mensagem_externa_id IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    direcao: Mapped[DirecaoMensagem] = mapped_column(_text_enum(DirecaoMensagem), nullable=False)
    autor_tipo: Mapped[AutorTipo] = mapped_column(_text_enum(AutorTipo), nullable=False)
    autor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    provedor: Mapped[Provedor | None] = mapped_column(_text_enum(Provedor), nullable=True)
    mensagem_externa_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mensagem_pai_externa_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo: Mapped[TipoMensagem] = mapped_column(_text_enum(TipoMensagem), default=TipoMensagem.TEXTO, nullable=False)
    texto: Mapped[str | None] = mapped_column(Text, nullable=True)
    midia_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status_envio: Mapped[StatusEnvio] = mapped_column(_text_enum(StatusEnvio), default=StatusEnvio.PENDENTE, nullable=False)
    criada_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ──────────────────────────────────────────────────────────
# Evento Webhook
# ──────────────────────────────────────────────────────────
class EventoWebhook(Base):
    __tablename__ = "eventos_webhook"
    __table_args__ = (
        Index(
            "ix_evento_provedor_externo_id",
            "provedor", "evento_externo_id",
            unique=True,
            postgresql_where=__import__("sqlalchemy").text("evento_externo_id IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conexao_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conexoes.id"), nullable=False)
    provedor: Mapped[Provedor] = mapped_column(_text_enum(Provedor), nullable=False)
    evento_externo_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo_evento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    payload_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    recebido_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    processado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[StatusWebhook] = mapped_column(_text_enum(StatusWebhook), default=StatusWebhook.RECEBIDO, nullable=False)


# ──────────────────────────────────────────────────────────
# Imóvel
# ──────────────────────────────────────────────────────────
class Imovel(Base):
    __tablename__ = "imoveis"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    filial_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("filiais.id"), nullable=True)
    codigo_externo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    titulo: Mapped[str] = mapped_column(String(500), nullable=False)
    linha_negocio: Mapped[LinhaNegocio] = mapped_column(_text_enum(LinhaNegocio), nullable=False)
    cidade: Mapped[str] = mapped_column(String(100), nullable=False)
    bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preco_venda: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    preco_aluguel: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    quartos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    banheiros: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vagas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    area_m2: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_extra: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ──────────────────────────────────────────────────────────
# Interesse em Imóvel
# ──────────────────────────────────────────────────────────
class InteresseImovel(Base):
    __tablename__ = "interesses_imovel"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    oportunidade_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("oportunidades.id"), nullable=False)
    imovel_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("imoveis.id"), nullable=False)
    grau_interesse: Mapped[GrauInteresse] = mapped_column(_text_enum(GrauInteresse), default=GrauInteresse.MEDIO, nullable=False)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ──────────────────────────────────────────────────────────
# Cadence Fluxo (template de cadência configurado pelo cliente)
# ──────────────────────────────────────────────────────────
class CadenceFluxo(Base):
    __tablename__ = "cadence_fluxos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    mensagem_inicial: Mapped[str] = mapped_column(Text, nullable=False)
    # steps: list of {ordem, delay_segundos, mensagem, acao_se_responder}
    steps: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    acao_resposta: Mapped[AcaoRespostaLead] = mapped_column(
        _text_enum(AcaoRespostaLead),
        nullable=False,
        default=AcaoRespostaLead.CONTINUAR_IA,
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    execucoes: Mapped[list["CadenceExecucao"]] = relationship(back_populates="fluxo", lazy="noload")


# ──────────────────────────────────────────────────────────
# Cadence Execução (instância de cadência por lead)
# ──────────────────────────────────────────────────────────
class CadenceExecucao(Base):
    __tablename__ = "cadence_execucoes"
    __table_args__ = (
        Index("ix_cadence_exec_contato_ativa", "empresa_id", "contato_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fluxo_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cadence_fluxos.id"), nullable=False)
    empresa_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False)
    contato_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contatos.id"), nullable=False)
    conexao_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conexoes.id"), nullable=False)
    oportunidade_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("oportunidades.id"), nullable=True)
    # -1 = execução criada, mensagem_inicial ainda não enviada
    #  0 = mensagem_inicial enviada; 1+ = step com essa ordem enviado
    step_atual: Mapped[int] = mapped_column(Integer, default=-1, nullable=False)
    status: Mapped[StatusCadenceExecucao] = mapped_column(
        _text_enum(StatusCadenceExecucao),
        default=StatusCadenceExecucao.ATIVA,
        nullable=False,
    )
    proximo_celery_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Fonte de verdade para reagendamento após perda do Redis
    proximo_step_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    iniciada_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    encerrada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    fluxo: Mapped["CadenceFluxo"] = relationship(back_populates="execucoes", lazy="selectin")


# ──────────────────────────────────────────────────────────
# Configuração da Empresa (branding SaaS)
# ──────────────────────────────────────────────────────────
class ConfiguracaoEmpresa(Base):
    __tablename__ = "configuracao_empresa"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    nome_app: Mapped[str] = mapped_column(String(255), nullable=False, server_default="Meu App")
    nome_empresa: Mapped[str] = mapped_column(String(255), nullable=False, server_default="Minha Empresa")
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    paleta_cores: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    uazapi_server_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    uazapi_admin_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
