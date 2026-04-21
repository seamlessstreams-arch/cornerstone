"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { api } from "@/hooks/use-api";
import { useTrainingMatrix } from "@/hooks/use-training-matrix";
import { useOpenTrainingLink } from "@/hooks/use-training-open-link";
import { useRunTrainingSync, useTrainingSyncStatus } from "@/hooks/use-training-sync";
import { useSaveTrainingProviderConfig, useTrainingProviderConfig } from "@/hooks/use-training-provider-config";
import { cn, formatDate, formatFiltersAppliedLabel } from "@/lib/utils";

const STATUS_STYLES: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  compliant: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Compliant" },
  due_soon: { color: "bg-amber-100 text-amber-700", icon: Clock, label: "Due Soon" },
  overdue: { color: "bg-orange-100 text-orange-700", icon: AlertTriangle, label: "Overdue" },
  expired: { color: "bg-red-100 text-red-700", icon: AlertTriangle, label: "Expired" },
  incomplete: { color: "bg-slate-100 text-slate-600", icon: Clock, label: "Incomplete" },
  non_compliant: { color: "bg-red-100 text-red-700", icon: AlertTriangle, label: "Non-Compliant" },
};

export default function TrainingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [requirementFilter, setRequirementFilter] = useState<"mandatory" | "optional" | "">("");
  const [view, setView] = useState<"my" | "home" | "organisation">("my");
  const [showAdmin, setShowAdmin] = useState(false);

  const matrixQuery = useTrainingMatrix({
    view,
    compliance: statusFilter || undefined,
    provider: providerFilter || undefined,
    requirement_type: requirementFilter || undefined,
  });
  const syncStatusQuery = useTrainingSyncStatus();
  const runSyncMutation = useRunTrainingSync();
  const openTrainingMutation = useOpenTrainingLink();
  const providerConfigQuery = useTrainingProviderConfig();
  const saveProviderConfigMutation = useSaveTrainingProviderConfig();

  const notificationsQuery = useQuery({
    queryKey: ["training-notifications"],
    queryFn: () =>
      api.get<{ notifications: Array<{ id: string; title: string; message: string; created_at: string }> }>(
        "/training/notifications"
      ),
  });

  const rows = matrixQuery.data?.rows ?? [];
  const summary = matrixQuery.data?.summary;

  const providers = useMemo(
    () =>
      [...new Set(rows.map((row) => row.training_courses?.provider_name).filter((value): value is string => Boolean(value)))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const course = row.training_courses?.course_title?.toLowerCase() ?? "";
      const provider = row.training_courses?.provider_name?.toLowerCase() ?? "";
      const staff = row.users?.email?.toLowerCase() ?? "";
      return course.includes(q) || provider.includes(q) || staff.includes(q);
    });
  }, [rows, search]);

  const syncLogs = (syncStatusQuery.data?.logs ?? []) as Array<Record<string, unknown>>;
  const syncErrors = (syncStatusQuery.data?.errors ?? []) as Array<Record<string, unknown>>;
  const activeFilterCount = [statusFilter, providerFilter, requirementFilter].filter(Boolean).length;

  return (
    <PageShell
      title="Training Matrix & LMS Integration"
      subtitle={
        summary
          ? `${summary.compliant}/${summary.total} compliant · ${summary.overdue} overdue · ${summary.dueSoon} due soon`
          : "Live provider-linked training matrix for Acacia Therapy Homes"
      }
      quickCreateContext={{ module: "training", defaultTaskCategory: "training" }}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runSyncMutation.mutate({ mode: "manual" })}
            disabled={runSyncMutation.isPending}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", runSyncMutation.isPending && "animate-spin")} />
            Sync Now
          </Button>
          <Button size="sm" variant={showAdmin ? "default" : "outline"} onClick={() => setShowAdmin((prev) => !prev)}>
            <Settings className="h-3.5 w-3.5" /> Provider Admin
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs text-slate-500">Completion Rate</div>
            <div className="text-2xl font-bold text-emerald-600">
              {summary?.total ? `${Math.round((summary.compliant / summary.total) * 100)}%` : "0%"}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs text-slate-500">Compliant</div>
            <div className="text-2xl font-bold text-emerald-600">{summary?.compliant ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs text-slate-500">Overdue Mandatory</div>
            <div className="text-2xl font-bold text-orange-600">{summary?.overdue ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs text-slate-500">Due Soon</div>
            <div className="text-2xl font-bold text-amber-600">{summary?.dueSoon ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs text-slate-500">Expired Certificates</div>
            <div className="text-2xl font-bold text-red-600">{summary?.expired ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs text-slate-500">Sync Health</div>
            <div className={cn("text-sm font-semibold mt-1", syncErrors.length > 0 ? "text-red-600" : "text-emerald-600")}>
              {syncErrors.length > 0 ? "Issues Detected" : "Healthy"}
            </div>
            {typeof syncLogs[0]?.started_at === "string" && (
              <div className="text-[11px] text-slate-500 mt-1">Last sync {formatDate(String(syncLogs[0].started_at))}</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={view === "my" ? "default" : "outline"} size="sm" onClick={() => setView("my")}>
            My Training
          </Button>
          <Button variant={view === "home" ? "default" : "outline"} size="sm" onClick={() => setView("home")}>
            <Building2 className="h-3.5 w-3.5" /> Home Training Matrix
          </Button>
          <Button variant={view === "organisation" ? "default" : "outline"} size="sm" onClick={() => setView("organisation")}>
            <Users className="h-3.5 w-3.5" /> Organisation Training Matrix
          </Button>
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800">
              {formatFiltersAppliedLabel(activeFilterCount)}
            </span>
          )}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff, course, provider" />
              <select className="h-10 rounded-md border bg-white px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All compliance</option>
                <option value="compliant">Compliant</option>
                <option value="due_soon">Due Soon</option>
                <option value="overdue">Overdue</option>
                <option value="expired">Expired</option>
                <option value="incomplete">Incomplete</option>
                <option value="non_compliant">Non-Compliant</option>
              </select>
              <select className="h-10 rounded-md border bg-white px-3 text-sm" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
                <option value="">All providers</option>
                {providers.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={requirementFilter}
                onChange={(event) => setRequirementFilter(event.target.value as "mandatory" | "optional" | "")}
              >
                <option value="">Mandatory + Optional</option>
                <option value="mandatory">Mandatory</option>
                <option value="optional">Optional</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setProviderFilter("");
                  setRequirementFilter("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {syncErrors.length > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
            <div className="text-sm font-semibold text-red-800">Provider sync failures need attention</div>
            <ul className="mt-2 space-y-1 text-xs text-red-700">
              {syncErrors.slice(0, 3).map((error) => (
                <li key={String(error.id)}>
                  {String(error.error_message ?? "Unknown sync error")} ({formatDate(String(error.created_at ?? ""))})
                </li>
              ))}
            </ul>
          </div>
        )}

        {(matrixQuery.isPending || syncStatusQuery.isPending) && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {!matrixQuery.isPending && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Staff</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Role</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Home</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Course</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Provider</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Mandatory</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Due</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Completed</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Expires</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Compliance</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Certificate</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Open Training</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const style = STATUS_STYLES[row.compliance_status] ?? STATUS_STYLES.incomplete;
                    const Icon = style.icon;

                    return (
                      <tr key={row.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-2 text-sm text-slate-700">{row.users?.email ?? row.staff_member_id}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.role_id ?? "-"}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.home_id ?? "All homes"}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.training_courses?.course_title ?? row.course_id}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.training_courses?.provider_name ?? "-"}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.requirement_type === "mandatory" ? "Yes" : "Optional"}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.due_date ? formatDate(row.due_date) : "-"}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.completed_at ? formatDate(row.completed_at) : "-"}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.expires_at ? formatDate(row.expires_at) : "-"}</td>
                        <td className="px-3 py-2 text-sm">
                          <Badge className={cn("text-[11px] rounded-full", style.color)}>
                            <Icon className="mr-1 h-3 w-3" />
                            {style.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.certificate_status ?? "missing"}</td>
                        <td className="px-3 py-2 text-sm">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() =>
                              openTrainingMutation.mutate({
                                providerCourseId: row.training_courses?.id ?? row.course_id,
                                providerName: "vocational_training_hub",
                                fallbackCourseUrl: row.direct_course_url ?? undefined,
                                courseId: row.course_id,
                              })
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open Training
                          </Button>
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.last_synced_at ? formatDate(row.last_synced_at) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredRows.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No matrix rows match current filters.</div>}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-500" /> Recent Training Notifications
              </div>
              <div className="mt-3 space-y-2">
                {(notificationsQuery.data?.notifications ?? []).slice(0, 5).map((notification) => (
                  <div key={notification.id} className="rounded-lg border p-3">
                    <div className="text-sm font-medium text-slate-900">{notification.title}</div>
                    <div className="text-xs text-slate-600 mt-1">{notification.message}</div>
                    <div className="text-[11px] text-slate-400 mt-2">{formatDate(notification.created_at)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" /> Phase 4 Training Reports
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>Staff Training Record</li>
                <li>Staff Training Matrix Export</li>
                <li>Home Training Compliance Report</li>
                <li>Mandatory Training Overdue Report</li>
                <li>Due Soon / Expiring Training Report</li>
                <li>Course Completion Report</li>
                <li>Certificate Audit Report</li>
                <li>Provider Sync Audit Report</li>
              </ul>
              <div className="mt-3 text-xs text-slate-500">ARIA manager summaries are available when generating these report templates.</div>
            </CardContent>
          </Card>
        </div>

        {showAdmin && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-sm font-semibold text-slate-900">Vocational Training Hub Provider Configuration</div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input id="vthApiBaseUrl" placeholder="API Base URL" defaultValue={String((providerConfigQuery.data?.connection as { config?: Record<string, unknown> } | undefined)?.config?.apiBaseUrl ?? "")} />
                <Input id="vthPortalBaseUrl" placeholder="Portal Base URL" defaultValue={String((providerConfigQuery.data?.connection as { config?: Record<string, unknown> } | undefined)?.config?.portalBaseUrl ?? "")} />
                <Input id="vthWebhookSecret" placeholder="Webhook Secret" type="password" defaultValue={String((providerConfigQuery.data?.connection as { config?: Record<string, unknown> } | undefined)?.config?.webhookSecret ?? "")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input id="vthApiToken" placeholder="API Token" type="password" defaultValue={String((providerConfigQuery.data?.connection as { config?: Record<string, unknown> } | undefined)?.config?.apiToken ?? "")} />
                <Input id="vthPollingInterval" placeholder="Polling interval minutes" defaultValue={String((providerConfigQuery.data?.connection as { polling_interval_minutes?: number } | undefined)?.polling_interval_minutes ?? 30)} />
                <Input id="vthWarningWindow" placeholder="Due soon warning window days" defaultValue={String((providerConfigQuery.data?.connection as { warning_window_days?: number } | undefined)?.warning_window_days ?? 30)} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    const apiBaseUrl = (document.getElementById("vthApiBaseUrl") as HTMLInputElement | null)?.value ?? "";
                    const portalBaseUrl = (document.getElementById("vthPortalBaseUrl") as HTMLInputElement | null)?.value ?? "";
                    const webhookSecret = (document.getElementById("vthWebhookSecret") as HTMLInputElement | null)?.value ?? "";
                    const apiToken = (document.getElementById("vthApiToken") as HTMLInputElement | null)?.value ?? "";
                    const pollingIntervalMinutes = Number((document.getElementById("vthPollingInterval") as HTMLInputElement | null)?.value ?? "30");
                    const warningWindowDays = Number((document.getElementById("vthWarningWindow") as HTMLInputElement | null)?.value ?? "30");

                    saveProviderConfigMutation.mutate({
                      providerCode: "vocational_training_hub",
                      enabled: true,
                      pollingEnabled: true,
                      pollingIntervalMinutes,
                      warningWindowDays,
                      certificateSyncEnabled: true,
                      courseCatalogSyncEnabled: true,
                      config: {
                        apiBaseUrl,
                        portalBaseUrl,
                        webhookSecret,
                        apiToken,
                        warningWindowDays,
                      },
                    });
                  }}
                  disabled={saveProviderConfigMutation.isPending}
                >
                  Save Provider Settings
                </Button>

                <Button variant="outline" onClick={() => runSyncMutation.mutate({ mode: "poll" })} disabled={runSyncMutation.isPending}>
                  Run Polling Sync
                </Button>
              </div>

              <div className="text-xs text-slate-500">Secrets remain server-side in provider connection config and are never returned to client responses after save.</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" /> ARIA Training Oversight Support
            </div>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>Summarise training compliance by home and role</li>
              <li>Draft concise manager commentary on training gaps</li>
              <li>Highlight repeated non-compliance patterns</li>
              <li>Generate report summaries for compliance packs</li>
              <li>Summarise sync failures for admin triage</li>
            </ul>
            <p className="text-xs text-slate-500 mt-3">ARIA remains read/assistive only and does not change completion status directly.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
