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
  return NextResponse.json({ data: db.intelligence.practiceBank.findByChild(id) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();

  if (!body.category || !body.title || !body.details) {
    return NextResponse.json({ error: "category, title, and details are required" }, { status: 400 });
  }

  const created = db.intelligence.practiceBank.create({
    child_id: id,
    category: body.category,
    title: String(body.title),
    details: String(body.details),
    evidence_refs: Array.isArray(body.evidence_refs) ? body.evidence_refs.map(String) : [],
    created_by: auth.userId,
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
