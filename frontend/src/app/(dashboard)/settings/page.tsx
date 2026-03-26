"use client";

import { useHealth, useReady } from "@/features/settings/use-health";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/env";
import { CheckCircle, XCircle, Server, Database, HardDrive, Activity } from "lucide-react";

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-destructive" />
  );
}

export default function SettingsPage() {
  const { data: health } = useHealth();
  const { data: ready } = useReady();

  const checks = ready?.checks as Record<string, string> | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Status do sistema e informações de ambiente"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" /> Saúde do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Status geral</span>
              {health ? (
                <Badge className="bg-green-600">{health.status}</Badge>
              ) : (
                <Badge variant="destructive">Indisponível</Badge>
              )}
            </div>
            {health && (
              <div className="flex items-center justify-between">
                <span>Serviço</span>
                <span className="text-muted-foreground">{health.service}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Readiness Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4" /> Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {checks ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    Banco de dados
                  </div>
                  <StatusIcon ok={checks.database === "ok"} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    Redis
                  </div>
                  <StatusIcon ok={checks.redis === "ok"} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    Storage (MinIO)
                  </div>
                  <StatusIcon ok={checks.storage === "ok"} />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Carregando…</p>
            )}
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ambiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>API Base URL</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{env.apiBaseUrl}</code>
            </div>
            <div className="flex items-center justify-between">
              <span>Empresa ID</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[150px]">
                {env.empresaId}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span>Poll Interval</span>
              <span className="text-muted-foreground">{env.pollIntervalMs}ms</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Frontend</span>
              <Badge variant="outline">Next.js 14</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Backend</span>
              <Badge variant="outline">FastAPI 0.115</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
