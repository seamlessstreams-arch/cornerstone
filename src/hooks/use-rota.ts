"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Shift, LeaveRequest } from "@/types";

export interface RotaMeta {
  week_start: string;
  week_end: string;
  on_shift_today: number;
  sleep_ins_tonight: number;
  open_shifts: number;
  on_leave_today: number;
  late_arrivals: number;
  open_shift_dates: { date: string; start: string; end: string; type: string }[];
}

export interface RotaResponse {
  shifts: Shift[];
  leave: LeaveRequest[];
  meta: RotaMeta;
}

export function useRota(weekStart: string) {
  return useQuery({
    queryKey: ["rota", weekStart],
    queryFn: () => api.get<RotaResponse>(`/rota?week_start=${weekStart}`),
    enabled: !!weekStart,
  });
}
