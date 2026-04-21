"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Medication, MedicationAdministration } from "@/types";

export function useMedication(childId?: string) {
  const query = childId ? `?child_id=${childId}` : "";
  return useQuery({
    queryKey: ["medication", childId],
    queryFn: () => api.get<{
      data: {
        medications: Medication[];
        mar: { medication: Medication; administrations: MedicationAdministration[] }[];
        today_schedule: MedicationAdministration[];
        exceptions: MedicationAdministration[];
        scheduled: MedicationAdministration[];
        stock_alerts: Medication[];
      };
      meta: Record<string, number>;
    }>(`/medication${query}`),
  });
}

export function useMedicationDetail(id?: string) {
  return useQuery({
    queryKey: ["medication", "detail", id],
    queryFn: () => api.get<{
      data: { medication: Medication; administrations: MedicationAdministration[]; prn: MedicationAdministration[] };
      meta: { given: number; refused: number; missed: number; late: number; total: number; adherence: number | null };
    }>(`/medication/${id}`),
    enabled: !!id,
  });
}

export function useUpdateMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch<Medication>(`/medication/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["medication"] });
      qc.invalidateQueries({ queryKey: ["medication", "detail", id] });
    },
  });
}


export function useAdminister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<MedicationAdministration>) =>
      api.post(`/medication/${id}/administer`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medication"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["health-check"] });
    },
  });
}

export function useCreateMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      child_id: string;
      name: string;
      type: string;
      dosage: string;
      frequency: string;
      route: string;
      prescriber: string;
      pharmacy?: string;
      start_date: string;
      special_instructions?: string;
      stock_count?: number;
    }) => api.post<{ data: Medication }>("/medication", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medication"] }),
  });
}
