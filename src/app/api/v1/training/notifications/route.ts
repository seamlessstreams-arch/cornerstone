import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext, isMissingSupabaseTableError } from "@/lib/phase3/server-auth";

export async function GET(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "me";

    let query = supabase
      .from("training_notifications")
      .select("id, notification_type, title, message, metadata, sent_at, read_at, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(100);

    if (scope === "me") {
      query = query.eq("user_id", actorId);
    }

    const { data, error } = await query;
    if (error) {
      if (isMissingSupabaseTableError(error)) {
        return NextResponse.json({ notifications: [] });
      }
      throw error;
    }

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch training notifications", error);
    return NextResponse.json({ error: "Failed to fetch training notifications" }, { status: 500 });
  }
}
