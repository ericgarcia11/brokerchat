"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { BrandingProvider } from "@/providers/branding-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <BrandingProvider>
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </BrandingProvider>
    </AuthGuard>
  );
}
