'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { ProtectedPageBanner } from '@/components/protected-page-banner'
import { PageShell, ShellCard, ShellTable } from '@/components/shell/page-shell'

interface CandidateItem {
  id: string
  name: string
  email: string
  status: string
  roleApplied: string
  applicationStatus: string
  createdAt: string
}

interface EvidenceItem {
  id: string
  candidateName: string
  documentType: string
  verificationStatus: string
  verifiedAt: string | null
  verifierMethod: string | null
  notes: string | null
}

interface DashboardResponse {
  candidates: CandidateItem[]
  evidence: EvidenceItem[]
  pendingVerifications: number
}

interface ApiError {
  error?: string
  requestId?: string
}

export default function SaferRecruitmentPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingCandidate, setIsCreatingCandidate] = useState(false)
  const [isAddingEvidence, setIsAddingEvidence] = useState(false)
  const [isVerifyingEvidence, setIsVerifyingEvidence] = useState(false)
  const [authError, setAuthError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [requestId, setRequestId] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [roleApplied, setRoleApplied] = useState('Residential Support Worker')

  const [evidenceApplicationId, setEvidenceApplicationId] = useState('')
  const [evidenceDocumentType, setEvidenceDocumentType] = useState('DBS')
  const [evidenceFileName, setEvidenceFileName] = useState('')
  const [evidencePath, setEvidencePath] = useState('')
  const [evidenceNotes, setEvidenceNotes] = useState('')

  const [evidenceDocId, setEvidenceDocId] = useState('')
  const [verificationOutcome, setVerificationOutcome] = useState<'verified' | 'rejected' | 'needs_review'>('verified')
  const [verificationMethod, setVerificationMethod] = useState<'manual' | 'cross-check' | 'third-party'>('manual')
  const [verificationNotes, setVerificationNotes] = useState('')

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setAuthError('')

    try {
      const response = await fetch('/api/safer-recruitment')
      const data = (await response.json()) as DashboardResponse | ApiError

      if (!response.ok) {
        const message = 'error' in data && data.error ? data.error : 'Unable to load safer recruitment dashboard.'
        setRequestId('requestId' in data && data.requestId ? data.requestId : '')
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
      setDashboard(null)
      setErrorMessage('Unexpected error while loading safer recruitment dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  async function handleCreateCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreatingCandidate(true)
    setErrorMessage('')
    setStatusMessage('Creating candidate...')

    try {
      const response = await fetch('/api/safer-recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-candidate',
          firstName,
          lastName,
          email,
          roleApplied
        })
      })

      const data = (await response.json()) as { applicationId?: string; error?: string; requestId?: string }

      if (!response.ok) {
        setRequestId(data.requestId ?? '')
        setStatusMessage('')
        setErrorMessage(data.error ?? 'Unable to create candidate.')
        return
      }

      setStatusMessage(`Candidate created. Application ID: ${data.applicationId ?? 'created'}.`)
      if (data.applicationId) {
        setEvidenceApplicationId(data.applicationId)
      }
      setFirstName('')
      setLastName('')
      setEmail('')
      await loadDashboard()
    } catch {
      setErrorMessage('Unexpected error while creating candidate.')
      setStatusMessage('')
    } finally {
      setIsCreatingCandidate(false)
    }
  }

  async function handleVerifyEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsVerifyingEvidence(true)
    setErrorMessage('')
    setStatusMessage('Submitting verification...')

    try {
      const response = await fetch('/api/safer-recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-evidence',
          documentId: evidenceDocId,
          outcome: verificationOutcome,
          method: verificationMethod,
          notes: verificationNotes
        })
      })

      const data = (await response.json()) as { outcome?: string; error?: string; requestId?: string }

      if (!response.ok) {
        setRequestId(data.requestId ?? '')
        setStatusMessage('')
        setErrorMessage(data.error ?? 'Unable to verify evidence.')
        return
      }

      setStatusMessage(`Evidence verified with outcome: ${data.outcome ?? verificationOutcome}.`)
      setEvidenceDocId('')
      setVerificationNotes('')
      await loadDashboard()
    } catch {
      setErrorMessage('Unexpected error while verifying evidence.')
      setStatusMessage('')
    } finally {
      setIsVerifyingEvidence(false)
    }
  }

  async function handleAddEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAddingEvidence(true)
    setErrorMessage('')
    setStatusMessage('Adding evidence...')

    try {
      const response = await fetch('/api/safer-recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-evidence',
          applicationId: evidenceApplicationId,
          documentType: evidenceDocumentType,
          fileName: evidenceFileName,
          path: evidencePath,
          checklist: [{ key: 'uploaded', passed: true }],
          notes: evidenceNotes
        })
      })

      const data = (await response.json()) as { documentId?: string; error?: string; requestId?: string }

      if (!response.ok) {
        setRequestId(data.requestId ?? '')
        setStatusMessage('')
        setErrorMessage(data.error ?? 'Unable to add evidence.')
        return
      }

      setStatusMessage(`Evidence added. Document ID: ${data.documentId ?? 'created'}.`)
      if (data.documentId) {
        setEvidenceDocId(data.documentId)
      }
      setEvidenceFileName('')
      setEvidencePath('')
      setEvidenceNotes('')
      await loadDashboard()
    } catch {
      setErrorMessage('Unexpected error while adding evidence.')
      setStatusMessage('')
    } finally {
      setIsAddingEvidence(false)
    }
  }

  return (
    <PageShell
      title="Safer Recruitment"
      description="Candidate pipeline, evidence register, verification lifecycle metadata, and follow-up automations."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <ShellCard title="Candidates">{dashboard?.candidates.length ?? 0}</ShellCard>
        <ShellCard title="Evidence Items">{dashboard?.evidence.length ?? 0}</ShellCard>
        <ShellCard title="Pending Verifications">{dashboard?.pendingVerifications ?? 0}</ShellCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Create Candidate</h2>
          <form className="mt-4 space-y-3" onSubmit={handleCreateCandidate}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">First Name</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Last Name</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Role Applied</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={roleApplied}
                onChange={(event) => setRoleApplied(event.target.value)}
                required
              />
            </label>

            <button
              type="submit"
              disabled={isCreatingCandidate}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-400"
            >
              {isCreatingCandidate ? 'Saving...' : 'Create Candidate'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Add Evidence</h3>
            <p className="mt-1 text-xs text-slate-600">Attach evidence to an application before verification.</p>
            <form className="mt-3 space-y-3" onSubmit={handleAddEvidence}>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Application ID</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={evidenceApplicationId}
                  onChange={(event) => setEvidenceApplicationId(event.target.value)}
                  required
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Document Type</span>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={evidenceDocumentType}
                    onChange={(event) => setEvidenceDocumentType(event.target.value)}
                    required
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">File Name</span>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={evidenceFileName}
                    onChange={(event) => setEvidenceFileName(event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">File Path</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={evidencePath}
                  onChange={(event) => setEvidencePath(event.target.value)}
                  placeholder="/mock/document.pdf"
                  required
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Evidence Notes</span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={evidenceNotes}
                  onChange={(event) => setEvidenceNotes(event.target.value)}
                  placeholder="Summarize checks completed for this evidence upload."
                />
              </label>

              <button
                type="submit"
                disabled={isAddingEvidence}
                className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:bg-slate-400"
              >
                {isAddingEvidence ? 'Submitting...' : 'Add Evidence'}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Verify Evidence</h2>
          <p className="mt-1 text-sm text-slate-600">Use any document ID from the evidence register.</p>

          <form className="mt-4 space-y-3" onSubmit={handleVerifyEvidence}>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Document ID</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={evidenceDocId}
                onChange={(event) => setEvidenceDocId(event.target.value)}
                required
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Outcome</span>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={verificationOutcome}
                  onChange={(event) => setVerificationOutcome(event.target.value as 'verified' | 'rejected' | 'needs_review')}
                >
                  <option value="verified">Verified</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Method</span>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={verificationMethod}
                  onChange={(event) => setVerificationMethod(event.target.value as 'manual' | 'cross-check' | 'third-party')}
                >
                  <option value="manual">Manual</option>
                  <option value="cross-check">Cross-check</option>
                  <option value="third-party">Third-party</option>
                </select>
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={verificationNotes}
                onChange={(event) => setVerificationNotes(event.target.value)}
                placeholder="Record decision rationale and references checked."
              />
            </label>

            <button
              type="submit"
              disabled={isVerifyingEvidence}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
            >
              {isVerifyingEvidence ? 'Submitting...' : 'Submit Verification'}
            </button>
          </form>
        </section>
      </div>

      <ProtectedPageBanner
        authError={authError}
        error={errorMessage}
        status={statusMessage}
        requestId={requestId}
        signInHref="/auth/sign-in?next=/safer-recruitment"
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Candidate Register</h2>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {isLoading && <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">Loading recruitment register...</div>}

        {!isLoading && (
          <div className="space-y-4">
            <ShellTable
              headers={['Candidate', 'Email', 'Role Applied', 'Status', 'Application', 'Created']}
              rows={(dashboard?.candidates ?? []).map((candidate) => [
                candidate.name,
                candidate.email,
                candidate.roleApplied,
                candidate.status,
                candidate.applicationStatus,
                new Date(candidate.createdAt).toLocaleString()
              ])}
            />

            <ShellTable
              headers={['Document ID', 'Candidate', 'Type', 'Verification', 'Verified At', 'Method', 'Notes']}
              rows={(dashboard?.evidence ?? []).map((item) => [
                item.id,
                item.candidateName || '-',
                item.documentType,
                item.verificationStatus,
                item.verifiedAt ? new Date(item.verifiedAt).toLocaleString() : '-',
                item.verifierMethod ?? '-',
                item.notes ?? '-'
              ])}
            />
          </div>
        )}
      </section>
    </PageShell>
  )
}
