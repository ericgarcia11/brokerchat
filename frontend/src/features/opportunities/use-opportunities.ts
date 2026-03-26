import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { oportunidadeApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { OportunidadeCreate } from "@/types/api";

export function useOpportunities(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["oportunidades", offset, limit],
    queryFn: () => oportunidadeApi.list({ empresa_id: env.empresaId, offset, limit }),
  });
}

export function useOpportunity(id: string | null) {
  return useQuery({
    queryKey: ["oportunidades", id],
    queryFn: () => oportunidadeApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OportunidadeCreate) => oportunidadeApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success("Oportunidade criada com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => oportunidadeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success("Oportunidade excluída com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
