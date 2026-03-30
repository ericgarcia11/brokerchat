"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import { useHandoffChat, useCloseChat, useResumeChat, useAssignAgent, useChatMessages } from "@/features/chats/use-chats";
import { useInboxChats, useInboxSync } from "@/features/chats/use-inbox";
import { useSendMessage } from "@/features/chats/use-messages";
import { useConnections } from "@/features/connections/use-connections";
import { useOpportunities } from "@/features/opportunities/use-opportunities";
import { ChatList } from "@/components/chats/chat-list";
import { ChatHeader } from "@/components/chats/chat-header";
import { ChatMessageBubble, DateSeparator } from "@/components/chats/chat-message-bubble";
import { ChatComposer } from "@/components/chats/chat-composer";
import { ChatSidebarPanel } from "@/components/chats/chat-sidebar-panel";
import { AssignAgentDialog } from "@/components/chats/assign-agent-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineLoading } from "@/components/shared/loading";
import { StatusChat } from "@/types/enums";
import { MessageSquareText, RefreshCw } from "lucide-react";
import type { Mensagem, InboxChat } from "@/types/api";

function groupMessagesByDate(messages: Mensagem[]) {
  const groups: { date: string; messages: Mensagem[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const date = msg.criada_em.split("T")[0];
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export default function ChatsPage() {
  const { selectedChatId, setSelectedChatId } = useAppStore();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedConexaoId, setSelectedConexaoId] = useState<string>("all");

  // ── Data queries ───────────────────────────────
  const { data: connections } = useConnections();
  const { data: inboxData, isLoading: chatsLoading } = useInboxChats(
    selectedConexaoId === "all" ? null : selectedConexaoId,
  );
  const syncMutation = useInboxSync();

  const inboxChats: InboxChat[] = inboxData?.items ?? [];

  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedChatId);
  const { data: opportunities } = useOpportunities(0, 500);

  // Find the selected chat from inbox data
  const selectedChat = useMemo(
    () => inboxChats.find((c) => c.id === selectedChatId) ?? null,
    [inboxChats, selectedChatId],
  );

  const selectedContact = selectedChat?.contato ?? null;

  // ── Mutations ──────────────────────────────────
  const sendMessage = useSendMessage();
  const handoff = useHandoffChat();
  const closeChat = useCloseChat();
  const resumeChat = useResumeChat();
  const assignAgent = useAssignAgent();

  // ── Derived data ────────────────────────────────
  const contactNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of inboxChats) {
      map[c.contato_id] = c.contato.nome || c.contato.telefone_e164;
    }
    return map;
  }, [inboxChats]);

  const unreadCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of inboxChats) {
      if (c.wa_unread_count > 0) map[c.id] = c.wa_unread_count;
    }
    return map;
  }, [inboxChats]);

  const selectedConnection = useMemo(
    () => (connections || []).find((c) => c.id === selectedChat?.conexao_id) ?? null,
    [connections, selectedChat],
  );

  const selectedOpportunity = useMemo(
    () => (opportunities || []).find((o) => o.id === selectedChat?.oportunidade_id) ?? null,
    [opportunities, selectedChat],
  );

  // ── Auto-scroll ────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Handlers ───────────────────────────────────
  const handleSend = useCallback(
    (text: string) => {
      if (!selectedChat || !selectedContact) return;
      sendMessage.mutate({
        conexao_id: selectedChat.conexao_id,
        phone: selectedContact.telefone_e164,
        chat_id: selectedChat.id,
        text,
      });
    },
    [selectedChat, selectedContact, sendMessage],
  );

  const handleHandoff = useCallback(() => {
    if (selectedChatId) handoff.mutate({ chatId: selectedChatId });
  }, [selectedChatId, handoff]);

  const handleClose = useCallback(() => {
    if (selectedChatId) closeChat.mutate(selectedChatId);
  }, [selectedChatId, closeChat]);

  const handleResume = useCallback(() => {
    if (selectedChatId) resumeChat.mutate(selectedChatId);
  }, [selectedChatId, resumeChat]);

  const handleAssignAgent = useCallback(
    (agenteIaId: string) => {
      if (selectedChatId) {
        assignAgent.mutate(
          { chatId: selectedChatId, body: { agente_ia_id: agenteIaId } },
          { onSuccess: () => setAssignDialogOpen(false) },
        );
      }
    },
    [selectedChatId, assignAgent],
  );

  const handleSync = useCallback(() => {
    if (selectedConexaoId === "all") return;
    syncMutation.mutate({ conexaoId: selectedConexaoId });
  }, [selectedConexaoId, syncMutation]);

  // ── Message date groups ────────────────────────
  const messageGroups = useMemo(
    () => groupMessagesByDate(messages || []),
    [messages],
  );

  const isClosed =
    selectedChat?.status === StatusChat.ENCERRADO ||
    selectedChat?.status === StatusChat.IGNORADO;

  // ── Render ─────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] -m-6 overflow-hidden">
      {/* Left panel: connection selector + chat list */}
      <div className="w-80 shrink-0 flex flex-col border-r">
        {/* Connection selector + sync */}
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Select value={selectedConexaoId} onValueChange={setSelectedConexaoId}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Todas as conexões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as conexões</SelectItem>
              {(connections || []).map((conn) => (
                <SelectItem key={conn.id} value={conn.id}>
                  {conn.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            disabled={selectedConexaoId === "all" || syncMutation.isPending}
            onClick={handleSync}
            title="Sincronizar chats da instância"
          >
            <RefreshCw className={syncMutation.isPending ? "animate-spin h-3.5 w-3.5" : "h-3.5 w-3.5"} />
          </Button>
        </div>

        {/* Chat list */}
        {chatsLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <ChatList
            chats={inboxChats}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            contactNames={contactNames}
            unreadCounts={unreadCounts}
          />
        )}
      </div>

      {/* Center panel: Conversation */}
      <div className="flex flex-1 flex-col min-w-0">
        {selectedChat ? (
          <>
            <ChatHeader
              chat={selectedChat}
              contact={selectedContact as any}
              connection={selectedConnection}
              onHandoff={handleHandoff}
              onClose={handleClose}
              onResume={handleResume}
              onAssignAgent={() => setAssignDialogOpen(true)}
            />

            <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-1">
              {messagesLoading ? (
                <InlineLoading message="Carregando mensagens…" />
              ) : (
                messageGroups.map((group) => (
                  <div key={group.date}>
                    <DateSeparator date={group.date} />
                    {group.messages.map((msg) => (
                      <ChatMessageBubble key={msg.id} message={msg} />
                    ))}
                  </div>
                ))
              )}
            </div>

            <ChatComposer
              onSend={handleSend}
              disabled={isClosed}
              isSending={sendMessage.isPending}
              placeholder={isClosed ? "Chat encerrado" : undefined}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <MessageSquareText className="mx-auto h-12 w-12 opacity-30" />
              <p className="text-sm">Selecione um chat para visualizar</p>
              {selectedConexaoId === "all" && (
                <p className="text-xs opacity-60">
                  Escolha uma conexão e clique em sincronizar para carregar os chats
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right panel: Contact/Opportunity sidebar */}
      {selectedChat && (
        <ChatSidebarPanel
          contact={selectedContact as any}
          opportunity={selectedOpportunity}
        />
      )}

      {/* Assign Agent Dialog */}
      <AssignAgentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onConfirm={handleAssignAgent}
        isLoading={assignAgent.isPending}
      />
    </div>
  );
}
