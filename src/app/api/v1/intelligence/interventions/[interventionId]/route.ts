import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ interventionId: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { interventionId } = await params;
  const body = await request.json();

  const updated = db.intelligence.interventions.update(interventionId, {
    title: typeof body.title === "string" ? body.title : undefined,
    why_now: typeof body.why_now === "string" ? body.why_now : undefined,
    intended_outcome: typeof body.intended_outcome === "string" ? body.intended_outcome : undefined,
    review_date: typeof body.review_date === "string" ? body.review_date : undefined,
    status: typeof body.status === "string" ? body.status : undefined,
    impact_summary: typeof body.impact_summary === "string" ? body.impact_summary : undefined,
    continue_decision: typeof body.continue_decision === "string" ? body.continue_decision : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
