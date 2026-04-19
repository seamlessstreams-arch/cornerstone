import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function updateSupabaseSession(request: NextRequest) {
  const env = getSupabaseEnv()

  if (!env.isConfigured || !env.url || !env.anonKey) {
    return {
      user: null,
      response: NextResponse.next({
        request: { headers: request.headers }
      })
    }
  }

  const response = NextResponse.next({
    request: { headers: request.headers }
  })

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      }
    }
  })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  return { user, response }
}
