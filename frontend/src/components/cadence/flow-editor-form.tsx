"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  ChevronDown,
  Zap,
} from "lucide-react";
import {
  useCreateCadenceFluxo,
  useUpdateCadenceFluxo,
} from "@/features/cadence/use-cadence";
import { env } from "@/lib/env";
import type { CadenceFluxo, AcaoResposta } from "@/types/api";

// ── Constants ─────────────────────────────────────────────────────────────
type DelayUnit = "minutos" | "horas" | "dias";

interface AcaoOption {
  value: AcaoResposta;
  label: string;
}

const ACAO_OPTIONS: AcaoOption[] = [
  { value: "continuar_ia", label: "Continuar com a IA" },
  { value: "notificar_responsavel", label: "Notificar responsável" },
  { value: "encerrar_cadencia", label: "Encerrar cadência" },
  { value: "transferir_humano", label: "Transferir para humano" },
];

// ── Schema ────────────────────────────────────────────────────────────────
const acaoEnum = z.enum([
  "continuar_ia",
  "notificar_responsavel",
  "encerrar_cadencia",
  "transferir_humano",
]);

const stepSchema = z.object({
  delayValue: z.coerce.number().min(1, "Mínimo 1"),
  delayUnit: z.enum(["minutos", "horas", "dias"]),
  mensagem: z.string().min(1, "Mensagem obrigatória"),
  acao_se_responder: acaoEnum,
});

const fluxoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  mensagem_inicial: z.string().min(1, "Mensagem inicial é obrigatória"),
  acao_resposta: acaoEnum,
  ativo: z.boolean(),
  steps: z.array(stepSchema),
});

type FluxoFormValues = z.infer<typeof fluxoSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────
function secondsToDisplay(seconds: number): {
  delayValue: number;
  delayUnit: DelayUnit;
} {
  if (seconds >= 86400 && seconds % 86400 === 0)
    return { delayValue: seconds / 86400, delayUnit: "dias" };
  if (seconds >= 3600 && seconds % 3600 === 0)
    return { delayValue: seconds / 3600, delayUnit: "horas" };
  return { delayValue: Math.max(1, Math.round(seconds / 60)), delayUnit: "minutos" };
}

function displayToSeconds(value: number, unit: DelayUnit): number {
  if (unit === "minutos") return value * 60;
  if (unit === "horas") return value * 3600;
  return value * 86400;
}

function buildDefaultValues(fluxo?: CadenceFluxo): FluxoFormValues {
  if (!fluxo) {
    return {
      nome: "",
      descricao: "",
      mensagem_inicial: "",
      acao_resposta: "continuar_ia",
      ativo: true,
      steps: [],
    };
  }
  return {
    nome: fluxo.nome,
    descricao: fluxo.descricao ?? "",
    mensagem_inicial: fluxo.mensagem_inicial,
    acao_resposta: fluxo.acao_resposta,
    ativo: fluxo.ativo,
    steps: fluxo.steps
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((s) => ({
        ...secondsToDisplay(s.delay_segundos),
        mensagem: s.mensagem,
        acao_se_responder: s.acao_se_responder,
      })),
  };
}

// ── NodeConnector ──────────────────────────────────────────────────────────
function NodeConnector() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-6 w-px bg-border" />
      <ChevronDown className="h-3.5 w-3.5 text-border -my-px" />
      <div className="h-3 w-px bg-border" />
    </div>
  );
}

// ── WorkflowNode ───────────────────────────────────────────────────────────
interface WorkflowNodeProps {
  title: string;
  subtitle?: string;
  headerClass: string;
  icon: React.ElementType;
  iconBgClass: string;
  borderClass: string;
  children: React.ReactNode;
  onDelete?: () => void;
}

function WorkflowNode({
  title,
  subtitle,
  headerClass,
  icon: Icon,
  iconBgClass,
  borderClass,
  children,
  onDelete,
}: WorkflowNodeProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[600px] rounded-xl overflow-hidden border shadow-sm",
        borderClass
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-2.5", headerClass)}>
        <div className="flex items-center gap-2.5">
          <div className={cn("flex items-center justify-center rounded-md p-1.5", iconBgClass)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">{title}</span>
          {subtitle && (
            <span className="text-xs opacity-60 hidden sm:inline">{subtitle}</span>
          )}
        </div>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {/* Body */}
      <div className="bg-card px-4 py-4 space-y-3">{children}</div>
    </div>
  );
}

// ── WaitNode ───────────────────────────────────────────────────────────────
interface WaitNodeProps {
  index: number;
  control: Control<FluxoFormValues>;
  errors: FieldErrors<FluxoFormValues>;
}

function WaitNode({ index, control, errors }: WaitNodeProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-5 py-2 shadow-sm text-sm">
        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-amber-700 dark:text-amber-300 font-medium whitespace-nowrap">
          Aguarda
        </span>
        <Controller
          name={`steps.${index}.delayValue`}
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              min={1}
              className="h-7 w-16 text-center text-xs px-1 border-amber-300 dark:border-amber-700"
              {...field}
            />
          )}
        />
        <Controller
          name={`steps.${index}.delayUnit`}
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-7 w-28 text-xs border-amber-300 dark:border-amber-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutos" className="text-xs">minuto(s)</SelectItem>
                <SelectItem value="horas" className="text-xs">hora(s)</SelectItem>
                <SelectItem value="dias" className="text-xs">dia(s)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <span className="text-amber-700 dark:text-amber-300 font-medium whitespace-nowrap">
          sem resposta
        </span>
      </div>
      {errors.steps?.[index]?.delayValue && (
        <p className="text-xs text-destructive">
          {errors.steps[index]?.delayValue?.message}
        </p>
      )}
    </div>
  );
}

// ── ActionSelect ──────────────────────────────────────────────────────────
interface ActionSelectProps {
  name: "acao_resposta" | `steps.${number}.acao_se_responder`;
  control: Control<FluxoFormValues>;
}

function ActionSelect({ name, control }: ActionSelectProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
      <Zap className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground shrink-0">Ação ao responder:</span>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="h-7 w-52 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACAO_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface FlowEditorFormProps {
  fluxo?: CadenceFluxo;
}

export function FlowEditorForm({ fluxo }: FlowEditorFormProps) {
  const router = useRouter();
  const isEditing = !!fluxo;
  const createFluxo = useCreateCadenceFluxo();
  const updateFluxo = useUpdateCadenceFluxo(fluxo?.id ?? "");

  const form = useForm<FluxoFormValues>({
    resolver: zodResolver(fluxoSchema),
    defaultValues: buildDefaultValues(fluxo),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = form;

  function onSubmit(values: FluxoFormValues) {
    const payload = {
      empresa_id: env.empresaId,
      nome: values.nome,
      descricao: values.descricao || null,
      mensagem_inicial: values.mensagem_inicial,
      acao_resposta: values.acao_resposta,
      ativo: values.ativo,
      steps: values.steps.map((s, idx) => ({
        ordem: idx + 1,
        delay_segundos: displayToSeconds(s.delayValue, s.delayUnit),
        mensagem: s.mensagem,
        acao_se_responder: s.acao_se_responder,
      })),
    };

    if (isEditing) {
      updateFluxo.mutate(payload, {
        onSuccess: () => router.push("/cadence"),
      });
    } else {
      createFluxo.mutate(payload, {
        onSuccess: () => router.push("/cadence"),
      });
    }
  }

  const isBusy = createFluxo.isPending || updateFluxo.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Config Panel ── */}
      <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <Input
                className="text-base font-semibold h-10 border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
                placeholder="Nome do fluxo…"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>
              )}
            </div>
            <Input
              className="text-sm text-muted-foreground border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
              placeholder="Descrição opcional…"
              {...register("descricao")}
            />
          </div>
          <div className="flex items-center gap-3 pt-1 shrink-0">
            <Controller
              name="ativo"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="ativo-switch"
                />
              )}
            />
            <Label htmlFor="ativo-switch" className="text-sm cursor-pointer">
              Ativo
            </Label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Ação padrão ao responder:</span>
          <Controller
            name="acao_resposta"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-7 w-52 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACAO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* ── Workflow Canvas ── */}
      <div className="flex flex-col items-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5 self-start">
          Fluxo de mensagens
        </p>

        {/* Trigger node */}
        <WorkflowNode
          title="Início"
          subtitle="— contato entra na cadência"
          headerClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          icon={Play}
          iconBgClass="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          borderClass="border-emerald-300 dark:border-emerald-800"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este fluxo é disparado quando um contato entra na cadência. A primeira
            mensagem é enviada imediatamente.
          </p>
        </WorkflowNode>

        <NodeConnector />

        {/* Initial message node */}
        <WorkflowNode
          title="Mensagem Inicial"
          headerClass="bg-primary/10 text-primary"
          icon={MessageSquare}
          iconBgClass="bg-primary/20 text-primary"
          borderClass="border-primary/30"
        >
          <Textarea
            placeholder="Escreva a mensagem inicial…"
            rows={3}
            {...register("mensagem_inicial")}
          />
          {errors.mensagem_inicial && (
            <p className="text-xs text-destructive">{errors.mensagem_inicial.message}</p>
          )}
          <ActionSelect name="acao_resposta" control={control} />
        </WorkflowNode>

        {/* Steps */}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-col items-center w-full max-w-[600px]"
          >
            <NodeConnector />
            <WaitNode index={index} control={control} errors={errors} />
            <NodeConnector />
            <WorkflowNode
              title={`Follow-up #${index + 1}`}
              headerClass="bg-violet-500/10 text-violet-700 dark:text-violet-400"
              icon={MessageSquare}
              iconBgClass="bg-violet-500/20 text-violet-600 dark:text-violet-400"
              borderClass="border-violet-300 dark:border-violet-800"
              onDelete={() => remove(index)}
            >
              <Textarea
                placeholder={`Escreva a mensagem do follow-up #${index + 1}…`}
                rows={3}
                {...register(`steps.${index}.mensagem`)}
              />
              {errors.steps?.[index]?.mensagem && (
                <p className="text-xs text-destructive">
                  {errors.steps[index]?.mensagem?.message}
                </p>
              )}
              <ActionSelect
                name={`steps.${index}.acao_se_responder`}
                control={control}
              />
            </WorkflowNode>
          </div>
        ))}

        {/* Add step */}
        <div className="flex flex-col items-center mt-1">
          <div className="h-6 w-px bg-border" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-full px-5 shadow-sm hover:shadow transition-shadow"
            onClick={() =>
              append({
                delayValue: 1,
                delayUnit: "dias",
                mensagem: "",
                acao_se_responder: getValues("acao_resposta"),
              })
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar follow-up
          </Button>
        </div>
      </div>

      {/* ── Actions ── */}
      <Separator />
      <div className="flex items-center justify-end gap-3 pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/cadence")}
          disabled={isBusy}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isBusy}>
          {isBusy
            ? "Salvando…"
            : isEditing
            ? "Salvar alterações"
            : "Criar fluxo"}
        </Button>
      </div>
    </form>
  );
}
