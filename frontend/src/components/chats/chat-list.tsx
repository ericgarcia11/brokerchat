"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelative, truncate } from "@/lib/formatters";
import type { Chat } from "@/types/api";
import { Search, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { CHAT_STATUS_ATIVOS, StatusChat } from "@/types/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
  contactNames: Record<string, string>;
}

export function ChatList({ chats, selectedChatId, onSelectChat, contactNames }: ChatListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all_active");

  const filtered = useMemo(() => {
    let result = chats;

    if (statusFilter === "all_active") {
      result = result.filter((c) => CHAT_STATUS_ATIVOS.includes(c.status as any));
    } else if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const name = contactNames[c.contato_id]?.toLowerCase() || "";
        return name.includes(q) || c.contato_id.includes(q);
      });
    }

    return result.sort((a, b) => {
      const dateA = a.ultima_mensagem_em || a.iniciado_em;
      const dateB = b.ultima_mensagem_em || b.iniciado_em;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [chats, search, statusFilter, contactNames]);

  return (
    <div className="flex h-full flex-col border-r">
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_active">Ativos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value={StatusChat.ABERTO}>Aberto</SelectItem>
            <SelectItem value={StatusChat.AGUARDANDO_LEAD}>Aguardando Lead</SelectItem>
            <SelectItem value={StatusChat.AGUARDANDO_HUMANO}>Aguardando Humano</SelectItem>
            <SelectItem value={StatusChat.ENCERRADO}>Encerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <MessageSquare className="mb-2 h-8 w-8" />
            <p className="text-sm">Nenhum chat encontrado</p>
          </div>
        ) : (
          <div className="space-y-0.5 p-1">
            {filtered.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                  selectedChatId === chat.id && "bg-accent",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {contactNames[chat.contato_id] || chat.contato_id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatRelative(chat.ultima_mensagem_em || chat.iniciado_em)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={chat.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
