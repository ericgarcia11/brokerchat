"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Loading } from "@/components/shared/loading";
import { useChats } from "@/features/chats/use-chats";
import { useContacts } from "@/features/contacts/use-contacts";
import { useOpportunities } from "@/features/opportunities/use-opportunities";
import { useConnections } from "@/features/connections/use-connections";
import { useReady } from "@/features/settings/use-health";
import {
  CHAT_STATUS_ATIVOS,
  StatusChat,
  OPORTUNIDADE_STATUS_ABERTOS,
} from "@/types/enums";
import { formatRelative, truncate } from "@/lib/formatters";
import {
  MessageSquare,
  Users,
  Target,
  Wifi,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: chats, isLoading: chatsLoading } = useChats();
  const { data: contacts, isLoading: contactsLoading } = useContacts(0, 5);
  const { data: opportunities, isLoading: oppsLoading } = useOpportunities();
  const { data: connections, isLoading: connsLoading } = useConnections();
  const { data: ready } = useReady();

  const activeChats =
    chats?.filter((c) => CHAT_STATUS_ATIVOS.includes(c.status as any)) || [];
  const awaitingHuman =
    chats?.filter((c) => c.status === StatusChat.AGUARDANDO_HUMANO) || [];
  const openOpps =
    opportunities?.filter((o) =>
      OPORTUNIDADE_STATUS_ABERTOS.includes(o.status as any),
    ) || [];
  const activeConns = connections?.filter((c) => c.ativo) || [];

  const isLoading =
    chatsLoading || contactsLoading || oppsLoading || connsLoading;

  if (isLoading) return <Loading text="Carregando dashboard…" />;

  const kpiCards = [
    {
      href: "/chats",
      title: "Chats Ativos",
      value: activeChats.length,
      sub: `${awaitingHuman.length} aguardando humano`,
      icon: MessageSquare,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      ring: "ring-blue-200 dark:ring-blue-800/50",
      delay: "animate-stagger-1",
    },
    {
      href: "/contacts",
      title: "Contatos",
      value: contacts?.length ?? 0,
      sub: "cadastrados",
      icon: Users,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      ring: "ring-violet-200 dark:ring-violet-800/50",
      delay: "animate-stagger-2",
    },
    {
      href: "/opportunities",
      title: "Oportunidades",
      value: openOpps.length,
      sub: "em andamento",
      icon: Target,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      ring: "ring-amber-200 dark:ring-amber-800/50",
      delay: "animate-stagger-3",
    },
    {
      href: "/connections",
      title: "Conexões Ativas",
      value: activeConns.length,
      sub: `de ${connections?.length ?? 0} total`,
      icon: Wifi,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "ring-emerald-200 dark:ring-emerald-800/50",
      delay: "animate-stagger-4",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral operacional da Salu Imóveis"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className={cn(
                "card-hover cursor-pointer border-0 shadow-sm ring-1",
                card.ring,
                "animate-fade-in-up",
                card.delay,
              )}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", card.bg)}>
                    <Icon className={cn("h-4 w-4", card.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-display font-bold", card.color)}>
                    {card.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* System health */}
      {ready && (
        <Card className="animate-fade-in border-0 shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Saúde do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Database", value: ready.checks.database },
                { label: "Redis", value: ready.checks.redis },
                { label: "Storage", value: ready.checks.storage },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    value === "ok" ? "bg-success" : value === "warn" ? "bg-warning" : "bg-destructive",
                  )} />
                  <span className="text-sm text-muted-foreground">{label}:</span>
                  <span className={cn(
                    "text-sm font-medium",
                    value === "ok" ? "text-success" : value === "warn" ? "text-warning" : "text-destructive",
                  )}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Chats aguardando humano */}
        <Card className="animate-fade-in animate-stagger-1 border-0 shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              </div>
              Aguardando Humano
              {awaitingHuman.length > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50 px-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                  {awaitingHuman.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {awaitingHuman.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-success/60 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum chat aguardando</p>
              </div>
            ) : (
              <div className="space-y-2">
                {awaitingHuman.slice(0, 5).map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chats?chatId=${chat.id}`}
                    className="flex items-center justify-between rounded-lg border border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/20 p-3 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse-soft" />
                      <span className="font-medium">{truncate(chat.contato_id, 14)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(chat.ultima_mensagem_em)}
                    </span>
                  </Link>
                ))}
                {awaitingHuman.length > 5 && (
                  <Link href="/chats" className="block text-center text-xs text-primary hover:underline pt-1">
                    Ver mais {awaitingHuman.length - 5} chats →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos contatos */}
        <Card className="animate-fade-in animate-stagger-2 border-0 shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40">
                <Users className="h-3.5 w-3.5 text-violet-500" />
              </div>
              Contatos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!contacts || contacts.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.slice(0, 5).map((contact: any) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors text-sm"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                      {(contact.nome as string)?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.nome || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.telefone}</p>
                    </div>
                  </Link>
                ))}
                <Link href="/contacts" className="block text-center text-xs text-primary hover:underline pt-1">
                  Ver todos os contatos →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
