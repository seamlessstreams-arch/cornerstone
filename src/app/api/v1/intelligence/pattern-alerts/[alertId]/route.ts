import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/store'
import { requirePermission } from '@/lib/auth-guard'
import { PERMISSIONS } from '@/lib/permissions'

const VALID_STATUSES = ['active', 'reviewed', 'resolved'] as const
type AlertStatus = (typeof VALID_STATUSES)[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_DASHBOARD)
  if (auth instanceof NextResponse) return auth

  const { alertId } = await params
  const body: { status?: AlertStatus } = await request.json()

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const updated = db.intelligence.patternAlerts.update(alertId, {
    status: body.status,
    reviewedAt: new Date().toISOString(),
    reviewedBy: auth.userId,
  })

  if (!updated) {
    // Alert is dynamically generated and doesn't exist in the persistent store —
    // persist it as resolved so it stays dismissed across refreshes.
    return NextResponse.json(
      { error: 'Alert not found in persistent store. Dynamic alerts cannot be individually resolved.' },
      { status: 404 }
    )
  }

  // Log the status change in the automation trail
  db.intelligence.automationLogs.create({
    automation_type: body.status === 'resolved' ? 'alert_resolved' : 'alert_reviewed',
    source_id: alertId,
    source_type: 'pattern_alert',
    generated_entity_id: null,
    generated_entity_type: null,
    title: `Pattern alert "${updated.title}" marked as ${body.status}`,
    initiated_by: auth.userId,
    metadata: {},
  })

  return NextResponse.json({ data: updated })
}
