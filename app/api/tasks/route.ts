import { NextRequest } from 'next/server'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { createTask, listTasks } from '@/lib/tasks/repository'
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

    const tasks = await listTasks(actor)

    return jsonWithRequestIdHeader(tasks, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to fetch tasks' }, requestId, 500)
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

    if (!title) {
      return validationError('Title is required.', requestId)
    }

    if (!description) {
      return validationError('Description is required.', requestId)
    }

    const priority = typeof body.priority === 'string' ? body.priority.toUpperCase() : 'MEDIUM'
    const dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null
    const assignedTo = typeof body.assignedTo === 'string' ? body.assignedTo : undefined
    const incidentId = typeof body.incidentId === 'string' ? body.incidentId : null
    const homeId = typeof body.homeId === 'string' && body.homeId.trim() ? body.homeId : actor.homeId
    const linkedRecords =
      body.linkedRecords && typeof body.linkedRecords === 'object'
        ? (body.linkedRecords as Record<string, unknown>)
        : { source: 'manual' }

    const task = await createTask(
      {
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        linkedRecords,
        incidentId,
        homeId
      },
      actor
    )

    return jsonWithRequestIdHeader(task, requestId, 201)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to create task' }, requestId, 500)
  }
}
