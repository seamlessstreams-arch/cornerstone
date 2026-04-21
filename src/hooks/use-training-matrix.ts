"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";

interface TrainingMatrixParams {
  view?: "my" | "home" | "organisation";
  home?: string;
  staff?: string;
  role?: string;
  course?: string;
  provider?: string;
  compliance?: string;
  requirement_type?: "mandatory" | "optional";
}

export interface TrainingMatrixRow {
  id: string;
  staff_member_id: string;
  course_id: string;
  home_id: string | null;
  role_id: string | null;
  requirement_type: string;
  assigned_status: string;
  completion_status: string;
  completed_at: string | null;
  expires_at: string | null;
  due_date: string | null;
  days_until_due: number | null;
  compliance_status: string;
  direct_course_url: string | null;
  certificate_status: string;
  last_synced_at: string | null;
  training_courses?: {
    id: string;
    course_title: string;
    provider_name: string;
    mandatory_flag: boolean;
    course_category: string | null;
  };
  users?: {
    id: string;
    email: string | null;
  };
}

export function useTrainingMatrix(params: TrainingMatrixParams = {}) {
  const query = new URLSearchParams();

  if (params.view) query.set("view", params.view);
  if (params.home) query.set("home", params.home);
  if (params.staff) query.set("staff", params.staff);
  if (params.role) query.set("role", params.role);
  if (params.course) query.set("course", params.course);
  if (params.provider) query.set("provider", params.provider);
  if (params.compliance) query.set("compliance", params.compliance);
  if (params.requirement_type) query.set("requirement_type", params.requirement_type);

  const queryString = query.toString();

  return useQuery({
    queryKey: ["training-matrix", params],
    queryFn: () =>
      api.get<{
        rows: TrainingMatrixRow[];
        summary: {
          total: number;
          compliant: number;
          dueSoon: number;
          overdue: number;
          expired: number;
          incomplete: number;
          nonCompliant: number;
        };
      }>(`/training/matrix${queryString ? `?${queryString}` : ""}`),
  });
}
