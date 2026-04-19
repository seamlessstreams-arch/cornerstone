'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { assertSupabaseBrowserEnv } from '@/lib/supabase/env'

let browserClient: SupabaseClient<Database> | null = null

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient
  }

  const env = assertSupabaseBrowserEnv()

  browserClient = createBrowserClient<Database>(env.url, env.anonKey)
  return browserClient
}
