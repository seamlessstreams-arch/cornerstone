"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";

export function useOpenTrainingLink() {
  return useMutation({
    mutationFn: (payload: {
      providerCourseId: string;
      providerName?: string;
      providerLearnerId?: string;
      fallbackCourseUrl?: string;
      courseId?: string;
    }) => api.post<{ ok: boolean; url: string }>("/training/open-link", payload),
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    },
  });
}
