"use client";

import { use, useMemo } from "react";
import { useOpportunity } from "@/features/opportunities/use-opportunities";
import { useContact } from "@/features/contacts/use-contacts";
import { useChats } from "@/features/chats/use-chats";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { InlineLoading } from "@/components/shared/loading";
import { formatDate, formatCurrency, formatRelative, formatPhone } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, MapPin, DollarSign, Bed, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: opp, isLoading } = useOpportunity(id);
  const { data: contact } = useContact(opp?.contato_id ?? null);
  const { data: allChats } = useChats();

  const relatedChats = useMemo(
    () => (allChats || []).filter((c) => c.oportunidade_id === id),
    [allChats, id],
  );

  if (isLoading) return <InlineLoading message="Carregando oportunidade…" />;
  if (!opp) return <p className="text-muted-foreground p-4">Oportunidade não encontrada.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oportunidade"
        description={`${opp.linha_negocio} • ${opp.interesse_cidade || "Sem cidade"}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/opportunities">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Status & Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={opp.status} />
              <Badge variant="outline">{opp.linha_negocio}</Badge>
            </div>
            {opp.interesse_cidade && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {opp.interesse_cidade}
                {opp.interesse_bairro && ` – ${opp.interesse_bairro}`}
              </div>
            )}
            {(opp.orcamento_min || opp.orcamento_max) && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                {opp.orcamento_min ? formatCurrency(opp.orcamento_min) : "—"}
                {" – "}
                {opp.orcamento_max ? formatCurrency(opp.orcamento_max) : "—"}
              </div>
            )}
            {opp.quartos_min && (
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                {opp.quartos_min}+ quartos
              </div>
            )}
            {opp.observacoes && (
              <p className="text-muted-foreground whitespace-pre-wrap">{opp.observacoes}</p>
            )}
            <div className="text-xs text-muted-foreground">
              Criada em {formatDate(opp.created_at)}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" /> Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {contact ? (
              <>
                <p className="font-medium">{contact.nome || "Sem nome"}</p>
                <p className="text-muted-foreground">{formatPhone(contact.telefone_e164)}</p>
                {contact.email && <p className="text-muted-foreground">{contact.email}</p>}
                <Link
                  href={`/contacts/${contact.id}`}
                  className="inline-block text-xs text-primary hover:underline"
                >
                  Ver perfil →
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">Contato não encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Related Chats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4" /> Chats Relacionados ({relatedChats.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {relatedChats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum chat vinculado</p>
            ) : (
              relatedChats.slice(0, 10).map((chat) => (
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
      </div>
    </div>
  );
}
