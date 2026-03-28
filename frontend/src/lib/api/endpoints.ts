import { apiClient } from "./client";
import type {
  Empresa, EmpresaCreate,
  Filial, FilialCreate,
  Equipe, EquipeCreate, EquipeUpdate,
  Usuario, UsuarioCreate, UsuarioUpdate,
  AgenteIA, AgenteIACreate,
  Conexao, ConexaoCreate,
  RegraRoteamento, RegraRoteamentoCreate,
  Contato, ContatoCreate,
  Oportunidade, OportunidadeCreate,
  Imovel, ImovelCreate,
  Chat, Mensagem,
  SendMessageRequest,
  CreateInstanceRequest,
  ProvisionConnectionRequest, ProvisionConnectionResponse,
  QRCodeResponse, ConnectionStatusResponse,
  HandoffRequest, AssignAgentRequest,
  MessageResponse,
  HealthResponse, ReadyResponse,
  ListParams,
  LoginRequest, LoginResponse,
  CadenceFluxo, CadenceFluxoCreate,
  CadenceExecucao,
  ConfiguracaoEmpresa, ConfiguracaoEmpresaUpdate,
} from "@/types/api";

// ── Health ──────────────────────────────────────
export const healthApi = {
  health: () => apiClient.get<HealthResponse>("/health"),
  ready: () => apiClient.get<ReadyResponse>("/ready"),
};

// ── Auth ────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),
  me: () => apiClient.get<Usuario>("/auth/me"),
};

// ── Generic CRUD factory ────────────────────────
function crudApi<TRead, TCreate>(entity: string) {
  const base = `/admin/${entity}`;
  return {
    list: (params?: ListParams) => apiClient.get<TRead[]>(base, params as Record<string, unknown>),
    get: (id: string) => apiClient.get<TRead>(`${base}/${id}`),
    create: (data: TCreate) => apiClient.post<TRead>(base, data),
    delete: (id: string) => apiClient.delete<MessageResponse>(`${base}/${id}`),
  };
}

export const empresaApi = crudApi<Empresa, EmpresaCreate>("empresas");
export const filialApi = crudApi<Filial, FilialCreate>("filiais");
export const equipeApi = {
  ...crudApi<Equipe, EquipeCreate>("equipes"),
  update: (id: string, data: EquipeUpdate) =>
    apiClient.put<Equipe>(`/admin/equipes/${id}`, data),
};
export const usuarioApi = {
  ...crudApi<Usuario, UsuarioCreate>("usuarios"),
  update: (id: string, data: UsuarioUpdate) =>
    apiClient.put<Usuario>(`/admin/usuarios/${id}`, data),
};
export const agenteIAApi = crudApi<AgenteIA, AgenteIACreate>("agentes-ia");
export const conexaoApi = crudApi<Conexao, ConexaoCreate>("conexoes");
export const regraRoteamentoApi = crudApi<RegraRoteamento, RegraRoteamentoCreate>("regras-roteamento");
export const contatoApi = crudApi<Contato, ContatoCreate>("contatos");
export const oportunidadeApi = crudApi<Oportunidade, OportunidadeCreate>("oportunidades");
export const imovelApi = crudApi<Imovel, ImovelCreate>("imoveis");

// ── Chats ───────────────────────────────────────
export const chatApi = {
  list: (params?: ListParams) =>
    apiClient.get<Chat[]>("/admin/chats", params as Record<string, unknown>),
  get: (id: string) =>
    apiClient.get<Chat>(`/admin/chats/${id}`),
  messages: (chatId: string, limit = 100) =>
    apiClient.get<Mensagem[]>(`/admin/chats/${chatId}/mensagens`, { limit }),
  handoff: (chatId: string, body?: HandoffRequest) =>
    apiClient.post<MessageResponse>(`/admin/chats/${chatId}/handoff`, body || {}),
  close: (chatId: string) =>
    apiClient.post<MessageResponse>(`/admin/chats/${chatId}/close`),
  resume: (chatId: string) =>
    apiClient.post<MessageResponse>(`/admin/chats/${chatId}/resume`),
  assignAgent: (chatId: string, body: AssignAgentRequest) =>
    apiClient.post<MessageResponse>(`/admin/chats/${chatId}/assign-agent`, body),
};

// ── Messages ────────────────────────────────────
export const messageApi = {
  send: (body: SendMessageRequest) =>
    apiClient.post<MessageResponse>("/admin/messages/send", body),
};

// ── Cadência ────────────────────────────────────
export const cadenceApi = {
  listFluxos: (empresa_id: string) =>
    apiClient.get<CadenceFluxo[]>('/cadence/fluxos', { empresa_id }),
  getFluxo: (id: string) =>
    apiClient.get<CadenceFluxo>(`/cadence/fluxos/${id}`),
  createFluxo: (data: CadenceFluxoCreate) =>
    apiClient.post<CadenceFluxo>('/cadence/fluxos', data),
  updateFluxo: (id: string, data: Partial<CadenceFluxoCreate>) =>
    apiClient.put<CadenceFluxo>(`/cadence/fluxos/${id}`, data),
  deleteFluxo: (id: string) =>
    apiClient.delete<MessageResponse>(`/cadence/fluxos/${id}`),
  listExecucoes: (fluxo_id: string) =>
    apiClient.get<CadenceExecucao[]>('/cadence/execucoes', { fluxo_id }),
  cancelarExecucao: (id: string) =>
    apiClient.post<MessageResponse>(`/cadence/execucoes/${id}/cancelar`),
};

// ── UazAPI / Connections ────────────────────────
export const uazapiApi = {
  createInstance: (body: CreateInstanceRequest) =>
    apiClient.post<Record<string, unknown>>("/admin/uazapi/instances", body),
  connectionStatus: (connectionId: string) =>
    apiClient.get<ConnectionStatusResponse>(`/admin/uazapi/connections/${connectionId}/status`),
  provision: (body: ProvisionConnectionRequest) =>
    apiClient.post<ProvisionConnectionResponse>("/admin/connections/provision", body),
  qrcode: (connectionId: string) =>
    apiClient.get<QRCodeResponse>(`/admin/connections/${connectionId}/qrcode`),
  syncConnections: () =>
    apiClient.post<Conexao[]>("/admin/connections/sync"),
  deleteConnection: (connectionId: string) =>
    apiClient.delete<MessageResponse>(`/admin/connections/${connectionId}`),
};

// ── Configuração Empresa (branding) ─────────────
export const configuracaoApi = {
  get: () =>
    apiClient.get<ConfiguracaoEmpresa>("/admin/configuracao"),
  update: (data: ConfiguracaoEmpresaUpdate) =>
    apiClient.put<ConfiguracaoEmpresa>("/admin/configuracao", data),
  uploadLogo: async (file: File): Promise<ConfiguracaoEmpresa> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("wwp_token") : null;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${(await import("@/lib/env")).env.apiBaseUrl}/admin/configuracao/logo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Erro ${res.status}`);
    }
    return res.json();
  },
  deleteLogo: () =>
    apiClient.delete<ConfiguracaoEmpresa>("/admin/configuracao/logo"),
  getPublico: (empresaId: string) =>
    apiClient.get<ConfiguracaoEmpresa>("/public/configuracao", { empresa_id: empresaId }),
};
