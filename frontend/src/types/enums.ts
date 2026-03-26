export const StatusChat = {
  ABERTO: "aberto",
  AGUARDANDO_LEAD: "aguardando_lead",
  AGUARDANDO_HUMANO: "aguardando_humano",
  ENCERRADO: "encerrado",
  IGNORADO: "ignorado",
} as const;
export type StatusChat = (typeof StatusChat)[keyof typeof StatusChat];

export const CHAT_STATUS_ATIVOS: StatusChat[] = [
  StatusChat.ABERTO,
  StatusChat.AGUARDANDO_LEAD,
  StatusChat.AGUARDANDO_HUMANO,
];

export const StatusOportunidade = {
  ABERTA: "aberta",
  QUALIFICANDO: "qualificando",
  EM_ATENDIMENTO: "em_atendimento",
  GANHA: "ganha",
  PERDIDA: "perdida",
  ARQUIVADA: "arquivada",
} as const;
export type StatusOportunidade = (typeof StatusOportunidade)[keyof typeof StatusOportunidade];

export const OPORTUNIDADE_STATUS_ABERTOS: StatusOportunidade[] = [
  StatusOportunidade.ABERTA,
  StatusOportunidade.QUALIFICANDO,
  StatusOportunidade.EM_ATENDIMENTO,
];

export const AcaoRoteamento = {
  ABRIR_CHAT: "abrir_chat",
  IGNORAR: "ignorar",
  ENCAMINHAR_HUMANO: "encaminhar_humano",
} as const;
export type AcaoRoteamento = (typeof AcaoRoteamento)[keyof typeof AcaoRoteamento];

export const DirecaoMensagem = {
  ENTRADA: "entrada",
  SAIDA: "saida",
} as const;
export type DirecaoMensagem = (typeof DirecaoMensagem)[keyof typeof DirecaoMensagem];

export const AutorTipo = {
  CONTATO: "contato",
  IA: "ia",
  USUARIO: "usuario",
  SISTEMA: "sistema",
} as const;
export type AutorTipo = (typeof AutorTipo)[keyof typeof AutorTipo];

export const TipoMensagem = {
  TEXTO: "texto",
  AUDIO: "audio",
  IMAGEM: "imagem",
  VIDEO: "video",
  DOCUMENTO: "documento",
  BOTAO: "botao",
  LISTA: "lista",
  SISTEMA: "sistema",
} as const;
export type TipoMensagem = (typeof TipoMensagem)[keyof typeof TipoMensagem];

export const StatusEnvio = {
  PENDENTE: "pendente",
  ENVIADA: "enviada",
  ENTREGUE: "entregue",
  LIDA: "lida",
  FALHA: "falha",
} as const;
export type StatusEnvio = (typeof StatusEnvio)[keyof typeof StatusEnvio];

export const StatusWebhook = {
  RECEBIDO: "recebido",
  PROCESSADO: "processado",
  ERRO: "erro",
  IGNORADO: "ignorado",
} as const;
export type StatusWebhook = (typeof StatusWebhook)[keyof typeof StatusWebhook];

export const LinhaNegocio = {
  VENDA: "venda",
  ALUGUEL: "aluguel",
  TRIAGEM: "triagem",
} as const;
export type LinhaNegocio = (typeof LinhaNegocio)[keyof typeof LinhaNegocio];

export const Canal = {
  WHATSAPP: "whatsapp",
} as const;
export type Canal = (typeof Canal)[keyof typeof Canal];

export const Provedor = {
  UAZAPI: "uazapi",
} as const;
export type Provedor = (typeof Provedor)[keyof typeof Provedor];

export const TipoAgente = {
  TRIAGEM: "triagem",
  VENDAS: "vendas",
  ALUGUEL: "aluguel",
  POS_ATENDIMENTO: "pos_atendimento",
} as const;
export type TipoAgente = (typeof TipoAgente)[keyof typeof TipoAgente];

export const PapelUsuario = {
  ADMIN: "admin",
  GESTOR: "gestor",
  ATENDENTE: "atendente",
} as const;
export type PapelUsuario = (typeof PapelUsuario)[keyof typeof PapelUsuario];

export const GrauInteresse = {
  BAIXO: "baixo",
  MEDIO: "medio",
  ALTO: "alto",
} as const;
export type GrauInteresse = (typeof GrauInteresse)[keyof typeof GrauInteresse];
