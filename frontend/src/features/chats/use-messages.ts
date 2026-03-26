import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageApi } from "@/lib/api/endpoints";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { SendMessageRequest } from "@/types/api";

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SendMessageRequest) => messageApi.send(body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["messages", variables.chat_id] });
      qc.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
