"use client";

import { cn } from "@/lib/utils";
import { formatTime, formatMessageDate } from "@/lib/formatters";
import { DirecaoMensagem, AutorTipo, TipoMensagem } from "@/types/enums";
import type { Mensagem } from "@/types/api";
import { Bot, User, Monitor } from "lucide-react";

interface ChatMessageBubbleProps {
  message: Mensagem;
}

function getAuthorIcon(tipo: string) {
  switch (tipo) {
    case AutorTipo.IA:
      return <Bot className="h-3 w-3" />;
    case AutorTipo.USUARIO:
      return <User className="h-3 w-3" />;
    case AutorTipo.SISTEMA:
      return <Monitor className="h-3 w-3" />;
    default:
      return null;
  }
}

function getAuthorLabel(tipo: string) {
  switch (tipo) {
    case AutorTipo.IA:
      return "IA";
    case AutorTipo.USUARIO:
      return "Atendente";
    case AutorTipo.SISTEMA:
      return "Sistema";
    case AutorTipo.CONTATO:
      return "Contato";
    default:
      return tipo;
  }
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isOutgoing = message.direcao === DirecaoMensagem.SAIDA;
  const isSystem = message.autor_tipo === AutorTipo.SISTEMA || message.tipo === TipoMensagem.SISTEMA;

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.texto || "Evento do sistema"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
          isOutgoing
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <div className="flex items-center gap-1 mb-0.5">
          {getAuthorIcon(message.autor_tipo)}
          <span className="text-xs font-medium opacity-80">
            {getAuthorLabel(message.autor_tipo)}
          </span>
        </div>

        {message.tipo === TipoMensagem.IMAGEM && message.midia_url && (
          <div className="mb-1">
            <img
              src={message.midia_url}
              alt="Imagem"
              className="max-w-full rounded"
              loading="lazy"
            />
          </div>
        )}

        {message.tipo === TipoMensagem.DOCUMENTO && message.midia_url && (
          <a
            href={message.midia_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 block text-xs underline"
          >
            📎 Documento
          </a>
        )}

        {message.tipo === TipoMensagem.AUDIO && message.midia_url && (
          <audio controls className="max-w-full mb-1">
            <source src={message.midia_url} />
          </audio>
        )}

        {message.texto && <p className="whitespace-pre-wrap break-words">{message.texto}</p>}

        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-[10px] opacity-60">{formatTime(message.criada_em)}</span>
        </div>
      </div>
    </div>
  );
}

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground font-medium">
        {formatMessageDate(date)}
      </span>
    </div>
  );
}
