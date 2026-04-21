import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveCornerstoneRole } from "@/lib/auth/roles";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      role: resolveCornerstoneRole(user),
      metadata: user.user_metadata,
    },
  });
}
