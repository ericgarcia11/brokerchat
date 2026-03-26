"use client";

import { useState, useMemo } from "react";
import {
  useOpportunities,
  useCreateOpportunity,
  useDeleteOpportunity,
} from "@/features/opportunities/use-opportunities";
import { useContacts } from "@/features/contacts/use-contacts";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelative, formatCurrency } from "@/lib/formatters";
import { env } from "@/lib/env";
import { StatusOportunidade, LinhaNegocio } from "@/types/enums";
import type { Oportunidade } from "@/types/api";
import { Plus, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  contato_id: z.string().min(1, "Contato obrigatório"),
  linha_negocio: z.string().min(1, "Linha obrigatória"),
  interesse_cidade: z.string().optional(),
  interesse_bairro: z.string().optional(),
  orcamento_min: z.coerce.number().optional(),
  orcamento_max: z.coerce.number().optional(),
  quartos_min: z.coerce.number().optional(),
  observacoes: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

const PAGE_SIZE = 20;

const KANBAN_COLUMNS = [
  StatusOportunidade.ABERTA,
  StatusOportunidade.QUALIFICANDO,
  StatusOportunidade.EM_ATENDIMENTO,
  StatusOportunidade.GANHA,
  StatusOportunidade.PERDIDA,
];

export default function OpportunitiesPage() {
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: opportunities, isLoading } = useOpportunities(page * PAGE_SIZE, PAGE_SIZE);
  const { data: contacts } = useContacts(0, 500);
  const createOpp = useCreateOpportunity();
  const deleteOpp = useDeleteOpportunity();

  const contactNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of contacts || []) {
      map[c.id] = c.nome || c.telefone_e164;
    }
    return map;
  }, [contacts]);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      contato_id: "",
      linha_negocio: "",
      interesse_cidade: "",
      interesse_bairro: "",
      observacoes: "",
    },
  });

  function handleCreate(values: CreateForm) {
    createOpp.mutate(
      {
        empresa_id: env.empresaId,
        contato_id: values.contato_id,
        linha_negocio: values.linha_negocio,
        interesse_cidade: values.interesse_cidade || undefined,
        interesse_bairro: values.interesse_bairro || undefined,
        orcamento_min: values.orcamento_min || undefined,
        orcamento_max: values.orcamento_max || undefined,
        quartos_min: values.quartos_min || undefined,
        observacoes: values.observacoes || undefined,
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
      deleteOpp.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Contato",
      accessorKey: "contato_id" as const,
      cell: (row: Oportunidade) => (
        <Link href={`/contacts/${row.contato_id}`} className="font-medium hover:underline">
          {contactNames[row.contato_id] || row.contato_id.slice(0, 8)}
        </Link>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: Oportunidade) => <StatusBadge status={row.status} />,
    },
    {
      header: "Linha",
      accessorKey: "linha_negocio" as const,
      cell: (row: Oportunidade) => <Badge variant="outline">{row.linha_negocio}</Badge>,
    },
    {
      header: "Cidade",
      accessorKey: "interesse_cidade" as const,
      cell: (row: Oportunidade) => row.interesse_cidade || "—",
    },
    {
      header: "Orçamento",
      accessorKey: "orcamento_min" as const,
      cell: (row: Oportunidade) => {
        if (!row.orcamento_min && !row.orcamento_max) return "—";
        const parts = [];
        if (row.orcamento_min) parts.push(formatCurrency(row.orcamento_min));
        if (row.orcamento_max) parts.push(formatCurrency(row.orcamento_max));
        return parts.join(" – ");
      },
    },
    {
      header: "Criada",
      accessorKey: "created_at" as const,
      cell: (row: Oportunidade) => formatRelative(row.created_at),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: Oportunidade) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/opportunities/${row.id}`}>
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

  // Kanban grouping
  const grouped = useMemo(() => {
    const map = new Map<string, Oportunidade[]>();
    for (const col of KANBAN_COLUMNS) map.set(col, []);
    for (const opp of opportunities || []) {
      const list = map.get(opp.status);
      if (list) list.push(opp);
    }
    return map;
  }, [opportunities]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Oportunidades"
        description="Pipeline de oportunidades de negócio"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Oportunidade
          </Button>
        }
      />

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="kanban">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <DataTable
            columns={columns}
            data={opportunities || []}
            isLoading={isLoading}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            totalEstimate={(opportunities?.length ?? 0) === PAGE_SIZE ? (page + 2) * PAGE_SIZE : (page + 1) * PAGE_SIZE}
          />
        </TabsContent>

        <TabsContent value="kanban">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((status) => (
              <div key={status} className="flex-shrink-0 w-64">
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-2">
                      <StatusBadge status={status} />
                      <span className="text-muted-foreground">
                        ({grouped.get(status)?.length || 0})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-2 pb-2 max-h-[60vh] overflow-auto">
                    {(grouped.get(status) || []).map((opp) => (
                      <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                        <Card className="hover:bg-accent transition-colors cursor-pointer">
                          <CardContent className="p-3 text-sm space-y-1">
                            <p className="font-medium truncate">
                              {contactNames[opp.contato_id] || opp.contato_id.slice(0, 8)}
                            </p>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px]">
                                {opp.linha_negocio}
                              </Badge>
                            </div>
                            {opp.interesse_cidade && (
                              <p className="text-xs text-muted-foreground">{opp.interesse_cidade}</p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Contato *</Label>
              <Controller
                control={form.control}
                name="contato_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(contacts || []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome || c.telefone_e164}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.contato_id && (
                <p className="text-xs text-destructive">{form.formState.errors.contato_id.message}</p>
              )}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input {...form.register("interesse_cidade")} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input {...form.register("interesse_bairro")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Orçamento mín.</Label>
                <Input type="number" {...form.register("orcamento_min")} />
              </div>
              <div className="space-y-2">
                <Label>Orçamento máx.</Label>
                <Input type="number" {...form.register("orcamento_max")} />
              </div>
              <div className="space-y-2">
                <Label>Quartos mín.</Label>
                <Input type="number" {...form.register("quartos_min")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input {...form.register("observacoes")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createOpp.isPending}>
                {createOpp.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir oportunidade"
        description="Tem certeza? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteOpp.isPending}
        variant="destructive"
      />
    </div>
  );
}
