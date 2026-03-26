"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDateTime } from "@/lib/formatters";
import { formatPhone } from "@/lib/formatters";
import {
  useCadenceExecucoes,
  useCancelarExecucao,
} from "@/features/cadence/use-cadence";
import type { CadenceExecucao } from "@/types/api";
import { XCircle } from "lucide-react";
import { useState } from "react";

interface ExecutionsPanelProps {
  fluxoId: string;
}

export function ExecutionsPanel({ fluxoId }: ExecutionsPanelProps) {
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: execucoes, isLoading } = useCadenceExecucoes(fluxoId);
  const cancelar = useCancelarExecucao(fluxoId);

  function handleConfirmCancel() {
    if (cancelId) {
      cancelar.mutate(cancelId, { onSuccess: () => setCancelId(null) });
    }
  }

  const columns = [
    {
      header: "Contato",
      accessorKey: "contato_id" as const,
      cell: (row: CadenceExecucao) => {
        if (row.contato?.nome) return row.contato.nome;
        if (row.contato?.telefone_e164)
          return formatPhone(row.contato.telefone_e164);
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {row.contato_id.slice(0, 8)}…
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: CadenceExecucao) => <StatusBadge status={row.status} />,
    },
    {
      header: "Step atual",
      accessorKey: "step_atual" as const,
      cell: (row: CadenceExecucao) =>
        row.step_atual !== null ? `#${row.step_atual}` : "—",
    },
    {
      header: "Iniciada em",
      accessorKey: "iniciada_em" as const,
      cell: (row: CadenceExecucao) => formatDateTime(row.iniciada_em),
    },
    {
      header: "Encerrada em",
      accessorKey: "encerrada_em" as const,
      cell: (row: CadenceExecucao) =>
        row.encerrada_em ? formatDateTime(row.encerrada_em) : "—",
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: CadenceExecucao) =>
        row.status === "ativa" ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            onClick={() => setCancelId(row.id)}
          >
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={execucoes ?? []}
        isLoading={isLoading}
        emptyMessage="Nenhuma execução registrada para este fluxo."
      />

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
        title="Cancelar execução"
        description="A cadência será interrompida para este contato. Deseja continuar?"
        confirmLabel="Cancelar execução"
        variant="destructive"
        onConfirm={handleConfirmCancel}
        isLoading={cancelar.isPending}
      />
    </>
  );
}
