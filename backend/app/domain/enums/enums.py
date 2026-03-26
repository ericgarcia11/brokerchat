import enum


class LinhaNegocio(str, enum.Enum):
    VENDA = "venda"
    ALUGUEL = "aluguel"
    TRIAGEM = "triagem"


class PapelUsuario(str, enum.Enum):
    ADMIN = "admin"
    GESTOR = "gestor"
    ATENDENTE = "atendente"


class TipoAgente(str, enum.Enum):
    TRIAGEM = "triagem"
    VENDAS = "vendas"
    ALUGUEL = "aluguel"
    POS_ATENDIMENTO = "pos_atendimento"


class Canal(str, enum.Enum):
    WHATSAPP = "whatsapp"


class Provedor(str, enum.Enum):
    UAZAPI = "uazapi"


class AcaoRoteamento(str, enum.Enum):
    ABRIR_CHAT = "abrir_chat"
    IGNORAR = "ignorar"
    ENCAMINHAR_HUMANO = "encaminhar_humano"


class StatusChat(str, enum.Enum):
    ABERTO = "aberto"
    AGUARDANDO_LEAD = "aguardando_lead"
    AGUARDANDO_HUMANO = "aguardando_humano"
    ENCERRADO = "encerrado"
    IGNORADO = "ignorado"


CHAT_STATUS_ATIVOS = {StatusChat.ABERTO, StatusChat.AGUARDANDO_LEAD, StatusChat.AGUARDANDO_HUMANO}


class DirecaoMensagem(str, enum.Enum):
    ENTRADA = "entrada"
    SAIDA = "saida"


class AutorTipo(str, enum.Enum):
    CONTATO = "contato"
    IA = "ia"
    USUARIO = "usuario"
    SISTEMA = "sistema"


class TipoMensagem(str, enum.Enum):
    TEXTO = "texto"
    AUDIO = "audio"
    IMAGEM = "imagem"
    VIDEO = "video"
    DOCUMENTO = "documento"
    BOTAO = "botao"
    LISTA = "lista"
    SISTEMA = "sistema"


class StatusEnvio(str, enum.Enum):
    PENDENTE = "pendente"
    ENVIADA = "enviada"
    ENTREGUE = "entregue"
    LIDA = "lida"
    FALHA = "falha"


class StatusWebhook(str, enum.Enum):
    RECEBIDO = "recebido"
    PROCESSADO = "processado"
    ERRO = "erro"
    IGNORADO = "ignorado"


class StatusOportunidade(str, enum.Enum):
    ABERTA = "aberta"
    QUALIFICANDO = "qualificando"
    EM_ATENDIMENTO = "em_atendimento"
    GANHA = "ganha"
    PERDIDA = "perdida"
    ARQUIVADA = "arquivada"


class GrauInteresse(str, enum.Enum):
    BAIXO = "baixo"
    MEDIO = "medio"
    ALTO = "alto"


class StatusCadenceExecucao(str, enum.Enum):
    ATIVA = "ativa"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"
    PAUSADA = "pausada"


class AcaoRespostaLead(str, enum.Enum):
    CONTINUAR_IA = "continuar_ia"
    NOTIFICAR_RESPONSAVEL = "notificar_responsavel"
    ENCERRAR_CADENCIA = "encerrar_cadencia"
    TRANSFERIR_HUMANO = "transferir_humano"
