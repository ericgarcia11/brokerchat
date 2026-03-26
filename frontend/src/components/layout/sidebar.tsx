"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Target,
  Wifi,
  Route,
  Bot,
  GitBranch,
  UserCog,
  ShieldCheck,
  Webhook,
  Settings,
  Home,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat2,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/chats", label: "Inbox", icon: MessageSquare },
      { href: "/contacts", label: "Contatos", icon: Users },
      { href: "/opportunities", label: "Oportunidades", icon: Target },
      { href: "/properties", label: "Imóveis", icon: Home },
    ],
  },
  {
    label: "Automação",
    items: [
      { href: "/connections", label: "Conexões", icon: Wifi },
      { href: "/routing", label: "Regras de Rota", icon: Route },
      { href: "/agents", label: "Agentes IA", icon: Bot },
      { href: "/cadence", label: "Fluxos de Cadência", icon: Repeat2 },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/admin/branches", label: "Filiais", icon: GitBranch },
      { href: "/admin/teams", label: "Equipes", icon: ShieldCheck },
      { href: "/admin/users", label: "Usuários", icon: UserCog },
      { href: "/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/settings", label: "Configurações", icon: Settings },
    ],
  },
];

function NavItems({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="p-2 space-y-4">
      {navGroups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/35 transition-opacity duration-200">
              {group.label}
            </p>
          )}
          {collapsed && <div className="mb-1.5 px-3 h-4" />}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    collapsed ? "justify-center px-2" : "",
                    isActive
                      ? "sidebar-item-active text-white"
                      : "text-white/60 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                      isActive
                        ? "text-primary"
                        : "text-white/50 group-hover:text-white/80",
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="h-3 w-3 text-primary/70 shrink-0" />
                      )}
                    </>
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex",
          "transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[60px]" : "w-64",
        )}
      >
        {/* Logo + collapse toggle */}
        <div className="relative flex h-14 items-center border-b border-white/10 shrink-0 px-3">
          {/* Logo icon — always visible */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
            <Image
              src="/logo.png"
              alt="Salu Imóveis"
              width={20}
              height={20}
              className="rounded"
            />
          </div>

          {/* Brand text — fades out when collapsed */}
          <div
            className={cn(
              "flex flex-col leading-none ml-3 overflow-hidden transition-all duration-300 ease-in-out",
              collapsed ? "w-0 opacity-0" : "w-36 opacity-100",
            )}
          >
            <span className="font-display font-semibold text-sm text-white whitespace-nowrap">
              Salu Conecta
            </span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider whitespace-nowrap">
              Imóveis & IA
            </span>
          </div>

          {/* Toggle button — floats outside the right edge so it's always reachable */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10
              flex h-6 w-6 items-center justify-center rounded-full
              bg-sidebar border border-white/15 shadow-md
              text-white/50 hover:text-white hover:border-white/30
              transition-all duration-150"
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-3 w-3" />
            ) : (
              <PanelLeftClose className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <NavItems collapsed={collapsed} />
        </ScrollArea>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-white/10 p-3 shrink-0">
            <div className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-[10px] text-white/40 text-center whitespace-nowrap">
                © 2025 Salu Imóveis
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile overlay sidebar ───────────────────────── */}
      {/* Always mounted — opacity + translateX transition handles open/close */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          "transition-opacity duration-300 ease-in-out",
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Drawer */}
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground shadow-2xl",
            "transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Logo */}
          <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
              <Image
                src="/logo.png"
                alt="Salu Imóveis"
                width={20}
                height={20}
                className="rounded"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-semibold text-sm text-white">
                Salu Conecta
              </span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                Imóveis & IA
              </span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <NavItems onNavigate={() => setSidebarOpen(false)} />
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-white/10 p-3 shrink-0">
            <div className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-[10px] text-white/40 text-center">
                © 2025 Salu Imóveis
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
