import { NextRequest } from 'next/server'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { createIncident, listIncidents } from '@/lib/incidents/repository'
import { getRequestId, jsonWithRequestId, jsonWithRequestIdHeader } from '@/lib/http/request-id'

function validationError(message: string, requestId: string, status = 400) {
  return jsonWithRequestId({ error: message }, requestId, status)
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    const { actor, error } = await resolveAuthenticatedActor(request)

    if (!actor) {
      return validationError(error ?? 'Authentication required.', requestId, 401)
    }

    const incidents = await listIncidents(actor)

    return jsonWithRequestIdHeader(incidents, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to fetch incidents' }, requestId, 500)
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    const { actor, error } = await resolveAuthenticatedActor(request)

    if (!actor) {
      return validationError(error ?? 'Authentication required.', requestId, 401)
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const homeId = typeof body.homeId === 'string' && body.homeId.trim() ? body.homeId.trim() : actor.homeId
    const safeguardingConcern = Boolean(body.safeguardingConcern)

    if (!title) {
      return validationError('Title is required.', requestId)
    }

    if (!description) {
      return validationError('Description is required.', requestId)
    }

    const incident = await createIncident(
      {
        title,
        description,
        homeId,
        safeguardingConcern
      },
      actor
    )

    return jsonWithRequestIdHeader(incident, requestId, 201)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to create incident' }, requestId, 500)
  }
}