"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { TrainingRecord } from "@/types";

export function useTraining(params?: { staff_id?: string; status?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params?.staff_id) query.set("staff_id", params.staff_id);
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);

  return useQuery({
    queryKey: ["training", params],
    queryFn: () =>
      api.get<{
        data: TrainingRecord[];
        meta: {
          total: number;
          compliant: number;
          expiring: number;
          expired: number;
          not_started: number;
          rate: number;
        };
      }>(`/training?${query}`),
  });
}
