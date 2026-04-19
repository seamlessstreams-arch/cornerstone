'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { AppRole, normalizeAppRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils'

interface ActorResponse {
  role: AppRole
  userId: string
  homeId: string
  email: string | null
}

const AUTH_PAGES = ['/auth/sign-in', '/auth/sign-out', '/auth/reset-password']

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [actor, setActor] = useState<ActorResponse | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isAuthPage = useMemo(() => AUTH_PAGES.some((path) => pathname.startsWith(path)), [pathname])
  const shouldSkipActorLookup =
    isAuthPage || (process.env.NODE_ENV !== 'production' && (pathname === '/' || pathname.startsWith('/registered-manager')))

  useEffect(() => {
    if (shouldSkipActorLookup) {
      return
    }

    let cancelled = false

    async function loadActor() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })

        if (!response.ok) {
          if (!cancelled) {
            setActor(null)
          }
          return
        }

        const data = (await response.json()) as ActorResponse

        if (!cancelled) {
          setActor({
            ...data,
            role: normalizeAppRole(data.role)
          })
        }
      } catch {
        if (!cancelled) {
          setActor(null)
        }
      }
    }

    void loadActor()

    return () => {
      cancelled = true
    }
  }, [pathname, shouldSkipActorLookup])

  if (isAuthPage) {
    return <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</main>
  }

  const role = pathname.startsWith('/registered-manager')
    ? 'REGISTERED_MANAGER'
    : (actor?.role ?? 'RESIDENTIAL_SUPPORT_WORKER')
  const label = actor?.email ?? actor?.userId.slice(0, 8) ?? 'Authenticated user'

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        role={role}
        pathname={pathname}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        )}
      >
        <TopNav userLabel={label} onOpenMenu={() => setMobileSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-64px)] px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
