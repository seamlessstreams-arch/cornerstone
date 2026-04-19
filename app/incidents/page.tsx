'use client'

import Image from 'next/image'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { ProtectedPageBanner } from '@/components/protected-page-banner'
import { AppRole } from '@/lib/auth/roles'

interface IncidentRecord {
  id: string
  title: string
  description: string
  homeId: string
  reportedBy: string
  safeguardingConcern: boolean
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

export default function IncidentsPage() {
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null)
  const [authError, setAuthError] = useState('')
  const [homeId, setHomeId] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [safeguardingConcern, setSafeguardingConcern] = useState(false)

  const [incidents, setIncidents] = useState<IncidentRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [messageRequestId, setMessageRequestId] = useState('')

  const fetchActorContext = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { method: 'GET' })
      const data = (await response.json()) as SessionContext | ApiErrorResponse

      if (!response.ok) {
        setSessionContext(null)
        setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
        setAuthError('error' in data && data.error ? data.error : 'You are not signed in. Please authenticate with Supabase to access incidents.')
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

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setMessageRequestId('')

    try {
      const response = await fetch('/api/incidents', {
        method: 'GET'
      })

      const data = (await response.json()) as IncidentRecord[] | ApiErrorResponse

      if (!response.ok) {
        if (response.status === 401) {
          setSessionContext(null)
          setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
          setAuthError('error' in data && data.error ? data.error : 'Authentication required. Please sign in.')
        }
        setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
        const message = 'error' in data && data.error ? data.error : 'Unable to load incidents.'
        setErrorMessage(message)
        setIncidents([])
        return
      }

      setIncidents(data as IncidentRecord[])
    } catch {
      setErrorMessage('Unexpected error while loading incidents. Please try again.')
      setIncidents([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchActorContext()
    void fetchIncidents()
  }, [fetchActorContext, fetchIncidents])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setStatusMessage('Creating incident...')
    setErrorMessage('')
    setMessageRequestId('')

    try {
      if (!sessionContext) {
        setStatusMessage('')
        setMessageRequestId('')
        setAuthError('Authentication required. Please sign in.')
        return
      }

      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          homeId,
          safeguardingConcern
        })
      })

      const data = (await response.json()) as IncidentRecord | ApiErrorResponse

      if (!response.ok) {
        if (response.status === 401) {
          setSessionContext(null)
          setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
          setAuthError('error' in data && data.error ? data.error : 'Authentication required. Please sign in.')
        }
        setMessageRequestId('requestId' in data && data.requestId ? data.requestId : '')
        const message = 'error' in data && data.error ? data.error : 'Unable to create incident.'
        setErrorMessage(message)
        setStatusMessage('')
        return
      }

      setMessageRequestId('')
      setStatusMessage('Incident created and oversight task queued.')
      setTitle('')
      setDescription('')
      setSafeguardingConcern(false)
      await fetchIncidents()
    } catch {
      setErrorMessage('Unexpected error while creating incident. Please try again.')
      setStatusMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const actorSummary = sessionContext
    ? `${sessionContext.email ?? sessionContext.userId} (${sessionContext.role})`
    : 'No active session'

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6 shadow-sm">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-teal-200/40 blur-2xl" />
        <div className="absolute -bottom-16 left-16 h-40 w-40 rounded-full bg-emerald-200/40 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Incidents and Safeguarding</h1>
            <p className="max-w-2xl text-sm text-slate-700">
              Capture incidents in real time with role-aware access control, audit trails, and reliable Supabase-backed storage.
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create Incident</h2>
          <p className="mt-1 text-sm text-slate-600">Sensitive actions are logged to audit records automatically.</p>

          <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              Authenticated actor: <span className="font-medium">{actorSummary}</span>
            </p>
            <p>
              Home context: <span className="font-medium">{homeId || 'acacia-home'}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="space-y-1 text-sm font-medium text-slate-700">
              Home ID
              <input
                value={homeId}
                onChange={(event) => setHomeId(event.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="acacia-home"
                required
              />
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700">
              Incident title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Missing medication handover"
                required
              />
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="block min-h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Capture context, immediate action, and safeguarding details..."
                required
              />
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={safeguardingConcern}
                onChange={(event) => setSafeguardingConcern(event.target.checked)}
                className="h-4 w-4 rounded border-slate-400"
              />
              Mark as safeguarding concern
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !sessionContext}
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? 'Saving incident...' : 'Submit incident'}
            </button>
          </form>

          <ProtectedPageBanner
            authError={authError}
            error={errorMessage}
            status={statusMessage}
            requestId={messageRequestId}
            signInHref="/auth/sign-in?next=/incidents"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Recent Incidents</h2>
            <button
              type="button"
              onClick={() => void fetchIncidents()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading && (
              <div className="space-y-3">
                <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              </div>
            )}

            {!isLoading && incidents.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No incidents yet. Submit the first incident to start oversight tracking.
              </div>
            )}

            {!isLoading && incidents.length > 0 && (
              <ul className="space-y-3">
                {incidents.map((incident) => (
                  <li key={incident.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{new Date(incident.createdAt).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 uppercase">{incident.source}</span>
                        {incident.safeguardingConcern && (
                          <span className="rounded-full bg-rose-100 px-2 py-1 font-medium text-rose-700">Safeguarding</span>
                        )}
                      </div>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">{incident.title}</h3>
                    <p className="mt-1 text-sm text-slate-700">{incident.description}</p>
                    <div className="mt-2 text-xs text-slate-500">By {incident.reportedBy} in {incident.homeId}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}