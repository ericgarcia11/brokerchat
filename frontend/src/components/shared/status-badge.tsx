import { Badge } from "@/components/ui/badge";
import { StatusChat, StatusOportunidade, StatusEnvio, StatusWebhook, AcaoRoteamento } from "@/types/enums";

const CHAT_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  [StatusChat.ABERTO]: { label: "Aberto", variant: "info" },
  [StatusChat.AGUARDANDO_LEAD]: { label: "Aguardando Lead", variant: "warning" },
  [StatusChat.AGUARDANDO_HUMANO]: { label: "Aguardando Humano", variant: "destructive" },
  [StatusChat.ENCERRADO]: { label: "Encerrado", variant: "secondary" },
  [StatusChat.IGNORADO]: { label: "Ignorado", variant: "outline" },
};

const OPORTUNIDADE_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  [StatusOportunidade.ABERTA]: { label: "Aberta", variant: "info" },
  [StatusOportunidade.QUALIFICANDO]: { label: "Qualificando", variant: "warning" },
  [StatusOportunidade.EM_ATENDIMENTO]: { label: "Em Atendimento", variant: "default" },
  [StatusOportunidade.GANHA]: { label: "Ganha", variant: "success" },
  [StatusOportunidade.PERDIDA]: { label: "Perdida", variant: "destructive" },
  [StatusOportunidade.ARQUIVADA]: { label: "Arquivada", variant: "secondary" },
};

const ENVIO_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  [StatusEnvio.PENDENTE]: { label: "Pendente", variant: "warning" },
  [StatusEnvio.ENVIADA]: { label: "Enviada", variant: "info" },
  [StatusEnvio.ENTREGUE]: { label: "Entregue", variant: "success" },
  [StatusEnvio.LIDA]: { label: "Lida", variant: "success" },
  [StatusEnvio.FALHA]: { label: "Falha", variant: "destructive" },
};

const WEBHOOK_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  [StatusWebhook.RECEBIDO]: { label: "Recebido", variant: "info" },
  [StatusWebhook.PROCESSADO]: { label: "Processado", variant: "success" },
  [StatusWebhook.ERRO]: { label: "Erro", variant: "destructive" },
  [StatusWebhook.IGNORADO]: { label: "Ignorado", variant: "outline" },
};

const ACAO_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  [AcaoRoteamento.ABRIR_CHAT]: { label: "Abrir Chat", variant: "success" },
  [AcaoRoteamento.IGNORAR]: { label: "Ignorar", variant: "outline" },
  [AcaoRoteamento.ENCAMINHAR_HUMANO]: { label: "Encaminhar Humano", variant: "warning" },
};

const CADENCE_EXECUCAO_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  ativa: { label: "Ativa", variant: "success" },
  concluida: { label: "Concluída", variant: "info" },
  cancelada: { label: "Cancelada", variant: "secondary" },
  pausada: { label: "Pausada", variant: "warning" },
};

function getStatusConfig(value: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" } {
  return (
    CHAT_STATUS_MAP[value] ||
    OPORTUNIDADE_STATUS_MAP[value] ||
    ENVIO_STATUS_MAP[value] ||
    WEBHOOK_STATUS_MAP[value] ||
    ACAO_MAP[value] ||
    CADENCE_EXECUCAO_STATUS_MAP[value] ||
    { label: value, variant: "outline" }
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
