import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { empresaApi, filialApi, equipeApi, usuarioApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { EmpresaCreate, FilialCreate, EquipeCreate, EquipeUpdate, UsuarioCreate, UsuarioUpdate } from "@/types/api";

// ── Empresas ────────────────────────────────────
export function useEmpresas() {
  return useQuery({
    queryKey: ["empresas"],
    queryFn: () => empresaApi.list(),
  });
}

// ── Filiais ─────────────────────────────────────
export function useBranches(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["filiais", offset, limit],
    queryFn: () => filialApi.list({ empresa_id: env.empresaId, offset, limit }),
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FilialCreate) => filialApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["filiais"] });
      toast.success("Filial criada com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => filialApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["filiais"] });
      toast.success("Filial excluída com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ── Equipes ─────────────────────────────────────
export function useTeams(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["equipes", offset, limit],
    queryFn: () => equipeApi.list({ empresa_id: env.empresaId, offset, limit }),
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EquipeCreate) => equipeApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipes"] });
      toast.success("Equipe criada com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => equipeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipes"] });
      toast.success("Equipe excluída com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EquipeUpdate }) =>
      equipeApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipes"] });
      toast.success("Equipe atualizada com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ── Usuários ────────────────────────────────────
export function useUsers(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["usuarios", offset, limit],
    queryFn: () => usuarioApi.list({ empresa_id: env.empresaId, offset, limit }),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UsuarioCreate) => usuarioApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário criado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usuarioApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário excluído com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UsuarioUpdate }) =>
      usuarioApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário atualizado com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
