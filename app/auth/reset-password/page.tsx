'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { AcaciaLogo } from '@/components/branding/acacia-logo'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSendingLink, setIsSendingLink] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  async function sendResetLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('')
    setErrorMessage('')
    setIsSendingLink(true)

    try {
      const client = getSupabaseBrowserClient()
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setStatusMessage('Password reset email sent. Follow the link in your inbox, then set a new password below.')
    } catch {
      setErrorMessage('Unable to send reset link. Verify Supabase auth configuration.')
    } finally {
      setIsSendingLink(false)
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('')
    setErrorMessage('')
    setIsUpdatingPassword(true)

    try {
      const client = getSupabaseBrowserClient()
      const { error } = await client.auth.updateUser({ password: newPassword })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setStatusMessage('Password updated successfully. You can now sign in with your new password.')
      setNewPassword('')
    } catch {
      setErrorMessage('Unable to update password. Open the reset link from your email and try again.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
        <AcaciaLogo />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-600">Request a reset email and complete password update for secure account recovery.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={sendResetLink} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">1. Send Reset Link</h2>
          <input
            type="email"
            required
            placeholder="name@acacia-therapy-homes.org"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isSendingLink}
            className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-400"
          >
            {isSendingLink ? 'Sending...' : 'Send reset email'}
          </button>
        </form>

        <form onSubmit={updatePassword} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">2. Set New Password</h2>
          <input
            type="password"
            minLength={8}
            required
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isUpdatingPassword ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>

      {statusMessage ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</p> : null}
      {errorMessage ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}

      <p className="text-sm text-slate-600">
        Return to{' '}
        <Link href="/auth/sign-in" className="text-teal-700 hover:text-teal-900">
          sign in
        </Link>
        .
      </p>
    </div>
  )
}
