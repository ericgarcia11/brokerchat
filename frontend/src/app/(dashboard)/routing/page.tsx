"use client";

import { useState, useMemo } from "react";
import {
  useRoutingRules,
  useCreateRoutingRule,
  useDeleteRoutingRule,
} from "@/features/routing-rules/use-routing-rules";
import { useConnections } from "@/features/connections/use-connections";
import { useAgents } from "@/features/agents/use-agents";
import { useTeams } from "@/features/admin/use-admin";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AcaoRoteamento } from "@/types/enums";
import type { RegraRoteamento } from "@/types/api";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  conexao_id: z.string().min(1, "Conexão obrigatória"),
  nome: z.string().min(1, "Nome obrigatório"),
  prioridade: z.coerce.number().int().min(0).default(100),
  acao: z.string().min(1, "Ação obrigatória"),
  iniciar_chat: z.boolean().default(true),
  equipe_destino_id: z.string().optional(),
  agente_ia_destino_id: z.string().optional(),
  stop_on_match: z.boolean().default(true),
  condicoes_json: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

export default function RoutingRulesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"guided" | "json">("guided");

  const { data: rules, isLoading } = useRoutingRules();
  const { data: connections } = useConnections();
  const { data: agents } = useAgents();
  const { data: teams } = useTeams();

  const createRule = useCreateRoutingRule();
  const deleteRule = useDeleteRoutingRule();

  const connectionNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of connections || []) map[c.id] = c.nome;
    return map;
  }, [connections]);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      conexao_id: "",
      nome: "",
      prioridade: 100,
      acao: "",
      iniciar_chat: true,
      stop_on_match: true,
      condicoes_json: "",
    },
  });

  function handleCreate(values: CreateForm) {
    let condicoes: Record<string, unknown> | undefined;
    if (values.condicoes_json) {
      try {
        condicoes = JSON.parse(values.condicoes_json);
      } catch {
        form.setError("condicoes_json", { message: "JSON inválido" });
        return;
      }
    }

    createRule.mutate(
      {
        conexao_id: values.conexao_id,
        nome: values.nome,
        prioridade: values.prioridade,
        acao: values.acao,
        iniciar_chat: values.iniciar_chat,
        equipe_destino_id: values.equipe_destino_id || undefined,
        agente_ia_destino_id: values.agente_ia_destino_id || undefined,
        stop_on_match: values.stop_on_match,
        condicoes: condicoes,
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
      deleteRule.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Nome",
      accessorKey: "nome" as const,
      cell: (row: RegraRoteamento) => <span className="font-medium">{row.nome}</span>,
    },
    {
      header: "Conexão",
      accessorKey: "conexao_id" as const,
      cell: (row: RegraRoteamento) =>
        connectionNames[row.conexao_id] || row.conexao_id.slice(0, 8),
    },
    {
      header: "Prioridade",
      accessorKey: "prioridade" as const,
      cell: (row: RegraRoteamento) => row.prioridade,
    },
    {
      header: "Ação",
      accessorKey: "acao" as const,
      cell: (row: RegraRoteamento) => {
        const labels: Record<string, string> = {
          [AcaoRoteamento.ABRIR_CHAT]: "Abrir Chat",
          [AcaoRoteamento.IGNORAR]: "Ignorar",
          [AcaoRoteamento.ENCAMINHAR_HUMANO]: "Encaminhar",
        };
        return (
          <Badge variant="outline">
            <ArrowRight className="mr-1 h-3 w-3" />
            {labels[row.acao] || row.acao}
          </Badge>
        );
      },
    },
    {
      header: "Ativa",
      accessorKey: "ativa" as const,
      cell: (row: RegraRoteamento) =>
        row.ativa ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>,
    },
    {
      header: "Stop",
      accessorKey: "stop_on_match" as const,
      cell: (row: RegraRoteamento) =>
        row.stop_on_match ? "Sim" : "Não",
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: RegraRoteamento) => (
        <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Regras de Roteamento"
        description="Regras que determinam o fluxo de mensagens recebidas"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Regra
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rules || []}
        isLoading={isLoading}
      />

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Nova Regra de Roteamento</DialogTitle>
          </DialogHeader>

          <Tabs value={formMode} onValueChange={(v) => setFormMode(v as "guided" | "json")}>
            <TabsList className="mb-2">
              <TabsTrigger value="guided">Guiado</TabsTrigger>
              <TabsTrigger value="json">JSON avançado</TabsTrigger>
            </TabsList>

            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <div className="space-y-2">
                <Label>Conexão *</Label>
                <Controller
                  control={form.control}
                  name="conexao_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(connections || []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input {...form.register("nome")} />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Input type="number" {...form.register("prioridade")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ação *</Label>
                <Controller
                  control={form.control}
                  name="acao"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AcaoRoteamento.ABRIR_CHAT}>Abrir Chat</SelectItem>
                        <SelectItem value={AcaoRoteamento.IGNORAR}>Ignorar</SelectItem>
                        <SelectItem value={AcaoRoteamento.ENCAMINHAR_HUMANO}>Encaminhar para Humano</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Agente IA destino</Label>
                <Controller
                  control={form.control}
                  name="agente_ia_destino_id"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        {(agents || []).filter((a) => a.ativo).map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Equipe destino</Label>
                <Controller
                  control={form.control}
                  name="equipe_destino_id"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        {(teams || []).filter((t) => t.ativo).map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Controller
                    control={form.control}
                    name="iniciar_chat"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label>Iniciar chat</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    control={form.control}
                    name="stop_on_match"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label>Parar no match</Label>
                </div>
              </div>

              <TabsContent value="json" className="mt-0">
                <div className="space-y-2">
                  <Label>Condições (JSON)</Label>
                  <Textarea
                    placeholder='{"keyword": "venda"}'
                    className="font-mono text-xs min-h-[100px]"
                    {...form.register("condicoes_json")}
                  />
                  {form.formState.errors.condicoes_json && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.condicoes_json.message}
                    </p>
                  )}
                </div>
              </TabsContent>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createRule.isPending}>
                  {createRule.isPending ? "Criando…" : "Criar Regra"}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir regra"
        description="Tem certeza? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteRule.isPending}
        variant="destructive"
      />
    </div>
  );
}
