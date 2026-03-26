import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agenteIAApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { AgenteIACreate } from "@/types/api";

export function useAgents(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["agentes-ia", offset, limit],
    queryFn: () => agenteIAApi.list({ empresa_id: env.empresaId, offset, limit }),
  });
}

export function useAgent(id: string | null) {
  return useQuery({
    queryKey: ["agentes-ia", id],
    queryFn: () => agenteIAApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AgenteIACreate) => agenteIAApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agentes-ia"] });
      toast.success("Agente criado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agenteIAApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agentes-ia"] });
      toast.success("Agente excluído com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
