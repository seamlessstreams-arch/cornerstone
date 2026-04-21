import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/store'
import { requirePermission } from '@/lib/auth-guard'
import { PERMISSIONS } from '@/lib/permissions'

interface CreateFollowUpInterventionRequest {
  actionReviewId: string
  childId: string
  newInterventionTitle: string
  newInterventionOutcome: string
  owner: string
  dueInDays?: number
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.CREATE_TASKS)
  if (auth instanceof NextResponse) return auth

  const body: CreateFollowUpInterventionRequest = await request.json()

  if (!body.childId || !body.newInterventionTitle || !body.newInterventionOutcome || !body.owner) {
    return NextResponse.json(
      { error: 'childId, newInterventionTitle, newInterventionOutcome, and owner are required.' },
      { status: 400 }
    )
  }

  const dueInDays = body.dueInDays ?? 30
  const dueDate = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const intervention = db.intelligence.interventions.create({
    child_id: body.childId,
    title: body.newInterventionTitle,
    why_now: `Follow-up from action review ${body.actionReviewId}.`,
    intended_outcome: body.newInterventionOutcome,
    started_on: new Date().toISOString().slice(0, 10),
    review_date: dueDate,
    agreed_by: auth.userId,
    owner_id: body.owner,
    status: 'active',
    impact_summary: null,
    continue_decision: null,
    linked_record_ids: [body.actionReviewId],
  })

  const task = db.tasks.create({
    title: `Begin intervention: ${body.newInterventionTitle}`,
    description: `Follow-up created from action review ${body.actionReviewId}. Intended outcome: ${body.newInterventionOutcome}`,
    category: 'admin',
    priority: 'medium',
    status: 'not_started',
    assigned_to: body.owner,
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
    linked_child_id: body.childId,
    linked_incident_id: null,
    linked_document_id: null,
    parent_task_id: null,
    home_id: 'acacia-home',
    tags: ['intelligence', 'follow-up'],
    created_by: auth.userId,
    updated_by: auth.userId,
  })

  // Persist automation log
  db.intelligence.automationLogs.create({
    automation_type: 'review_task',
    source_id: body.actionReviewId,
    source_type: 'action_review',
    generated_entity_id: task.id,
    generated_entity_type: 'task',
    title: `Follow-up intervention created: "${body.newInterventionTitle}"`,
    initiated_by: auth.userId,
    metadata: {
      child_id: body.childId,
      decision_rationale: `Action review required follow-up. Intervention + task created.`,
      manual_review_needed: false,
    },
  })

  return NextResponse.json(
    {
      success: true,
      message: `Follow-up intervention created for child ${body.childId}.`,
      interventionId: intervention.id,
      taskId: task.id,
      actionReviewId: body.actionReviewId,
      intervention,
      task,
    },
    { status: 201 }
  )
}

