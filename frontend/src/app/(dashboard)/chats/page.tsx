"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import { useChats, useChat, useChatMessages, useHandoffChat, useCloseChat, useResumeChat, useAssignAgent } from "@/features/chats/use-chats";
import { useSendMessage } from "@/features/chats/use-messages";
import { useContacts } from "@/features/contacts/use-contacts";
import { useContact } from "@/features/contacts/use-contacts";
import { useConnections } from "@/features/connections/use-connections";
import { useOpportunities } from "@/features/opportunities/use-opportunities";
import { ChatList } from "@/components/chats/chat-list";
import { ChatHeader } from "@/components/chats/chat-header";
import { ChatMessageBubble, DateSeparator } from "@/components/chats/chat-message-bubble";
import { ChatComposer } from "@/components/chats/chat-composer";
import { ChatSidebarPanel } from "@/components/chats/chat-sidebar-panel";
import { AssignAgentDialog } from "@/components/chats/assign-agent-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineLoading } from "@/components/shared/loading";
import { StatusChat } from "@/types/enums";
import { MessageSquareText } from "lucide-react";
import type { Mensagem } from "@/types/api";

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

  // ── Data queries ───────────────────────────────
  const { data: chats, isLoading: chatsLoading } = useChats();
  const { data: selectedChat } = useChat(selectedChatId);
  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedChatId);
  const { data: contacts } = useContacts(0, 500);
  const { data: connections } = useConnections();
  const { data: opportunities } = useOpportunities(0, 500);

  // Contact detail for the selected chat
  const { data: selectedContact } = useContact(selectedChat?.contato_id ?? null);

  // ── Mutations ──────────────────────────────────
  const sendMessage = useSendMessage();
  const handoff = useHandoffChat();
  const closeChat = useCloseChat();
  const resumeChat = useResumeChat();
  const assignAgent = useAssignAgent();

  // ── Derived lookups ────────────────────────────
  const contactNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of contacts || []) {
      map[c.id] = c.nome || c.telefone_e164;
    }
    return map;
  }, [contacts]);

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
      {/* Left panel: Chat list */}
      <div className="w-80 shrink-0">
        {chatsLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <ChatList
            chats={chats || []}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            contactNames={contactNames}
          />
        )}
      </div>

      {/* Center panel: Conversation */}
      <div className="flex flex-1 flex-col min-w-0">
        {selectedChat ? (
          <>
            <ChatHeader
              chat={selectedChat}
              contact={selectedContact}
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
            </div>
          </div>
        )}
      </div>

      {/* Right panel: Contact/Opportunity sidebar */}
      {selectedChat && (
        <ChatSidebarPanel
          contact={selectedContact}
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
