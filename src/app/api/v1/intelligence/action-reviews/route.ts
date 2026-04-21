import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { listActionEffectiveness } from "@/lib/intelligence/engine";

const VALID_EFFECTIVENESS = ["worked", "partially_worked", "did_not_work"] as const;
const VALID_DECISIONS = ["continue", "adapt", "stop"] as const;

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_TASKS);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const childId = url.searchParams.get("child_id");

  const reviews = listActionEffectiveness();
  const data = childId ? reviews.filter((r) => r.child_id === childId) : reviews;

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.EDIT_TEAM_TASKS);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();

  if (!body.action_id || !body.what_changed || !body.evidence_after || !body.effectiveness || !body.decision) {
    return NextResponse.json(
      { error: "action_id, what_changed, evidence_after, effectiveness, and decision are required" },
      { status: 400 }
    );
  }

  if (!(VALID_EFFECTIVENESS as readonly string[]).includes(body.effectiveness)) {
    return NextResponse.json(
      { error: `effectiveness must be one of: ${VALID_EFFECTIVENESS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!(VALID_DECISIONS as readonly string[]).includes(body.decision)) {
    return NextResponse.json(
      { error: `decision must be one of: ${VALID_DECISIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const created = db.intelligence.actionReviews.create({
    action_id: String(body.action_id),
    child_id: typeof body.child_id === "string" ? body.child_id : null,
    what_changed: String(body.what_changed),
    evidence_after: String(body.evidence_after),
    effectiveness: body.effectiveness as (typeof VALID_EFFECTIVENESS)[number],
    decision: body.decision as (typeof VALID_DECISIONS)[number],
    reviewed_by: auth.userId,
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
