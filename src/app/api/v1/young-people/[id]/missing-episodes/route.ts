import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// ── GET /api/v1/young-people/[id]/missing-episodes ────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const yp = db.youngPeople.findById(id);
  if (!yp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const episodes = db.missingEpisodes
    .findByChild(id)
    .sort((a, b) => b.date_missing.localeCompare(a.date_missing));

  return NextResponse.json({ data: episodes, total: episodes.length });
}

// ── POST /api/v1/young-people/[id]/missing-episodes ───────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const yp = db.youngPeople.findById(id);
  if (!yp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    date_missing,
    time_missing,
    risk_level,
    location_last_seen,
    reported_to_police = false,
    police_reference = null,
    reported_to_la = true,
    contextual_safeguarding_risk = false,
    pattern_notes = null,
  } = body;

  if (!date_missing) return NextResponse.json({ error: "date_missing is required" }, { status: 400 });
  if (!time_missing) return NextResponse.json({ error: "time_missing is required" }, { status: 400 });
  if (!risk_level) return NextResponse.json({ error: "risk_level is required" }, { status: 400 });
  if (!location_last_seen?.trim()) return NextResponse.json({ error: "location_last_seen is required" }, { status: 400 });

  const episode = db.missingEpisodes.create({
    child_id: id,
    home_id: "home_oak",
    date_missing,
    time_missing,
    risk_level,
    location_last_seen: location_last_seen.trim(),
    reported_to_police,
    police_reference: reported_to_police ? (police_reference || null) : null,
    reported_to_la,
    la_notified_at: reported_to_la ? new Date().toISOString() : null,
    contextual_safeguarding_risk,
    pattern_notes,
    status: "active",
    date_returned: null,
    time_returned: null,
    duration_hours: null,
    return_location: null,
    return_interview_completed: false,
    return_interview_by: null,
    return_interview_date: null,
    return_interview_notes: null,
    linked_incident_id: null,
    created_by: body.recorded_by ?? "staff_darren",
  });

  // Auto-create chronology entry
  db.chronology.create({
    child_id: id,
    home_id: "home_oak",
    date: date_missing,
    time: time_missing,
    category: "missing",
    title: `Missing from care episode logged — ${episode.reference}`,
    description: `${yp.preferred_name ?? yp.first_name} reported missing from ${location_last_seen.trim()}. Risk level: ${risk_level}.${contextual_safeguarding_risk ? " Contextual safeguarding risk identified." : ""}`,
    significance: risk_level === "critical" || risk_level === "high" ? "critical" : "significant",
    recorded_by: body.recorded_by ?? "staff_darren",
    linked_incident_id: null,
  });

  return NextResponse.json({ data: episode }, { status: 201 });
}

// ── PATCH /api/v1/young-people/[id]/missing-episodes  (return + interview) ───

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { episode_id, action, ...data } = body;

  if (!episode_id) return NextResponse.json({ error: "episode_id is required" }, { status: 400 });

  const episodes = db.missingEpisodes.findByChild(id);
  const ep = episodes.find((e) => e.id === episode_id);
  if (!ep) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  const idx = db.missingEpisodes["findAll"]().findIndex((e) => e.id === episode_id);
  if (idx === -1) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  const allEpisodes = db.missingEpisodes.findAll();

  if (action === "record_return") {
    const { date_returned, time_returned, return_location } = data;
    if (!date_returned || !time_returned) {
      return NextResponse.json({ error: "date_returned and time_returned are required" }, { status: 400 });
    }
    const missingStart = new Date(`${ep.date_missing}T${ep.time_missing}`);
    const returnedAt = new Date(`${date_returned}T${time_returned}`);
    const durationHours = Math.round(((returnedAt.getTime() - missingStart.getTime()) / 3_600_000) * 10) / 10;

    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["date_returned"] = date_returned;
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["time_returned"] = time_returned;
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["return_location"] = return_location ?? null;
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["duration_hours"] = durationHours;
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["status"] = "returned";

    // Chronology
    db.chronology.create({
      child_id: id,
      home_id: "home_oak",
      date: date_returned,
      time: time_returned,
      category: "missing",
      title: `Returned from missing episode — ${ep.reference}`,
      description: `${db.youngPeople.findById(id)?.preferred_name ?? "Young person"} returned after ${durationHours}h.${return_location ? ` Location: ${return_location}.` : ""}`,
      significance: "significant",
      recorded_by: data.recorded_by ?? "staff_darren",
      linked_incident_id: null,
    });

    return NextResponse.json({ data: allEpisodes[idx] });
  }

  if (action === "record_interview") {
    const { interview_notes, interviewed_by } = data;
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["return_interview_completed"] = true;
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["return_interview_by"] = interviewed_by ?? null;
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["return_interview_date"] = todayStr();
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["return_interview_notes"] = interview_notes ?? null;
    ((allEpisodes[idx] as unknown) as Record<string, unknown>)["status"] = "closed";

    return NextResponse.json({ data: allEpisodes[idx] });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
