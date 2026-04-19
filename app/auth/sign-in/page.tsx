'use client'

import { Suspense, FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AcaciaLogo } from '@/components/branding/acacia-logo'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

function formatSignInError(message?: string) {
  const normalized = (message ?? '').toLowerCase()
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('err_name_not_resolved')
  ) {
    return 'Unable to reach Supabase auth. Check NEXT_PUBLIC_SUPABASE_URL and local DNS/network connectivity.'
  }

  return message || 'Unable to sign in with the provided credentials.'
}

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const nextPath = useMemo(() => {
    const raw = searchParams.get('next')
    if (!raw || !raw.startsWith('/')) {
      return '/tasks'
    }

    return raw
  }, [searchParams])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('Signing in...')
    setIsSubmitting(true)

    try {
      const client = getSupabaseBrowserClient()
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        setStatusMessage('')
        setErrorMessage(formatSignInError(error.message))
        return
      }

      setStatusMessage('Signed in. Redirecting...')
      router.push(nextPath)
    } catch {
      setStatusMessage('')
      setErrorMessage(
        'Supabase auth is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm">
        <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 via-white to-emerald-50 px-6 py-5">
          <AcaciaLogo />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Sign In</h1>
          <p className="mt-1 text-sm text-slate-600">Secure access for Acacia Therapy Homes staff and leadership.</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4 px-6 py-6">
          <label className="block space-y-1 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="manager@acacia-home.org"
            />
          </label>

          <div className="flex justify-end">
            <Link href="/auth/reset-password" className="text-xs font-medium text-teal-700 hover:text-teal-900">
              Forgot your password?
            </Link>
          </div>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Enter your password"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          {statusMessage && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{statusMessage}</p>}
          {errorMessage && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>}
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        After sign-in, you will be redirected to <span className="font-medium">{nextPath}</span>.
      </p>
      <p className="mt-2 text-center text-xs text-slate-500">
        Need to return home?{' '}
        <Link
          href={process.env.NODE_ENV === 'production' ? '/dashboard' : '/registered-manager'}
          className="text-teal-700 underline-offset-2 hover:underline"
        >
          Go to dashboard
        </Link>
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg py-10 text-center text-slate-600">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
