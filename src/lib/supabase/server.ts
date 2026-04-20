// Server-side Supabase client
// Uses service role key for privileged operations
// Only import this in Server Components, API routes, and Server Actions

export async function createServerClient() {
  // When Supabase is enabled, replace with real client:
  // const { createClient } = await import("@supabase/supabase-js");
  // return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // For now, return null — data layer handles this
  return null;
}
