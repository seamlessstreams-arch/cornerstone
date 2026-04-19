import Link from 'next/link'
import { PageShell, ShellCard, ShellTable } from '@/components/shell/page-shell'

function StatusPill({ label, tone }: { label: string; tone: 'emerald' | 'amber' | 'rose' | 'blue' }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
      : tone === 'amber'
      ? 'border-amber-200 bg-amber-100 text-amber-800'
      : tone === 'rose'
      ? 'border-rose-200 bg-rose-100 text-rose-800'
      : 'border-blue-200 bg-blue-100 text-blue-800'

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{label}</span>
}

export default function RegisteredManagerPanel() {
  return (
    <PageShell
      title="Registered Manager Panel"
      description="Management oversight, safeguarding risk, staffing pressure, and inspection readiness for the home leadership team."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ShellCard title="Safeguarding Escalations">
          <p className="text-3xl font-semibold text-slate-900">2</p>
          <p className="mt-1 text-sm text-slate-600">1 requires same-day management review</p>
        </ShellCard>
        <ShellCard title="Staffing Pressure">
          <p className="text-3xl font-semibold text-slate-900">84%</p>
          <p className="mt-1 text-sm text-slate-600">Roster coverage for the next 72 hours</p>
        </ShellCard>
        <ShellCard title="Compliance Due This Week">
          <p className="text-3xl font-semibold text-slate-900">3</p>
          <p className="mt-1 text-sm text-slate-600">Medication, fire drill, recruitment review</p>
        </ShellCard>
        <ShellCard title="Inspection Readiness">
          <p className="text-3xl font-semibold text-slate-900">92%</p>
          <p className="mt-1 text-sm text-slate-600">Outstanding evidence pack: 2 items</p>
        </ShellCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Management Action Board</h2>
              <p className="mt-1 text-sm text-slate-600">Priority items requiring registered manager attention today.</p>
            </div>
            <Link
              href="/reports"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open reports
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-rose-900">Missing-from-home pattern review</p>
                  <p className="mt-1 text-sm text-rose-800">Third missing episode this month requires oversight entry and local authority update.</p>
                </div>
                <StatusPill label="Critical" tone="rose" />
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Safer recruitment evidence review</p>
                  <p className="mt-1 text-sm text-amber-800">One DBS evidence item completed and awaiting manager sign-off in the weekly audit sample.</p>
                </div>
                <StatusPill label="Review" tone="amber" />
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blue-900">Property defect follow-up</p>
                  <p className="mt-1 text-sm text-blue-800">Window restrictor contractor task was raised and needs completion confirmation before tonight&apos;s handover.</p>
                </div>
                <StatusPill label="Monitor" tone="blue" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Manager Quick Links</h2>
          <div className="mt-4 grid gap-3">
            <Link href="/health-safety" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Review Health & Safety actions
            </Link>
            <Link href="/safer-recruitment" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Open Safer Recruitment checks
            </Link>
            <Link href="/reports" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Generate inspection report pack
            </Link>
            <Link href="/settings" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Open organisation settings
            </Link>
          </div>
        </section>
      </div>

      <ShellTable
        headers={['Area', 'Current Position', 'Owner', 'Next Review']}
        rows={[
          ['Safeguarding oversight', <StatusPill key="s1" label="On track" tone="emerald" />, 'Registered Manager', 'Today 18:00'],
          ['Staff deployment', <StatusPill key="s2" label="Tight" tone="amber" />, 'Deputy Manager', 'Tomorrow 09:00'],
          ['Recruitment compliance', <StatusPill key="s3" label="Review due" tone="amber" />, 'HR / Recruitment Lead', '22 Apr 2026'],
          ['Inspection evidence pack', <StatusPill key="s4" label="Strong" tone="blue" />, 'Operations Support', 'Weekly']
        ]}
      />
    </PageShell>
  )
}