"use client";

import { use } from "react";
import { useProperty } from "@/features/properties/use-properties";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineLoading } from "@/components/shared/loading";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, DollarSign, Bed, Bath, Car, Ruler } from "lucide-react";
import Link from "next/link";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: property, isLoading } = useProperty(id);

  if (isLoading) return <InlineLoading message="Carregando imóvel…" />;
  if (!property) return <p className="text-muted-foreground p-4">Imóvel não encontrado.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.titulo}
        description={`${property.cidade}${property.bairro ? ` – ${property.bairro}` : ""}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/properties">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{property.linha_negocio}</Badge>
              {property.ativo ? (
                <Badge>Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {property.cidade}
              {property.bairro && ` – ${property.bairro}`}
            </div>
            {property.codigo_externo && (
              <p className="text-muted-foreground">
                Código: {property.codigo_externo}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Criado em {formatDate(property.created_at)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preços e Características</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {property.preco_venda && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Venda: {formatCurrency(property.preco_venda)}
              </div>
            )}
            {property.preco_aluguel && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Aluguel: {formatCurrency(property.preco_aluguel)}/mês
              </div>
            )}
            <div className="grid grid-cols-2 gap-y-2">
              {property.quartos != null && (
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  {property.quartos} quartos
                </div>
              )}
              {property.banheiros != null && (
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  {property.banheiros} banheiros
                </div>
              )}
              {property.vagas != null && (
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  {property.vagas} vagas
                </div>
              )}
              {property.area_m2 != null && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  {property.area_m2} m²
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
