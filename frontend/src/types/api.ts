import type {
  StatusChat,
  StatusOportunidade,
  LinhaNegocio,
  DirecaoMensagem,
  AutorTipo,
  TipoMensagem,
  StatusEnvio,
  StatusWebhook,
  AcaoRoteamento,
  GrauInteresse,
  PapelUsuario,
} from "./enums";

// ── Generic ─────────────────────────────────────
export interface MessageResponse {
  message: string;
}

export interface ListParams {
  offset?: number;
  limit?: number;
  empresa_id?: string;
}

// ── Empresa ─────────────────────────────────────
export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  created_at: string;
}

export interface EmpresaCreate {
  nome: string;
  slug: string;
  ativo?: boolean;
}

// ── Filial ──────────────────────────────────────
export interface Filial {
  id: string;
  empresa_id: string;
  nome: string;
  cidade: string;
  estado: string;
  ativo: boolean;
  created_at: string;
}

export interface FilialCreate {
  empresa_id: string;
  nome: string;
  cidade: string;
  estado: string;
  ativo?: boolean;
}

// ── Equipe ──────────────────────────────────────
export interface Equipe {
  id: string;
  empresa_id: string;
  filial_id: string;
  nome: string;
  linha_negocio: LinhaNegocio;
  ativo: boolean;
  created_at: string;
}

export interface EquipeCreate {
  empresa_id: string;
  filial_id: string;
  nome: string;
  linha_negocio: string;
  ativo?: boolean;
}
export interface EquipeUpdate {
  nome?: string;
  filial_id?: string;
  linha_negocio?: string;
  ativo?: boolean;
}
// ── Usuario ─────────────────────────────────────
export interface Usuario {
  id: string;
  empresa_id: string;
  equipe_id: string | null;
  nome: string;
  login: string;
  email: string;
  telefone_e164: string | null;
  papel: PapelUsuario;
  ativo: boolean;
  created_at: string;
}

export interface UsuarioCreate {
  empresa_id: string;
  equipe_id?: string | null;
  nome: string;
  login: string;
  email: string;
  senha: string;
  telefone_e164?: string | null;
  papel?: string;
}

export interface UsuarioUpdate {
  nome?: string;
  email?: string;
  telefone_e164?: string | null;
  papel?: string;
  ativo?: boolean;
  senha?: string;
}

// ── Auth ───────────────────────────────────────
export interface LoginRequest {
  login: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: Usuario;
}

// ── Agente IA ───────────────────────────────────
export interface AgenteIA {
  id: string;
  empresa_id: string;
  equipe_id: string | null;
  nome: string;
  tipo: string;
  provider: string;
  graph_id: string;
  versao_prompt: string;
  prompt_sistema: string | null;
  configuracao: Record<string, unknown> | null;
  ativo: boolean;
  created_at: string;
}

export interface AgenteIACreate {
  empresa_id: string;
  equipe_id?: string | null;
  nome: string;
  tipo: string;
  provider?: string;
  graph_id: string;
  versao_prompt?: string;
  prompt_sistema?: string | null;
  configuracao?: Record<string, unknown> | null;
  ativo?: boolean;
}

// ── Conexao ─────────────────────────────────────
export interface Conexao {
  id: string;
  empresa_id: string;
  filial_id: string | null;
  equipe_padrao_id: string | null;
  nome: string;
  canal: string;
  provedor: string;
  telefone_e164: string;
  identificador_externo: string | null;
  webhook_secret_ref: string;
  configuracao: Record<string, unknown> | null;
  ativo: boolean;  uazapi_status: string | null;
  profile_name: string | null;
  profile_pic_url: string | null;
  synced_at: string | null;  created_at: string;
}

export interface ConexaoCreate {
  empresa_id: string;
  filial_id?: string | null;
  equipe_padrao_id?: string | null;
  nome: string;
  canal?: string;
  provedor?: string;
  telefone_e164: string;
  identificador_externo?: string | null;
  token_ref?: string | null;
  webhook_secret_ref?: string | null;
  configuracao?: Record<string, unknown> | null;
  ativo?: boolean;
}

// ── Regra Roteamento ────────────────────────────
export interface RegraRoteamento {
  id: string;
  conexao_id: string;
  nome: string;
  prioridade: number;
  ativa: boolean;
  acao: AcaoRoteamento;
  iniciar_chat: boolean;
  equipe_destino_id: string | null;
  agente_ia_destino_id: string | null;
  condicoes: Record<string, unknown> | null;
  stop_on_match: boolean;
  created_at: string;
}

export interface RegraRoteamentoCreate {
  conexao_id: string;
  nome: string;
  prioridade?: number;
  ativa?: boolean;
  acao: string;
  iniciar_chat?: boolean;
  equipe_destino_id?: string | null;
  agente_ia_destino_id?: string | null;
  condicoes?: Record<string, unknown> | null;
  stop_on_match?: boolean;
}

// ── Contato ─────────────────────────────────────
export interface Contato {
  id: string;
  empresa_id: string;
  nome: string | null;
  telefone_e164: string;
  whatsapp_id: string | null;
  email: string | null;
  cidade_interesse: string | null;
  origem_inicial: string | null;
  origem_atual: string | null;
  opt_out: boolean;
  ultimo_contato_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContatoCreate {
  empresa_id: string;
  nome?: string | null;
  telefone_e164: string;
  email?: string | null;
  cidade_interesse?: string | null;
  origem_inicial?: string | null;
}

// ── Oportunidade ────────────────────────────────
export interface Oportunidade {
  id: string;
  empresa_id: string;
  contato_id: string;
  filial_id: string | null;
  equipe_id: string | null;
  usuario_responsavel_id: string | null;
  conexao_origem_id: string | null;
  linha_negocio: LinhaNegocio;
  status: StatusOportunidade;
  origem: string | null;
  interesse_cidade: string | null;
  interesse_bairro: string | null;
  orcamento_min: number | null;
  orcamento_max: number | null;
  quartos_min: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OportunidadeCreate {
  empresa_id: string;
  contato_id: string;
  filial_id?: string | null;
  equipe_id?: string | null;
  conexao_origem_id?: string | null;
  linha_negocio: string;
  origem?: string | null;
  interesse_cidade?: string | null;
  interesse_bairro?: string | null;
  orcamento_min?: number | null;
  orcamento_max?: number | null;
  quartos_min?: number | null;
  observacoes?: string | null;
}

// ── Chat ────────────────────────────────────────
export interface Chat {
  id: string;
  empresa_id: string;
  contato_id: string;
  conexao_id: string;
  filial_id: string | null;
  equipe_id: string | null;
  agente_ia_id: string | null;
  usuario_responsavel_id: string | null;
  oportunidade_id: string | null;
  status: StatusChat;
  origem_abertura: string | null;
  graph_thread_id: string | null;
  contexto_resumido: Record<string, unknown> | null;
  iniciado_em: string;
  ultima_mensagem_em: string | null;
  encerrado_em: string | null;
}

// ── Mensagem ────────────────────────────────────
export interface Mensagem {
  id: string;
  chat_id: string;
  direcao: DirecaoMensagem;
  autor_tipo: AutorTipo;
  autor_id: string | null;
  tipo: TipoMensagem;
  texto: string | null;
  midia_url: string | null;
  status_envio: StatusEnvio;
  criada_em: string;
}

export interface SendMessageRequest {
  conexao_id: string;
  phone: string;
  chat_id: string;
  text?: string | null;
  media_url?: string | null;
  media_type?: string;
}

// ── Imovel ──────────────────────────────────────
export interface Imovel {
  id: string;
  empresa_id: string;
  filial_id: string | null;
  codigo_externo: string | null;
  titulo: string;
  linha_negocio: LinhaNegocio;
  cidade: string;
  bairro: string | null;
  preco_venda: number | null;
  preco_aluguel: number | null;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  area_m2: number | null;
  ativo: boolean;
  created_at: string;
}

export interface ImovelCreate {
  empresa_id: string;
  filial_id?: string | null;
  codigo_externo?: string | null;
  titulo: string;
  linha_negocio: string;
  cidade: string;
  bairro?: string | null;
  preco_venda?: number | null;
  preco_aluguel?: number | null;
  quartos?: number | null;
  banheiros?: number | null;
  vagas?: number | null;
  area_m2?: number | null;
  metadata_extra?: Record<string, unknown> | null;
}

// ── Evento Webhook ──────────────────────────────
export interface EventoWebhook {
  id: string;
  conexao_id: string;
  provedor: string;
  evento_externo_id: string | null;
  tipo_evento: string | null;
  payload: Record<string, unknown>;
  payload_hash: string | null;
  recebido_em: string;
  processado_em: string | null;
  status: StatusWebhook;
}

// ── Interesse Imovel ────────────────────────────
export interface InteresseImovel {
  id: string;
  oportunidade_id: string;
  imovel_id: string;
  grau_interesse: GrauInteresse;
  observacoes: string | null;
  created_at: string;
}

// ── UazAPI ──────────────────────────────────────
export interface CreateInstanceRequest {
  name: string;
}

export interface ProvisionConnectionRequest {
  empresa_id: string;
  nome: string;
  telefone_e164?: string;
  filial_id?: string | null;
  equipe_padrao_id?: string | null;
}

export interface ProvisionConnectionResponse {
  connection: Conexao;
  instance_token: string;
  qrcode: string | null;
  pairing_code: string | null;
  status: string;
}

export interface QRCodeResponse {
  qrcode: string | null;
  pairing_code: string | null;
  status: string;
}

export interface ConnectionStatusResponse {
  status: string;
  phone: string | null;
  name: string | null;
}

export interface HandoffRequest {
  motivo?: string;
}

export interface AssignAgentRequest {
  agente_ia_id: string;
}

// ── Health ──────────────────────────────────────
export interface HealthResponse {
  status: string;
  service: string;
}

export interface ReadyResponse {
  status: string;
  checks: {
    database: string;
    redis: string;
    storage: string;
  };
}

// ── Cadência ─────────────────────────────────────
export type AcaoResposta =
  | 'continuar_ia'
  | 'notificar_responsavel'
  | 'encerrar_cadencia'
  | 'transferir_humano';

export type StatusExecucaoCadencia = 'ativa' | 'concluida' | 'cancelada' | 'pausada';

export interface CadenceStep {
  ordem: number;
  delay_segundos: number;
  mensagem: string;
  acao_se_responder: AcaoResposta;
}

export interface CadenceFluxo {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  mensagem_inicial: string;
  acao_resposta: AcaoResposta;
  steps: CadenceStep[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CadenceFluxoCreate {
  empresa_id: string;
  nome: string;
  descricao?: string | null;
  mensagem_inicial: string;
  acao_resposta: AcaoResposta;
  steps: CadenceStep[];
  ativo?: boolean;
}

export interface CadenceExecucao {
  id: string;
  fluxo_id: string;
  contato_id: string;
  conexao_id: string;
  oportunidade_id: string | null;
  status: StatusExecucaoCadencia;
  step_atual: number | null;
  iniciada_em: string;
  encerrada_em: string | null;
  contato?: { telefone_e164: string; nome: string | null };
}

export interface CadenceExecucaoCreate {
  fluxo_id: string;
  contato_id: string;
  conexao_id: string;
  oportunidade_id?: string | null;
}

// ── Configuração Empresa (branding SaaS) ────────
export interface PaletaCoresTheme {
  primary?: string;
  "primary-foreground"?: string;
  "sidebar-bg"?: string;
  "sidebar-fg"?: string;
  "header-bg"?: string;
  "header-fg"?: string;
  accent?: string;
  "accent-foreground"?: string;
}

export interface PaletaCores {
  light?: PaletaCoresTheme;
  dark?: PaletaCoresTheme;
}

export interface ConfiguracaoEmpresa {
  id: string;
  empresa_id: string;
  nome_app: string;
  nome_empresa: string;
  logo_url: string | null;
  paleta_cores: PaletaCores | null;
  uazapi_server_url: string | null;
  uazapi_admin_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoEmpresaUpdate {
  nome_app?: string;
  nome_empresa?: string;
  paleta_cores?: PaletaCores | null;
  uazapi_server_url?: string | null;
  uazapi_admin_token?: string | null;
}
