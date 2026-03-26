import { useQuery } from "@tanstack/react-query";
import { healthApi } from "@/lib/api/endpoints";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => healthApi.health(),
    refetchInterval: 60000,
  });
}

export function useReady() {
  return useQuery({
    queryKey: ["ready"],
    queryFn: () => healthApi.ready(),
    refetchInterval: 60000,
  });
}
