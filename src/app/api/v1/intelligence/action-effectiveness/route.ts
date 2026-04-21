import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { listActionEffectiveness } from "@/lib/intelligence/engine";

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_TASKS);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ data: listActionEffectiveness() });
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.EDIT_TEAM_TASKS);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  if (!body.action_id || !body.what_changed || !body.evidence_after || !body.effectiveness || !body.decision) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const created = db.intelligence.actionReviews.create({
    action_id: String(body.action_id),
    child_id: typeof body.child_id === "string" ? body.child_id : null,
    what_changed: String(body.what_changed),
    evidence_after: String(body.evidence_after),
    effectiveness: body.effectiveness,
    decision: body.decision,
    reviewed_by: auth.userId,
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
