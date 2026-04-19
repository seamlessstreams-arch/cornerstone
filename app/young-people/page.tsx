import { EmptyState, PageShell } from '@/components/shell/page-shell'

export default function YoungPeoplePage() {
  return (
    <PageShell
      title="Young People"
      description="Case records, plans, chronology, and form workflows are scaffolded for Phase 2 implementation."
    >
      <EmptyState
        title="Young People modules ready"
        description="Tables and RLS foundations are provisioned for profiles, plans, chronology, forms, signatures, and linked records."
      />
    </PageShell>
  )
}
