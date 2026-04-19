import Link from 'next/link'
import {
  BarChart3,
  Building2,
  ChevronRight,
  Heart,
  PanelLeft,
  PanelLeftClose,
  Settings,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  LayoutDashboard
} from 'lucide-react'
import { AppRole } from '@/lib/auth/roles'
import { resolveVisibleNavItems } from '@/lib/auth/rbac'
import { cn } from '@/lib/utils'
import { AcaciaLogo } from '@/components/branding/acacia-logo'

interface SidebarProps {
  role: AppRole
  pathname: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: ['Dashboard', 'Registered Manager', 'Reports']
  },
  {
    label: 'Care',
    items: ['Young People', 'Health & Safety', 'Safer Recruitment']
  },
  {
    label: 'People & Admin',
    items: ['Training', 'Settings']
  }
] as const

const ICON_BY_LABEL = {
  Dashboard: LayoutDashboard,
  'Registered Manager': Building2,
  'Young People': Heart,
  'Health & Safety': ShieldCheck,
  'Safer Recruitment': Sparkles,
  Training: GraduationCap,
  Reports: BarChart3,
  Settings
}

export function Sidebar({
  role,
  pathname,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onCloseMobile
}: SidebarProps) {
  const navItems = resolveVisibleNavItems(role)
  const roleLabel = role.replaceAll('_', ' ')
  const groupedNav = NAV_SECTIONS.map((section) => ({
    ...section,
    items: navItems.filter((item) => (section.items as readonly string[]).includes(item.label))
  })).filter((section) => section.items.length > 0)

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-4">
          <div className="shrink-0">
            <AcaciaLogo compact />
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">Cornerstone</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-slate-400">Acacia Therapy Homes</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <div className="border-b border-slate-100 px-3 py-3">
          <div className={cn('rounded-xl border border-slate-200 bg-slate-50 px-3 py-2', collapsed && 'px-2 py-3 text-center')}>
            {!collapsed ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Role Context</p>
                <p className="mt-1 text-xs font-medium text-slate-700">{roleLabel}</p>
              </>
            ) : (
              <Building2 className="mx-auto h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {groupedNav.map((section) => (
            <div key={section.label} className="mb-2">
              {!collapsed ? (
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.label}
                </p>
              ) : null}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  const Icon = ICON_BY_LABEL[item.label as keyof typeof ICON_BY_LABEL] ?? ChevronRight

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                        active
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-slate-400')} />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="h-[18px] w-[18px] text-slate-400" />
            {!collapsed ? <span>Settings</span> : null}
          </Link>
        </div>
      </aside>
    </>
  )
}
