"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { configuracaoApi } from "@/lib/api/endpoints";
import type { ConfiguracaoEmpresa, PaletaCoresTheme } from "@/types/api";

interface BrandingContextValue {
  config: ConfiguracaoEmpresa | null;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextValue>({
  config: null,
  isLoading: true,
});

export function useBranding() {
  return useContext(BrandingContext);
}

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
    if (value) {
      root.style.setProperty(cssVar, value);
    }
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

  if (!config?.paleta_cores) {
    clearThemeVars(root);
    return;
  }

  const isDark = root.classList.contains("dark");
  const palette = config.paleta_cores;
  const theme = isDark ? palette.dark : palette.light;

  // Clear first so we don't carry stale values
  clearThemeVars(root);
  if (theme) {
    applyThemeVars(root, theme);
  }

  // Also set ring to match primary if primary is set
  const primaryValue = theme?.primary;
  if (primaryValue) {
    root.style.setProperty("--ring", primaryValue);
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("wwp_token")
      : null;

  const { data: config, isLoading } = useQuery({
    queryKey: ["configuracao-empresa"],
    queryFn: () => configuracaoApi.get(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  });

  // Apply CSS variables whenever config or theme changes
  useEffect(() => {
    applyBranding(config ?? null);
  }, [config]);

  // Keep browser tab title in sync — Next.js metadata can overwrite
  // document.title, so we use a MutationObserver on <title> to enforce ours.
  useEffect(() => {
    if (typeof document === "undefined" || !config?.nome_app) return;
    const desired = config.nome_app;
    document.title = desired;

    const head = document.querySelector("head");
    if (!head) return;
    const observer = new MutationObserver(() => {
      if (document.title !== desired) {
        document.title = desired;
      }
    });
    observer.observe(head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [config?.nome_app]);

  // Listen for theme class changes (light/dark toggle)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new MutationObserver(() => {
      applyBranding(config ?? null);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [config]);

  return (
    <BrandingContext.Provider value={{ config: config ?? null, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}
