"use client";

import { useState } from "react";
import {
  useProperties,
  useCreateProperty,
  useDeleteProperty,
} from "@/features/properties/use-properties";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/formatters";
import { env } from "@/lib/env";
import { LinhaNegocio } from "@/types/enums";
import type { Imovel } from "@/types/api";
import { Plus, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório"),
  linha_negocio: z.string().min(1, "Linha obrigatória"),
  cidade: z.string().min(1, "Cidade obrigatória"),
  bairro: z.string().optional(),
  preco_venda: z.coerce.number().optional(),
  preco_aluguel: z.coerce.number().optional(),
  quartos: z.coerce.number().optional(),
  banheiros: z.coerce.number().optional(),
  vagas: z.coerce.number().optional(),
  area_m2: z.coerce.number().optional(),
  codigo_externo: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

const PAGE_SIZE = 20;

export default function PropertiesPage() {
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: properties, isLoading } = useProperties(page * PAGE_SIZE, PAGE_SIZE);
  const createProp = useCreateProperty();
  const deleteProp = useDeleteProperty();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      titulo: "",
      linha_negocio: "",
      cidade: "",
      bairro: "",
      codigo_externo: "",
    },
  });

  function handleCreate(values: CreateForm) {
    createProp.mutate(
      {
        empresa_id: env.empresaId,
        titulo: values.titulo,
        linha_negocio: values.linha_negocio,
        cidade: values.cidade,
        bairro: values.bairro || undefined,
        preco_venda: values.preco_venda || undefined,
        preco_aluguel: values.preco_aluguel || undefined,
        quartos: values.quartos || undefined,
        banheiros: values.banheiros || undefined,
        vagas: values.vagas || undefined,
        area_m2: values.area_m2 || undefined,
        codigo_externo: values.codigo_externo || undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          form.reset();
        },
      },
    );
  }

  function handleDelete() {
    if (deleteId) {
      deleteProp.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  }

  const columns = [
    {
      header: "Título",
      accessorKey: "titulo" as const,
      cell: (row: Imovel) => (
        <Link href={`/properties/${row.id}`} className="font-medium hover:underline">
          {row.titulo}
        </Link>
      ),
    },
    {
      header: "Linha",
      accessorKey: "linha_negocio" as const,
      cell: (row: Imovel) => <Badge variant="outline">{row.linha_negocio}</Badge>,
    },
    {
      header: "Cidade",
      accessorKey: "cidade" as const,
      cell: (row: Imovel) =>
        row.bairro ? `${row.cidade} – ${row.bairro}` : row.cidade,
    },
    {
      header: "Preço",
      accessorKey: "preco_venda" as const,
      cell: (row: Imovel) => {
        if (row.preco_venda) return formatCurrency(row.preco_venda);
        if (row.preco_aluguel) return `${formatCurrency(row.preco_aluguel)}/mês`;
        return "—";
      },
    },
    {
      header: "Quartos",
      accessorKey: "quartos" as const,
      cell: (row: Imovel) => row.quartos ?? "—",
    },
    {
      header: "Área",
      accessorKey: "area_m2" as const,
      cell: (row: Imovel) => (row.area_m2 ? `${row.area_m2} m²` : "—"),
    },
    {
      header: "Ativo",
      accessorKey: "ativo" as const,
      cell: (row: Imovel) =>
        row.ativo ? (
          <Badge>Sim</Badge>
        ) : (
          <Badge variant="secondary">Não</Badge>
        ),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: Imovel) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/properties/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Imóveis"
        description="Catálogo de imóveis disponíveis"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Imóvel
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={properties || []}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        totalEstimate={(properties?.length ?? 0) === PAGE_SIZE ? (page + 2) * PAGE_SIZE : (page + 1) * PAGE_SIZE}
      />

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Novo Imóvel</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Apartamento 3 quartos Copacabana" {...form.register("titulo")} />
              {form.formState.errors.titulo && (
                <p className="text-xs text-destructive">{form.formState.errors.titulo.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Linha de negócio *</Label>
              <Controller
                control={form.control}
                name="linha_negocio"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LinhaNegocio.VENDA}>Venda</SelectItem>
                      <SelectItem value={LinhaNegocio.ALUGUEL}>Aluguel</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input {...form.register("cidade")} />
                {form.formState.errors.cidade && (
                  <p className="text-xs text-destructive">{form.formState.errors.cidade.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input {...form.register("bairro")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço venda</Label>
                <Input type="number" {...form.register("preco_venda")} />
              </div>
              <div className="space-y-2">
                <Label>Preço aluguel</Label>
                <Input type="number" {...form.register("preco_aluguel")} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Quartos</Label>
                <Input type="number" {...form.register("quartos")} />
              </div>
              <div className="space-y-2">
                <Label>Banheiros</Label>
                <Input type="number" {...form.register("banheiros")} />
              </div>
              <div className="space-y-2">
                <Label>Vagas</Label>
                <Input type="number" {...form.register("vagas")} />
              </div>
              <div className="space-y-2">
                <Label>Área m²</Label>
                <Input type="number" {...form.register("area_m2")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código externo</Label>
              <Input placeholder="REF-001" {...form.register("codigo_externo")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProp.isPending}>
                {createProp.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir imóvel"
        description="Tem certeza? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteProp.isPending}
        variant="destructive"
      />
    </div>
  );
}
