"use client";

import { Suspense } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ReportBuilder } from "@/components/phase3/report-builder";

export default function ReportBuilderPage() {
  return (
    <PageShell
      title="Report Builder"
      subtitle="Build branded, exportable reports with chronology, oversight, and AI summaries"
      fullWidth
    >
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <Suspense fallback={<div className="text-sm text-slate-500">Loading report builder...</div>}>
            <ReportBuilder />
          </Suspense>
        </div>
      </div>
    </PageShell>
  );
}
