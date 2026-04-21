import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/db/store";
import type { AutomationLog } from "@/types/intelligence";

// ── GET /api/v1/intelligence/automation-logs ──────────────────────────────────
// Returns the automation audit trail, newest-first.
// Optional query params:
//   ?type=pattern_task|review_task|...
//   ?limit=N (default 50)

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get("type") as AutomationLog["automation_type"] | null;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  let logs = typeFilter
    ? db.intelligence.automationLogs.findByType(typeFilter)
    : db.intelligence.automationLogs.findAll();

  logs = logs.slice(0, limit);

  return NextResponse.json({ data: logs, total: logs.length });
}
