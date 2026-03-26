"use client";

import { useState } from "react";
import { useBranches, useCreateBranch, useDeleteBranch } from "@/features/admin/use-admin";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate } from "@/lib/formatters";
import { env } from "@/lib/env";
import type { Filial } from "@/types/api";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  cidade: z.string().min(1, "Cidade obrigatória"),
  estado: z.string().min(2, "Estado obrigatório").max(2, "Sigla do estado (2 letras)"),
});

type CreateForm = z.infer<typeof createSchema>;

export default function BranchesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: branches, isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const deleteBranch = useDeleteBranch();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { nome: "", cidade: "", estado: "" },
  });

  function handleCreate(values: CreateForm) {
    createBranch.mutate(
      {
        empresa_id: env.empresaId,
        nome: values.nome,
        cidade: values.cidade,
        estado: values.estado.toUpperCase(),
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          form.reset();
        },
      },
    );
  }

  function handleDelete() {
    if (deleteId) {
      deleteBranch.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const,
      cell: (row: Filial) => <span className="font-medium">{row.nome}</span>,
    },
    {
      header: "Cidade",
      accessorKey: "cidade" as const,
      cell: (row: Filial) => row.cidade,
    },
    {
      header: "Estado",
      accessorKey: "estado" as const,
      cell: (row: Filial) => <Badge variant="outline">{row.estado}</Badge>,
    },
    {
      header: "Ativo",
      accessorKey: "ativo" as const,
      cell: (row: Filial) =>
        row.ativo ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>,
    },
    {
      header: "Criada em",
      accessorKey: "created_at" as const,
      cell: (row: Filial) => formatDate(row.created_at),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: Filial) => (
        <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Filiais"
        description="Filiais da empresa"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Filial
          </Button>
        }
      />

      <DataTable columns={columns} data={branches || []} isLoading={isLoading} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Filial</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Filial São Paulo" {...form.register("nome")} />
              {form.formState.errors.nome && (
                <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input placeholder="São Paulo" {...form.register("cidade")} />
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Input placeholder="SP" maxLength={2} {...form.register("estado")} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createBranch.isPending}>
                {createBranch.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir filial"
        description="Tem certeza? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteBranch.isPending}
        variant="destructive"
      />
    </div>
  );
}
