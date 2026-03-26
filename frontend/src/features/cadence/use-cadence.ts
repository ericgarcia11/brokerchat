import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cadenceApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { CadenceFluxoCreate } from "@/types/api";

export function useCadenceFluxos() {
  return useQuery({
    queryKey: ["cadence-fluxos"],
    queryFn: () => cadenceApi.listFluxos(env.empresaId),
  });
}

export function useCadenceFluxo(id: string | null) {
  return useQuery({
    queryKey: ["cadence-fluxos", id],
    queryFn: () => cadenceApi.getFluxo(id!),
    enabled: !!id,
  });
}

export function useCreateCadenceFluxo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CadenceFluxoCreate) => cadenceApi.createFluxo(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cadence-fluxos"] });
      toast.success("Fluxo criado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateCadenceFluxo(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CadenceFluxoCreate>) =>
      cadenceApi.updateFluxo(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cadence-fluxos"] });
      toast.success("Fluxo atualizado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useToggleCadenceFluxo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      cadenceApi.updateFluxo(id, { ativo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cadence-fluxos"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCadenceFluxo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cadenceApi.deleteFluxo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cadence-fluxos"] });
      toast.success("Fluxo excluído com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCadenceExecucoes(fluxoId: string | null) {
  return useQuery({
    queryKey: ["cadence-execucoes", fluxoId],
    queryFn: () => cadenceApi.listExecucoes(fluxoId!),
    enabled: !!fluxoId,
  });
}

export function useCancelarExecucao(fluxoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cadenceApi.cancelarExecucao(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cadence-execucoes", fluxoId] });
      toast.success("Execução cancelada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
