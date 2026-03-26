"use client";

import { use } from "react";
import { useContact } from "@/features/contacts/use-contacts";
import { useChats } from "@/features/chats/use-chats";
import { useOpportunities } from "@/features/opportunities/use-opportunities";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { InlineLoading } from "@/components/shared/loading";
import { formatPhone, formatDate, formatRelative } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Calendar, MessageSquare, Target, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: contact, isLoading } = useContact(id);
  const { data: allChats } = useChats();
  const { data: allOpportunities } = useOpportunities(0, 500);

  const contactChats = (allChats || []).filter((c) => c.contato_id === id);
  const contactOpportunities = (allOpportunities || []).filter((o) => o.contato_id === id);

  if (isLoading) return <InlineLoading message="Carregando contato…" />;
  if (!contact) return <p className="text-muted-foreground p-4">Contato não encontrado.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.nome || "Sem nome"}
        description={formatPhone(contact.telefone_e164)}
        action={
          <Button variant="outline" asChild>
            <Link href="/contacts">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {formatPhone(contact.telefone_e164)}
            </div>
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {contact.email}
              </div>
            )}
            {contact.cidade_interesse && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {contact.cidade_interesse}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Criado em {formatDate(contact.created_at)}
            </div>
            {contact.ultimo_contato_em && (
              <div className="flex items-center gap-2 text-muted-foreground">
                Último contato: {formatRelative(contact.ultimo_contato_em)}
              </div>
            )}
            <div className="flex gap-2">
              {contact.opt_out && <Badge variant="destructive">Opt-out</Badge>}
              {contact.origem_inicial && (
                <Badge variant="outline">{contact.origem_inicial}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chats card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4" />
              Chats ({contactChats.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contactChats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum chat</p>
            ) : (
              contactChats.slice(0, 10).map((chat) => (
                <Link
                  key={chat.id}
                  href="/chats"
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  <StatusBadge status={chat.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(chat.ultima_mensagem_em || chat.iniciado_em)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Opportunities card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              Oportunidades ({contactOpportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contactOpportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma oportunidade</p>
            ) : (
              contactOpportunities.slice(0, 10).map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={opp.status} />
                    <Badge variant="outline" className="text-[10px]">
                      {opp.linha_negocio}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {opp.interesse_cidade || "—"}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
