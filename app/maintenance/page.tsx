'use client'

import { useEffect, useState } from 'react'
import { ProtectedPageBanner } from '@/components/protected-page-banner'

type CheckRecord = {
  id: string
  title: string
  status: string
  dueDate: string
}

type ApiErrorResponse = {
  error?: string
  requestId?: string
}

export default function MaintenancePage() {
  const [tab, setTab] = useState<'overview' | 'create-check' | 'create-task'>('overview')
  const [checks, setChecks] = useState<CheckRecord[]>([])
  const [newCheckTitle, setNewCheckTitle] = useState('')
  const [newCheckDueDate, setNewCheckDueDate] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [authError, setAuthError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [messageRequestId, setMessageRequestId] = useState('')

  useEffect(() => {
    async function loadMaintenanceChecks() {
      try {
        setErrorMessage('')
        setMessageRequestId('')
        const response = await fetch('/api/maintenance')
        const data = (await response.json()) as { checks?: CheckRecord[] } & ApiErrorResponse

        if (!response.ok) {
          if (response.status === 401) {
            setAuthError(data.error || 'Authentication required. Please sign in.')
          }
          setErrorMessage(data.error || 'Unable to load maintenance checks.')
          setMessageRequestId(data.requestId || '')
          setChecks([])
          return
        }

        setChecks(data.checks || [])
      } catch {
        setErrorMessage('Unexpected error while loading maintenance checks. Please try again.')
        setMessageRequestId('')
        setChecks([])
      }
    }

    void loadMaintenanceChecks()
  }, [])

  const handleCreateCheck = async () => {
    setErrorMessage('')
    setMessageRequestId('')
    const response = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newCheckTitle,
        dueDate: newCheckDueDate,
        type: 'Building Safety'
      })
    })
    const data = (await response.json()) as { check?: CheckRecord } & ApiErrorResponse

    if (response.ok) {
      setChecks((current) => (data.check ? [data.check, ...current] : current))
      setStatusMessage('Created maintenance check successfully.')
      setNewCheckTitle('')
      setNewCheckDueDate('')
    } else {
      if (response.status === 401) {
        setAuthError(data.error || 'Authentication required. Please sign in.')
      }
      setStatusMessage('')
      setErrorMessage(data.error || 'Failed to create maintenance check.')
      setMessageRequestId(data.requestId || '')
    }
  }

  const handleCreateTask = async () => {
    setErrorMessage('')
    setMessageRequestId('')
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTaskTitle,
        description: `Maintenance follow-up for ${newTaskTitle}`,
        assignedTo: newTaskAssignee || 'maintenance-manager',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        linkedRecords: { source: 'maintenance' }
      })
    })
    const data = (await response.json()) as { id?: string } & ApiErrorResponse

    if (response.ok) {
      setStatusMessage(`Maintenance task created: ${data.id}`)
      setNewTaskTitle('')
      setNewTaskAssignee('')
    } else {
      if (response.status === 401) {
        setAuthError(data.error || 'Authentication required. Please sign in.')
      }
      setStatusMessage('')
      setErrorMessage(data.error || 'Failed to create maintenance task.')
      setMessageRequestId(data.requestId || '')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Maintenance & Compliance</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setTab('overview')}
          className={`rounded px-4 py-2 ${tab === 'overview' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('create-check')}
          className={`rounded px-4 py-2 ${tab === 'create-check' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
        >
          Create Check Form
        </button>
        <button
          onClick={() => setTab('create-task')}
          className={`rounded px-4 py-2 ${tab === 'create-task' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
        >
          Create Task
        </button>
      </div>

      <ProtectedPageBanner
        authError={authError}
        error={errorMessage}
        status={statusMessage}
        requestId={messageRequestId}
        signInHref="/auth/sign-in?next=/maintenance"
      />

      {tab === 'overview' ? (
        <div className="space-y-4">
          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Open Maintenance Checks</h2>
            {checks.length ? (
              <ul className="space-y-2">
                {checks.map((check) => (
                  <li key={check.id} className="rounded border border-slate-200 p-3">
                    <div className="font-semibold">{check.title}</div>
                    <div className="text-sm text-slate-600">Status: {check.status}</div>
                    <div className="text-sm text-slate-600">Due: {new Date(check.dueDate).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600">No active checks yet. Create one from the form tab.</p>
            )}
          </section>

          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Asset Alerts</h2>
            <ul className="space-y-2 text-slate-700">
              <li>Vehicle MOT due in 12 days.</li>
              <li>Fire extinguisher servicing pending.</li>
              <li>Garden fencing inspection overdue.</li>
            </ul>
          </section>
        </div>
      ) : null}

      {tab === 'create-check' ? (
        <section className="space-y-4 rounded border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Create a Maintenance Check</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Check title</span>
              <input
                value={newCheckTitle}
                onChange={(e) => setNewCheckTitle(e.target.value)}
                className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
                placeholder="Fire safety inspection"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Due date</span>
              <input
                type="date"
                value={newCheckDueDate}
                onChange={(e) => setNewCheckDueDate(e.target.value)}
                className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <button onClick={handleCreateCheck} className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Create Check
          </button>
        </section>
      ) : null}

      {tab === 'create-task' ? (
        <section className="space-y-4 rounded border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Create Maintenance Task</h2>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Task title</span>
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Replace broken door lock"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Assign to</span>
            <input
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="maintenance-manager"
            />
          </label>
          <button onClick={handleCreateTask} className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Create Task
          </button>
        </section>
      ) : null}
    </div>
  )
}
