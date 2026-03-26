"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

/**
 * Webhook Events page.
 *
 * NOTE: The backend does NOT currently expose a listing endpoint for EventoWebhook.
 * This page is a placeholder / extension point for when that endpoint is added.
 * When the backend adds GET /admin/eventos-webhook, create a hook and wire it here.
 */
export default function WebhooksPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Eventos de Webhook"
        description="Auditoria de webhooks recebidos do provedor"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Endpoint não disponível
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            O backend ainda não expõe um endpoint de listagem para eventos de webhook.
          </p>
          <p>
            Quando o endpoint <Badge variant="outline">GET /admin/eventos-webhook</Badge> for
            implementado, esta tabela será preenchida automaticamente com os registros da tabela{" "}
            <code className="text-xs bg-muted px-1 rounded">eventos_webhook</code>.
          </p>
          <p className="text-xs">
            Campos esperados: conexão, provedor, tipo do evento, payload, status (recebido,
            processado, erro, ignorado), data de recebimento e processamento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
