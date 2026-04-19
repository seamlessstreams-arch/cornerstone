import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { getRequestId, jsonWithRequestId, jsonWithRequestIdHeader } from '@/lib/http/request-id'

const DEFAULT_TASK_USER_EMAIL = 'system+task@cornerstone.app'

function hasLinkedSource(linkedRecords: Prisma.JsonValue, source: string): boolean {
  if (typeof linkedRecords !== 'object' || linkedRecords === null) {
    return false
  }

  return (linkedRecords as Record<string, Prisma.JsonValue>).source === source
}

async function getDefaultTaskUserId() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_TASK_USER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_TASK_USER_EMAIL,
      name: 'Task System',
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

    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        user: true,
        home: true
      }
    })

    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const handoverTasks = tasks.filter((task) => hasLinkedSource(task.linkedRecords, 'handover'))
    const recentTasks = tasks.slice(0, 6)

    return NextResponse.json({
      incidents,
      handoverTasks,
      recentTasks
    })
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to load daily logs' }, requestId, 500)
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
    const { note, title, assignedTo } = body
    const assignedUserId = assignedTo || (await getDefaultTaskUserId())

    const task = await prisma.task.create({
      data: {
        title: title || 'Shift handover summary',
        description: note || 'Saved handover summary',
        assignedTo: assignedUserId,
        priority: 'MEDIUM',
        status: 'PENDING',
        linkedRecords: { source: 'handover' }
      }
    })

    return jsonWithRequestIdHeader(task, requestId, 201)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to save handover summary' }, requestId, 500)
  }
}
