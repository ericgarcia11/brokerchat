"use client";

import { useState } from "react";
import { useContacts, useCreateContact, useDeleteContact } from "@/features/contacts/use-contacts";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatPhone, formatRelative } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";
import type { Contato } from "@/types/api";
import { Plus, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  telefone_e164: z.string().min(10, "Telefone obrigatório"),
  nome: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cidade_interesse: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

const PAGE_SIZE = 20;

export default function ContactsPage() {
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: contacts, isLoading } = useContacts(page * PAGE_SIZE, PAGE_SIZE);
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { telefone_e164: "", nome: "", email: "", cidade_interesse: "" },
  });

  function handleCreate(values: CreateForm) {
    createContact.mutate(
      {
        empresa_id: env.empresaId,
        telefone_e164: values.telefone_e164,
        nome: values.nome || undefined,
        email: values.email || undefined,
        cidade_interesse: values.cidade_interesse || undefined,
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
      deleteContact.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const,
      cell: (row: Contato) => (
        <Link href={`/contacts/${row.id}`} className="font-medium hover:underline">
          {row.nome || "Sem nome"}
        </Link>
      ),
    },
    {
      header: "Telefone",
      accessorKey: "telefone_e164" as const,
      cell: (row: Contato) => formatPhone(row.telefone_e164),
    },
    {
      header: "Email",
      accessorKey: "email" as const,
      cell: (row: Contato) => row.email || "—",
    },
    {
      header: "Cidade",
      accessorKey: "cidade_interesse" as const,
      cell: (row: Contato) => row.cidade_interesse || "—",
    },
    {
      header: "Opt-out",
      accessorKey: "opt_out" as const,
      cell: (row: Contato) =>
        row.opt_out ? (
          <Badge variant="destructive">Sim</Badge>
        ) : (
          <Badge variant="outline">Não</Badge>
        ),
    },
    {
      header: "Último contato",
      accessorKey: "ultimo_contato_em" as const,
      cell: (row: Contato) =>
        row.ultimo_contato_em ? formatRelative(row.ultimo_contato_em) : "—",
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: Contato) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/contacts/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
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
        title="Contatos"
        description="Todos os contatos registrados"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Contato
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={contacts || []}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        totalEstimate={(contacts?.length ?? 0) === PAGE_SIZE ? (page + 2) * PAGE_SIZE : (page + 1) * PAGE_SIZE}
      />

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Telefone (E.164) *</Label>
              <Input placeholder="+5511999999999" {...form.register("telefone_e164")} />
              {form.formState.errors.telefone_e164 && (
                <p className="text-xs text-destructive">{form.formState.errors.telefone_e164.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Nome do contato" {...form.register("nome")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="email@exemplo.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Cidade de interesse</Label>
              <Input placeholder="São Paulo" {...form.register("cidade_interesse")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createContact.isPending}>
                {createContact.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir contato"
        description="Tem certeza? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteContact.isPending}
        variant="destructive"
      />
    </div>
  );
}
