"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { FlowEditorForm } from "@/components/cadence/flow-editor-form";
import { ExecutionsPanel } from "@/components/cadence/executions-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCadenceFluxo } from "@/features/cadence/use-cadence";
import { ArrowLeft, Settings2, PlayCircle } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export default function CadenceDetailPage({ params }: PageProps) {
  const { id } = params;
  const { data: fluxo, isLoading } = useCadenceFluxo(id);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!fluxo) {
    return (
      <div className="space-y-4">
        <PageHeader title="Fluxo não encontrado" />
        <Button variant="outline" asChild>
          <Link href="/cadence">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a lista
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title={fluxo.nome}
        description={fluxo.descricao ?? "Fluxo de cadência"}
        action={
          <div className="flex items-center gap-2">
            {fluxo.ativo ? (
              <Badge variant="success">Ativo</Badge>
            ) : (
              <Badge variant="secondary">Inativo</Badge>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/cadence">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="execucoes" className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Execuções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-4">
          <FlowEditorForm fluxo={fluxo} />
        </TabsContent>

        <TabsContent value="execucoes" className="mt-4">
          <ExecutionsPanel fluxoId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
