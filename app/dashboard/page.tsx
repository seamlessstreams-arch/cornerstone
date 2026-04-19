import { EmptyState, PageShell, ShellCard, ShellTable } from '@/components/shell/page-shell'

function StatusPill({ label, tone }: { label: string; tone: 'amber' | 'blue' | 'slate' }) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : tone === 'blue'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-slate-100 text-slate-700 border-slate-200'

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{label}</span>
}

export default function ManagerDashboard() {
  return (
    <PageShell
      title="Dashboard"
      description="Acacia Therapy Homes operations overview, with secure role-aware access and cloud-ready module foundations."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ShellCard title="Open Incidents">
          <p className="text-3xl font-semibold text-slate-900">4</p>
          <p className="mt-1 text-sm text-slate-600">1 requiring management review</p>
        </ShellCard>
        <ShellCard title="Task Completion">
          <p className="text-3xl font-semibold text-slate-900">87%</p>
          <p className="mt-1 text-sm text-slate-600">Completed within target SLA</p>
        </ShellCard>
        <ShellCard title="Compliance Risk">
          <p className="text-3xl font-semibold text-slate-900">2</p>
          <p className="mt-1 text-sm text-slate-600">Items due in the next 7 days</p>
        </ShellCard>
        <ShellCard title="Unread Notifications">
          <p className="text-3xl font-semibold text-slate-900">6</p>
          <p className="mt-1 text-sm text-slate-600">Role-targeted alerts pending</p>
        </ShellCard>
      </div>

      <ShellTable
        headers={["Area", "Status", "Owner", "Due"]}
        rows={[
          ['Medication audit', <StatusPill label="In progress" tone="blue" key="s1" />, 'Training / Compliance Lead', '2026-04-22'],
          ['Safer recruitment checks', <StatusPill label="Ready for review" tone="amber" key="s2" />, 'Safer Recruitment Officer', '2026-04-25'],
          ['Independent visitor report', <StatusPill label="Awaiting upload" tone="slate" key="s3" />, 'Read-only Auditor', '2026-04-29']
        ]}
      />

      <EmptyState
        title="Provider modules not yet connected"
        description="Integration provider placeholders are provisioned and ready for HR, LMS, and external compliance sync flows."
      />
    </PageShell>
  )
}
