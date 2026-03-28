"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { setSession } from "@/lib/auth/session";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { usePublicBranding } from "@/features/settings/use-public-branding";

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: Record<string, unknown>;
}

export default function LoginPage() {
  const router = useRouter();
  const branding = usePublicBranding();
  const appName = branding?.nome_app || "BrokerChat";
  const companyName = branding?.nome_empresa || appName;
  const logoUrl = branding?.logo_url || null;
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login.trim() || !senha.trim()) {
      setError("Informe seu e-mail e senha");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiClient.post<LoginResponse>("/auth/login", {
        login: login.trim(),
        senha: senha.trim(),
      });
      setSession(res.access_token, res.user);
      router.push("/");
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: string };
      if (apiErr.status === 401) {
        setError("E-mail ou senha inválidos");
      } else if (apiErr.status === 403) {
        setError("Usuário inativo. Entre em contato com o administrador.");
      } else {
        setError("Erro ao conectar com o servidor. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand flex-col items-center justify-center p-12 relative">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute bottom-[-40px] right-[-40px] h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-[-20px] h-32 w-32 rounded-full bg-primary/20" />

        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 shadow-xl">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appName}
                width={52}
                height={52}
                className="rounded-xl object-contain"
              />
            ) : (
              <Building2 className="h-10 w-10 text-white/80" />
            )}
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            {appName}
          </h1>
          <p className="text-white/60 text-sm mb-10">
            {companyName !== appName ? companyName : "CRM com WhatsApp & IA"}
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            {[
              { icon: Building2, label: "Gestão de Imóveis & Oportunidades" },
              { icon: Mail, label: "Atendimento via WhatsApp integrado" },
              { icon: Lock, label: "Agentes de IA para qualificação" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/30">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-6 text-xs text-white/30">
          © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel - login form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sidebar shadow-lg">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={appName}
                  width={40}
                  height={40}
                  className="rounded-xl object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-sidebar-foreground/70" />
              )}
            </div>
            <h1 className="font-display text-2xl font-bold">{appName}</h1>
            <p className="text-sm text-muted-foreground mt-1">{companyName !== appName ? companyName : "CRM"}</p>
          </div>

          {/* Form header */}
          <div className="mb-8 hidden lg:block">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Faça login para acessar o painel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login" className="text-sm font-medium">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login"
                  type="text"
                  placeholder="seu@email.com"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoFocus
                  className="pl-9 h-11 transition-shadow focus:shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-9 pr-10 h-11 transition-shadow focus:shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 animate-fade-in">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold gap-2 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            {appName} — Powered by WhatsApp & IA
          </p>
        </div>
      </div>
    </div>
  );
}
