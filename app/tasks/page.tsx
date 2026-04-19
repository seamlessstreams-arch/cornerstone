'use client'

import Image from 'next/image'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { ProtectedPageBanner } from '@/components/protected-page-banner'
import { AppRole } from '@/lib/auth/roles'

interface TaskRecord {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assignedTo: string
  dueDate: string | null
  createdAt: string
  source: 'supabase' | 'prisma'
}

interface SessionContext {
  role: AppRole
  userId: string
  homeId: string
  email: string | null
}

interface ApiErrorResponse {
  error?: string
  requestId?: string
}

export default function TasksPage() {
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null)
  const [authError, setAuthError] = useState('')
  const [homeId, setHomeId] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [messageRequestId, setMessageRequestId] = useState('')
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchActorContext = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { method: 'GET' })
      const data = (await response.json()) as SessionContext | ApiErrorResponse

      if (!response.ok) {
        setSessionContext(null)
        setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
        setAuthError('error' in data && data.error ? data.error : 'You are not signed in. Please authenticate with Supabase to access tasks.')
        return null
      }

      const context = data as SessionContext
      setSessionContext(context)
      setAuthError('')
      setMessageRequestId('')
      setHomeId((currentHomeId) => currentHomeId || context.homeId)
      return context
    } catch {
      setSessionContext(null)
      setMessageRequestId('')
      setAuthError('Authentication context is unavailable. Please sign in again.')
      return null
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setMessageRequestId('')

    try {
      const response = await fetch('/api/tasks', {
        method: 'GET'
      })

      const data = (await response.json()) as TaskRecord[] | ApiErrorResponse

      if (response.ok) {
        setTasks(data as TaskRecord[])
      } else {
        if (response.status === 401) {
          setSessionContext(null)
          setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
          setAuthError('error' in data && data.error ? data.error : 'Authentication required. Please sign in.')
        }
        setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
        setTasks([])
        setErrorMessage('error' in data && data.error ? data.error : 'Unable to load tasks.')
      }
    } catch {
      setTasks([])
      setErrorMessage('Unexpected error while loading tasks. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchActorContext()
    void fetchTasks()
  }, [fetchActorContext, fetchTasks])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage('Creating task...')
    setErrorMessage('')
    setMessageRequestId('')

    try {
      if (!sessionContext) {
        setStatusMessage('')
        setMessageRequestId('')
        setAuthError('Authentication required. Please sign in.')
        return
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          assignedTo: assignedTo || sessionContext.userId,
          homeId,
          dueDate: dueDate || null,
          linkedRecords: {
            source: 'task-page'
          }
        })
      })

      const data = (await response.json()) as TaskRecord | ApiErrorResponse
      if (response.ok) {
        setMessageRequestId('')
        setStatusMessage('Task created successfully and audit logged.')
        setTitle('')
        setDescription('')
        setPriority('MEDIUM')
        setAssignedTo('')
        setDueDate('')
        void fetchTasks()
      } else {
        if (response.status === 401) {
          setSessionContext(null)
          setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
          setAuthError('error' in data && data.error ? data.error : 'Authentication required. Please sign in.')
        }
        setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
        setStatusMessage('')
        setErrorMessage('error' in data && data.error ? data.error : 'Unable to create task.')
      }
    } catch {
      setStatusMessage('')
      setErrorMessage('Unexpected error while creating task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const actorSummary = sessionContext
    ? `${sessionContext.email ?? sessionContext.userId} (${sessionContext.role})`
    : 'No active session'

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-orange-100 p-6 shadow-sm">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-200/40 blur-2xl" />
        <div className="absolute -bottom-16 left-16 h-40 w-40 rounded-full bg-orange-200/40 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Task Delegation</h1>
            <p className="max-w-2xl text-sm text-slate-700">
              Delegate, track, and review operational tasks with role-aware permissions and auditable changes.
            </p>
          </div>
          <Image
            src="/branding/acacia-logo.png"
            alt="Acacia Therapy Homes logo"
            width={180}
            height={56}
            className="h-14 w-auto rounded bg-white/80 p-2 shadow"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Assign Task</h2>

          <div className="mb-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              Authenticated actor: <span className="font-medium">{actorSummary}</span>
            </p>
            <p>
              Home context: <span className="font-medium">{homeId || 'acacia-home'}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Home ID</label>
                <input
                  value={homeId}
                  onChange={(e) => setHomeId(e.target.value)}
                  type="text"
                  className="block w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign to</label>
                <input
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  type="text"
                  placeholder="Optional - defaults to authenticated user"
                  className="block w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="Task title"
                className="block w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task details"
                className="block w-full rounded border border-gray-300 px-3 py-2"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="block w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                type="date"
                className="block w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !sessionContext}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? 'Assigning...' : 'Assign'}
            </button>
          </form>
          <ProtectedPageBanner
            authError={authError}
            error={errorMessage}
            status={statusMessage}
            requestId={messageRequestId}
            signInHref="/auth/sign-in?next=/tasks"
          />
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Task List</h2>
            <button
              type="button"
              onClick={() => void fetchTasks()}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          {isLoading ? (
            <p>Loading tasks…</p>
          ) : (
            <ul className="space-y-3">
              {tasks.length === 0 ? (
                <li className="text-slate-500">No tasks found.</li>
              ) : (
                tasks.map((task) => (
                  <li key={task.id} className="rounded border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold uppercase">{task.priority}</span>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs uppercase">{task.source}</span>
                      </div>
                    </div>
                    <h3 className="mt-2 text-base font-semibold">{task.title}</h3>
                    <p className="mt-1 text-slate-700">{task.description}</p>
                    <p className="mt-2 text-sm text-slate-500">Status: {task.status}</p>
                    <p className="mt-1 text-sm text-slate-500">Assigned to: {task.assignedTo}</p>
                    {task.dueDate && (
                      <p className="mt-1 text-sm text-slate-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
