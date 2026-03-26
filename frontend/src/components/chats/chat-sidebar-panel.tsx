"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatPhone, formatDate, formatRelative } from "@/lib/formatters";
import type { Contato, Oportunidade } from "@/types/api";
import { User, Target, Phone, Mail, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

interface ChatSidebarPanelProps {
  contact?: Contato | null;
  opportunity?: Oportunidade | null;
}

export function ChatSidebarPanel({ contact, opportunity }: ChatSidebarPanelProps) {
  return (
    <div className="w-72 shrink-0 overflow-auto border-l bg-card p-4 space-y-4 hidden xl:block">
      {contact && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">{contact.nome || "Sem nome"}</span>
              {contact.opt_out && (
                <Badge variant="destructive" className="ml-2 text-[10px]">
                  Opt-out
                </Badge>
              )}
            </div>
            {contact.telefone_e164 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {formatPhone(contact.telefone_e164)}
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3 w-3" />
                {contact.email}
              </div>
            )}
            {contact.cidade_interesse && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {contact.cidade_interesse}
              </div>
            )}
            {contact.ultimo_contato_em && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatRelative(contact.ultimo_contato_em)}
              </div>
            )}
            <Link
              href={`/contacts/${contact.id}`}
              className="inline-block text-xs text-primary hover:underline mt-1"
            >
              Ver perfil completo →
            </Link>
          </CardContent>
        </Card>
      )}

      {opportunity && (
        <>
          <Separator />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                Oportunidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge status={opportunity.status} />
                <Badge variant="outline" className="text-[10px]">
                  {opportunity.linha_negocio}
                </Badge>
              </div>
              {opportunity.interesse_cidade && (
                <p className="text-muted-foreground">
                  {opportunity.interesse_cidade}
                  {opportunity.interesse_bairro && ` - ${opportunity.interesse_bairro}`}
                </p>
              )}
              {opportunity.observacoes && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {opportunity.observacoes}
                </p>
              )}
              <Link
                href={`/opportunities/${opportunity.id}`}
                className="inline-block text-xs text-primary hover:underline mt-1"
              >
                Ver oportunidade →
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
