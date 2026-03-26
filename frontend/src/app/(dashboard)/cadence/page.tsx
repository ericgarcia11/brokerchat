"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  useCadenceFluxos,
  useDeleteCadenceFluxo,
  useToggleCadenceFluxo,
} from "@/features/cadence/use-cadence";
import type { CadenceFluxo, AcaoResposta } from "@/types/api";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ACAO_LABELS: Record<AcaoResposta, string> = {
  continuar_ia: "Continuar com a IA",
  notificar_responsavel: "Notificar responsável",
  encerrar_cadencia: "Encerrar cadência",
  transferir_humano: "Transferir para humano",
};

export default function CadenceListPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: fluxos, isLoading } = useCadenceFluxos();
  const deleteFluxo = useDeleteCadenceFluxo();
  const toggleFluxo = useToggleCadenceFluxo();

  function handleDelete() {
    if (deleteId) {
      deleteFluxo.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const,
      cell: (row: CadenceFluxo) => (
        <Link
          href={`/cadence/${row.id}`}
          className="font-medium hover:underline"
        >
          {row.nome}
        </Link>
      ),
    },
    {
      header: "Nº de Steps",
      accessorKey: "steps" as const,
      cell: (row: CadenceFluxo) => (
        <span className="tabular-nums">{row.steps.length}</span>
      ),
    },
    {
      header: "Ação padrão ao responder",
      accessorKey: "acao_resposta" as const,
      cell: (row: CadenceFluxo) => ACAO_LABELS[row.acao_resposta] ?? row.acao_resposta,
    },
    {
      header: "Ativo",
      accessorKey: "ativo" as const,
      cell: (row: CadenceFluxo) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.ativo}
            onCheckedChange={(checked) =>
              toggleFluxo.mutate({ id: row.id, ativo: checked })
            }
          />
          {row.ativo ? (
            <Badge variant="success">Ativo</Badge>
          ) : (
            <Badge variant="secondary">Inativo</Badge>
          )}
        </div>
      ),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: CadenceFluxo) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/cadence/${row.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
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
        title="Fluxos de Cadência"
        description="Configure sequências automáticas de follow-up via WhatsApp"
        action={
          <Button asChild>
            <Link href="/cadence/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fluxo
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={fluxos ?? []}
        isLoading={isLoading}
        emptyMessage="Nenhum fluxo de cadência configurado."
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir fluxo"
        description="Tem certeza? O fluxo e todas as suas configurações serão removidos. Execuções em andamento não serão afetadas."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteFluxo.isPending}
      />
    </div>
  );
}
