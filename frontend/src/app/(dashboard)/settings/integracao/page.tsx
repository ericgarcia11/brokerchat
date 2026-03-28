"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configuracaoApi } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Webhook, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import type { ConfiguracaoEmpresaUpdate } from "@/types/api";

export default function IntegracaoPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["configuracao-empresa"],
    queryFn: () => configuracaoApi.get(),
  });

  const [serverUrl, setServerUrl] = useState<string>("");
  const [adminToken, setAdminToken] = useState<string>("");
  const [showToken, setShowToken] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config && !dirty) {
      setServerUrl(config.uazapi_server_url ?? "");
      // Keep token field empty if already set — show placeholder only
      setAdminToken("");
    }
  }, [config, dirty]);

  const updateMutation = useMutation({
    mutationFn: (data: ConfiguracaoEmpresaUpdate) => configuracaoApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracao-empresa"] });
      toast.success("Configurações da integração salvas!");
      setDirty(false);
      setAdminToken(""); // clear after save (will show placeholder)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar configurações.");
    },
  });

  function handleSave() {
    const data: ConfiguracaoEmpresaUpdate = {};
    data.uazapi_server_url = serverUrl.trim() || null;
    if (adminToken.trim()) {
      data.uazapi_admin_token = adminToken.trim();
    }
    updateMutation.mutate(data);
  }

  const isConfigured = Boolean(config?.uazapi_server_url && config?.uazapi_admin_token);
  const hasChanges = dirty;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        description="Configure as integrações de API do sistema"
      >
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm">
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              <CardTitle className="text-sm">UazAPI — WhatsApp</CardTitle>
            </div>
            {isLoading ? null : isConfigured ? (
              <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600">
                <CheckCircle className="h-3 w-3" /> Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-400">
                <AlertCircle className="h-3 w-3" /> Não configurado
              </Badge>
            )}
          </div>
          <CardDescription>
            Informe o endereço do servidor UazAPI e o token de administrador.
            Essas credenciais são necessárias para criar e gerenciar conexões WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server_url">URL do Servidor</Label>
            <Input
              id="server_url"
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value);
                setDirty(true);
              }}
              placeholder="https://sua-instancia.uazapi.com"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Endereço base do servidor UazAPI sem barra final.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_token">Token de Administrador</Label>
            <div className="relative">
              <Input
                id="admin_token"
                value={adminToken}
                onChange={(e) => {
                  setAdminToken(e.target.value);
                  setDirty(true);
                }}
                placeholder={
                  config?.uazapi_admin_token
                    ? "••••••••••••  (token salvo — insira novo para substituir)"
                    : "Token de admin do UazAPI"
                }
                type={showToken ? "text" : "password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para manter o token atual.
            </p>
          </div>

          {!isLoading && !isConfigured && (
            <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
              <strong>Atenção:</strong> Connexões WhatsApp, envio de mensagens e outras
              funcionalidades do sistema dependem desta configuração.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
