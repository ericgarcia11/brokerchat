"use client";

import { useState, useMemo, useEffect } from "react";
import { useUsers, useCreateUser, useDeleteUser, useUpdateUser, useTeams } from "@/features/admin/use-admin";
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
import { formatDate, formatPhone } from "@/lib/formatters";
import { env } from "@/lib/env";
import { PapelUsuario } from "@/types/enums";
import type { Usuario } from "@/types/api";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  login: z.string().min(1, "Login obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  telefone_e164: z.string().optional(),
  papel: z.string().default("atendente"),
  equipe_id: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().optional().refine((v) => !v || v.length >= 6, "Senha deve ter ao menos 6 caracteres"),
  telefone_e164: z.string().optional(),
  papel: z.string(),
  equipe_id: z.string().optional(),
  ativo: z.boolean(),
});

type EditForm = z.infer<typeof editSchema>;

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: users, isLoading } = useUsers();
  const { data: teams } = useTeams();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const teamNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of teams || []) map[t.id] = t.nome;
    return map;
  }, [teams]);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { nome: "", login: "", email: "", senha: "", telefone_e164: "", papel: "atendente", equipe_id: "" },
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { nome: "", email: "", senha: "", telefone_e164: "", papel: "atendente", equipe_id: "", ativo: true },
  });

  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        nome: editingUser.nome,
        email: editingUser.email,
        senha: "",
        telefone_e164: editingUser.telefone_e164 || "",
        papel: editingUser.papel,
        equipe_id: editingUser.equipe_id || "",
        ativo: editingUser.ativo,
      });
    }
  }, [editingUser, editForm]);

  function handleCreate(values: CreateForm) {
    createUser.mutate(
      {
        empresa_id: env.empresaId,
        nome: values.nome,
        login: values.login,
        email: values.email,
        senha: values.senha,
        telefone_e164: values.telefone_e164 || undefined,
        papel: values.papel,
        equipe_id: values.equipe_id || undefined,
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
      deleteUser.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  function handleEdit(values: EditForm) {
    if (!editingUser) return;
    updateUser.mutate(
      {
        id: editingUser.id,
        data: {
          nome: values.nome,
          email: values.email,
          telefone_e164: values.telefone_e164 || null,
          papel: values.papel,
          ativo: values.ativo,
          ...(values.senha ? { senha: values.senha } : {}),
        },
      },
      {
        onSuccess: () => setEditingUser(null),
      },
    );
  }

  const roleLabels: Record<string, string> = {
    [PapelUsuario.ADMIN]: "Admin",
    [PapelUsuario.GESTOR]: "Gestor",
    [PapelUsuario.ATENDENTE]: "Atendente",
  };

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const,
      cell: (row: Usuario) => <span className="font-medium">{row.nome}</span>,
    },
    {
      header: "Email",
      accessorKey: "email" as const,
      cell: (row: Usuario) => row.email,
    },
    {
      header: "Telefone",
      accessorKey: "telefone_e164" as const,
      cell: (row: Usuario) => (row.telefone_e164 ? formatPhone(row.telefone_e164) : "—"),
    },
    {
      header: "Papel",
      accessorKey: "papel" as const,
      cell: (row: Usuario) => <Badge variant="outline">{roleLabels[row.papel] || row.papel}</Badge>,
    },
    {
      header: "Equipe",
      accessorKey: "equipe_id" as const,
      cell: (row: Usuario) =>
        row.equipe_id ? teamNames[row.equipe_id] || "—" : "—",
    },
    {
      header: "Ativo",
      accessorKey: "ativo" as const,
      cell: (row: Usuario) =>
        row.ativo ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>,
    },
    {
      header: "Criado em",
      accessorKey: "created_at" as const,
      cell: (row: Usuario) => formatDate(row.created_at),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: Usuario) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditingUser(row)}>
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
        title="Usuários"
        description="Atendentes, gestores e administradores"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        }
      />

      <DataTable columns={columns} data={users || []} isLoading={isLoading} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="João Silva" {...form.register("nome")} />
              {form.formState.errors.nome && (
                <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Login *</Label>
              <Input placeholder="joao.silva" {...form.register("login")} />
              {form.formState.errors.login && (
                <p className="text-xs text-destructive">{form.formState.errors.login.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="joao@empresa.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" {...form.register("senha")} />
              {form.formState.errors.senha && (
                <p className="text-xs text-destructive">{form.formState.errors.senha.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="+5511999999999" {...form.register("telefone_e164")} />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Controller
                control={form.control}
                name="papel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PapelUsuario.ATENDENTE}>Atendente</SelectItem>
                      <SelectItem value={PapelUsuario.GESTOR}>Gestor</SelectItem>
                      <SelectItem value={PapelUsuario.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Equipe</Label>
              <Controller
                control={form.control}
                name="equipe_id"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      {(teams || []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input {...editForm.register("nome")} />
              {editForm.formState.errors.nome && (
                <p className="text-xs text-destructive">{editForm.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" {...editForm.register("email")} />
              {editForm.formState.errors.email && (
                <p className="text-xs text-destructive">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input type="password" placeholder="Deixe em branco para manter" {...editForm.register("senha")} />
              {editForm.formState.errors.senha && (
                <p className="text-xs text-destructive">{editForm.formState.errors.senha.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="+5511999999999" {...editForm.register("telefone_e164")} />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Controller
                control={editForm.control}
                name="papel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PapelUsuario.ATENDENTE}>Atendente</SelectItem>
                      <SelectItem value={PapelUsuario.GESTOR}>Gestor</SelectItem>
                      <SelectItem value={PapelUsuario.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Equipe</Label>
              <Controller
                control={editForm.control}
                name="equipe_id"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      {(teams || []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
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
              <Button variant="outline" type="button" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir usuário"
        description="Tem certeza? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteUser.isPending}
        variant="destructive"
      />
    </div>
  );
}
