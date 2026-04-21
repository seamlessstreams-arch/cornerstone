import { PageShell } from "@/components/layout/page-shell";
import { HsCheckSchedule } from "@/components/phase3/hs-check-schedule";

export default function HealthSafetyRegister() {
  return (
    <PageShell
      title="Health & Safety Register"
      subtitle="Track daily, weekly, and monthly health and safety checks across the home"
    >
      <HsCheckSchedule />
    </PageShell>
  );
}
