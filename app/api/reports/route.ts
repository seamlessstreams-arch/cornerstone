import { NextRequest } from 'next/server'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { getRequestId, jsonWithRequestId, jsonWithRequestIdHeader } from '@/lib/http/request-id'
import { exportReport, generateReport, listReportsDashboard } from '@/lib/phase3/reports'

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

    const dashboard = await listReportsDashboard(actor)
    return jsonWithRequestIdHeader(dashboard, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to load reports dashboard.' }, requestId, 500)
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
    const action = typeof body.action === 'string' ? body.action : 'generate'

    if (action === 'generate') {
      const templateId = typeof body.templateId === 'string' ? body.templateId : ''
      const title = typeof body.title === 'string' ? body.title : ''
      const startDate = typeof body.startDate === 'string' ? body.startDate : ''
      const endDate = typeof body.endDate === 'string' ? body.endDate : ''
      const includeAiSummary = Boolean(body.includeAiSummary)
      const filters = body.filters && typeof body.filters === 'object' ? body.filters : {}

      if (!templateId || !title || !startDate || !endDate) {
        return validationError('Template, title, start date, and end date are required.', requestId)
      }

      const generated = await generateReport(
        {
          templateId,
          title,
          startDate,
          endDate,
          filters,
          includeAiSummary
        },
        actor
      )

      return jsonWithRequestIdHeader(generated, requestId, 201)
    }

    if (action === 'export') {
      const reportId = typeof body.reportId === 'string' ? body.reportId : ''
      const format = body.format === 'pdf' || body.format === 'print' ? body.format : null

      if (!reportId || !format) {
        return validationError('Report ID and export format are required.', requestId)
      }

      const exported = await exportReport(reportId, format, actor)
      return jsonWithRequestIdHeader(exported, requestId, 201)
    }

    return validationError('Unsupported action.', requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to process report request.' }, requestId, 500)
  }
}
