import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inboxApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";

export function useInboxChats(conexaoId?: string | null, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["inbox-chats", conexaoId ?? "all", limit, offset],
    queryFn: () =>
      inboxApi.list({ conexao_id: conexaoId || undefined, limit, offset }),
    refetchInterval: env.pollIntervalMs,
  });
}

export function useInboxSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conexaoId, limit }: { conexaoId: string; limit?: number }) =>
      inboxApi.sync(conexaoId, limit),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["inbox-chats"] });
      toast.success(
        `Sincronização concluída: ${data.synced} chat(s), ${data.created_contacts} contato(s) novo(s).`,
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
