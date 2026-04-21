import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { buildManagerOversightIntelligence } from "@/lib/intelligence/engine";
import { db } from "@/lib/db/store";

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ data: buildManagerOversightIntelligence() });
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.MANAGE_INCIDENTS);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json() as { triggerType?: string; assignTo?: string };
  const triggerType = body.triggerType ?? "all";
  const assignTo = body.assignTo ?? "manager";

  const intelligence = buildManagerOversightIntelligence();
  const tasksCreated: Array<{ id: string; title: string; reason: string }> = [];

  if ((triggerType === "stalled" || triggerType === "all") && intelligence.stalledActions.length > 0) {
    for (const action of intelligence.stalledActions.slice(0, 5)) {
      tasksCreated.push({
        id: `task_${Date.now()}_${action.id}`,
        title: `Chase overdue action: ${action.title}`,
        reason: `Task assigned to ${action.owner} has passed its due date.`,
      });
    }
  }

  if ((triggerType === "oversight" || triggerType === "all") && intelligence.missingOversight.length > 0) {
    for (const item of intelligence.missingOversight.slice(0, 5)) {
      tasksCreated.push({
        id: `task_${Date.now()}_${item.id}`,
        title: `Complete oversight: ${item.title}`,
        reason: item.reason,
      });
    }
  }

  // Persist an automation log entry for each task generated
  for (const t of tasksCreated) {
    db.intelligence.automationLogs.create({
      automation_type: "oversight_task",
      source_id: t.id,
      source_type: "oversight",
      generated_entity_id: t.id,
      generated_entity_type: "task",
      title: t.title,
      initiated_by: auth.userId,
      metadata: {
        decision_rationale: t.reason,
        manual_review_needed: true,
      },
    });
  }

  return NextResponse.json(
    {
      success: true,
      tasksCreated,
      driftIndicators: intelligence.driftIndicators,
      message: `${tasksCreated.length} oversight task(s) auto-generated.`,
    },
    { status: 201 }
  );
}
