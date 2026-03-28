"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHealth, useReady } from "@/features/settings/use-health";
import { configuracaoApi } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/env";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Server,
  Database,
  HardDrive,
  Activity,
  Upload,
  Trash2,
  Palette,
  Building2,
  Loader2,
  Save,
} from "lucide-react";
import type { ConfiguracaoEmpresaUpdate, PaletaCoresTheme } from "@/types/api";

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-destructive" />
  );
}

const DEFAULT_LIGHT: PaletaCoresTheme = {
  primary: "162 63% 36%",
  "primary-foreground": "0 0% 100%",
  "sidebar-bg": "222 47% 11%",
  "sidebar-fg": "0 0% 100%",
  "header-bg": "222 47% 15%",
  "header-fg": "0 0% 100%",
  accent: "162 50% 92%",
  "accent-foreground": "162 63% 22%",
};

const DEFAULT_DARK: PaletaCoresTheme = {
  primary: "162 63% 42%",
  "primary-foreground": "0 0% 100%",
  "sidebar-bg": "222 40% 7%",
  "sidebar-fg": "36 20% 94%",
  "header-bg": "222 40% 10%",
  "header-fg": "36 20% 94%",
  accent: "162 40% 18%",
  "accent-foreground": "162 60% 85%",
};

const COLOR_LABELS: Record<string, string> = {
  primary: "Primária",
  "primary-foreground": "Texto sobre primária",
  "sidebar-bg": "Fundo da sidebar",
  "sidebar-fg": "Texto da sidebar",
  "header-bg": "Fundo do header",
  "header-fg": "Texto do header",
  accent: "Destaque",
  "accent-foreground": "Texto sobre destaque",
};

function hslToHex(hslStr: string): string {
  const parts = hslStr.trim().split(/\s+/);
  if (parts.length < 3) return "#000000";
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hexValue = hslToHex(value);
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="h-9 w-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{value}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: health } = useHealth();
  const { data: ready } = useReady();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["configuracao-empresa"],
    queryFn: () => configuracaoApi.get(),
  });

  const [nomeApp, setNomeApp] = useState<string | null>(null);
  const [nomeEmpresa, setNomeEmpresa] = useState<string | null>(null);
  const [lightPalette, setLightPalette] = useState<PaletaCoresTheme | null>(null);
  const [darkPalette, setDarkPalette] = useState<PaletaCoresTheme | null>(null);

  // Derive display values from local state or config
  const displayNomeApp = nomeApp ?? config?.nome_app ?? "";
  const displayNomeEmpresa = nomeEmpresa ?? config?.nome_empresa ?? "";
  const displayLightPalette = lightPalette ?? config?.paleta_cores?.light ?? DEFAULT_LIGHT;
  const displayDarkPalette = darkPalette ?? config?.paleta_cores?.dark ?? DEFAULT_DARK;

  const updateMutation = useMutation({
    mutationFn: (data: ConfiguracaoEmpresaUpdate) => configuracaoApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracao-empresa"] });
      toast.success("Configurações salvas com sucesso!");
      // Reset local state
      setNomeApp(null);
      setNomeEmpresa(null);
      setLightPalette(null);
      setDarkPalette(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar configurações.");
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => configuracaoApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracao-empresa"] });
      toast.success("Logo atualizada!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao fazer upload da logo.");
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: () => configuracaoApi.deleteLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracao-empresa"] });
      toast.success("Logo removida.");
    },
  });

  function handleSave() {
    const data: ConfiguracaoEmpresaUpdate = {};
    if (nomeApp !== null) data.nome_app = nomeApp;
    if (nomeEmpresa !== null) data.nome_empresa = nomeEmpresa;
    if (lightPalette !== null || darkPalette !== null) {
      data.paleta_cores = {
        light: lightPalette ?? config?.paleta_cores?.light ?? DEFAULT_LIGHT,
        dark: darkPalette ?? config?.paleta_cores?.dark ?? DEFAULT_DARK,
      };
    }
    updateMutation.mutate(data);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogoMutation.mutate(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function updateLightColor(key: string, value: string) {
    setLightPalette((prev) => ({
      ...(prev ?? displayLightPalette),
      [key]: value,
    }));
  }

  function updateDarkColor(key: string, value: string) {
    setDarkPalette((prev) => ({
      ...(prev ?? displayDarkPalette),
      [key]: value,
    }));
  }

  const hasChanges = nomeApp !== null || nomeEmpresa !== null || lightPalette !== null || darkPalette !== null;

  const checks = ready?.checks as Record<string, string> | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aparência"
        description="Personalize a identidade visual do sistema"
      >
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm">
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        )}
      </PageHeader>

      {/* ── Branding Section ─────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" /> Identidade
            </CardTitle>
            <CardDescription>Nome do app, empresa e logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_app">Nome do App</Label>
              <Input
                id="nome_app"
                value={displayNomeApp}
                onChange={(e) => setNomeApp(e.target.value)}
                placeholder="Nome exibido no app"
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome_empresa">Nome da Empresa</Label>
              <Input
                id="nome_empresa"
                value={displayNomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Nome da empresa"
                maxLength={255}
              />
            </div>

            <Separator />

            {/* Logo upload */}
            <div className="space-y-3">
              <Label>Logo da Empresa</Label>
              {config?.logo_url ? (
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.logo_url}
                      alt="Logo"
                      className="max-h-14 max-w-14 object-contain p-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLogoMutation.isPending}
                    >
                      {uploadLogoMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Trocar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteLogoMutation.mutate()}
                      disabled={deleteLogoMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clique para fazer upload da logo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPEG, WebP ou SVG — máx. 2 MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pré-visualização</CardTitle>
            <CardDescription>Como ficará a sidebar e o header</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border">
              {/* Mini sidebar preview */}
              <div className="flex">
                <div
                  className="w-48 p-3 space-y-2"
                  style={{ background: `hsl(${displayLightPalette["sidebar-bg"] || "222 47% 11%"})` }}
                >
                  <div className="flex items-center gap-2">
                    {config?.logo_url ? (
                      <div className="h-6 w-6 rounded overflow-hidden bg-white/10 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={config.logo_url}
                          alt=""
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded" style={{ background: `hsl(${displayLightPalette.primary || "162 63% 36%"} / 0.3)` }} />
                    )}
                    <div>
                      <p className="text-xs font-semibold" style={{ color: `hsl(${displayLightPalette["sidebar-fg"] || "0 0% 100%"})` }}>
                        {displayNomeApp || "App"}
                      </p>
                      <p className="text-[8px] opacity-50" style={{ color: `hsl(${displayLightPalette["sidebar-fg"] || "0 0% 100%"})` }}>
                        {displayNomeEmpresa || "Empresa"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {["Dashboard", "Inbox", "Contatos"].map((item, i) => (
                      <div
                        key={item}
                        className="rounded px-2 py-1 text-[10px]"
                        style={{
                          background: i === 0 ? `hsl(${displayLightPalette.primary || "162 63% 36%"} / 0.2)` : "transparent",
                          color: `hsl(${displayLightPalette["sidebar-fg"] || "0 0% 100%"} / ${i === 0 ? 1 : 0.6})`,
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div
                    className="h-8 px-3 flex items-center"
                    style={{ background: `hsl(${displayLightPalette["header-bg"] || "222 47% 15%"})` }}
                  >
                    <span className="text-[10px] font-medium" style={{ color: `hsl(${displayLightPalette["header-fg"] || "0 0% 100%"})` }}>
                      Dashboard
                    </span>
                  </div>
                  <div className="p-3 bg-background">
                    <div className="flex gap-2">
                      <div className="h-12 flex-1 rounded" style={{ background: `hsl(${displayLightPalette.primary || "162 63% 36%"} / 0.1)` }} />
                      <div className="h-12 flex-1 rounded" style={{ background: `hsl(${displayLightPalette.accent || "162 50% 92%"})` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Color Palette Section ────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Light Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4" /> Paleta — Modo Claro
            </CardTitle>
            <CardDescription>Cores aplicadas no tema claro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(COLOR_LABELS).map(([key, label]) => (
                <ColorField
                  key={`light-${key}`}
                  label={label}
                  value={(displayLightPalette as Record<string, string>)[key] || "0 0% 50%"}
                  onChange={(v) => updateLightColor(key, v)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dark Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4" /> Paleta — Modo Escuro
            </CardTitle>
            <CardDescription>Cores aplicadas no tema escuro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(COLOR_LABELS).map(([key, label]) => (
                <ColorField
                  key={`dark-${key}`}
                  label={label}
                  value={(displayDarkPalette as Record<string, string>)[key] || "0 0% 50%"}
                  onChange={(v) => updateDarkColor(key, v)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ── System Health Section (existing) ─────────── */}
      <h2 className="font-display text-lg font-semibold">Status do Sistema</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" /> Saúde do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Status geral</span>
              {health ? (
                <Badge className="bg-green-600">{health.status}</Badge>
              ) : (
                <Badge variant="destructive">Indisponível</Badge>
              )}
            </div>
            {health && (
              <div className="flex items-center justify-between">
                <span>Serviço</span>
                <span className="text-muted-foreground">{health.service}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Readiness Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4" /> Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {checks ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    Banco de dados
                  </div>
                  <StatusIcon ok={checks.database === "ok"} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    Redis
                  </div>
                  <StatusIcon ok={checks.redis === "ok"} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    Storage (MinIO)
                  </div>
                  <StatusIcon ok={checks.storage === "ok"} />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Carregando…</p>
            )}
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ambiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>API</span>
              <span className="text-muted-foreground text-xs font-mono truncate max-w-[180px]">
                {env.apiBaseUrl}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>App</span>
              <span className="text-muted-foreground">{config?.nome_app || env.appName}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
