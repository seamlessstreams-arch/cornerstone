import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  return NextResponse.json({ data: db.intelligence.interventions.findByChild(id) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();
  if (!body.title || !body.why_now || !body.intended_outcome || !body.started_on || !body.review_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const created = db.intelligence.interventions.create({
    child_id: id,
    title: String(body.title),
    why_now: String(body.why_now),
    intended_outcome: String(body.intended_outcome),
    started_on: String(body.started_on),
    review_date: String(body.review_date),
    agreed_by: String(body.agreed_by ?? ""),
    owner_id: String(body.owner_id ?? auth.userId),
    status: (body.status ?? "active") as "active" | "review_due" | "completed" | "stopped",
    impact_summary: body.impact_summary ? String(body.impact_summary) : null,
    continue_decision: (body.continue_decision ?? null) as "continue" | "adapt" | "stop" | null,
    linked_record_ids: Array.isArray(body.linked_record_ids) ? body.linked_record_ids.map(String) : [],
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
