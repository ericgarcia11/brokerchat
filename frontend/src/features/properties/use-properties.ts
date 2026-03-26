import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imovelApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { ImovelCreate } from "@/types/api";

export function useProperties(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["imoveis", offset, limit],
    queryFn: () => imovelApi.list({ empresa_id: env.empresaId, offset, limit }),
  });
}

export function useProperty(id: string | null) {
  return useQuery({
    queryKey: ["imoveis", id],
    queryFn: () => imovelApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ImovelCreate) => imovelApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["imoveis"] });
      toast.success("Imóvel criado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => imovelApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["imoveis"] });
      toast.success("Imóvel excluído com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
