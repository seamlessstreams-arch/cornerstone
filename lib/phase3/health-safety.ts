import { ensurePlatformContext, Phase3Actor, writeAuditLog } from '@/lib/phase3/platform-context'

export interface HealthSafetyRecord {
  id: string
  templateName: string
  status: string
  severity: string
  hasDefect: boolean
  dueAt: string | null
  createdAt: string
  summary: string
  photos: number
  voiceTranscript: boolean
}

export interface HealthSafetyDashboard {
  totalOpen: number
  overdue: number
  highSeverity: number
  linkedMaintenanceTasks: number
  records: HealthSafetyRecord[]
}

export interface CreateHealthSafetyInput {
  templateName: string
  summary: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  dueAt?: string
  hasDefect: boolean
  photos?: string[]
  voiceTranscript?: string
}

// Store mock records in memory for demo
const mockRecords: HealthSafetyRecord[] = []

export async function listHealthSafetyDashboard(actor: Phase3Actor): Promise<HealthSafetyDashboard> {
  await ensurePlatformContext(actor)
  
  // Count records by status/severity for demo
  const totalOpen = mockRecords.filter(r => r.status === 'open' || r.status === 'awaiting_action').length
  const overdue = mockRecords.filter(r => r.dueAt && new Date(r.dueAt) < new Date()).length
  const highSeverity = mockRecords.filter(r => r.severity === 'high' || r.severity === 'critical').length
  const linkedMaintenanceTasks = mockRecords.filter(r => r.hasDefect).length
  
  return {
    totalOpen,
    overdue,
    highSeverity,
    linkedMaintenanceTasks,
    records: mockRecords
  }
}
export async function createHealthSafetyRecord(input: CreateHealthSafetyInput, actor: Phase3Actor) {
  const context = await ensurePlatformContext(actor)
  
  const recordId = `hs_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const now = new Date().toISOString()
  
  const newRecord: HealthSafetyRecord = {
    id: recordId,
    templateName: input.templateName,
    status: input.hasDefect ? 'awaiting_action' : 'completed',
    severity: input.severity,
    hasDefect: input.hasDefect,
    dueAt: input.dueAt ?? null,
    createdAt: now,
    summary: input.summary,
    photos: input.photos?.length ?? 0,
    voiceTranscript: Boolean(input.voiceTranscript)
  }
  
  mockRecords.push(newRecord)
  
  await writeAuditLog({
    organisationId: context.organisationId,
    homeId: context.homeId,
    platformUserId: context.platformUserId,
    action: 'HEALTH_SAFETY_RECORD_CREATED',
    entityType: 'form_record',
    entityId: recordId,
    payload: {
      templateName: input.templateName,
      severity: input.severity
    }
  })
  
  return {
    id: recordId,
    createdAt: now,
    maintenanceTaskId: input.hasDefect ? `maint_${recordId}` : null
  }
}
