import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-guard'
import { PERMISSIONS } from '@/lib/permissions'

interface RecordChildVoiceRequest {
  childId: string
  childSaid: string
  adultResponse: string
  outcome: string
  source?: string
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.CREATE_TASKS)
  if (auth instanceof NextResponse) return auth

  const body: RecordChildVoiceRequest = await request.json()

  if (!body.childId || !body.childSaid || !body.adultResponse || !body.outcome) {
    return NextResponse.json(
      { error: 'childId, childSaid, adultResponse, and outcome are required.' },
      { status: 400 }
    )
  }

  // In-memory voice entry creation (production would use Supabase)
  const voiceEntryId = `voice_${Date.now()}`
  const taskId = body.outcome.toLowerCase().includes('action') ? `task_${Date.now()}` : null

  return NextResponse.json(
    {
      success: true,
      message: `Child voice entry recorded for ${body.childId}.`,
      voiceEntryId,
      childId: body.childId,
      followUpTaskId: taskId,
      voiceEntry: {
        id: voiceEntryId,
        child_id: body.childId,
        said: body.childSaid,
        adult_response: body.adultResponse,
        outcome: body.outcome,
        source: body.source || 'dictation',
        recorded_at: new Date().toISOString(),
      },
    },
    { status: 201 }
  )
}
