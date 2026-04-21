"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Incident } from "@/types";

export function useIncident(id: string) {
  return useQuery({
    queryKey: ["incidents", id],
    queryFn: () => api.get<{ data: Incident }>(`/incidents/${id}`),
    enabled: !!id,
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch<{ data: Incident }>(`/incidents/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["incidents", vars.id] });
    },
  });
}

export function useIncidents(params?: { status?: string; child_id?: string; needs_oversight?: boolean }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.child_id) query.set("child_id", params.child_id);
  if (params?.needs_oversight) query.set("needs_oversight", "true");

  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => api.get<{ data: Incident[]; meta: Record<string, number> }>(`/incidents?${query}`),
  });
}

export function useAddOversight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note, by, aria_assisted }: { id: string; note: string; by: string; aria_assisted?: boolean }) =>
      api.post(`/incidents/${id}/oversight`, { oversight_note: note, oversight_by: by, aria_assisted }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["health-check"] });
    },
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Incident>) => api.post<{ data: Incident; linked_updates: string[] }>("/incidents", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["health-check"] });
    },
  });
}

// ── Intelligence hooks ────────────────────────────────────────────────────────

export interface SimilarIncidentResult {
  incident: Incident;
  matchReasons: string[];
  daysSince: number;
  patternNote: string;
}

export interface RiskAssessmentResult {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: Array<{ label: string; weight: number; description: string }>;
  protectiveFactors: string[];
  recommendedActions: string[];
}

export function useSimilarIncidents(incidentId: string | undefined) {
  return useQuery({
    queryKey: ["incidents", "similar", incidentId],
    queryFn: () =>
      api.get<{ data: SimilarIncidentResult[]; total: number }>(
        `/intelligence/incidents/similar?incident_id=${incidentId}`
      ),
    enabled: !!incidentId,
    staleTime: 60_000,
  });
}

export function useIncidentRiskAssessment(incidentId: string | undefined) {
  return useQuery({
    queryKey: ["incidents", "risk-assessment", incidentId],
    queryFn: () =>
      api.post<{ data: RiskAssessmentResult }>(
        "/intelligence/incidents/risk-assessment",
        { incident_id: incidentId }
      ),
    enabled: !!incidentId,
    staleTime: 60_000,
  });
}
