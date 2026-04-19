import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
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

    const handoverRecords = await prisma.handover.findMany({
      where: { createdBy: actor.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        incident: true,
        creator: true
      }
    })

    return jsonWithRequestIdHeader({ handoverRecords }, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to load handover records' }, requestId, 500)
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
    const { note, incidentId } = body

    if (!note || typeof note !== 'string') {
      return validationError('Handover note is required', requestId)
    }

    const handover = await prisma.handover.create({
      data: {
        note,
        incidentId: incidentId || null,
        createdBy: actor.userId
      }
    })

    return jsonWithRequestIdHeader(handover, requestId, 201)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to save handover record' }, requestId, 500)
  }
}
