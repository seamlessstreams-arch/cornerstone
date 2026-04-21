import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidate_id");

  const interviews = candidateId
    ? db.candidateInterviews.findByCandidate(candidateId)
    : db.candidateInterviews.findAll();

  return NextResponse.json({ data: interviews }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidate_id, scheduled_at, mode, interview_type, panel, notes, location, vacancy_id } = body;

    if (!candidate_id || !scheduled_at || !mode) {
      return NextResponse.json(
        { error: "candidate_id, scheduled_at, and mode are required" },
        { status: 400 }
      );
    }

    const interview = db.candidateInterviews.create({
      candidate_id,
      vacancy_id: vacancy_id ?? null,
      scheduled_at,
      mode,
      interview_type: interview_type ?? "first_interview",
      panel: panel ?? [],
      location: location ?? null,
      rationale: notes ?? null,
      completed_at: null,
      recommendation: null,
      safeguarding_question_asked: false,
      motivation_question_asked: false,
      signed_off_by: null,
      signed_off_at: null,
    });

    return NextResponse.json({ data: interview }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to schedule interview" }, { status: 500 });
  }
}
