"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";

export function useTrainingSyncStatus() {
  return useQuery({
    queryKey: ["training-sync-status"],
    queryFn: () =>
      api.get<{
        connected: boolean;
        provider: Record<string, unknown> | null;
        logs: Array<Record<string, unknown>>;
        errors: Array<Record<string, unknown>>;
      }>("/training/sync"),
  });
}

export function useRunTrainingSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { mode?: "manual" | "poll"; sinceIso?: string }) =>
      api.post<{ ok: boolean; processed: number; warnings: string[] }>("/training/sync", payload ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["training-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["training"] });
    },
  });
}
