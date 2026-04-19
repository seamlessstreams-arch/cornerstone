import { prisma } from '@/lib/prisma'
import { AppRole } from '@/lib/auth/roles'
import { createSupabaseServiceRoleClient, isSupabaseServerConfigured } from '@/lib/supabase/server'

type IncidentSource = 'supabase' | 'prisma'

export interface IncidentActor {
  role: AppRole
  userId: string
  homeId?: string
}

export interface IncidentListItem {
  id: string
  title: string
  description: string
  homeId: string
  reportedBy: string
  safeguardingConcern: boolean
  createdAt: string
  updatedAt: string
  source: IncidentSource
}

export interface CreateIncidentInput {
  title: string
  description: string
  homeId: string
  safeguardingConcern?: boolean
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

function incidentTaskTitle(title: string) {
  return `Oversight for Incident: ${title}`
}

function incidentTaskDescription(incidentId: string) {
  return `Review and provide oversight for incident ${incidentId}`
}

function normalizePrismaIncident(incident: {
  id: string
  title: string
  description: string
  homeId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  safeguarding: { id: string } | null
}): IncidentListItem {
  return {
    id: incident.id,
    title: incident.title,
    description: incident.description,
    homeId: incident.homeId,
    reportedBy: incident.userId,
    safeguardingConcern: Boolean(incident.safeguarding),
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
    source: 'prisma'
  }
}

function normalizeSupabaseIncident(incident: Record<string, unknown>): IncidentListItem {
  return {
    id: String(incident.id),
    title: String(incident.title ?? ''),
    description: String(incident.description ?? ''),
    homeId: String(incident.home_id ?? ''),
    reportedBy: String(incident.reported_by ?? ''),
    safeguardingConcern: Boolean(incident.safeguarding_concern),
    createdAt: String(incident.created_at ?? new Date().toISOString()),
    updatedAt: String(incident.updated_at ?? new Date().toISOString()),
    source: 'supabase'
  }
}

async function ensureDefaultHome(homeId?: string) {
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

  const existingDefault = await prisma.home.findFirst({
    where: { name: 'Acacia Therapy Home' },
    orderBy: { createdAt: 'asc' }
  })

  if (existingDefault) return existingDefault.id

  const created = await prisma.home.create({
    data: {
      name: 'Acacia Therapy Home',
      address: 'Not yet configured'
    }
  })

  return created.id
}

async function ensureActorUser(actor: IncidentActor, homeId: string) {
  const syntheticEmail = `${actor.userId}@cornerstone.local`
  const prismaRole = toPrismaRole(actor.role)

  const user = await prisma.user.upsert({
    where: { email: syntheticEmail },
    update: {
      role: prismaRole,
      homeId
    },
    create: {
      email: syntheticEmail,
      name: actor.userId,
      role: prismaRole,
      homeId
    }
  })

  return user.id
}

async function ensureManagerUser(homeId: string) {
  const manager = await prisma.user.upsert({
    where: { email: 'system+manager@cornerstone.app' },
    update: {
      role: 'MANAGER',
      homeId
    },
    create: {
      email: 'system+manager@cornerstone.app',
      name: 'System Manager',
      role: 'MANAGER',
      homeId
    }
  })

  return manager.id
}

async function listFromPrisma(homeId?: string) {
  const incidents = await prisma.incident.findMany({
    where: homeId
      ? {
          homeId
        }
      : undefined,
    include: {
      safeguarding: {
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return incidents.map(normalizePrismaIncident)
}

async function listFromSupabase(homeId?: string) {
  const client = createSupabaseServiceRoleClient()
  const query = client
    .from('incidents')
    .select('id,title,description,home_id,reported_by,safeguarding_concern,created_at,updated_at')
    .order('created_at', { ascending: false })

  if (homeId) {
    query.eq('home_id', homeId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Supabase incidents read failed: ${error.message}`)
  }

  return (data ?? []).map((incident) => normalizeSupabaseIncident(incident))
}

async function createInPrisma(input: CreateIncidentInput, actor: IncidentActor) {
  const homeId = await ensureDefaultHome(input.homeId)
  const actorUserId = await ensureActorUser(actor, homeId)

  const incident = await prisma.incident.create({
    data: {
      title: input.title,
      description: input.description,
      userId: actorUserId,
      homeId
    },
    include: {
      safeguarding: {
        select: { id: true }
      }
    }
  })

  if (input.safeguardingConcern) {
    await prisma.safeguarding.create({
      data: {
        incidentId: incident.id,
        details: 'Safeguarding concern raised at incident creation.'
      }
    })
  }

  const managerId = await ensureManagerUser(homeId)

  await prisma.task.create({
    data: {
      title: incidentTaskTitle(input.title),
      description: incidentTaskDescription(incident.id),
      assignedTo: managerId,
      priority: 'HIGH',
      status: 'PENDING',
      linkedRecords: { incidentId: incident.id },
      incidentId: incident.id
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: 'INCIDENT_CREATED',
      recordId: incident.id,
      recordType: 'Incident'
    }
  })

  return normalizePrismaIncident(incident)
}

async function createInSupabase(input: CreateIncidentInput, actor: IncidentActor) {
  const client = createSupabaseServiceRoleClient()

  const { data: insertedIncident, error: incidentError } = await client
    .from('incidents')
    .insert({
      title: input.title,
      description: input.description,
      home_id: input.homeId,
      reported_by: actor.userId,
      safeguarding_concern: Boolean(input.safeguardingConcern)
    })
    .select('id,title,description,home_id,reported_by,safeguarding_concern,created_at,updated_at')
    .single()

  if (incidentError || !insertedIncident) {
    throw new Error(`Supabase incident create failed: ${incidentError?.message ?? 'Unknown error'}`)
  }

  await client.from('tasks').insert({
    title: incidentTaskTitle(input.title),
    description: incidentTaskDescription(String(insertedIncident.id)),
    priority: 'HIGH',
    status: 'PENDING',
    linked_records: { incidentId: insertedIncident.id },
    incident_id: insertedIncident.id,
    assigned_to: actor.userId,
    created_by: actor.userId,
    home_id: input.homeId
  })

  await client.from('audit_logs').insert({
    action: 'INCIDENT_CREATED',
    entity_type: 'incident',
    entity_id: insertedIncident.id,
    actor_id: actor.userId,
    actor_role: actor.role,
    metadata: {
      homeId: input.homeId,
      safeguardingConcern: Boolean(input.safeguardingConcern)
    }
  })

  return normalizeSupabaseIncident(insertedIncident)
}

export async function listIncidents(actor?: IncidentActor) {
  if (isSupabaseServerConfigured()) {
    try {
      return await listFromSupabase(actor?.homeId)
    } catch (error) {
      console.error('Falling back to Prisma incidents list:', error)
    }
  }

  return listFromPrisma(actor?.homeId)
}

export async function createIncident(input: CreateIncidentInput, actor: IncidentActor) {
  if (isSupabaseServerConfigured()) {
    try {
      return await createInSupabase(input, actor)
    } catch (error) {
      console.error('Falling back to Prisma incidents create:', error)
    }
  }

  return createInPrisma(input, actor)
}
