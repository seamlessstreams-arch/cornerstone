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

    const oversightRecords = await prisma.oversight.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        incident: true
      }
    })

    return jsonWithRequestId({ oversightRecords }, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to load oversight records' }, requestId, 500)
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
    const { id, draft, approved } = body

    if (!id) {
      return validationError('Oversight record id is required', requestId)
    }

    const oversight = await prisma.oversight.update({
      where: { id },
      data: {
        draft,
        approved: approved ?? false,
        approvedAt: approved ? new Date() : null,
        approvedBy: approved ? actor.userId : null
      }
    })

    return jsonWithRequestIdHeader(oversight, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to save oversight record' }, requestId, 500)
  }
}
