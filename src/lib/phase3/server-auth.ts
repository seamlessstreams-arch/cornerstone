import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserIdFromRequest } from "@/lib/auth-guard";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

interface Phase3ServerContext {
  supabase: SupabaseClient;
  actorId: string;
}

interface SupabaseErrorLike {
  code?: string | null;
}

export async function resolvePhase3ServerContext(request: Request): Promise<Phase3ServerContext> {
  const sessionClient = await createServerClient();

  try {
    const {
      data: { session },
    } = await sessionClient.auth.getSession();

    if (session?.user?.id) {
      return {
        supabase: sessionClient,
        actorId: session.user.id,
      };
    }
  } catch {
    // Fall back to demo-mode request auth below.
  }

  return {
    supabase: createServiceRoleClient(),
    actorId: getUserIdFromRequest(request),
  };
}

export function isMissingSupabaseTableError(error: SupabaseErrorLike | null | undefined): boolean {
  return error?.code === "PGRST205";
}