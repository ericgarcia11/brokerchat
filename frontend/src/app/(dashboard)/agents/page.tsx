"use client";

import { useState, useMemo } from "react";
import { useAgents, useCreateAgent, useDeleteAgent } from "@/features/agents/use-agents";
import { useTeams } from "@/features/admin/use-admin";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate } from "@/lib/formatters";
import { env } from "@/lib/env";
import { TipoAgente } from "@/types/enums";
import type { AgenteIA } from "@/types/api";
import { Plus, Trash2, Bot, Eye } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  tipo: z.string().min(1, "Tipo obrigatório"),
  graph_id: z.string().min(1, "Graph ID obrigatório"),
  equipe_id: z.string().optional(),
  versao_prompt: z.string().default("v1"),
  prompt_sistema: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

export default function AgentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailAgent, setDetailAgent] = useState<AgenteIA | null>(null);

  const { data: agents, isLoading } = useAgents();
  const { data: teams } = useTeams();
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();

  const teamNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of teams || []) map[t.id] = t.nome;
    return map;
  }, [teams]);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nome: "",
      tipo: "",
      graph_id: "",
      equipe_id: "",
      versao_prompt: "v1",
      prompt_sistema: "",
    },
  });

  function handleCreate(values: CreateForm) {
    createAgent.mutate(
      {
        empresa_id: env.empresaId,
        nome: values.nome,
        tipo: values.tipo,
        graph_id: values.graph_id,
        equipe_id: values.equipe_id || undefined,
        versao_prompt: values.versao_prompt,
        prompt_sistema: values.prompt_sistema || undefined,
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
      deleteAgent.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const,
      cell: (row: AgenteIA) => (
        <button
          onClick={() => setDetailAgent(row)}
          className="font-medium hover:underline text-left"
        >
          {row.nome}
        </button>
      ),
    },
    {
      header: "Tipo",
      accessorKey: "tipo" as const,
      cell: (row: AgenteIA) => <Badge variant="outline">{row.tipo}</Badge>,
    },
    {
      header: "Graph",
      accessorKey: "graph_id" as const,
      cell: (row: AgenteIA) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.graph_id}</code>
      ),
    },
    {
      header: "Equipe",
      accessorKey: "equipe_id" as const,
      cell: (row: AgenteIA) =>
        row.equipe_id ? teamNames[row.equipe_id] || "—" : "—",
    },
    {
      header: "Prompt",
      accessorKey: "versao_prompt" as const,
      cell: (row: AgenteIA) => <Badge variant="secondary">{row.versao_prompt}</Badge>,
    },
    {
      header: "Ativo",
      accessorKey: "ativo" as const,
      cell: (row: AgenteIA) =>
        row.ativo ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>,
    },
    {
      header: "Criado",
      accessorKey: "created_at" as const,
      cell: (row: AgenteIA) => formatDate(row.created_at),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: AgenteIA) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => setDetailAgent(row)}>
            <Eye className="h-4 w-4" />
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
        title="Agentes IA"
        description="Agentes LangGraph configurados"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Agente
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={agents || []}
        isLoading={isLoading}
      />

      {/* Detail view */}
      <Dialog open={!!detailAgent} onOpenChange={(open) => !open && setDetailAgent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {detailAgent?.nome}
            </DialogTitle>
          </DialogHeader>
          {detailAgent && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  <Badge variant="outline">{detailAgent.tipo}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>{" "}
                  {detailAgent.provider}
                </div>
                <div>
                  <span className="text-muted-foreground">Graph:</span>{" "}
                  <code className="text-xs bg-muted px-1 rounded">{detailAgent.graph_id}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Versão:</span>{" "}
                  {detailAgent.versao_prompt}
                </div>
              </div>
              {detailAgent.prompt_sistema && (
                <div>
                  <Label className="text-muted-foreground">Prompt do sistema:</Label>
                  <pre className="mt-1 whitespace-pre-wrap text-xs bg-muted p-3 rounded max-h-60 overflow-auto">
                    {detailAgent.prompt_sistema}
                  </pre>
                </div>
              )}
              {detailAgent.configuracao && Object.keys(detailAgent.configuracao).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Configuração:</Label>
                  <pre className="mt-1 text-xs bg-muted p-3 rounded max-h-40 overflow-auto">
                    {JSON.stringify(detailAgent.configuracao, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Novo Agente IA</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Agente Triagem" {...form.register("nome")} />
              {form.formState.errors.nome && (
                <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Controller
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TipoAgente.TRIAGEM}>Triagem</SelectItem>
                      <SelectItem value={TipoAgente.VENDAS}>Vendas</SelectItem>
                      <SelectItem value={TipoAgente.ALUGUEL}>Aluguel</SelectItem>
                      <SelectItem value={TipoAgente.POS_ATENDIMENTO}>Pós-atendimento</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Graph ID *</Label>
              <Input placeholder="triagem_graph" {...form.register("graph_id")} />
              {form.formState.errors.graph_id && (
                <p className="text-xs text-destructive">{form.formState.errors.graph_id.message}</p>
              )}
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
            <div className="space-y-2">
              <Label>Versão do prompt</Label>
              <Input {...form.register("versao_prompt")} />
            </div>
            <div className="space-y-2">
              <Label>Prompt do sistema</Label>
              <Input {...form.register("prompt_sistema")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAgent.isPending}>
                {createAgent.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir agente"
        description="Tem certeza? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteAgent.isPending}
        variant="destructive"
      />
    </div>
  );
}
