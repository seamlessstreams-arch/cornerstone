"use client";
import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wrench, Plus, AlertTriangle, CheckCircle2, Calendar,
  Flame, Zap, Droplets, Shield, X,
} from "lucide-react";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import { useMaintenance, useCreateMaintenanceItem, useUpdateMaintenanceItem } from "@/hooks/use-maintenance";
import type { MaintenanceItem } from "@/types/extended";
type MaintenancePriority = "urgent" | "high" | "medium" | "low";
type MaintenanceCategory = "hvac" | "fire_safety" | "plumbing" | "security" | "electrical" | "cleaning" | "general";

const CAT_ICONS: Record<string, React.ElementType> = {
  hvac: Flame, fire_safety: Shield, plumbing: Droplets,
  security: Shield, electrical: Zap, cleaning: Wrench, general: Wrench, default: Wrench,
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
};
const PRIO_COLORS: Record<string, string> = {
  urgent: "text-red-600", high: "text-orange-600", medium: "text-blue-600", low: "text-slate-400",
};

const CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: "hvac", label: "HVAC / Heating" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "plumbing", label: "Plumbing" },
  { value: "security", label: "Security" },
  { value: "electrical", label: "Electrical" },
  { value: "cleaning", label: "Cleaning" },
  { value: "general", label: "General" },
];

const EMPTY_FORM = {
  title: "", category: "general" as MaintenanceCategory, priority: "medium" as MaintenancePriority,
  due_date: "", assigned_to: "", notes: "", recurring: false,
};

export default function MaintenancePage() {
  const maintenanceQuery = useMaintenance();
  const items: MaintenanceItem[] = maintenanceQuery.data?.data ?? [];
  const createItem = useCreateMaintenanceItem();
  const updateItem = useUpdateMaintenanceItem();

  const [filter, setFilter] = useState<"all" | "open" | "completed">("all");
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const filtered = items.filter((m) =>
    filter === "all" ? true
    : filter === "open" ? m.status === "open" || m.status === "scheduled"
    : m.status === "completed"
  );
  const openCount = items.filter((m) => m.status === "open").length;
  const urgentCount = items.filter((m) => m.priority === "urgent" && m.status !== "completed").length;

  function handleMarkDone(id: string) {
    updateItem.mutate({ id, data: { status: "completed" } });
  }

  function handleLogIssue() {
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    setFormError("");
    createItem.mutate(
      {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        status: "open",
        due_date: form.due_date || daysFromNow(7),
        assigned_to: form.assigned_to?.trim() || null,
        notes: form.notes.trim(),
        recurring: form.recurring,
      },
      {
        onSuccess: () => {
          setShowLog(false);
          setForm(EMPTY_FORM);
        },
      }
    );
  }

  return (
    <>
      <PageShell
        title="Maintenance"
        subtitle="Property maintenance, safety checks, and scheduled works"
        quickCreateContext={{ module: "maintenance", defaultTaskCategory: "maintenance", defaultFormType: "health_safety_check" }}
        actions={
          <Button size="sm" onClick={() => setShowLog(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Log Issue
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Open Issues", value: openCount, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Urgent", value: urgentCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
              { label: "Scheduled Works", value: items.filter((m) => m.status === "scheduled").length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Completed (30d)", value: items.filter((m) => m.status === "completed").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                    <div className={cn("mt-1 text-3xl font-bold", color)}>{value}</div>
                  </div>
                  <div className={cn("rounded-2xl p-3", bg)}><Icon className={cn("h-5 w-5", color)} /></div>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base flex-1">Maintenance Log</CardTitle>
                <div className="flex gap-1">
                  {(["all", "open", "completed"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize",
                        filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >{f}</button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceQuery.isLoading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading maintenance items…</div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((item) => {
                    const Icon = CAT_ICONS[item.category] || Wrench;
                    return (
                      <div key={item.id} className={cn(
                        "rounded-xl border p-4 flex items-center gap-4",
                        item.priority === "urgent" && item.status !== "completed"
                          ? "border-red-200 bg-red-50"
                          : "border-slate-200 bg-white"
                      )}>
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{item.title}</span>
                            {item.recurring && (
                              <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-500">Recurring</Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.notes} {item.assigned_to && `· ${item.assigned_to}`}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">{formatDate(item.due_date)}</div>
                        <Badge className={cn("text-[9px] rounded-full capitalize", PRIO_COLORS[item.priority])}>{item.priority}</Badge>
                        <Badge className={cn("text-[10px] rounded-full capitalize", STATUS_COLORS[item.status] || "bg-slate-100")}>
                          {item.status}
                        </Badge>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled
                            title="Open the issue to edit its details."
                          >
                            Edit
                          </Button>
                          {item.status !== "completed" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleMarkDone(item.id)}
                              disabled={updateItem.isPending}
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No items in this view.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>

      {/* Log Issue Modal */}
      {showLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowLog(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-900">Log Maintenance Issue</span>
              <button onClick={() => setShowLog(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title <span className="text-red-500">*</span></label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Describe the issue…"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as MaintenanceCategory }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as MaintenancePriority }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Due Date</label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Assigned To</label>
                  <Input
                    value={form.assigned_to ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                    placeholder="Contractor or staff"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Additional details…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
                  className="rounded"
                />
                Recurring issue
              </label>

              {formError && <p className="text-xs text-red-600 font-medium">{formError}</p>}
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1"
                onClick={handleLogIssue}
                disabled={createItem.isPending}
              >
                <Plus className="h-4 w-4" />Log Issue
              </Button>
              <Button variant="outline" onClick={() => setShowLog(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
