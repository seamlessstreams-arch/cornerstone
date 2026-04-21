import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client using the service role key.
 * ONLY use server-side (API routes, server actions). Never expose to the browser.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
