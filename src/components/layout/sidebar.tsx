"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SIDEBAR
// Permission-aware navigation. Only shows modules the current role can access.
// Includes a role-switcher widget at the bottom for demo / development mode.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Target, Heart, BookOpen, AlertTriangle, Shield, Pill,
  CheckSquare, Calendar, CalendarDays, ArrowRightLeft, Wrench, Users,
  MessageSquare, GraduationCap, UserPlus, FileText, ClipboardCheck, Award,
  BarChart3, Receipt, Clock, ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeft, Settings, Building2, Car, Activity,
  User, Fingerprint, FileCheck, Mail, ChevronUp, HardHat, FolderSearch,
  LayoutList, PieChart, ScanLine, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AcaciaLogo } from "@/components/branding/acacia-logo";
import { useAuthContext } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { useSidebarCounts } from "@/hooks/use-sidebar-counts";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/permissions";
import { useStaff } from "@/hooks/use-staff";
import type { StaffEnriched } from "@/hooks/use-staff";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Target, Heart, BookOpen, AlertTriangle, Shield, Pill,
  CheckSquare, Calendar, CalendarDays, ArrowRightLeft, Wrench, Users,
  MessageSquare, GraduationCap, UserPlus, FileText, ClipboardCheck, Award,
  BarChart3, Receipt, Clock, Building2, Car, Activity, User,
  Fingerprint, FileCheck, Mail, HardHat, FolderSearch, LayoutList, PieChart, ScanLine,
  Sparkles,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Static badge (rarely used — prefer badgeKey for live counts) */
  badge?: number;
  /** Key into SidebarCounts — drives live badge from API */
  badgeKey?: "tasks" | "incidents" | "forms" | "alerts";
  /** Module key matched against canAccessModule() */
  module?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",       href: "/dashboard",       icon: "LayoutDashboard", module: "dashboard" },
      { label: "Staff Dashboard", href: "/dashboard/staff", icon: "User",            module: "dashboard" },
      { label: "My Day",          href: "/dashboard/my-day",icon: "Target",          module: "my-day"    },
      { label: "Reports",         href: "/reports",         icon: "BarChart3",       module: "reports"   },
      { label: "Intelligence",    href: "/reports/intelligence", icon: "Sparkles",    module: "reports", badgeKey: "alerts" },
    ],
  },
  {
    label: "Care",
    items: [
      { label: "Young People", href: "/young-people", icon: "Heart",         module: "young-people"                           },
      { label: "Daily Log",    href: "/daily-log",    icon: "BookOpen",      module: "daily-log"                              },
      { label: "Incidents",    href: "/incidents",    icon: "AlertTriangle", module: "incidents",    badgeKey: "incidents"    },
      { label: "Safeguarding", href: "/safeguarding", icon: "Shield",        module: "safeguarding"           },
      { label: "Medication",   href: "/medication",   icon: "Pill",          module: "medication"             },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Tasks",      href: "/tasks", icon: "CheckSquare", module: "tasks", badgeKey: "tasks" },
      { label: "Care Forms", href: "/forms", icon: "FileText",    module: "forms", badgeKey: "forms" },
      { label: "Rota",         href: "/rota",         icon: "Calendar",       module: "rota"                   },
      { label: "Handover",     href: "/handover",     icon: "ArrowRightLeft", module: "handover"               },
      { label: "Maintenance",  href: "/maintenance",  icon: "Wrench",         module: "maintenance"            },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Staff",          href: "/staff",       icon: "Users",          module: "staff"       },
      { label: "Leave & Absence",href: "/leave",       icon: "CalendarDays",   module: "leave"       },
      { label: "Timesheets",     href: "/timesheets",  icon: "Clock",          module: "timesheets"  },
      { label: "Supervision",    href: "/supervision", icon: "MessageSquare",  module: "supervision" },
      { label: "Training",       href: "/training",    icon: "GraduationCap",  module: "training"   },
      { label: "Recruitment",    href: "/recruitment", icon: "UserPlus",       module: "recruitment" },
    ],
  },
  {
    label: "Safer Recruitment",
    items: [
      { label: "Recruitment Dashboard", href: "/safer-recruitment/dashboard",         icon: "PieChart",      module: "recruitment" },
      { label: "Evidence Register",     href: "/safer-recruitment/evidence-register", icon: "FolderSearch",  module: "recruitment" },
      { label: "All Candidates",        href: "/recruitment/candidates",              icon: "Users",         module: "recruitment" },
      { label: "Checks & SCR",          href: "/recruitment/safer-recruitment/checks",icon: "Shield",        module: "recruitment" },
      { label: "References",            href: "/recruitment/safer-recruitment/references",icon: "ClipboardCheck",module: "recruitment" },
      { label: "DBS Tracker",           href: "/recruitment/safer-recruitment/dbs",  icon: "Fingerprint",   module: "recruitment" },
      { label: "Right to Work",         href: "/recruitment/safer-recruitment/right-to-work",icon: "FileCheck",module: "recruitment" },
      { label: "Interviews",            href: "/recruitment/safer-recruitment/interviews",icon: "MessageSquare",module: "recruitment" },
      { label: "Offers",                href: "/recruitment/safer-recruitment/offers",icon: "Award",         module: "recruitment" },
      { label: "Audit Log",             href: "/recruitment/safer-recruitment/audit", icon: "Activity",      module: "recruitment" },
      { label: "Templates",             href: "/recruitment/templates",               icon: "Mail",          module: "recruitment" },
    ],
  },
  {
    label: "Health & Safety",
    items: [
      { label: "H&S Register",       href: "/health-safety/register", icon: "HardHat",     module: "buildings" },
      { label: "Buildings & H&S",    href: "/buildings",               icon: "Building2",   module: "buildings" },
      { label: "Vehicles",           href: "/vehicles",                icon: "Car",          module: "vehicles"  },
      { label: "Maintenance",        href: "/maintenance",             icon: "Wrench",       module: "maintenance" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { label: "Documents",      href: "/documents",     icon: "FileText",      module: "documents"  },
      { label: "Audits",         href: "/audits",        icon: "ClipboardCheck",module: "audits"     },
      { label: "Regulation 45",  href: "/audits/reg45",  icon: "ScanLine",      module: "audits"     },
      { label: "Inspection",     href: "/inspection",    icon: "Award",         module: "inspection" },
      { label: "Report Builder", href: "/reports/builder",icon: "LayoutList",   module: "reports"   },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Expenses", href: "/expenses", icon: "Receipt", module: "expenses" },
    ],
  },
];

// ── Role Switcher (demo / dev only) ──────────────────────────────────────────

function RoleSwitcher({ collapsed }: { collapsed: boolean }) {
  const { currentUser, currentRole, setCurrentUserId } = useAuthContext();
  const [open, setOpen] = useState(false);
  const staffQuery = useStaff();
  const staffByRole = (staffQuery.data?.data ?? [])
    .filter((s) => s.is_active)
    .reduce<Record<string, StaffEnriched[]>>((acc, s) => {
      if (!acc[s.role]) acc[s.role] = [];
      acc[s.role].push(s);
      return acc;
    }, {});

  if (collapsed) return null; // hidden when sidebar is collapsed

  return (
    <div className="relative border-t border-slate-100 p-3">
      {/* Current user pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-slate-50 transition-colors group"
        title="Switch demo user"
      >
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
          {currentUser?.first_name?.[0] ?? "?"}
          {currentUser?.last_name?.[0] ?? ""}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium text-slate-900 truncate">{currentUser?.full_name ?? "Unknown"}</div>
          <div className="text-[10px] text-slate-400 truncate">{APP_ROLE_LABELS[currentRole] ?? currentRole}</div>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />

          {/* Menu — renders upward */}
          <div className="absolute bottom-full left-0 right-0 mb-1 z-50 mx-3 rounded-xl border border-slate-200 bg-white shadow-xl py-2 max-h-[60vh] overflow-y-auto">
            <div className="px-3 pb-2 border-b border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Switch demo user</p>
            </div>
            {Object.entries(staffByRole).map(([role, members]) => (
              <div key={role}>
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                    {APP_ROLE_LABELS[role as AppRole] ?? role}
                  </p>
                </div>
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => { setCurrentUserId(member.id); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors",
                      currentUser?.id === member.id && "bg-blue-50 text-blue-700",
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      currentUser?.id === member.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                    )}>
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <span className="truncate">{member.full_name}</span>
                    {currentUser?.id === member.id && (
                      <span className="ml-auto text-[9px] text-blue-500 font-medium">Active</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(NAV.map((s) => [s.label, true]))
  );
  const { canAccess } = usePermissions();
  const counts = useSidebarCounts();

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
        <AcaciaLogo showText={!collapsed} size={34} className="min-w-0 flex-1" />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shrink-0"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {NAV.map((section) => {
          // Filter to only items the current role can access
          const visibleItems = section.items.filter((item) =>
            !item.module || canAccess(item.module)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className="mb-1">
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex w-full items-center gap-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {expandedSections[section.label] ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {section.label}
                </button>
              )}
              {(collapsed || expandedSections[section.label]) && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                          isActive
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          collapsed && "justify-center px-0"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-white" : "text-slate-400")} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {(() => {
                              const n = item.badgeKey
                                ? counts[item.badgeKey]
                                : (item.badge ?? 0);
                              return n > 0 ? (
                                <Badge
                                  variant={isActive ? "secondary" : "destructive"}
                                  className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]"
                                >
                                  {n}
                                </Badge>
                              ) : null;
                            })()}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: Settings link ───────────────────────────────────────────── */}
      <div className="border-t border-slate-100 p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-[18px] w-[18px] text-slate-400" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* ── Role Switcher (demo mode) ───────────────────────────────────────── */}
      <RoleSwitcher collapsed={collapsed} />
    </aside>
  );
}
