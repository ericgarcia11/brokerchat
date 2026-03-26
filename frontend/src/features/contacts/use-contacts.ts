import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contatoApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { ContatoCreate } from "@/types/api";

export function useContacts(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["contatos", offset, limit],
    queryFn: () => contatoApi.list({ empresa_id: env.empresaId, offset, limit }),
  });
}

export function useContact(id: string | null) {
  return useQuery({
    queryKey: ["contatos", id],
    queryFn: () => contatoApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContatoCreate) => contatoApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contatos"] });
      toast.success("Contato criado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contatoApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contatos"] });
      toast.success("Contato excluído com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
