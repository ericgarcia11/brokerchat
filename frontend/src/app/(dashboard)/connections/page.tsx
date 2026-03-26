"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useConnections,
  useDeleteConnection,
  useConnectionStatus,
  useConnectionQRCode,
  useProvisionConnection,
} from "@/features/connections/use-connections";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhone, formatDate } from "@/lib/formatters";
import { env } from "@/lib/env";
import type { Conexao, ProvisionConnectionResponse } from "@/types/api";
import {
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Loader2,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* ─── Wizard steps ───────────────────────────────── */
type WizardStep = "form" | "pairing" | "connected";

const provisionSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  telefone_e164: z
    .string()
    .min(10, "Telefone obrigatório")
    .regex(/^\+?\d+$/, "Formato inválido — use apenas números com +"),
});
type ProvisionForm = z.infer<typeof provisionSchema>;

/* ─── QR Pairing panel (polls every 5s) ──────────── */
function PairingPanel({
  connectionId,
  initialQR,
  initialPairingCode,
  onConnected,
}: {
  connectionId: string;
  initialQR: string | null;
  initialPairingCode: string | null;
  onConnected: () => void;
}) {
  const { data: qrData } = useConnectionQRCode(connectionId);
  const [copied, setCopied] = useState(false);

  const qrcode = qrData?.qrcode ?? initialQR;
  const pairingCode = qrData?.pairing_code ?? initialPairingCode;
  const status = qrData?.status ?? "disconnected";

  useEffect(() => {
    if (status === "connected") {
      onConnected();
    }
  }, [status, onConnected]);

  const handleCopy = useCallback(async () => {
    if (!pairingCode) return;
    await navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pairingCode]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground text-center">
        Abra o WhatsApp no seu celular e escaneie o QR code, ou use o código de
        pareamento abaixo.
      </p>

      {/* QR Code display */}
      <div className="relative flex items-center justify-center w-64 h-64 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30">
        {qrcode ? (
          <img
            src={
              qrcode.startsWith("data:")
                ? qrcode
                : `data:image/png;base64,${qrcode}`
            }
            alt="QR Code WhatsApp"
            className="w-56 h-56 rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs">Gerando QR code…</span>
          </div>
        )}
      </div>

      {/* Pairing code */}
      {pairingCode && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
          <QrCode className="h-4 w-4 text-muted-foreground" />
          <code className="text-lg font-mono tracking-widest">
            {pairingCode}
          </code>
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Aguardando conexão…
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────── */
export default function ConnectionsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("form");
  const [provisionResult, setProvisionResult] =
    useState<ProvisionConnectionResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusCheckId, setStatusCheckId] = useState<string | null>(null);

  const { data: connections, isLoading } = useConnections();
  const deleteConn = useDeleteConnection();
  const provision = useProvisionConnection();
  const { data: connStatus, isLoading: statusLoading } =
    useConnectionStatus(statusCheckId);

  const form = useForm<ProvisionForm>({
    resolver: zodResolver(provisionSchema),
    defaultValues: { nome: "", telefone_e164: "" },
  });

  function openWizard() {
    setWizardStep("form");
    setProvisionResult(null);
    form.reset();
    setWizardOpen(true);
  }

  function closeWizard() {
    setWizardOpen(false);
    setWizardStep("form");
    setProvisionResult(null);
  }

  function handleProvision(values: ProvisionForm) {
    provision.mutate(
      {
        empresa_id: env.empresaId,
        nome: values.nome,
        telefone_e164: values.telefone_e164,
      },
      {
        onSuccess: (data) => {
          setProvisionResult(data);
          setWizardStep("pairing");
        },
      },
    );
  }

  const handleConnected = useCallback(() => {
    setWizardStep("connected");
  }, []);

  function handleDelete() {
    if (deleteId) {
      deleteConn.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const,
      cell: (row: Conexao) => <span className="font-medium">{row.nome}</span>,
    },
    {
      header: "Telefone",
      accessorKey: "telefone_e164" as const,
      cell: (row: Conexao) => formatPhone(row.telefone_e164),
    },
    {
      header: "Canal",
      accessorKey: "canal" as const,
      cell: (row: Conexao) => <Badge variant="outline">{row.canal}</Badge>,
    },
    {
      header: "Status",
      accessorKey: "ativo" as const,
      cell: (row: Conexao) =>
        row.ativo ? (
          <Badge className="bg-green-600">
            <Wifi className="mr-1 h-3 w-3" /> Conectado
          </Badge>
        ) : (
          <Badge variant="destructive">
            <WifiOff className="mr-1 h-3 w-3" /> Desconectado
          </Badge>
        ),
    },
    {
      header: "Criada em",
      accessorKey: "created_at" as const,
      cell: (row: Conexao) => formatDate(row.created_at),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: Conexao) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStatusCheckId(row.id)}
            title="Verificar status"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Conexões WhatsApp"
        description="Gerencie as conexões de WhatsApp da sua empresa"
        action={
          <Button onClick={openWizard}>
            <Smartphone className="mr-2 h-4 w-4" /> Conectar WhatsApp
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={connections || []}
        isLoading={isLoading}
      />

      {/* Status check card */}
      {statusCheckId && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw
                className={`h-4 w-4 ${statusLoading ? "animate-spin" : ""}`}
              />
              Status da Conexão
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusCheckId(null)}
              >
                Fechar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <p className="text-sm text-muted-foreground">Verificando…</p>
            ) : connStatus ? (
              <div className="flex items-center gap-3">
                {connStatus.status === "connected" ? (
                  <Badge className="bg-green-600">
                    <Wifi className="mr-1 h-3 w-3" /> Conectado
                  </Badge>
                ) : connStatus.status === "connecting" ? (
                  <Badge variant="secondary">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />{" "}
                    Conectando
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <WifiOff className="mr-1 h-3 w-3" /> Desconectado
                  </Badge>
                )}
                {connStatus.phone && (
                  <span className="text-sm text-muted-foreground">
                    {connStatus.phone}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Provision wizard dialog ─── */}
      <Dialog open={wizardOpen} onOpenChange={(open) => !open && closeWizard()}>
        <DialogContent className="sm:max-w-lg">
          {/* Step 1: Form */}
          {wizardStep === "form" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Conectar WhatsApp
                </DialogTitle>
                <DialogDescription>
                  Informe o nome e o número do WhatsApp que deseja conectar. Em
                  seguida você poderá escanear o QR code com o celular.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit(handleProvision)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Nome da conexão *</Label>
                  <Input
                    placeholder="Ex: WhatsApp Principal"
                    {...form.register("nome")}
                  />
                  {form.formState.errors.nome && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.nome.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Telefone (E.164) *</Label>
                  <Input
                    placeholder="+5511999999999"
                    {...form.register("telefone_e164")}
                  />
                  {form.formState.errors.telefone_e164 && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.telefone_e164.message}
                    </p>
                  )}
                </div>
                {provision.error && (
                  <p className="text-xs text-destructive">
                    Erro ao criar conexão. Verifique os dados e tente novamente.
                  </p>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={closeWizard}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={provision.isPending}>
                    {provision.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Criando…
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {/* Step 2: QR Code pairing */}
          {wizardStep === "pairing" && provisionResult && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Escanear QR Code
                </DialogTitle>
                <DialogDescription>
                  Conectão <strong>{provisionResult.connection.nome}</strong>{" "}
                  criada. Agora escaneie o QR code para parear.
                </DialogDescription>
              </DialogHeader>
              <PairingPanel
                connectionId={provisionResult.connection.id}
                initialQR={provisionResult.qrcode}
                initialPairingCode={provisionResult.pairing_code}
                onConnected={handleConnected}
              />
              <DialogFooter>
                <Button variant="outline" onClick={closeWizard}>
                  Fechar e parear depois
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 3: Connected */}
          {wizardStep === "connected" && provisionResult && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  WhatsApp Conectado!
                </DialogTitle>
                <DialogDescription>
                  O número{" "}
                  <strong>
                    {formatPhone(provisionResult.connection.telefone_e164)}
                  </strong>{" "}
                  foi conectado com sucesso.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium">
                    {provisionResult.connection.nome}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(provisionResult.connection.telefone_e164)}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={closeWizard}>Concluir</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir conexão"
        description="Tem certeza? Essa ação não pode ser desfeita. Mensagens do chat serão mantidas mas a conexão deixará de funcionar."
        onConfirm={handleDelete}
        isLoading={deleteConn.isPending}
        variant="destructive"
      />
    </div>
  );
}
