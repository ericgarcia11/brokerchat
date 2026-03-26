"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Chat, Contato, Conexao } from "@/types/api";
import { StatusChat } from "@/types/enums";
import { MoreVertical, HandMetal, XCircle, PlayCircle, Bot } from "lucide-react";
import { formatPhone } from "@/lib/formatters";

interface ChatHeaderProps {
  chat: Chat;
  contact?: Contato | null;
  connection?: Conexao | null;
  onHandoff: () => void;
  onClose: () => void;
  onResume: () => void;
  onAssignAgent: () => void;
}

export function ChatHeader({
  chat,
  contact,
  connection,
  onHandoff,
  onClose,
  onResume,
  onAssignAgent,
}: ChatHeaderProps) {
  const isClosed = chat.status === StatusChat.ENCERRADO;
  const isActive = chat.status !== StatusChat.ENCERRADO && chat.status !== StatusChat.IGNORADO;

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">
              {contact?.nome || formatPhone(contact?.telefone_e164) || "Contato"}
            </span>
            <StatusBadge status={chat.status} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {connection && (
              <span>{connection.nome}</span>
            )}
            {contact?.telefone_e164 && (
              <span>{formatPhone(contact.telefone_e164)}</span>
            )}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isActive && (
            <>
              <DropdownMenuItem onClick={onHandoff}>
                <HandMetal className="mr-2 h-4 w-4" />
                Transferir para humano
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAssignAgent}>
                <Bot className="mr-2 h-4 w-4" />
                Atribuir agente IA
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClose}>
                <XCircle className="mr-2 h-4 w-4" />
                Encerrar chat
              </DropdownMenuItem>
            </>
          )}
          {isClosed && (
            <DropdownMenuItem onClick={onResume}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Retomar chat
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
