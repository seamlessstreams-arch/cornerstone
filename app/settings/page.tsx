import { EmptyState, PageShell } from '@/components/shell/page-shell'

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="Administrative controls for organisation config, provider links, and policy governance."
    >
      <EmptyState
        title="Settings foundations provisioned"
        description="Use this area for role administration, provider activation, and controlled configuration updates."
      />
    </PageShell>
  )
}
