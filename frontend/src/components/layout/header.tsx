"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, LogOut, Menu, ChevronDown } from "lucide-react";
import { clearSession, getUser } from "@/lib/auth/session";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/chats": "Inbox",
  "/contacts": "Contatos",
  "/opportunities": "Oportunidades",
  "/properties": "Imóveis",
  "/connections": "Conexões",
  "/routing": "Regras de Rota",
  "/agents": "Agentes IA",
  "/admin/branches": "Filiais",
  "/admin/teams": "Equipes",
  "/admin/users": "Usuários",
  "/webhooks": "Webhooks",
  "/settings": "Configurações",
};

function getPageTitle(pathname: string): string {
  if (pathname in pageTitles) return pageTitles[pathname];
  for (const [key, value] of Object.entries(pageTitles)) {
    if (key !== "/" && pathname.startsWith(key)) return value;
  }
  return "Salu Conecta";
}

export function Header() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const user = getUser();
  const userName = (user?.nome as string) || "Usuário";
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const pageTitle = getPageTitle(pathname);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between bg-header text-header-foreground px-4 border-b border-white/10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-header-foreground hover:bg-white/10 h-9 w-9"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:flex items-center gap-2">
          <h2 className="font-display font-semibold text-sm text-white/90">{pageTitle}</h2>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-header-foreground hover:bg-white/10"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
        >
          <Sun className={cn(
            "h-4 w-4 transition-all duration-200",
            theme === "dark" ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )} />
          <Moon className={cn(
            "absolute h-4 w-4 transition-all duration-200",
            theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
          )} />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 text-header-foreground hover:bg-white/10 pl-2 pr-3"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/30 ring-1 ring-primary/50 text-[10px] font-bold text-white shrink-0">
                {initials}
              </div>
              <span className="hidden sm:inline text-sm">{userName.split(" ")[0]}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 animate-scale-in">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground">Conta</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
