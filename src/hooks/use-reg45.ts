"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";

export interface Reg45Cycle {
  id: string;
  cycle_title: string;
  status: string;
  review_start_date: string;
  review_end_date: string;
  due_date: string | null;
  evidence_count?: number;
  findings_count?: number;
  open_actions_count?: number;
  completeness?: {
    score: number;
    alerts: string[];
    blockFinalSignOff: boolean;
  };
}

export function useReg45Cycles() {
  return useQuery({
    queryKey: ["reg45-cycles"],
    queryFn: () => api.get<{ cycles: Reg45Cycle[] }>("/reg45/cycles"),
  });
}

export function useCreateReg45Cycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      cycleTitle: string;
      reviewStartDate: string;
      reviewEndDate: string;
      dueDate?: string;
      requiredConsultationGroups?: string[];
    }) => api.post<{ cycle: Reg45Cycle }>("/reg45/cycles", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reg45-cycles"] });
    },
  });
}

export function useReg45Evidence(cycleId?: string) {
  return useQuery({
    queryKey: ["reg45-evidence", cycleId],
    queryFn: () => api.get<{ evidence: Array<Record<string, unknown>> }>(`/reg45/evidence${cycleId ? `?cycleId=${cycleId}` : ""}`),
    enabled: Boolean(cycleId),
  });
}

export function useCreateReg45Evidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ evidence: Record<string, unknown> }>("/reg45/evidence", payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-evidence", payload.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["reg45-cycles"] });
    },
  });
}

export function useReg45Findings(cycleId?: string) {
  return useQuery({
    queryKey: ["reg45-findings", cycleId],
    queryFn: () => api.get<{ findings: Array<Record<string, unknown>> }>(`/reg45/findings${cycleId ? `?cycleId=${cycleId}` : ""}`),
    enabled: Boolean(cycleId),
  });
}

export function useCreateReg45Finding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ finding: Record<string, unknown> }>("/reg45/findings", payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-findings", payload.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["reg45-cycles"] });
    },
  });
}

export function useReg45Actions(cycleId?: string) {
  return useQuery({
    queryKey: ["reg45-actions", cycleId],
    queryFn: () => api.get<{ actions: Array<Record<string, unknown>> }>(`/reg45/actions${cycleId ? `?cycleId=${cycleId}` : ""}`),
    enabled: Boolean(cycleId),
  });
}

export function useCreateReg45Action() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ action: Record<string, unknown> }>("/reg45/actions", payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-actions", payload.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["reg45-cycles"] });
    },
  });
}

export function useReg45Consultations(cycleId?: string) {
  return useQuery({
    queryKey: ["reg45-consultations", cycleId],
    queryFn: () =>
      api.get<{ consultations: Array<Record<string, unknown>> }>(`/reg45/consultations${cycleId ? `?cycleId=${cycleId}` : ""}`),
    enabled: Boolean(cycleId),
  });
}

export function useCreateReg45Consultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<{ consultation: Record<string, unknown> }>("/reg45/consultations", payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-consultations", payload.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["reg45-cycles"] });
    },
  });
}

export function useReg45Report(cycleId?: string) {
  return useQuery({
    queryKey: ["reg45-report", cycleId],
    queryFn: () => api.get<{ reportVersion: Record<string, unknown>; sections: Array<Record<string, unknown>>; completeness: { score: number; alerts: string[]; blockFinalSignOff: boolean } }>(`/reg45/reports?cycleId=${cycleId}`),
    enabled: Boolean(cycleId),
  });
}

export function useSaveReg45ReportSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ section: Record<string, unknown> }>("/reg45/reports", payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-report", payload.cycleId] });
    },
  });
}

export function useGenerateReg45AriaDraft() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<{ draft: string; warning?: string }>("/reg45/reports/draft", payload),
  });
}

export function useSignOffReg45Cycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cycleId: string; submissionDueDate?: string }) =>
      api.post<{ cycle: Record<string, unknown>; completeness: Record<string, unknown> }>("/reg45/reports/signoff", payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-cycles"] });
      queryClient.invalidateQueries({ queryKey: ["reg45-report", payload.cycleId] });
    },
  });
}

export function useReg45Exports(cycleId?: string) {
  return useQuery({
    queryKey: ["reg45-exports", cycleId],
    queryFn: () => api.get<{ exports: Array<Record<string, unknown>> }>(`/reg45/exports${cycleId ? `?cycleId=${cycleId}` : ""}`),
    enabled: Boolean(cycleId),
  });
}

export function useCreateReg45Export() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ export: Record<string, unknown>; filePath: string }>("/reg45/exports", payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-exports", payload.cycleId] });
    },
  });
}

export function useReg45CycleDetail(cycleId?: string) {
  return useQuery({
    queryKey: ["reg45-cycle-detail", cycleId],
    queryFn: () => api.get<{ cycle: Record<string, unknown>; completeness: Record<string, unknown> }>(`/reg45/cycles/${cycleId}`),
    enabled: Boolean(cycleId),
  });
}

export function useUpdateReg45Cycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, ...payload }: { cycleId: string } & Record<string, unknown>) =>
      api.patch<{ cycle: Record<string, unknown>; completeness: Record<string, unknown> }>(`/reg45/cycles/${cycleId}`, payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-cycles"] });
      queryClient.invalidateQueries({ queryKey: ["reg45-cycle-detail", payload.cycleId] });
    },
  });
}

export function useVerifyReg45Evidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      evidenceId,
      cycleId,
      ...payload
    }: { evidenceId: string; cycleId: string } & Record<string, unknown>) =>
      api.patch<{ evidence: Record<string, unknown> }>(`/reg45/evidence/${evidenceId}`, payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-evidence", payload.cycleId] });
    },
  });
}

export function useUpdateReg45Action() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actionId,
      cycleId,
      ...payload
    }: { actionId: string; cycleId: string } & Record<string, unknown>) =>
      api.patch<{ action: Record<string, unknown> }>(`/reg45/actions/${actionId}`, payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-actions", payload.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["reg45-cycles"] });
    },
  });
}

export function useUpdateReg45Finding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      findingId,
      cycleId,
      ...payload
    }: { findingId: string; cycleId: string } & Record<string, unknown>) =>
      api.patch<{ finding: Record<string, unknown> }>(`/reg45/findings/${findingId}`, payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reg45-findings", payload.cycleId] });
    },
  });
}

export function useReg45Oversight(entityType: string, entityId?: string) {
  return useQuery({
    queryKey: ["reg45-oversight", entityType, entityId],
    queryFn: () =>
      api.get<{ entries: Array<Record<string, unknown>> }>(
        `/reg45/oversight?entityType=${entityType}&entityId=${entityId}`
      ),
    enabled: Boolean(entityId),
  });
}

export function useCreateReg45Oversight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<{ entry: Record<string, unknown> }>("/reg45/oversight", payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["reg45-oversight", payload.entityType, payload.entityId],
      });
    },
  });
}
