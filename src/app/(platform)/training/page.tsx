"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, Search, Plus, AlertTriangle, CheckCircle2, Clock,
  XCircle, Shield, Loader2,
} from "lucide-react";
import { getStaffName } from "@/lib/seed-data";
import { useTraining } from "@/hooks/use-training";
import { useStaff } from "@/hooks/use-staff";
import { cn, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  compliant:    { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Compliant"    },
  expiring_soon:{ color: "bg-amber-100 text-amber-700",    icon: Clock,        label: "Expiring Soon" },
  expired:      { color: "bg-red-100 text-red-700",         icon: XCircle,      label: "Expired"       },
  not_started:  { color: "bg-slate-100 text-slate-600",    icon: AlertTriangle, label: "Not Started"  },
};

export default function TrainingPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [view, setView] = useState<"matrix" | "list">("matrix");

  const trainingQuery = useTraining();
  const staffQuery = useStaff();

  const allRecords = useMemo(() => trainingQuery.data?.data ?? [], [trainingQuery.data?.data]);
  const meta = trainingQuery.data?.meta;
  const activeStaff = useMemo(
    () => (staffQuery.data?.data ?? []).filter((s) => s.role !== "responsible_individual"),
    [staffQuery.data?.data]
  );

  const courses = useMemo(() => [...new Set(allRecords.map((t) => t.course_name))], [allRecords]);

  const filtered = useMemo(() => {
    let list = [...allRecords];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.course_name.toLowerCase().includes(q) ||
        getStaffName(t.staff_id).toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    return list;
  }, [allRecords, search, filterStatus]);

  const isLoading = trainingQuery.isPending || staffQuery.isPending;

  return (
    <PageShell
      title="Training & Compliance"
      subtitle={
        meta
          ? `${meta.rate}% overall compliance · ${meta.expired} expired · ${meta.expiring} expiring`
          : "Loading…"
      }
      quickCreateContext={{ module: "training", defaultTaskCategory: "training" }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled title="Training records are uploaded via the Documents section.">
            <Plus className="h-3.5 w-3.5" /> Add Record
          </Button>
          <Button size="sm" disabled title="Compliance reports are generated from the Reports page.">
            Compliance Report
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-2xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{meta?.total ?? "—"}</div>
            <div className="text-xs text-slate-500">Total Records</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{meta?.compliant ?? "—"}</div>
            <div className="text-xs text-slate-500">Compliant</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{meta?.expiring ?? "—"}</div>
            <div className="text-xs text-slate-500">Expiring Soon</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{meta?.expired ?? "—"}</div>
            <div className="text-xs text-slate-500">Expired</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center">
            {meta ? (
              <>
                <Progress
                  value={meta.rate}
                  color={meta.rate > 80 ? "bg-emerald-500" : meta.rate > 60 ? "bg-amber-500" : "bg-red-500"}
                  className="mt-1"
                />
                <div className="text-lg font-bold text-slate-900 mt-1">{meta.rate}%</div>
              </>
            ) : (
              <div className="text-2xl font-bold text-slate-300">—</div>
            )}
            <div className="text-xs text-slate-500">Compliance Rate</div>
          </div>
        </div>

        {/* Alert banner */}
        {meta && meta.expired > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-800">
                {meta.expired} training record{meta.expired > 1 ? "s" : ""} expired
              </div>
              <div className="text-xs text-red-600 mt-0.5">
                Staff with expired mandatory training should not work unsupervised until recertified.
              </div>
            </div>
          </div>
        )}

        {/* Filters + view toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search training…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {Object.entries(STATUS_STYLES).map(([key, cfg]) => (
              <Button
                key={key}
                variant={filterStatus === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(filterStatus === key ? null : key)}
                className="gap-1"
              >
                <cfg.icon className="h-3 w-3" />{cfg.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            <Button variant={view === "matrix" ? "default" : "outline"} size="sm" onClick={() => setView("matrix")}>Matrix</Button>
            <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>List</Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* Matrix View */}
        {!isLoading && view === "matrix" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 w-[180px] sticky left-0 bg-slate-50 z-10">Staff</th>
                    {courses.map((course) => (
                      <th key={course} className="py-3 px-2 text-center text-[10px] font-medium text-slate-600 min-w-[100px]">
                        <div className="truncate">{course}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map((staff) => (
                    <tr key={staff.id} className="border-b hover:bg-slate-50/50">
                      <td className="py-2 px-4 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <Avatar name={staff.full_name} size="sm" />
                          <div>
                            <div className="text-xs font-medium text-slate-900">{staff.full_name}</div>
                            <div className="text-[10px] text-slate-400">{staff.job_title}</div>
                          </div>
                        </div>
                      </td>
                      {courses.map((course) => {
                        const record = allRecords.find((t) => t.staff_id === staff.id && t.course_name === course);
                        if (!record) {
                          return <td key={course} className="py-2 px-2 text-center"><div className="text-[10px] text-slate-300">—</div></td>;
                        }
                        const cfg = STATUS_STYLES[record.status] ?? STATUS_STYLES.not_started;
                        const Icon = cfg.icon;
                        return (
                          <td key={course} className="py-2 px-2 text-center">
                            <div className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-medium", cfg.color)}>
                              <Icon className="h-3 w-3" />
                              {record.expiry_date ? formatDate(record.expiry_date).split(",")[0] : cfg.label}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* List View */}
        {!isLoading && view === "list" && (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border bg-white p-12 text-center">
                <GraduationCap className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                <div className="text-sm text-slate-500">No training records match your filters</div>
              </div>
            ) : (
              filtered.map((record) => {
                const cfg = STATUS_STYLES[record.status] ?? STATUS_STYLES.not_started;
                const Icon = cfg.icon;
                return (
                  <div key={record.id} className="rounded-xl border bg-white p-4 flex items-center gap-4 hover:shadow-sm transition-all">
                    <div className={cn("rounded-full p-2 shrink-0", cfg.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{record.course_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{getStaffName(record.staff_id)}</span>
                        {record.provider && <span className="text-slate-400">via {record.provider}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {record.expiry_date && (
                        <div className={cn("text-xs font-medium", record.status === "expired" ? "text-red-600" : record.status === "expiring_soon" ? "text-amber-600" : "text-slate-500")}>
                          {record.status === "expired" ? "Expired" : "Expires"} {formatDate(record.expiry_date)}
                        </div>
                      )}
                      <Badge className={cn("text-[9px] rounded-full mt-1", cfg.color)}>{cfg.label}</Badge>
                    </div>
                    {record.is_mandatory && <Shield className="h-4 w-4 text-blue-400 shrink-0" aria-label="Mandatory" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
