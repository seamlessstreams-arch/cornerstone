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
  return NextResponse.json({ data: db.intelligence.childVoice.findByChild(id) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();

  if (!body.said || !body.adult_response || !body.outcome) {
    return NextResponse.json({ error: "said, adult_response, and outcome are required" }, { status: 400 });
  }

  const created = db.intelligence.childVoice.create({
    child_id: id,
    said: String(body.said),
    adult_response: String(body.adult_response),
    outcome: String(body.outcome),
    source: typeof body.source === "string" ? body.source : "manual",
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
