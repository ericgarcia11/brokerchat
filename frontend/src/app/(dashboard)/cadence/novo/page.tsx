"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { FlowEditorForm } from "@/components/cadence/flow-editor-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CadenceNovoPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title="Novo Fluxo de Cadência"
        description="Configure a sequência de mensagens automáticas"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/cadence">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <FlowEditorForm />
    </div>
  );
}
