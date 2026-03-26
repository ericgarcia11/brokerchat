import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { regraRoteamentoApi } from "@/lib/api/endpoints";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { RegraRoteamentoCreate } from "@/types/api";

export function useRoutingRules(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["regras-roteamento", offset, limit],
    queryFn: () => regraRoteamentoApi.list({ offset, limit }),
  });
}

export function useRoutingRule(id: string | null) {
  return useQuery({
    queryKey: ["regras-roteamento", id],
    queryFn: () => regraRoteamentoApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegraRoteamentoCreate) => regraRoteamentoApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regras-roteamento"] });
      toast.success("Regra de roteamento criada com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => regraRoteamentoApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regras-roteamento"] });
      toast.success("Regra de roteamento excluída com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
