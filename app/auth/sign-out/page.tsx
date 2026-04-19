'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function SignOutPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing out...')

  useEffect(() => {
    let cancelled = false

    async function runSignOut() {
      try {
        const client = getSupabaseBrowserClient()
        await client.auth.signOut()
      } catch {
        // Continue logout flow even if client is not configured.
      }

      if (!cancelled) {
        setMessage('Signed out. Redirecting...')
        router.replace('/auth/sign-in')
      }
    }

    void runSignOut()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Sign Out</h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <p className="mt-4 text-xs text-slate-500">
        If you are not redirected,{' '}
        <Link href="/auth/sign-in" className="text-teal-700 underline-offset-2 hover:underline">
          continue to sign in
        </Link>
        .
      </p>
    </div>
  )
}
