"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  ActionEffectivenessReview,
  AutomationLog,
  ChildExperienceSnapshot,
  ChildVoiceEntry,
  HomeClimateSnapshot,
  InterventionRecord,
  PatternSignal,
  PracticeBankEntry,
  QualityOfCareSnapshot,
  TrustedAdultLink,
} from "@/types/intelligence";

export function useChildExperience(childId?: string) {
  return useQuery({
    queryKey: ["intelligence", "child-experience", childId],
    queryFn: () => api.get<{ data: ChildExperienceSnapshot }>(`/intelligence/children/${childId}/experience`),
    enabled: Boolean(childId),
  });
}

export function useChildInterventions(childId?: string) {
  return useQuery({
    queryKey: ["intelligence", "interventions", childId],
    queryFn: () => api.get<{ data: InterventionRecord[] }>(`/intelligence/children/${childId}/interventions`),
    enabled: Boolean(childId),
  });
}

export function useCreateIntervention(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ data: InterventionRecord }>(`/intelligence/children/${childId}/interventions`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence", "interventions", childId] });
      queryClient.invalidateQueries({ queryKey: ["intelligence", "child-experience", childId] });
    },
  });
}

export function useUpdateIntervention(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ interventionId, ...payload }: { interventionId: string } & Record<string, unknown>) =>
      api.patch<{ data: InterventionRecord }>(`/intelligence/interventions/${interventionId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence", "interventions", childId] });
      queryClient.invalidateQueries({ queryKey: ["intelligence", "child-experience", childId] });
    },
  });
}

export function useTrustedAdults(childId?: string) {
  return useQuery({
    queryKey: ["intelligence", "trusted-adults", childId],
    queryFn: () => api.get<{ data: Array<TrustedAdultLink & { staff: Record<string, unknown> | null }> }>(`/intelligence/children/${childId}/trusted-adults`),
    enabled: Boolean(childId),
  });
}

export function useCreateTrustedAdult(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ data: TrustedAdultLink }>(`/intelligence/children/${childId}/trusted-adults`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["intelligence", "trusted-adults", childId] }),
  });
}

export function usePracticeBank(childId?: string) {
  return useQuery({
    queryKey: ["intelligence", "practice-bank", childId],
    queryFn: () => api.get<{ data: PracticeBankEntry[] }>(`/intelligence/children/${childId}/practice-bank`),
    enabled: Boolean(childId),
  });
}

export function useCreatePracticeBankEntry(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ data: PracticeBankEntry }>(`/intelligence/children/${childId}/practice-bank`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["intelligence", "practice-bank", childId] }),
  });
}

export function useChildVoice(childId?: string) {
  return useQuery({
    queryKey: ["intelligence", "child-voice", childId],
    queryFn: () => api.get<{ data: ChildVoiceEntry[] }>(`/intelligence/children/${childId}/voice`),
    enabled: Boolean(childId),
  });
}

export function useCreateChildVoice(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ data: ChildVoiceEntry }>(`/intelligence/children/${childId}/voice`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["intelligence", "child-voice", childId] }),
  });
}

export function useHomeClimate(periodDays = 28) {
  return useQuery({
    queryKey: ["intelligence", "home-climate", periodDays],
    queryFn: () => api.get<{ data: HomeClimateSnapshot }>(`/intelligence/home-climate?periodDays=${periodDays}`),
  });
}

export function usePatternAlerts() {
  return useQuery({
    queryKey: ["intelligence", "pattern-alerts"],
    queryFn: () => api.get<{ data: PatternSignal[] }>("/intelligence/pattern-alerts"),
  });
}

export function useQualityOfCareIntelligence() {
  return useQuery({
    queryKey: ["intelligence", "quality-of-care"],
    queryFn: () => api.get<{ data: QualityOfCareSnapshot }>("/intelligence/quality-of-care"),
  });
}

export function useManagementOversightIntelligence() {
  return useQuery({
    queryKey: ["intelligence", "management-oversight"],
    queryFn: () => api.get<{ data: Record<string, unknown> }>("/intelligence/management-oversight"),
  });
}

export function useActionEffectiveness() {
  return useQuery({
    queryKey: ["intelligence", "action-effectiveness"],
    queryFn: () => api.get<{ data: ActionEffectivenessReview[] }>("/intelligence/action-effectiveness"),
  });
}

export function useCreateActionEffectiveness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ data: ActionEffectivenessReview }>("/intelligence/action-effectiveness", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["intelligence", "action-effectiveness"] }),
  });
}

export function useVoiceCoverage() {
  return useQuery({
    queryKey: ["intelligence", "voice-coverage"],
    queryFn: () => api.get<{ data: { generatedAt: string; entriesTotal: number; perChild: Array<{ childId: string; childName: string; count: number; latest: string | null; hasActionLink: boolean; recurringThemes: string[] }>; missingChildren: string[] } }>("/intelligence/voice-coverage"),
  });
}

export function useAutomatePatternTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, ...payload }: { alertId: string } & Record<string, unknown>) =>
      api.post<{ taskId: string; task: Record<string, unknown> }>(`/intelligence/pattern-alerts/${alertId}/automate-task`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence", "pattern-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useResolvePatternAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, status }: { alertId: string; status: "reviewed" | "resolved" }) =>
      api.patch<{ data: PatternSignal }>(`/intelligence/pattern-alerts/${alertId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence", "pattern-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar", "alerts"] });
    },
  });
}

export function useActiveAlertCount() {
  return useQuery({
    queryKey: ["sidebar", "alerts"],
    queryFn: () => api.get<{ count: number }>("/intelligence/pattern-alerts/count"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useCreateFollowUpIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<{ interventionId: string; taskId: string; intervention: Record<string, unknown> }>("/intelligence/action-reviews/follow-up-intervention", payload),
    onSuccess: (_data, variables) => {
      const childId = variables.childId as string | undefined;
      if (childId) {
        queryClient.invalidateQueries({ queryKey: ["intelligence", "interventions", childId] });
        queryClient.invalidateQueries({ queryKey: ["intelligence", "child-experience", childId] });
      }
      queryClient.invalidateQueries({ queryKey: ["intelligence", "action-effectiveness"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useTriggerOversightAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { triggerType?: "stalled" | "oversight" | "all"; assignTo?: string }) =>
      api.post<{ tasksCreated: Array<{ id: string; title: string; reason: string }>; driftIndicators: string[]; message: string }>(
        "/intelligence/management-oversight",
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence", "management-oversight"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["intelligence", "automation-logs"] });
    },
  });
}

export function useAutomationLogs(type?: AutomationLog["automation_type"]) {
  const params = type ? `?type=${type}` : "";
  return useQuery({
    queryKey: ["intelligence", "automation-logs", type],
    queryFn: () => api.get<{ data: AutomationLog[]; total: number }>(`/intelligence/automation-logs${params}`),
    staleTime: 30_000,
  });
}
