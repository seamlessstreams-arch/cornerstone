import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/store'
import { requirePermission } from '@/lib/auth-guard'
import { PERMISSIONS } from '@/lib/permissions'

interface AutomatePatternAlertRequest {
  alertTitle: string
  alertDescription: string
  alertConfidence: 'low' | 'medium' | 'high'
  dueInDays?: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.CREATE_TASKS)
  if (auth instanceof NextResponse) return auth

  const { alertId } = await params
  const body: AutomatePatternAlertRequest = await request.json()

  if (!body.alertTitle) {
    return NextResponse.json({ error: 'Alert title is required.' }, { status: 400 })
  }

  const dueInDays = body.dueInDays ?? (body.alertConfidence === 'high' ? 2 : body.alertConfidence === 'medium' ? 7 : 14)
  const dueDate = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const task = db.tasks.create({
    title: `Review: ${body.alertTitle}`,
    description: `Auto-generated from pattern alert ${alertId}. ${body.alertDescription ?? ''}`.trim(),
    category: 'admin',
    priority: body.alertConfidence === 'high' ? 'high' : body.alertConfidence === 'medium' ? 'medium' : 'low',
    status: 'not_started',
    assigned_to: auth.userId,
    assigned_role: null,
    due_date: dueDate,
    start_date: null,
    completed_at: null,
    completed_by: null,
    estimated_minutes: null,
    actual_minutes: null,
    recurring: false,
    recurring_schedule: null,
    requires_sign_off: false,
    signed_off_by: null,
    signed_off_at: null,
    evidence_note: null,
    evidence_files: [],
    escalated: false,
    escalated_to: null,
    escalated_at: null,
    escalation_reason: null,
    linked_child_id: null,
    linked_incident_id: null,
    linked_document_id: null,
    parent_task_id: null,
    home_id: 'acacia-home',
    tags: ['intelligence', 'pattern-alert'],
    created_by: auth.userId,
    updated_by: auth.userId,
  })

  // Persist automation log
  db.intelligence.automationLogs.create({
    automation_type: 'pattern_task',
    source_id: alertId,
    source_type: 'pattern_alert',
    generated_entity_id: task.id,
    generated_entity_type: 'task',
    title: `Auto-created review task for "${body.alertTitle}" (${body.alertConfidence} confidence)`,
    initiated_by: auth.userId,
    metadata: {
      confidence: body.alertConfidence,
      decision_rationale: `${body.alertConfidence}-confidence pattern triggered automated task creation.`,
    },
  })

  return NextResponse.json(
    {
      success: true,
      message: `Pattern alert "${body.alertTitle}" converted to task.`,
      taskId: task.id,
      alertId,
      task,
    },
    { status: 201 }
  )
}

