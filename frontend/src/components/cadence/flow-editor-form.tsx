"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ArrowDown, Send, MessageSquare } from "lucide-react";
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

// ── Delay connector sub-component ─────────────────────────────────────────
interface DelayConnectorProps {
  index: number;
  control: Control<FluxoFormValues>;
  errors: FieldErrors<FluxoFormValues>;
}

function DelayConnector({ index, control, errors }: DelayConnectorProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <div className="h-5 w-px bg-border" />
      <div className="flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-1.5 text-xs shadow-sm">
        <ArrowDown className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Aguarda</span>
        <Controller
          name={`steps.${index}.delayValue`}
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              min={1}
              className="h-7 w-16 text-center text-xs px-1"
              {...field}
            />
          )}
        />
        <Controller
          name={`steps.${index}.delayUnit`}
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutos" className="text-xs">
                  minuto(s)
                </SelectItem>
                <SelectItem value="horas" className="text-xs">
                  hora(s)
                </SelectItem>
                <SelectItem value="dias" className="text-xs">
                  dia(s)
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <span className="text-muted-foreground">de silêncio</span>
      </div>
      {errors.steps?.[index]?.delayValue && (
        <p className="text-xs text-destructive">
          {errors.steps[index]?.delayValue?.message}
        </p>
      )}
      <div className="h-5 w-px bg-border" />
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
      {/* ── Header fields ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informações do Fluxo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ex.: Follow-up 3 dias"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">
                  {errors.nome.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Ação padrão ao responder</Label>
              <Controller
                name="acao_resposta"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACAO_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descrição opcional do fluxo…"
              rows={2}
              {...register("descricao")}
            />
          </div>
          <div className="flex items-center gap-3">
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
            <Label htmlFor="ativo-switch">Fluxo ativo</Label>
          </div>
        </CardContent>
      </Card>

      {/* ── Timeline ── */}
      <div className="space-y-0">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Linha do tempo
        </h3>

        {/* Initial message card */}
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Send className="h-4 w-4 text-primary" />
              Mensagem Inicial
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                — enviada imediatamente ao entrar na cadência
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <Textarea
              placeholder="Escreva a mensagem inicial…"
              rows={3}
              {...register("mensagem_inicial")}
            />
            {errors.mensagem_inicial && (
              <p className="text-xs text-destructive">
                {errors.mensagem_inicial.message}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Label className="shrink-0 text-xs">Ação se responder aqui:</Label>
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
          </CardContent>
        </Card>

        {/* Step list */}
        {fields.map((field, index) => (
          <div key={field.id}>
            <DelayConnector index={index} control={control} errors={errors} />
            <Card className="border-muted">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Follow-up #{index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
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
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="shrink-0 text-xs">Ação se responder aqui:</Label>
                  <Controller
                    name={`steps.${index}.acao_se_responder`}
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-7 w-52 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACAO_OPTIONS.map((o) => (
                            <SelectItem
                              key={o.value}
                              value={o.value}
                              className="text-xs"
                            >
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Add step button */}
        <div className="flex flex-col items-center gap-0 pt-1">
          {fields.length > 0 && <div className="h-5 w-px bg-border" />}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 gap-2"
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
