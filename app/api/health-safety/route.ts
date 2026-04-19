import { NextRequest } from 'next/server'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { getRequestId, jsonWithRequestId, jsonWithRequestIdHeader } from '@/lib/http/request-id'
import { createHealthSafetyRecord, listHealthSafetyDashboard } from '@/lib/phase3/health-safety'

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

    const dashboard = await listHealthSafetyDashboard(actor)

    return jsonWithRequestIdHeader(dashboard, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to load health and safety dashboard.' }, requestId, 500)
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

    const templateName = typeof body.templateName === 'string' ? body.templateName.trim() : ''
    const summary = typeof body.summary === 'string' ? body.summary.trim() : ''

    if (!templateName) {
      return validationError('Template name is required.', requestId)
    }

    if (!summary) {
      return validationError('Summary is required.', requestId)
    }

    const severity =
      body.severity === 'critical' || body.severity === 'high' || body.severity === 'medium' || body.severity === 'low'
        ? body.severity
        : 'medium'

    const dueAt = typeof body.dueAt === 'string' && body.dueAt ? body.dueAt : undefined
    const hasDefect = Boolean(body.hasDefect)
    const photos = Array.isArray(body.photos)
      ? body.photos.filter((item: unknown): item is string => typeof item === 'string')
      : []
    const voiceTranscript = typeof body.voiceTranscript === 'string' ? body.voiceTranscript : undefined

    const created = await createHealthSafetyRecord(
      {
        templateName,
        summary,
        severity,
        dueAt,
        hasDefect,
        photos,
        voiceTranscript
      },
      actor
    )

    return jsonWithRequestIdHeader(created, requestId, 201)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to create health and safety record.' }, requestId, 500)
  }
}
