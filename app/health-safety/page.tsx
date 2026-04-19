'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { ProtectedPageBanner } from '@/components/protected-page-banner'
import { PageShell, ShellCard, ShellTable } from '@/components/shell/page-shell'

interface HealthSafetyRecord {
  id: string
  templateName: string
  status: string
  severity: string
  dueAt: string | null
  createdAt: string
  summary: string
  photos: number
  voiceTranscript: boolean
}

interface DashboardResponse {
  totalOpen: number
  overdue: number
  highSeverity: number
  linkedMaintenanceTasks: number
  records: HealthSafetyRecord[]
}

interface ApiError {
  error?: string
  requestId?: string
}

const DEFAULT_TEMPLATE = 'Property Walkthrough'

export default function HealthSafetyPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [requestId, setRequestId] = useState('')

  const [templateName, setTemplateName] = useState(DEFAULT_TEMPLATE)
  const [summary, setSummary] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [dueAt, setDueAt] = useState('')
  const [hasDefect, setHasDefect] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setAuthError('')

    try {
      const response = await fetch('/api/health-safety')
      const data = (await response.json()) as DashboardResponse | ApiError

      if (!response.ok) {
        setRequestId('requestId' in data && data.requestId ? data.requestId : '')
        const message = 'error' in data && data.error ? data.error : 'Unable to load health and safety dashboard.'
        if (response.status === 401) {
          setAuthError(message)
        } else {
          setErrorMessage(message)
        }
        setDashboard(null)
        return
      }

      setDashboard(data as DashboardResponse)
      setRequestId('')
    } catch {
      setErrorMessage('Unexpected error while loading health and safety records.')
      setDashboard(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  async function handleCreateRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('Creating record...')

    try {
      const response = await fetch('/api/health-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName,
          summary,
          severity,
          dueAt: dueAt || undefined,
          hasDefect,
          photos: [],
          voiceTranscript: voiceTranscript || undefined
        })
      })

      const data = (await response.json()) as { maintenanceTaskId?: string | null; requestId?: string; error?: string }

      if (!response.ok) {
        setRequestId(data.requestId ?? '')
        setStatusMessage('')
        if (response.status === 401) {
          setAuthError(data.error ?? 'Authentication required.')
          return
        }
        setErrorMessage(data.error ?? 'Unable to create health and safety record.')
        return
      }

      setStatusMessage(
        data.maintenanceTaskId
          ? `Record created and maintenance task ${data.maintenanceTaskId} triggered.`
          : 'Record created successfully.'
      )
      setSummary('')
      setDueAt('')
      setHasDefect(false)
      setVoiceTranscript('')
      await loadDashboard()
    } catch {
      setErrorMessage('Unexpected error while creating health and safety record.')
      setStatusMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Health & Safety"
      description="Operational checks, defect-triggered maintenance automations, ARIA dictation metadata, and due-date visibility."
    >
      <div className="grid gap-5 md:grid-cols-4">
        <ShellCard title="Open Records">{dashboard?.totalOpen ?? 0}</ShellCard>
        <ShellCard title="Overdue">{dashboard?.overdue ?? 0}</ShellCard>
        <ShellCard title="High Severity">{dashboard?.highSeverity ?? 0}</ShellCard>
        <ShellCard title="Linked Maintenance Tasks">{dashboard?.linkedMaintenanceTasks ?? 0}</ShellCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Create Health & Safety Record</h2>
          <p className="mt-1 text-sm text-slate-600">Raise a check and optionally trigger maintenance actions automatically.</p>

          <form className="mt-4 space-y-3" onSubmit={handleCreateRecord}>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Template</span>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
              >
                <option>Property Walkthrough</option>
                <option>Fire Safety Drill</option>
                <option>Medication Storage Audit</option>
                <option>Infection Control Check</option>
                <option>Vehicle Safety Checklist</option>
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Summary</span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Include defect details and immediate controls."
                required
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Severity</span>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as 'low' | 'medium' | 'high' | 'critical')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Due Date</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">ARIA / Dictation Notes</span>
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={voiceTranscript}
                onChange={(event) => setVoiceTranscript(event.target.value)}
                placeholder="Optional transcript metadata for compliance evidence."
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={hasDefect}
                onChange={(event) => setHasDefect(event.target.checked)}
                className="h-4 w-4"
              />
              Defect found (auto-create maintenance task)
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-400"
            >
              {isSubmitting ? 'Saving...' : 'Create Record'}
            </button>
          </form>

          <ProtectedPageBanner
            authError={authError}
            error={errorMessage}
            status={statusMessage}
            requestId={requestId}
            signInHref="/auth/sign-in?next=/health-safety"
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Checks</h2>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          {isLoading && <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">Loading records...</div>}
          {!isLoading && (
            <ShellTable
              headers={['Template', 'Summary', 'Severity', 'Status', 'Due', 'Created', 'Evidence']}
              rows={(dashboard?.records ?? []).map((record) => [
                record.templateName,
                record.summary || '-',
                record.severity,
                record.status,
                record.dueAt ? new Date(record.dueAt).toLocaleString() : '-',
                new Date(record.createdAt).toLocaleString(),
                `${record.photos} photos${record.voiceTranscript ? ', voice' : ''}`
              ])}
            />
          )}
        </section>
      </div>
    </PageShell>
  )
}
