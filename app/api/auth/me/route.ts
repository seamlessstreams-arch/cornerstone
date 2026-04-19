import { NextRequest } from 'next/server'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { getRequestId, jsonWithRequestId, jsonWithRequestIdHeader } from '@/lib/http/request-id'

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  const { actor, error } = await resolveAuthenticatedActor(request)

  if (!actor) {
    return jsonWithRequestId({ error: error ?? 'Authentication required.' }, requestId, 401)
  }

  return jsonWithRequestIdHeader(actor, requestId)
}
