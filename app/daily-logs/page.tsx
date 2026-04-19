'use client'

import { useCallback, useEffect, useState } from 'react'
import { ProtectedPageBanner } from '@/components/protected-page-banner'

type IncidentRecord = {
  id: string
  title: string
  description: string
  createdAt: string
  user: { name: string }
  home: { name: string }
}

type TaskRecord = {
  id: string
  title: string
  status: string
  dueDate: string | null
  assignedTo: string
  linkedRecords: unknown
}

type HandoverRecord = {
  id: string
  note: string
  createdAt: string
  incident?: {
    id: string
    title: string
  }
}

type ApiErrorResponse = {
  error?: string
  requestId?: string
}

export default function DailyLogsPage() {
  const [tab, setTab] = useState<'events' | 'handover' | 'task'>('events')
  const [handoverNote, setHandoverNote] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [incidents, setIncidents] = useState<IncidentRecord[]>([])
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [recentTasks, setRecentTasks] = useState<TaskRecord[]>([])
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>([])
  const [authError, setAuthError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [messageRequestId, setMessageRequestId] = useState('')

  const loadDailyLogs = useCallback(async () => {
    try {
      setErrorMessage('')
      setMessageRequestId('')
      const [dailyResponse, handoverResponse] = await Promise.all([
        fetch('/api/daily-logs'),
        fetch('/api/handover')
      ])

      const dailyData = (await dailyResponse.json()) as {
        incidents?: IncidentRecord[]
        handoverTasks?: TaskRecord[]
        recentTasks?: TaskRecord[]
      } & ApiErrorResponse
      const handoverData = (await handoverResponse.json()) as {
        handoverRecords?: HandoverRecord[]
      } & ApiErrorResponse

      if (!dailyResponse.ok) {
        if (dailyResponse.status === 401) {
          setAuthError(dailyData.error || 'Authentication required. Please sign in.')
        }
        setErrorMessage(dailyData.error || 'Failed to load daily logs.')
        setMessageRequestId(dailyData.requestId || '')
        setIncidents([])
        setRecentTasks([])
        setHandoverRecords([])
        return
      }

      if (!handoverResponse.ok) {
        if (handoverResponse.status === 401) {
          setAuthError(handoverData.error || 'Authentication required. Please sign in.')
        }
        setErrorMessage(handoverData.error || 'Failed to load handover records.')
        setMessageRequestId(handoverData.requestId || '')
      }

      setIncidents(dailyData.incidents || [])
      setSelectedIncidentId((current) => current || dailyData.incidents?.[0]?.id || null)
      setRecentTasks(dailyData.recentTasks || [])
      setHandoverRecords(handoverData.handoverRecords || [])
    } catch {
      setMessageRequestId('')
      setErrorMessage('Unexpected error while loading daily logs. Please try again.')
      setIncidents([])
      setRecentTasks([])
      setHandoverRecords([])
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadDailyLogs()
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [loadDailyLogs])

  const handleCreateTask = async () => {
    setErrorMessage('')
    setMessageRequestId('')
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskTitle,
        description: `Handover follow-up: ${taskTitle}`,
        assignedTo: taskAssignee || undefined,
        priority: 'MEDIUM',
        linkedRecords: { source: 'handover' }
      })
    })

    const data = (await response.json()) as { id?: string } & ApiErrorResponse

    if (response.ok) {
      setStatusMessage('Task created successfully.')
      setTaskTitle('')
      setTaskAssignee('')
      loadDailyLogs()
    } else {
      if (response.status === 401) {
        setAuthError(data.error || 'Authentication required. Please sign in.')
      }
      setErrorMessage(data.error || 'Failed to create task. Please try again.')
      setMessageRequestId(data.requestId || '')
    }
  }

  const handleSaveSummary = async () => {
    if (!handoverNote.trim()) {
      setStatusMessage('')
      setMessageRequestId('')
      setErrorMessage('Enter a handover summary before saving.')
      return
    }

    setErrorMessage('')
    setMessageRequestId('')

    const response = await fetch('/api/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: handoverNote, incidentId: selectedIncidentId })
    })

    const data = (await response.json()) as ApiErrorResponse

    if (response.ok) {
      setStatusMessage('Handover summary saved and persisted.')
      setHandoverNote('')
      loadDailyLogs()
    } else {
      if (response.status === 401) {
        setAuthError(data.error || 'Authentication required. Please sign in.')
      }
      setErrorMessage(data.error || 'Failed to save handover summary. Please try again.')
      setMessageRequestId(data.requestId || '')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Daily Logs + Handover</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setTab('events')}
          className={`rounded px-4 py-2 ${tab === 'events' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
        >
          Auto Events
        </button>
        <button
          onClick={() => setTab('handover')}
          className={`rounded px-4 py-2 ${tab === 'handover' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
        >
          Handover Note
        </button>
        <button
          onClick={() => setTab('task')}
          className={`rounded px-4 py-2 ${tab === 'task' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
        >
          Create Task
        </button>
      </div>

      <ProtectedPageBanner
        authError={authError}
        error={errorMessage}
        status={statusMessage}
        requestId={messageRequestId}
        signInHref="/auth/sign-in?next=/daily-logs"
      />

      {tab === 'events' ? (
        <div className="space-y-4">
          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Recent Incidents</h2>
            {incidents.length ? (
              <ul className="space-y-3">
                {incidents.map((incident) => (
                  <li key={incident.id} className="rounded border border-slate-200 p-4">
                    <div className="font-semibold">{incident.title}</div>
                    <div className="text-sm text-slate-600">{incident.description}</div>
                    <div className="mt-2 text-sm text-slate-500">
                      {new Date(incident.createdAt).toLocaleString()} • {incident.user?.name} • {incident.home?.name}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600">No recent incidents have been logged yet.</p>
            )}
          </section>

          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Recent Tasks</h2>
            {recentTasks.length ? (
              <ul className="space-y-3">
                {recentTasks.map((task) => (
                  <li key={task.id} className="rounded border border-slate-200 p-4">
                    <div className="font-semibold">{task.title}</div>
                    <div className="text-sm text-slate-600">Status: {task.status}</div>
                    <div className="text-sm text-slate-600">Assignee: {task.assignedTo}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600">No recent tasks are available.</p>
            )}
          </section>
        </div>
      ) : null}

      {tab === 'handover' ? (
        <div className="space-y-4 rounded border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Handover Summary</h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Link summary to incident</span>
              <select
                value={selectedIncidentId ?? ''}
                onChange={(e) => setSelectedIncidentId(e.target.value || null)}
                className="mt-2 w-full rounded border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">No specific incident</option>
                {incidents.map((incident) => (
                  <option key={incident.id} value={incident.id}>
                    {incident.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <textarea
            value={handoverNote}
            onChange={(e) => setHandoverNote(e.target.value)}
            rows={8}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
            placeholder="Enter key handover details for the next shift..."
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={handleSaveSummary} className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
              Save Summary
            </button>
            <span className="text-slate-500">Saved handover notes are persisted to the daily logs task queue.</span>
          </div>
          <p className="text-slate-600">Handover tasks are pulled from the latest handover actions logged in the system.</p>
          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold">Saved Handover Notes</h3>
            {handoverRecords.length ? (
              <ul className="mt-3 space-y-2 text-slate-700">
                {handoverRecords.map((handover) => (
                  <li key={handover.id} className="rounded border border-slate-200 bg-white p-3">
                    <div className="font-semibold">{new Date(handover.createdAt).toLocaleString()}</div>
                    <div className="text-sm text-slate-600">{handover.note}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-600">No saved handover notes are currently available.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'task' ? (
        <div className="space-y-4 rounded border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Create Follow-up Task</h2>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Task title</span>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Arrange medication review"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Assign to</span>
            <input
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Staff member or team"
            />
          </label>
          <button onClick={handleCreateTask} className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Create Task
          </button>
        </div>
      ) : null}
    </div>
  )
}
