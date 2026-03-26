import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { Chat, HandoffRequest, AssignAgentRequest } from "@/types/api";

export function useChats(empresaId?: string, offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["chats", empresaId, offset, limit],
    queryFn: () => chatApi.list({ empresa_id: empresaId || env.empresaId, offset, limit }),
    refetchInterval: env.pollIntervalMs,
  });
}

export function useChat(chatId: string | null) {
  return useQuery({
    queryKey: ["chats", chatId],
    queryFn: () => chatApi.get(chatId!),
    enabled: !!chatId,
  });
}

export function useChatMessages(chatId: string | null, limit = 200) {
  return useQuery({
    queryKey: ["messages", chatId, limit],
    queryFn: () => chatApi.messages(chatId!, limit),
    enabled: !!chatId,
    refetchInterval: env.pollIntervalMs,
  });
}

export function useHandoffChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body?: HandoffRequest }) =>
      chatApi.handoff(chatId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat transferido com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCloseChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.close(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat encerrado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useResumeChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.resume(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat retomado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAssignAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body: AssignAgentRequest }) =>
      chatApi.assignAgent(chatId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Agente atribuído com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
