import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { configuracaoApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import type { ConfiguracaoEmpresa, PaletaCoresTheme } from "@/types/api";

const CSS_VAR_MAP: Record<keyof PaletaCoresTheme, string> = {
  primary: "--primary",
  "primary-foreground": "--primary-foreground",
  "sidebar-bg": "--sidebar-bg",
  "sidebar-fg": "--sidebar-fg",
  "header-bg": "--header-bg",
  "header-fg": "--header-fg",
  accent: "--accent",
  "accent-foreground": "--accent-foreground",
};

function applyThemeVars(root: HTMLElement, theme: PaletaCoresTheme) {
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = theme[key as keyof PaletaCoresTheme];
    if (value) root.style.setProperty(cssVar, value);
  }
}

function clearThemeVars(root: HTMLElement) {
  for (const cssVar of Object.values(CSS_VAR_MAP)) {
    root.style.removeProperty(cssVar);
  }
}

function applyBranding(config: ConfiguracaoEmpresa | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  clearThemeVars(root);
  if (!config?.paleta_cores) return;
  const isDark = root.classList.contains("dark");
  const theme = isDark ? config.paleta_cores.dark : config.paleta_cores.light;
  if (theme) {
    applyThemeVars(root, theme);
    if (theme.primary) root.style.setProperty("--ring", theme.primary);
  }
}

export function usePublicBranding() {
  const { data: config } = useQuery({
    queryKey: ["configuracao-publica", env.empresaId],
    queryFn: () => configuracaoApi.getPublico(env.empresaId),
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry if not configured yet
  });

  useEffect(() => {
    applyBranding(config ?? null);
  }, [config]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new MutationObserver(() => applyBranding(config ?? null));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [config]);

  return config ?? null;
}
