import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const requiresSign = searchParams.get("requires_read_sign");

  let docs = db.documents.findAll();
  if (category) docs = docs.filter((d) => d.category === category);
  if (requiresSign === "true") docs = docs.filter((d) => d.requires_read_sign);

  const receipts = db.documentReadReceipts.findAll();
  const expiringSoon = docs.filter((d) => {
    if (!d.expiry_date) return false;
    const days = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  });

  return NextResponse.json({
    data: docs,
    receipts,
    meta: {
      total: docs.length,
      requires_sign: docs.filter((d) => d.requires_read_sign).length,
      expiring_soon: expiringSoon.length,
      expired: docs.filter((d) => d.expiry_date && d.expiry_date < new Date().toISOString().slice(0, 10)).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, category } = body;

  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 });

  const doc = db.documents.create({
    title: title.trim(),
    category,
    description: body.description?.trim() ?? null,
    file_url: body.file_url ?? "#",
    file_name: body.file_name ?? `${title.trim().toLowerCase().replace(/\s+/g, "-")}.pdf`,
    file_size: body.file_size ?? 0,
    mime_type: body.mime_type ?? "application/pdf",
    version: 1,
    previous_version_id: null,
    requires_read_sign: body.requires_read_sign ?? false,
    linked_child_id: body.linked_child_id ?? null,
    linked_staff_id: body.linked_staff_id ?? null,
    linked_incident_id: body.linked_incident_id ?? null,
    expiry_date: body.expiry_date ?? null,
    tags: Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === "string"
        ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
    home_id: "home_oak",
    created_by: body.created_by ?? "staff_darren",
    updated_by: body.created_by ?? "staff_darren",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ data: doc }, { status: 201 });
}
