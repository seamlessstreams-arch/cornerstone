import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

// ── GET /api/v1/missing-episodes/[id] ────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.VIEW_SAFEGUARDING);
  if (auth instanceof NextResponse) return auth;

  const episode = db.missingEpisodes.findById(id);
  if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  return NextResponse.json({ data: episode });
}

// ── PATCH /api/v1/missing-episodes/[id] ──────────────────────────────────────
// Supports three action types:
//   action: "mark_returned"   — logs return details, sets status to "returned"
//   action: "complete_interview" — logs return interview, closes episode
//   action: "update"          — general field update

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.MANAGE_SAFEGUARDING);
  if (auth instanceof NextResponse) return auth;

  const episode = db.missingEpisodes.findById(id);
  if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  const body = await req.json();
  const { action, ...rest } = body;

  if (action === "mark_returned") {
    const { date_returned, time_returned, return_location, duration_hours } = rest;
    const updated = db.missingEpisodes.update(id, {
      date_returned: date_returned ?? null,
      time_returned: time_returned ?? null,
      return_location: return_location ?? null,
      duration_hours: duration_hours ?? null,
      reported_to_police: rest.reported_to_police ?? episode.reported_to_police,
      police_reference: rest.police_reference ?? episode.police_reference,
      reported_to_la: rest.reported_to_la ?? episode.reported_to_la,
      la_notified_at: rest.la_notified_at ?? episode.la_notified_at,
      status: "returned",
    });
    return NextResponse.json({ data: updated });
  }

  if (action === "complete_interview") {
    const { return_interview_by, return_interview_date, return_interview_notes, contextual_safeguarding_risk, pattern_notes } = rest;
    if (!return_interview_by || !return_interview_date) {
      return NextResponse.json({ error: "return_interview_by and return_interview_date are required" }, { status: 400 });
    }
    const updated = db.missingEpisodes.update(id, {
      return_interview_completed: true,
      return_interview_by,
      return_interview_date,
      return_interview_notes: return_interview_notes ?? null,
      contextual_safeguarding_risk: contextual_safeguarding_risk ?? episode.contextual_safeguarding_risk,
      pattern_notes: pattern_notes ?? episode.pattern_notes,
      status: "closed",
    });
    return NextResponse.json({ data: updated });
  }

  // General update — strip immutable fields
  const safe = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !["id", "created_at", "created_by", "reference"].includes(key))
  );
  const updated = db.missingEpisodes.update(id, safe as never);
  return NextResponse.json({ data: updated });
}
