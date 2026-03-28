import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conexaoApi, uazapiApi } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { ConexaoCreate, ProvisionConnectionRequest, CreateInstanceRequest } from "@/types/api";

export function useConnections(offset = 0, limit = 50) {
  return useQuery({
    queryKey: ["conexoes", offset, limit],
    queryFn: () => conexaoApi.list({ empresa_id: env.empresaId, offset, limit }),
  });
}

export function useConnection(id: string | null) {
  return useQuery({
    queryKey: ["conexoes", id],
    queryFn: () => conexaoApi.get(id!),
    enabled: !!id,
  });
}

export function useConnectionStatus(connectionId: string | null) {
  return useQuery({
    queryKey: ["conexao-status", connectionId],
    queryFn: () => uazapiApi.connectionStatus(connectionId!),
    enabled: !!connectionId,
    refetchInterval: 30000,
  });
}

export function useConnectionQRCode(connectionId: string | null) {
  return useQuery({
    queryKey: ["conexao-qrcode", connectionId],
    queryFn: () => uazapiApi.qrcode(connectionId!),
    enabled: !!connectionId,
    refetchInterval: 5000,
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConexaoCreate) => conexaoApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conexoes"] });
      toast.success("Conexão criada com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => uazapiApi.deleteConnection(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conexoes"] });
      toast.success("Conexão excluída com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useProvisionConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProvisionConnectionRequest) => uazapiApi.provision(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conexoes"] });
      toast.success("Conexão provisionada com sucesso.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateInstance() {
  return useMutation({
    mutationFn: (data: CreateInstanceRequest) => uazapiApi.createInstance(data),
    onSuccess: () => toast.success("Instância criada com sucesso."),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSyncConnections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => uazapiApi.syncConnections(),
    onSuccess: (data) => {
      qc.setQueryData(["conexoes", 0, 50], data);
      qc.invalidateQueries({ queryKey: ["conexoes"] });
      toast.success(`${data.length} conexão(ões) sincronizada(s) com sucesso.`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
