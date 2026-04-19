import Link from 'next/link'

interface ProtectedPageBannerProps {
  authError?: string
  error?: string
  status?: string
  requestId?: string
  signInHref: string
}

export function ProtectedPageBanner({ authError, error, status, requestId, signInHref }: ProtectedPageBannerProps) {
  if (!authError && !error && !status) {
    return null
  }

  return (
    <div className="mt-4 space-y-3">
      {authError && (
        <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <p>{authError}</p>
          {requestId && <p className="text-xs text-amber-800/80">Request ID: {requestId}</p>}
          <Link
            href={signInHref}
            className="inline-flex rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            Sign in to continue
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <p>{error}</p>
          {requestId && <p className="mt-1 text-xs text-rose-800/80">Request ID: {requestId}</p>}
        </div>
      )}
      {status && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p>}
    </div>
  )
}
