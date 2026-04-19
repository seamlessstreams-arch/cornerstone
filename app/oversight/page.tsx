'use client'

import { useCallback, useEffect, useState } from 'react'
import { ProtectedPageBanner } from '@/components/protected-page-banner'

type OversightRecord = {
  id: string
  draft: string
  approved: boolean
  approvedAt: string | null
  incident: {
    id: string
    title: string
  }
}

type TaskRecord = {
  id: string
  title: string
  status: string
  linkedRecords: unknown
}

type ApiErrorResponse = {
  error?: string
  requestId?: string
}

function hasLinkedSource(linkedRecords: unknown, source: string): boolean {
  if (typeof linkedRecords !== 'object' || linkedRecords === null) {
    return false
  }

  return (linkedRecords as Record<string, unknown>).source === source
}

export default function OversightPage() {
  const [draft, setDraft] = useState('')
  const [approved, setApproved] = useState(false)
  const [authError, setAuthError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [messageRequestId, setMessageRequestId] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [oversightRecords, setOversightRecords] = useState<OversightRecord[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [selectedOversightId, setSelectedOversightId] = useState<string | null>(null)

  const loadOversightRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/oversight')
      const data = (await response.json()) as { oversightRecords?: OversightRecord[] } | ApiErrorResponse

      if (!response.ok) {
        setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
        if (response.status === 401) {
          setAuthError('error' in data && data.error ? data.error : 'Authentication required. Please sign in.')
        } else {
          setErrorMessage('error' in data && data.error ? data.error : 'Unable to load oversight records.')
        }
        setOversightRecords([])
        return
      }

      setMessageRequestId('')
      const successData = data as { oversightRecords?: OversightRecord[] }
      setOversightRecords(successData.oversightRecords || [])
      setErrorMessage('')

      if (successData.oversightRecords?.length && !selectedOversightId) {
        const firstRecord = successData.oversightRecords[0]
        setSelectedOversightId(firstRecord.id)
        setDraft(firstRecord.draft || '')
        setApproved(firstRecord.approved || false)
      }
    } catch {
      setMessageRequestId('')
      setErrorMessage('Unexpected error while loading oversight records. Please try again.')
      setOversightRecords([])
    }
  }, [selectedOversightId])

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = (await response.json()) as TaskRecord[] | ApiErrorResponse

      if (!response.ok) {
        setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
        if (response.status === 401) {
          setAuthError('error' in data && data.error ? data.error : 'Authentication required. Please sign in.')
        } else {
          setErrorMessage('error' in data && data.error ? data.error : 'Unable to load tasks for oversight.')
        }
        setTasks([])
        return
      }

      setMessageRequestId('')
      const taskData = data as TaskRecord[]
      setTasks(taskData || [])
    } catch {
      setMessageRequestId('')
      setErrorMessage('Unexpected error while loading oversight tasks. Please try again.')
      setTasks([])
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadOversightRecords()
      void loadTasks()
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [loadOversightRecords, loadTasks])

  const selectedRecord = oversightRecords.find((record) => record.id === selectedOversightId)
  const oversightTasks = tasks.filter((task) => hasLinkedSource(task.linkedRecords, 'oversight'))

  const updateOverview = async (payload: { draft: string; approved: boolean }) => {
    if (!selectedRecord) {
      setStatusMessage('')
      setMessageRequestId('')
      setErrorMessage('Please select an oversight record before saving.')
      return
    }

    setErrorMessage('')
    setMessageRequestId('')
    setStatusMessage('Saving oversight update...')

    const response = await fetch('/api/oversight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedRecord.id,
        draft: payload.draft,
        approved: payload.approved
      })
    })

    if (response.ok) {
      const updated = await response.json()
      setMessageRequestId('')
      setDraft(updated.draft || '')
      setApproved(updated.approved || false)
      setStatusMessage('Oversight record updated successfully.')
      await loadOversightRecords()
    } else {
      const data = (await response.json()) as ApiErrorResponse
      if (response.status === 401) {
        setAuthError(data.error || 'Authentication required. Please sign in.')
      }
      setMessageRequestId(data.requestId || '')
      setStatusMessage('')
      setErrorMessage(data.error || 'Unable to save the oversight record.')
    }
  }

  const handleSaveDraft = () => {
    updateOverview({ draft, approved })
  }

  const handleApprove = () => {
    updateOverview({ draft, approved: true })
  }

  const handleCreateFollowUp = async () => {
    if (!followUp.trim()) {
      setStatusMessage('')
      setMessageRequestId('')
      setErrorMessage('Enter a follow-up task title before creating a task.')
      return
    }

    setErrorMessage('')
    setMessageRequestId('')
    setStatusMessage('Creating follow-up task...')

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: followUp,
        description: `Oversight follow-up: ${followUp}`,
        priority: 'HIGH',
        linkedRecords: { source: 'oversight' }
      })
    })

    if (response.ok) {
      setMessageRequestId('')
      setStatusMessage('Follow-up task created for oversight.')
      setFollowUp('')
      await loadTasks()
    } else {
      const data = (await response.json()) as ApiErrorResponse
      if (response.status === 401) {
        setAuthError(data.error || 'Authentication required. Please sign in.')
      }
      setMessageRequestId(data.requestId || '')
      setStatusMessage('')
      setErrorMessage(data.error || 'Unable to create follow-up task.')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Management Oversight</h1>

      <ProtectedPageBanner
        authError={authError}
        error={errorMessage}
        status={statusMessage}
        requestId={messageRequestId}
        signInHref="/auth/sign-in?next=/oversight"
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-3 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Oversight Records</h2>
          {oversightRecords.length ? (
            <ul className="space-y-2">
              {oversightRecords.map((record) => (
                <li key={record.id}>
                  <button
                    onClick={() => {
                      setSelectedOversightId(record.id)
                      setDraft(record.draft || '')
                      setApproved(record.approved)
                      setStatusMessage('')
                      setMessageRequestId('')
                      setErrorMessage('')
                    }}
                    className={`w-full text-left rounded border px-3 py-2 ${selectedOversightId === record.id ? 'border-slate-900 bg-slate-100' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="font-medium">{record.incident?.title || 'Untitled oversight'}</div>
                    <div className="text-xs text-slate-500">Approved: {record.approved ? 'Yes' : 'No'}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No oversight records are currently available.</p>
          )}
        </section>

        <section className="space-y-4 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Selected Oversight</h2>
          <p className="text-slate-600">
            {selectedRecord
              ? `Review the oversight draft for incident: ${selectedRecord.incident?.title || 'unknown incident'}`
              : 'Select an oversight record to begin.'}
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700">Oversight Draft</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
              placeholder="Summarise the oversight review, concerns and follow-up actions..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleSaveDraft} className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
              Save Draft
            </button>
            <button onClick={handleApprove} className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
              Approve
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Oversight Actions</h2>
          <p className="text-slate-600">Create follow-up tasks that are linked to oversight activity.</p>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Create follow-up task</span>
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Schedule a governance review"
            />
          </label>
          <button onClick={handleCreateFollowUp} className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Create Task
          </button>

          <div className="rounded border border-slate-200 bg-slate-50 p-4 text-slate-700">
            <div className="font-semibold">Status</div>
            <p>{approved ? 'Approved' : 'Draft'}</p>
          </div>
        </section>

        <section className="space-y-4 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Open Oversight Tasks</h2>
          {oversightTasks.length ? (
            <ul className="space-y-3">
              {oversightTasks.map((task) => (
                <li key={task.id} className="rounded border border-slate-200 bg-slate-50 p-3">
                  <div className="font-semibold">{task.title}</div>
                  <div className="text-sm text-slate-600">Status: {task.status}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No oversight-linked tasks are logged yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
