"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";

export function useTrainingProviderConfig() {
  return useQuery({
    queryKey: ["training-provider-config"],
    queryFn: () =>
      api.get<{
        providerCode: string;
        enabled: boolean;
        connection: Record<string, unknown> | null;
        capabilities: Array<Record<string, unknown>>;
      }>("/training/provider-config"),
  });
}

export function useSaveTrainingProviderConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<{ ok: boolean; connection: Record<string, unknown> }>("/training/provider-config", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-provider-config"] });
      queryClient.invalidateQueries({ queryKey: ["training-sync-status"] });
    },
  });
}
