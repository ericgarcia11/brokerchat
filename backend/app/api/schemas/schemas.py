"""Pydantic v2 schemas for API request/response."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ── Generic ──────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    offset: int
    limit: int


class MessageResponse(BaseModel):
    message: str


# ── Empresa ──────────────────────────────────────
class EmpresaCreate(BaseModel):
    nome: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=100)
    ativo: bool = True


class EmpresaRead(BaseModel):
    id: uuid.UUID
    nome: str
    slug: str
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Filial ───────────────────────────────────────
class FilialCreate(BaseModel):
    empresa_id: uuid.UUID
    nome: str = Field(..., max_length=255)
    cidade: str = Field(..., max_length=100)
    estado: str = Field(..., max_length=2)
    ativo: bool = True


class FilialRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    nome: str
    cidade: str
    estado: str
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Equipe ───────────────────────────────────────
class EquipeCreate(BaseModel):
    empresa_id: uuid.UUID
    filial_id: uuid.UUID
    nome: str = Field(..., max_length=255)
    linha_negocio: str
    ativo: bool = True


class EquipeUpdate(BaseModel):
    nome: str | None = None
    filial_id: uuid.UUID | None = None
    linha_negocio: str | None = None
    ativo: bool | None = None


class EquipeRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    filial_id: uuid.UUID
    nome: str
    linha_negocio: str
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Usuario ──────────────────────────────────────
class UsuarioCreate(BaseModel):
    empresa_id: uuid.UUID
    equipe_id: uuid.UUID | None = None
    nome: str = Field(..., max_length=255)
    login: str = Field(..., max_length=100)
    email: str = Field(..., max_length=255)
    senha: str = Field(..., min_length=6)
    telefone_e164: str | None = None
    papel: str = "atendente"


class UsuarioUpdate(BaseModel):
    nome: str | None = None
    email: str | None = None
    telefone_e164: str | None = None
    papel: str | None = None
    ativo: bool | None = None
    senha: str | None = Field(None, min_length=6)


class UsuarioRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    equipe_id: uuid.UUID | None
    nome: str
    login: str
    email: str
    telefone_e164: str | None
    papel: str
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Auth ─────────────────────────────────────────
class LoginRequest(BaseModel):
    login: str
    senha: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UsuarioRead


# ── Agente IA ────────────────────────────────────
class AgenteIACreate(BaseModel):
    empresa_id: uuid.UUID
    equipe_id: uuid.UUID | None = None
    nome: str = Field(..., max_length=255)
    tipo: str
    provider: str = "openai"
    graph_id: str
    versao_prompt: str = "v1"
    prompt_sistema: str | None = None
    configuracao: dict | None = None
    ativo: bool = True


class AgenteIARead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    equipe_id: uuid.UUID | None
    nome: str
    tipo: str
    provider: str
    graph_id: str
    versao_prompt: str
    prompt_sistema: str | None
    configuracao: dict | None
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Conexão ──────────────────────────────────────
class ConexaoCreate(BaseModel):
    empresa_id: uuid.UUID
    filial_id: uuid.UUID | None = None
    equipe_padrao_id: uuid.UUID | None = None
    nome: str = Field(..., max_length=255)
    canal: str = "whatsapp"
    provedor: str = "uazapi"
    telefone_e164: str
    identificador_externo: str | None = None
    token_ref: str | None = None
    webhook_secret_ref: str | None = None
    configuracao: dict | None = None
    ativo: bool = True


class ConexaoRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    filial_id: uuid.UUID | None
    equipe_padrao_id: uuid.UUID | None
    nome: str
    canal: str
    provedor: str
    telefone_e164: str
    identificador_externo: str | None
    webhook_secret_ref: str
    configuracao: dict | None
    ativo: bool
    uazapi_status: str | None
    profile_name: str | None
    profile_pic_url: str | None
    synced_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Regra Roteamento ─────────────────────────────
class RegraRoteamentoCreate(BaseModel):
    conexao_id: uuid.UUID
    nome: str = Field(..., max_length=255)
    prioridade: int = 100
    ativa: bool = True
    acao: str
    iniciar_chat: bool = True
    equipe_destino_id: uuid.UUID | None = None
    agente_ia_destino_id: uuid.UUID | None = None
    condicoes: dict | None = None
    stop_on_match: bool = True


class RegraRoteamentoRead(BaseModel):
    id: uuid.UUID
    conexao_id: uuid.UUID
    nome: str
    prioridade: int
    ativa: bool
    acao: str
    iniciar_chat: bool
    equipe_destino_id: uuid.UUID | None
    agente_ia_destino_id: uuid.UUID | None
    condicoes: dict | None
    stop_on_match: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Contato ──────────────────────────────────────
class ContatoCreate(BaseModel):
    empresa_id: uuid.UUID
    nome: str | None = None
    telefone_e164: str
    email: str | None = None
    cidade_interesse: str | None = None
    origem_inicial: str | None = None


class ContatoRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    nome: str | None
    telefone_e164: str
    whatsapp_id: str | None
    email: str | None
    cidade_interesse: str | None
    origem_inicial: str | None
    origem_atual: str | None
    opt_out: bool
    ultimo_contato_em: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Oportunidade ─────────────────────────────────
class OportunidadeCreate(BaseModel):
    empresa_id: uuid.UUID
    contato_id: uuid.UUID
    filial_id: uuid.UUID | None = None
    equipe_id: uuid.UUID | None = None
    conexao_origem_id: uuid.UUID | None = None
    linha_negocio: str
    origem: str | None = None
    interesse_cidade: str | None = None
    interesse_bairro: str | None = None
    orcamento_min: float | None = None
    orcamento_max: float | None = None
    quartos_min: int | None = None
    observacoes: str | None = None


class OportunidadeRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    contato_id: uuid.UUID
    filial_id: uuid.UUID | None
    equipe_id: uuid.UUID | None
    usuario_responsavel_id: uuid.UUID | None
    conexao_origem_id: uuid.UUID | None
    linha_negocio: str
    status: str
    origem: str | None
    interesse_cidade: str | None
    interesse_bairro: str | None
    orcamento_min: float | None
    orcamento_max: float | None
    quartos_min: int | None
    observacoes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Chat ─────────────────────────────────────────
class ChatRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    contato_id: uuid.UUID
    conexao_id: uuid.UUID
    filial_id: uuid.UUID | None
    equipe_id: uuid.UUID | None
    agente_ia_id: uuid.UUID | None
    usuario_responsavel_id: uuid.UUID | None
    oportunidade_id: uuid.UUID | None
    status: str
    origem_abertura: str | None
    graph_thread_id: str | None
    contexto_resumido: dict | None
    iniciado_em: datetime
    ultima_mensagem_em: datetime | None
    encerrado_em: datetime | None

    model_config = {"from_attributes": True}


# ── Mensagem ─────────────────────────────────────
class MensagemRead(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    direcao: str
    autor_tipo: str
    autor_id: uuid.UUID | None
    tipo: str
    texto: str | None
    midia_url: str | None
    status_envio: str
    criada_em: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    conexao_id: uuid.UUID
    phone: str
    chat_id: uuid.UUID
    text: str | None = None
    media_url: str | None = None
    media_type: str = "text"


# ── Imóvel ───────────────────────────────────────
class ImovelCreate(BaseModel):
    empresa_id: uuid.UUID
    filial_id: uuid.UUID | None = None
    codigo_externo: str | None = None
    titulo: str
    linha_negocio: str
    cidade: str
    bairro: str | None = None
    preco_venda: float | None = None
    preco_aluguel: float | None = None
    quartos: int | None = None
    banheiros: int | None = None
    vagas: int | None = None
    area_m2: float | None = None
    metadata_extra: dict | None = None


class ImovelRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    filial_id: uuid.UUID | None
    codigo_externo: str | None
    titulo: str
    linha_negocio: str
    cidade: str
    bairro: str | None
    preco_venda: float | None
    preco_aluguel: float | None
    quartos: int | None
    banheiros: int | None
    vagas: int | None
    area_m2: float | None
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── UazAPI Admin ─────────────────────────────────
class CreateInstanceRequest(BaseModel):
    name: str


class ProvisionConnectionRequest(BaseModel):
    empresa_id: uuid.UUID
    nome: str = Field(..., max_length=255)
    telefone_e164: str = Field("", max_length=20)
    filial_id: uuid.UUID | None = None
    equipe_padrao_id: uuid.UUID | None = None


class ProvisionConnectionResponse(BaseModel):
    connection: ConexaoRead
    instance_token: str
    qrcode: str | None = None
    pairing_code: str | None = None
    status: str = "disconnected"

    model_config = {"from_attributes": True}


class QRCodeResponse(BaseModel):
    qrcode: str | None = None
    pairing_code: str | None = None
    status: str = "disconnected"


class ConnectionStatusResponse(BaseModel):
    status: str = "disconnected"
    phone: str | None = None
    name: str | None = None


# ── Chat operations ──────────────────────────────
class HandoffRequest(BaseModel):
    motivo: str | None = "solicitado pelo operador"


class AssignAgentRequest(BaseModel):
    agente_ia_id: uuid.UUID


# ── Cadence ──────────────────────────────────────

class CadenceStep(BaseModel):
    ordem: int = Field(..., ge=1)
    delay_segundos: int = Field(..., ge=60, description="Segundos de espera antes de enviar este step")
    mensagem: str = Field(..., min_length=1)
    acao_se_responder: str = Field(
        default="continuar_ia",
        description="continuar_ia | notificar_responsavel | encerrar_cadencia | transferir_humano",
    )


class CadenceFluxoCreate(BaseModel):
    empresa_id: uuid.UUID
    nome: str = Field(..., max_length=255)
    descricao: str | None = None
    mensagem_inicial: str = Field(..., min_length=1)
    acao_resposta: str = Field(default="continuar_ia")
    steps: list[CadenceStep] = Field(default_factory=list)
    ativo: bool = True


class CadenceFluxoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    mensagem_inicial: str | None = None
    acao_resposta: str | None = None
    steps: list[CadenceStep] | None = None
    ativo: bool | None = None


class CadenceFluxoRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    nome: str
    descricao: str | None
    mensagem_inicial: str
    acao_resposta: str
    steps: list[dict]
    ativo: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CadenceExecucaoCreate(BaseModel):
    fluxo_id: uuid.UUID
    contato_id: uuid.UUID
    conexao_id: uuid.UUID
    oportunidade_id: uuid.UUID | None = None


class CadenceExecucaoRead(BaseModel):
    id: uuid.UUID
    fluxo_id: uuid.UUID
    empresa_id: uuid.UUID
    contato_id: uuid.UUID
    conexao_id: uuid.UUID
    oportunidade_id: uuid.UUID | None
    step_atual: int
    status: str
    proximo_celery_task_id: str | None
    iniciada_em: datetime
    encerrada_em: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Paleta de Cores ──────────────────────────────
class PaletaCoresTheme(BaseModel):
    primary: str | None = None
    primary_foreground: str | None = Field(None, alias="primary-foreground")
    sidebar_bg: str | None = Field(None, alias="sidebar-bg")
    sidebar_fg: str | None = Field(None, alias="sidebar-fg")
    header_bg: str | None = Field(None, alias="header-bg")
    header_fg: str | None = Field(None, alias="header-fg")
    accent: str | None = None
    accent_foreground: str | None = Field(None, alias="accent-foreground")

    model_config = {"populate_by_name": True}


class PaletaCores(BaseModel):
    light: PaletaCoresTheme | None = None
    dark: PaletaCoresTheme | None = None


# ── Configuração da Empresa (branding SaaS) ─────
class ConfiguracaoEmpresaUpdate(BaseModel):
    nome_app: str | None = Field(None, max_length=255)
    nome_empresa: str | None = Field(None, max_length=255)
    paleta_cores: PaletaCores | None = None
    uazapi_server_url: str | None = None
    uazapi_admin_token: str | None = None


class ConfiguracaoEmpresaRead(BaseModel):
    id: uuid.UUID
    empresa_id: uuid.UUID
    nome_app: str
    nome_empresa: str
    logo_url: str | None
    paleta_cores: dict | None
    uazapi_server_url: str | None
    uazapi_admin_token: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Inbox ────────────────────────────────────────
class InboxContactInfo(BaseModel):
    """Embedded contact summary returned with each inbox chat."""
    id: uuid.UUID
    nome: str | None
    telefone_e164: str
    whatsapp_id: str | None
    email: str | None

    model_config = {"from_attributes": True}


class InboxChatRead(BaseModel):
    """Enriched chat row for the inbox screen."""
    id: uuid.UUID
    empresa_id: uuid.UUID
    conexao_id: uuid.UUID
    contato_id: uuid.UUID
    contato: InboxContactInfo
    status: str
    wa_chat_id: str | None
    wa_unread_count: int
    wa_last_msg_timestamp: int | None
    wa_name: str | None
    equipe_id: uuid.UUID | None
    usuario_responsavel_id: uuid.UUID | None
    agente_ia_id: uuid.UUID | None
    iniciado_em: datetime
    ultima_mensagem_em: datetime | None

    model_config = {"from_attributes": True}


class InboxSyncResponse(BaseModel):
    synced: int
    created_contacts: int
    pagination: dict


class InboxListResponse(BaseModel):
    items: list[InboxChatRead]
    total: int
    offset: int
    limit: int
