import { NextRequest } from 'next/server'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { getRequestId, jsonWithRequestId, jsonWithRequestIdHeader } from '@/lib/http/request-id'
import { addEvidence, createCandidate, listRecruitmentDashboard, verifyEvidence } from '@/lib/phase3/recruitment'

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

    const dashboard = await listRecruitmentDashboard(actor)
    return jsonWithRequestIdHeader(dashboard, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to load recruitment dashboard.' }, requestId, 500)
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
    const action = typeof body.action === 'string' ? body.action : 'create-candidate'

    if (action === 'create-candidate') {
      const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
      const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
      const email = typeof body.email === 'string' ? body.email.trim() : ''
      const roleApplied = typeof body.roleApplied === 'string' ? body.roleApplied.trim() : ''

      if (!firstName || !lastName || !email || !roleApplied) {
        return validationError('First name, last name, email, and role applied are required.', requestId)
      }

      const created = await createCandidate({ firstName, lastName, email, roleApplied }, actor)
      return jsonWithRequestIdHeader(created, requestId, 201)
    }

    if (action === 'add-evidence') {
      const applicationId = typeof body.applicationId === 'string' ? body.applicationId : ''
      const documentType = typeof body.documentType === 'string' ? body.documentType : ''
      const fileName = typeof body.fileName === 'string' ? body.fileName : ''
      const path = typeof body.path === 'string' ? body.path : ''

      if (!applicationId || !documentType || !fileName || !path) {
        return validationError('Application ID, document type, file name, and file path are required.', requestId)
      }

      const checklist = Array.isArray(body.checklist)
        ? body.checklist.filter(
            (item: unknown): item is { key: string; passed: boolean } =>
              typeof item === 'object' &&
              item !== null &&
              'key' in item &&
              typeof item.key === 'string' &&
              'passed' in item &&
              typeof item.passed === 'boolean'
          )
        : []

      const notes = typeof body.notes === 'string' ? body.notes : undefined

      const created = await addEvidence({ applicationId, documentType, fileName, path, checklist, notes }, actor)
      return jsonWithRequestIdHeader(created, requestId, 201)
    }

    if (action === 'verify-evidence') {
      const documentId = typeof body.documentId === 'string' ? body.documentId : ''
      const outcome = body.outcome === 'verified' || body.outcome === 'rejected' || body.outcome === 'needs_review' ? body.outcome : null
      const method = body.method === 'manual' || body.method === 'cross-check' || body.method === 'third-party' ? body.method : null
      const notes = typeof body.notes === 'string' ? body.notes : undefined

      if (!documentId || !outcome || !method) {
        return validationError('Document ID, outcome, and method are required.', requestId)
      }

      const updated = await verifyEvidence({ documentId, outcome, method, notes }, actor)
      return jsonWithRequestIdHeader(updated, requestId)
    }

    return validationError('Unsupported action.', requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to process recruitment request.' }, requestId, 500)
  }
}
