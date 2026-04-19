import { EmptyState, PageShell } from '@/components/shell/page-shell'

export default function TrainingPage() {
  return (
    <PageShell
      title="Training"
      description="Role requirements, completions, certificates, and provider-sync structures are in place."
    >
      <EmptyState
        title="Training framework provisioned"
        description="Tables support course versions, matrix rows, assignments, certificates, and notifications."
      />
    </PageShell>
  )
}
