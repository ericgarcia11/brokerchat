"use client";

import { useState, useMemo, useEffect } from "react";
import { useTeams, useCreateTeam, useDeleteTeam, useUpdateTeam, useBranches } from "@/features/admin/use-admin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate } from "@/lib/formatters";
import { env } from "@/lib/env";
import { LinhaNegocio } from "@/types/enums";
import type { Equipe } from "@/types/api";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  filial_id: z.string().min(1, "Filial obrigatória"),
  nome: z.string().min(1, "Nome obrigatório"),
  linha_negocio: z.string().min(1, "Linha obrigatória"),
});

type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  filial_id: z.string().min(1, "Filial obrigatória"),
  nome: z.string().min(1, "Nome obrigatório"),
  linha_negocio: z.string().min(1, "Linha obrigatória"),
  ativo: z.boolean(),
});

type EditForm = z.infer<typeof editSchema>;

export default function TeamsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Equipe | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: teams, isLoading } = useTeams();
  const { data: branches } = useBranches();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const updateTeam = useUpdateTeam();

  const branchNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of branches || []) map[b.id] = b.nome;
    return map;
  }, [branches]);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { filial_id: "", nome: "", linha_negocio: "" },
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { filial_id: "", nome: "", linha_negocio: "", ativo: true },
  });

  useEffect(() => {
    if (editingTeam) {
      editForm.reset({
        filial_id: editingTeam.filial_id,
        nome: editingTeam.nome,
        linha_negocio: editingTeam.linha_negocio,
        ativo: editingTeam.ativo,
      });
    }
  }, [editingTeam, editForm]);

  function handleCreate(values: CreateForm) {
    createTeam.mutate(
      {
        empresa_id: env.empresaId,
        filial_id: values.filial_id,
        nome: values.nome,
        linha_negocio: values.linha_negocio,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          form.reset();
        },
      },
    );
  }

  function handleEdit(values: EditForm) {
    if (!editingTeam) return;
    updateTeam.mutate(
      {
        id: editingTeam.id,
        data: {
          filial_id: values.filial_id,
          nome: values.nome,
          linha_negocio: values.linha_negocio,
          ativo: values.ativo,
        },
      },
      {
        onSuccess: () => setEditingTeam(null),
      },
    );
  }

  function handleDelete() {
    if (deleteId) {
      deleteTeam.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const,
      cell: (row: Equipe) => <span className="font-medium">{row.nome}</span>,
    },
    {
      header: "Filial",
      accessorKey: "filial_id" as const,
      cell: (row: Equipe) => branchNames[row.filial_id] || row.filial_id.slice(0, 8),
    },
    {
      header: "Linha",
      accessorKey: "linha_negocio" as const,
      cell: (row: Equipe) => <Badge variant="outline">{row.linha_negocio}</Badge>,
    },
    {
      header: "Ativo",
      accessorKey: "ativo" as const,
      cell: (row: Equipe) =>
        row.ativo ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>,
    },
    {
      header: "Criada em",
      accessorKey: "created_at" as const,
      cell: (row: Equipe) => formatDate(row.created_at),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: Equipe) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditingTeam(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Equipes"
        description="Equipes de atendimento e vendas"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Equipe
          </Button>
        }
      />

      <DataTable columns={columns} data={teams || []} isLoading={isLoading} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Equipe</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Filial *</Label>
              <Controller
                control={form.control}
                name="filial_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(branches || []).map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Equipe Vendas SP" {...form.register("nome")} />
            </div>
            <div className="space-y-2">
              <Label>Linha de negócio *</Label>
              <Controller
                control={form.control}
                name="linha_negocio"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LinhaNegocio.VENDA}>Venda</SelectItem>
                      <SelectItem value={LinhaNegocio.ALUGUEL}>Aluguel</SelectItem>
                      <SelectItem value={LinhaNegocio.TRIAGEM}>Triagem</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTeam.isPending}>
                {createTeam.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Equipe</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Filial *</Label>
              <Controller
                control={editForm.control}
                name="filial_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(branches || []).map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input {...editForm.register("nome")} />
              {editForm.formState.errors.nome && (
                <p className="text-xs text-destructive">{editForm.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Linha de negócio *</Label>
              <Controller
                control={editForm.control}
                name="linha_negocio"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LinhaNegocio.VENDA}>Venda</SelectItem>
                      <SelectItem value={LinhaNegocio.ALUGUEL}>Aluguel</SelectItem>
                      <SelectItem value={LinhaNegocio.TRIAGEM}>Triagem</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center gap-3">
              <Controller
                control={editForm.control}
                name="ativo"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label>Ativo</Label>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingTeam(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateTeam.isPending}>
                {updateTeam.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir equipe"
        description="Tem certeza? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteTeam.isPending}
        variant="destructive"
      />
    </div>
  );
}
