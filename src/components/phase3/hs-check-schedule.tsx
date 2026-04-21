"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EvidenceRegister } from "@/components/phase3/evidence-register";
import { EvidenceUploader } from "@/components/phase3/evidence-uploader";
import { OversightPanel } from "@/components/phase3/oversight-panel";
import { formatFiltersAppliedLabel } from "@/lib/utils";

interface HsCheck {
  id: string;
  check_type: string;
  check_date: string;
  due_date: string | null;
  completed_at: string | null;
  status: "pending" | "completed" | "overdue" | "skipped";
  defects_identified: boolean;
  defect_severity: string | null;
  maintenance_task_id: string | null;
  form_record_id: string;
}

interface HsStats {
  dueToday: number;
  overdue: number;
  completedThisWeek: number;
  openDefects: number;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800",
  overdue: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-700",
  skipped: "bg-gray-100 text-gray-600",
};

const CHECK_TYPE_LABELS: Record<string, string> = {
  daily_safety_walkthrough: "Daily Safety Walkthrough",
  daily_kitchen_check: "Kitchen Safety Check",
  daily_fire_check: "Fire Safety Check",
  weekly_audit: "Weekly Manager Audit",
  monthly_manager_audit: "Monthly Manager Audit",
  room_check: "Room Check",
  garden_check: "Garden & Outdoor Check",
  vehicle_check: "Vehicle Check",
};

const FILTER_LABELS: Record<"all" | "pending" | "overdue" | "completed", string> = {
  all: "All",
  pending: "Pending",
  overdue: "Overdue",
  completed: "Completed",
};

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) > 1 ? "s" : ""} ago`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

export function HsCheckSchedule() {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydratedFromUrl = useRef(false);

  const [checks, setChecks] = useState<HsCheck[]>([]);
  const [stats, setStats] = useState<HsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "overdue" | "completed">("all");
  const [selectedCheck, setSelectedCheck] = useState<HsCheck | null>(null);
  const [evidenceRefreshKey, setEvidenceRefreshKey] = useState(0);
  const activeFilterCount = filter === "all" ? 0 : 1;
  const activeFilterLabel = formatFiltersAppliedLabel(activeFilterCount);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status === "pending" || status === "overdue" || status === "completed") {
      setFilter(status);
    }

    hasHydratedFromUrl.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (filter === "all") {
      params.delete("status");
    } else {
      params.set("status", filter);
    }

    const nextQuery = params.toString();
    const currentQuery = window.location.search.replace(/^\?/, "");

    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [filter, pathname, router]);

  useEffect(() => {
    const fetchChecks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("status", filter);
        // Last 7 days to next 30 days
        const from = new Date();
        from.setDate(from.getDate() - 7);
        const to = new Date();
        to.setDate(to.getDate() + 30);
        params.set("from", from.toISOString().split("T")[0]);
        params.set("to", to.toISOString().split("T")[0]);

        const resp = await fetch(`/api/phase3/health-safety-checks?${params}`);
        if (!resp.ok) throw new Error("Failed to fetch");
        const data = await resp.json();
        setSchemaReady(data.schemaReady !== false);
        setChecks(data.checks ?? []);
        setStats(data.stats ?? null);
      } catch {
        // fail silently — page shows empty state
        setSchemaReady(true);
        setChecks([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChecks();
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Due Today</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">{stats?.dueToday ?? "—"}</div>
          <div className="text-xs text-gray-400 mt-1">H&amp;S checks</div>
        </div>
        <div className="bg-white p-5 rounded-lg border">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Overdue</div>
          <div className="text-3xl font-bold text-red-600 mt-1">{stats?.overdue ?? "—"}</div>
          <div className="text-xs text-gray-400 mt-1">Urgent attention</div>
        </div>
        <div className="bg-white p-5 rounded-lg border">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Completed This Week</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{stats?.completedThisWeek ?? "—"}</div>
          <div className="text-xs text-gray-400 mt-1">Checks done</div>
        </div>
        <div className="bg-white p-5 rounded-lg border">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Open Defects</div>
          <div className="text-3xl font-bold text-purple-600 mt-1">{stats?.openDefects ?? "—"}</div>
          <div className="text-xs text-gray-400 mt-1">Requiring action</div>
        </div>
      </div>

      {/* Check Schedule */}
      <div className="bg-white rounded-lg border">
        {!schemaReady && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            Phase 3 H&amp;S tables are not available in this database yet. Apply the latest Supabase migrations to enable live check schedules.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b">
          <h2 className="text-lg font-semibold">Check Schedule</h2>
          <div className="flex items-center gap-2">
            {(["all", "overdue", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  filter === f
                    ? "bg-teal-600 text-white border-teal-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800">
                {activeFilterLabel}
              </span>
            )}
            <Link href="/forms/new?category=Health+%26+Safety">
              <Button size="sm" className="ml-2">+ New Check</Button>
            </Link>
          </div>
        </div>

        {filter !== "all" && (
          <div className="px-5 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-800">
                {`Status: ${FILTER_LABELS[filter]}`}
                <button
                  type="button"
                  className="font-semibold leading-none text-teal-700 hover:text-teal-900"
                  onClick={() => setFilter("all")}
                  aria-label="Remove status filter"
                >
                  x
                </button>
              </span>
              <button
                type="button"
                className="text-xs text-gray-600 underline hover:text-gray-900"
                onClick={() => setFilter("all")}
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading schedule…</div>
        ) : checks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">No checks found for this period.</p>
            <Link href="/forms/new?category=Health+%26+Safety">
              <Button variant="outline" className="mt-4">+ Log a Check</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {checks.map((check) => (
              <div
                key={check.id}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 ${
                  check.status === "overdue" ? "bg-red-50" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900">
                    {CHECK_TYPE_LABELS[check.check_type] ?? check.check_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDueDate(check.due_date)}</p>
                  {check.defects_identified && (
                    <p className={`text-xs mt-1 font-medium ${check.defect_severity === "high" || check.defect_severity === "critical" ? "text-red-600" : "text-amber-600"}`}>
                      ⚠ Defect: {check.defect_severity ?? "unspecified severity"}
                      {check.maintenance_task_id && " — Task raised"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${STATUS_BADGE[check.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedCheck(check)}>
                    Review
                  </Button>
                  {check.status !== "completed" && (
                    <Link href={`/forms/new?checkId=${check.id}&category=Health+%26+Safety`}>
                      <Button size="sm" variant="outline">Complete</Button>
                    </Link>
                  )}
                  {check.status === "completed" && (
                    <Link href={`/forms/${check.form_record_id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports quick-launch */}
      <div className="bg-white rounded-lg border p-5">
        <h2 className="text-lg font-semibold mb-4">Reports &amp; Audit Trail</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "📋", label: "Daily Audit", type: "h_and_s_daily_audit_report" },
            { icon: "📊", label: "Weekly Audit", type: "h_and_s_weekly_audit_report" },
            { icon: "📅", label: "Monthly Audit", type: "h_and_s_monthly_audit_report" },
          ].map((r) => (
            <Link key={r.type} href={`/reports/builder?template=${r.type}`}>
              <div className="p-4 border rounded-lg hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition">
                <div className="text-xl">{r.icon}</div>
                <h3 className="font-medium text-sm mt-2">{r.label} Report</h3>
                <p className="text-xs text-gray-500 mt-1">Generate &amp; export</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {selectedCheck && (
        <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto p-4">
          <div className="max-w-5xl mx-auto bg-gray-50 rounded-2xl shadow-xl border">
            <div className="flex items-start justify-between gap-4 p-6 border-b bg-white rounded-t-2xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {CHECK_TYPE_LABELS[selectedCheck.check_type] ?? selectedCheck.check_type.replace(/_/g, " ")}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Review evidence and management oversight for this check record.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedCheck(null)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Evidence Uploads</h4>
                      <p className="text-sm text-gray-500 mt-1">Attach supporting evidence to this completed check.</p>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${STATUS_BADGE[selectedCheck.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {selectedCheck.status.charAt(0).toUpperCase() + selectedCheck.status.slice(1)}
                    </span>
                  </div>

                  <EvidenceUploader
                    formRecordId={selectedCheck.form_record_id}
                    defaultEvidenceType="photo_evidence"
                    compact
                    onUploadComplete={() => setEvidenceRefreshKey((current) => current + 1)}
                  />

                  <div className="mt-5">
                    <EvidenceRegister
                      key={`${selectedCheck.form_record_id}-${evidenceRefreshKey}`}
                      formRecordId={selectedCheck.form_record_id}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-5">
                  <h4 className="font-semibold text-gray-900 mb-2">Check Summary</h4>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Due</dt>
                      <dd className="text-gray-800 mt-1">{selectedCheck.due_date ? new Date(selectedCheck.due_date).toLocaleDateString("en-GB") : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Completed</dt>
                      <dd className="text-gray-800 mt-1">
                        {selectedCheck.completed_at ? new Date(selectedCheck.completed_at).toLocaleString("en-GB") : "Not completed"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Defects</dt>
                      <dd className="text-gray-800 mt-1">
                        {selectedCheck.defects_identified ? `Yes${selectedCheck.defect_severity ? ` (${selectedCheck.defect_severity})` : ""}` : "None recorded"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <OversightPanel formRecordId={selectedCheck.form_record_id} alwaysShowForm={selectedCheck.status !== "completed"} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
