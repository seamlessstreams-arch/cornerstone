import { cookies } from 'next/headers'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/lib/supabase/database.types'
import { assertSupabaseBrowserEnv, assertSupabaseServiceEnv, getSupabaseEnv } from '@/lib/supabase/env'

export function isSupabaseServerConfigured() {
  return getSupabaseEnv().isConfigured
}

export async function createSupabaseServerComponentClient() {
  const env = assertSupabaseBrowserEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      }
    }
  })
}

export function createSupabaseRouteClient(getAllCookies: () => { name: string; value: string }[]) {
  const env = assertSupabaseBrowserEnv()

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: getAllCookies,
      setAll() {
        // Route handlers rely on middleware/client refresh for cookie persistence.
      }
    }
  })
}

export function createSupabaseServiceRoleClient(): SupabaseClient {
  const env = assertSupabaseServiceEnv()

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}
