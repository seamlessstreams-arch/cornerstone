import { NextRequest } from 'next/server'
import { AppRole, normalizeAppRole, resolveHomeIdFromMetadata } from '@/lib/auth/roles'
import { createSupabaseRouteClient, createSupabaseServiceRoleClient, isSupabaseServerConfigured } from '@/lib/supabase/server'

export interface AuthenticatedActor {
  role: AppRole
  userId: string
  homeId: string
  email: string | null
}

export interface ActorResolution {
  actor: AuthenticatedActor | null
  error: string | null
}

function toAuthenticatedActor(user: {
  id: string
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}): AuthenticatedActor {
  const role = normalizeAppRole(
    user.app_metadata?.cornerstone_role ?? user.app_metadata?.role ?? user.user_metadata?.role
  )
  const homeId = resolveHomeIdFromMetadata(user.app_metadata, user.user_metadata)

  return {
    role,
    userId: user.id,
    homeId,
    email: user.email ?? null
  }
}

export async function resolveAuthenticatedActor(request: NextRequest): Promise<ActorResolution> {
  const authHeader = request.headers.get('authorization')

  if (!isSupabaseServerConfigured()) {
    return { actor: null, error: 'Server authentication is not configured.' }
  }

  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.slice(7).trim()

    if (!accessToken) {
      return { actor: null, error: 'Authentication token is missing.' }
    }

    const client = createSupabaseServiceRoleClient()
    const { data, error } = await client.auth.getUser(accessToken)

    if (error || !data.user) {
      return { actor: null, error: 'Authentication failed. Session is invalid or expired.' }
    }

    return {
      actor: toAuthenticatedActor(data.user),
      error: null
    }
  }

  const routeClient = createSupabaseRouteClient(() => request.cookies.getAll())

  const {
    data: { user },
    error
  } = await routeClient.auth.getUser()

  if (error || !user) {
    return { actor: null, error: 'Authentication required. Please sign in.' }
  }

  return {
    actor: toAuthenticatedActor(user),
    error: null
  }
}
