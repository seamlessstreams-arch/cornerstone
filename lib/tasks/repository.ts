import { prisma } from '@/lib/prisma'
import { AppRole } from '@/lib/auth/roles'
import { createSupabaseServiceRoleClient, isSupabaseServerConfigured } from '@/lib/supabase/server'

type TaskSource = 'supabase' | 'prisma'

export interface TaskActor {
  role: AppRole
  userId: string
  homeId?: string
}

export interface TaskListItem {
  id: string
  title: string
  description: string
  priority: string
  status: string
  assignedTo: string
  dueDate: string | null
  createdAt: string
  source: TaskSource
}

export interface CreateTaskInput {
  title: string
  description: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string | null
  assignedTo?: string
  linkedRecords?: Record<string, unknown>
  incidentId?: string | null
  homeId?: string
}

function toPrismaRole(role: AppRole): 'ADMIN' | 'MANAGER' | 'STAFF' {
  if (role === 'ADMINISTRATOR' || role === 'RESPONSIBLE_INDIVIDUAL' || role === 'DIRECTOR') {
    return 'ADMIN'
  }

  if (
    role === 'REGISTERED_MANAGER' ||
    role === 'DEPUTY_MANAGER' ||
    role === 'TEAM_LEADER' ||
    role === 'TRAINING_COMPLIANCE_LEAD' ||
    role === 'HR_RECRUITMENT_LEAD' ||
    role === 'SAFER_RECRUITMENT_OFFICER'
  ) {
    return 'MANAGER'
  }

  return 'STAFF'
}

function normalizePrismaTask(task: {
  id: string
  title: string
  description: string
  priority: string
  status: string
  assignedTo: string
  dueDate: Date | null
  createdAt: Date
}): TaskListItem {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    assignedTo: task.assignedTo,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    source: 'prisma'
  }
}

function normalizeSupabaseTask(task: Record<string, unknown>): TaskListItem {
  return {
    id: String(task.id),
    title: String(task.title ?? ''),
    description: String(task.description ?? ''),
    priority: String(task.priority ?? 'MEDIUM'),
    status: String(task.status ?? 'PENDING'),
    assignedTo: String(task.assigned_to ?? ''),
    dueDate: task.due_date ? String(task.due_date) : null,
    createdAt: String(task.created_at ?? new Date().toISOString()),
    source: 'supabase'
  }
}

async function ensureHome(homeId?: string) {
  if (homeId) {
    const existing = await prisma.home.findUnique({ where: { id: homeId } })
    if (existing) return existing.id

    const created = await prisma.home.create({
      data: {
        id: homeId,
        name: 'Acacia Therapy Home',
        address: 'Not yet configured'
      }
    })

    return created.id
  }

  const existing = await prisma.home.findFirst({
    where: { name: 'Acacia Therapy Home' },
    orderBy: { createdAt: 'asc' }
  })

  if (existing) return existing.id

  const created = await prisma.home.create({
    data: {
      name: 'Acacia Therapy Home',
      address: 'Not yet configured'
    }
  })

  return created.id
}

async function ensureUserByHandle(handle: string, role: AppRole, homeId: string) {
  const email = `${handle}@cornerstone.local`
  const prismaRole = toPrismaRole(role)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: prismaRole,
      homeId
    },
    create: {
      email,
      name: handle,
      role: prismaRole,
      homeId
    }
  })

  return user.id
}

async function listFromPrisma(homeId?: string) {
  const tasks = await prisma.task.findMany({
    where: homeId
      ? {
          OR: [{ assignedUser: { homeId } }, { incident: { homeId } }]
        }
      : undefined,
    orderBy: { createdAt: 'desc' }
  })

  return tasks.map(normalizePrismaTask)
}

async function listFromSupabase(homeId?: string) {
  const client = createSupabaseServiceRoleClient()
  const query = client
    .from('tasks')
    .select('id,title,description,priority,status,assigned_to,due_date,created_at')
    .order('created_at', { ascending: false })

  if (homeId) {
    query.eq('home_id', homeId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Supabase tasks read failed: ${error.message}`)
  }

  return (data ?? []).map((task) => normalizeSupabaseTask(task))
}

async function createInPrisma(input: CreateTaskInput, actor: TaskActor) {
  const homeId = await ensureHome(input.homeId)
  const assignedHandle = input.assignedTo?.trim() || actor.userId

  const assignedTo = await ensureUserByHandle(assignedHandle, 'RESIDENTIAL_SUPPORT_WORKER', homeId)
  const actorUserId = await ensureUserByHandle(actor.userId, actor.role, homeId)

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      assignedTo,
      priority: input.priority ?? 'MEDIUM',
      status: 'PENDING',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      linkedRecords: (input.linkedRecords ?? { source: 'manual' }) as Record<string, string>,
      incidentId: input.incidentId ?? null
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'TASK_CREATED',
      recordId: task.id,
      recordType: 'Task'
    }
  })

  return normalizePrismaTask(task)
}

async function createInSupabase(input: CreateTaskInput, actor: TaskActor) {
  const client = createSupabaseServiceRoleClient()
  const homeId = input.homeId ?? 'acacia-home'
  const assignedTo = input.assignedTo?.trim() || actor.userId

  const { data: task, error: taskError } = await client
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description,
      priority: input.priority ?? 'MEDIUM',
      status: 'PENDING',
      due_date: input.dueDate ?? null,
      linked_records: input.linkedRecords ?? { source: 'manual' },
      incident_id: input.incidentId ?? null,
      assigned_to: assignedTo,
      created_by: actor.userId,
      home_id: homeId
    })
    .select('id,title,description,priority,status,assigned_to,due_date,created_at')
    .single()

  if (taskError || !task) {
    throw new Error(`Supabase task create failed: ${taskError?.message ?? 'Unknown error'}`)
  }

  await client.from('audit_logs').insert({
    action: 'TASK_CREATED',
    entity_type: 'task',
    entity_id: task.id,
    actor_id: actor.userId,
    actor_role: actor.role,
    metadata: {
      assignedTo,
      priority: input.priority ?? 'MEDIUM',
      homeId
    }
  })

  return normalizeSupabaseTask(task)
}

export async function listTasks(actor?: TaskActor) {
  if (isSupabaseServerConfigured()) {
    try {
      return await listFromSupabase(actor?.homeId)
    } catch (error) {
      console.error('Falling back to Prisma tasks list:', error)
    }
  }

  return listFromPrisma(actor?.homeId)
}

export async function createTask(input: CreateTaskInput, actor: TaskActor) {
  if (isSupabaseServerConfigured()) {
    try {
      return await createInSupabase(input, actor)
    } catch (error) {
      console.error('Falling back to Prisma task create:', error)
    }
  }

  return createInPrisma(input, actor)
}
