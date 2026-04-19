import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { getRequestId, jsonWithRequestId, jsonWithRequestIdHeader } from '@/lib/http/request-id'

const MAINTENANCE_USER_EMAIL = 'system+maintenance@cornerstone.app'

async function getDefaultMaintenanceUserId() {
  const user = await prisma.user.upsert({
    where: { email: MAINTENANCE_USER_EMAIL },
    update: {},
    create: {
      email: MAINTENANCE_USER_EMAIL,
      name: 'Maintenance System',
      role: 'MANAGER'
    }
  })
  return user.id
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    const { actor, error } = await resolveAuthenticatedActor(request)

    if (!actor) {
      return jsonWithRequestId({ error: error ?? 'Authentication required.' }, requestId, 401)
    }

    const tasks = await prisma.task.findMany({
      orderBy: { dueDate: 'asc' }
    })

    const checks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate?.toISOString() ?? new Date().toISOString(),
      assignedTo: task.assignedTo,
      linkedRecords: task.linkedRecords
    }))

    return jsonWithRequestIdHeader({ checks }, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to load maintenance items' }, requestId, 500)
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    const { actor, error } = await resolveAuthenticatedActor(request)

    if (!actor) {
      return jsonWithRequestId({ error: error ?? 'Authentication required.' }, requestId, 401)
    }

    const body = await request.json()
    const { title, dueDate, type } = body
    const assignedTo = await getDefaultMaintenanceUserId()

    const task = await prisma.task.create({
      data: {
        title,
        description: `${type} check scheduled for ${title}`,
        assignedTo,
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        linkedRecords: {
          source: 'maintenance',
          type,
          scheduledAt: new Date().toISOString()
        }
      }
    })

    return jsonWithRequestIdHeader({
      check: {
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate?.toISOString() ?? new Date().toISOString()
      }
    }, requestId, 201)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Unable to create maintenance check' }, requestId, 500)
  }
}
