// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING EPISODES HOOKS
// React Query wrappers for /api/v1/missing-episodes
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MissingEpisode } from "@/types/extended";

const API = "/api/v1/missing-episodes";

function currentUserId(): string {
  if (typeof window === "undefined") return "staff_darren";
  try { return localStorage.getItem("cs_user_id") ?? "staff_darren"; } catch { return "staff_darren"; }
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-User-Id": currentUserId() };
}

// ── Response shapes ────────────────────────────────────────────────────────────

export interface PatternAnalysisItem {
  child_id: string;
  child_name: string;
  total_episodes: number;
  avg_duration_hours: number;
  highest_risk: string;
  contextual_risk: boolean;
  return_interview_outstanding: boolean;
  last_episode_date: string | null;
}

export interface MissingEpisodesMeta {
  total: number;
  active: number;
  this_month: number;
  this_year: number;
  contextual_risk: number;
  unresolved: number;
}

export interface MissingEpisodesResponse {
  data: MissingEpisode[];
  meta: MissingEpisodesMeta;
  pattern_analysis: PatternAnalysisItem[];
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useMissingEpisodes(params?: {
  child_id?: string;
  status?: "active" | "closed" | "all";
  risk_level?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.child_id) qs.set("child_id", params.child_id);
  if (params?.status && params.status !== "all") qs.set("status", params.status);
  if (params?.risk_level) qs.set("risk_level", params.risk_level);

  const url = qs.toString() ? `${API}?${qs}` : API;

  return useQuery<MissingEpisodesResponse>({
    queryKey: ["missing-episodes", params ?? {}],
    queryFn: async () => {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch missing episodes");
      return res.json();
    },
  });
}

export function useMissingEpisode(id: string) {
  return useQuery<{ data: MissingEpisode }>({
    queryKey: ["missing-episodes", id],
    queryFn: async () => {
      const res = await fetch(`${API}/${id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Episode not found");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useLogMissingEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      child_id: string;
      date_missing: string;
      time_missing?: string;
      risk_level: "low" | "medium" | "high" | "critical";
      location_last_seen: string;
    }) => {
      const res = await fetch(API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...data, created_by: currentUserId() }),
      });
      if (!res.ok) throw new Error("Failed to log episode");
      return res.json() as Promise<{ data: MissingEpisode }>;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["missing-episodes"] }); },
  });
}

export function useUpdateMissingEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; action?: string } & Record<string, unknown>) => {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update episode");
      return res.json() as Promise<{ data: MissingEpisode }>;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["missing-episodes"] }); },
  });
}
