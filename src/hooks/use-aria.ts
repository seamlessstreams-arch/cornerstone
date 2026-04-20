"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "./use-api";
import type { AriaMode, AriaStyle } from "@/types/extended";

export interface AriaRequestPayload {
  mode: AriaMode;
  style: AriaStyle;
  page_context: string;
  record_type?: string;
  source_content?: string;
  linked_records?: string;
  audience?: string;
  question?: string;
  user_role?: string;
  aria_assisted?: boolean;
}

export function useAria() {
  return useMutation({
    mutationFn: (payload: AriaRequestPayload) =>
      api.post<{ data: { response: string; mode: AriaMode; style: AriaStyle } }>(
        "/aria",
        { ...payload, user_role: payload.user_role || "registered_manager" }
      ),
  });
}
