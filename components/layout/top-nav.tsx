import Link from 'next/link'
import { Bell, CalendarClock, Menu, RefreshCw, Search, Sparkles } from 'lucide-react'

interface TopNavProps {
  userLabel: string
  onOpenMenu: () => void
}

export function TopNav({ userLabel, onOpenMenu }: TopNavProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  })

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search everything..."
              className="w-48 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-700">{greeting}</p>
            <p className="text-[11px] text-slate-500">Acacia Therapy Homes</p>
          </div>

          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 lg:inline-flex">
            <CalendarClock className="h-3.5 w-3.5" />
            {todayLabel}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 md:inline-flex"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <Link
            href="/aria"
            className="hidden items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 sm:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" />
            ARIA
          </Link>

          <button
            type="button"
            className="relative rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
          </button>

          <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 xl:inline">
            {userLabel}
          </span>

          <Link
            href="/auth/sign-out"
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Sign out
          </Link>
        </div>
      </div>
    </header>
  )
}
