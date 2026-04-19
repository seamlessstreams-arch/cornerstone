export function isPlaceholder(value: string) {
  return value.includes('your-project-id') || value.includes('your_supabase')
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const isConfigured = Boolean(url && anonKey) && !isPlaceholder(url ?? '') && !isPlaceholder(anonKey ?? '')

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured,
    isServiceRoleConfigured: isConfigured && Boolean(serviceRoleKey) && !isPlaceholder(serviceRoleKey ?? '')
  }
}

export function assertSupabaseBrowserEnv(): { url: string; anonKey: string; serviceRoleKey?: string } {
  const env = getSupabaseEnv()

  if (!env.isConfigured || !env.url || !env.anonKey) {
    throw new Error('Supabase browser client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return {
    url: env.url!,
    anonKey: env.anonKey!,
    serviceRoleKey: env.serviceRoleKey
  }
}

export function assertSupabaseServiceEnv(): { url: string; anonKey: string; serviceRoleKey: string } {
  const env = getSupabaseEnv()

  if (!env.isServiceRoleConfigured || !env.url || !env.serviceRoleKey) {
    throw new Error('Supabase service-role client is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.')
  }

  return {
    url: env.url!,
    anonKey: env.anonKey!,
    serviceRoleKey: env.serviceRoleKey!
  }
}
