"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION DETAIL PAGE
// Full record for a single medication: prescriber info, adherence analytics,
// full administration history (MAR), PRN log, stock levels, and special notes.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock, X,
  AlertTriangle, Pill, Package, Calendar, User, Shield,
  FileText, Info, ChevronDown, ChevronUp, Filter,
} from "lucide-react";
import { useMedicationDetail, useUpdateMedication } from "@/hooks/use-medication";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useStaff } from "@/hooks/use-staff";
import { cn, formatDate, todayStr } from "@/lib/utils";
import type { MedicationAdministration } from "@/types";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  given:            { label: "Given",           bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  late:             { label: "Late",            bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  refused:          { label: "Refused",         bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
  missed:           { label: "Missed",          bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",     dot: "bg-red-400"     },
  withheld:         { label: "Withheld",        bg: "bg-slate-50",    text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400"   },
  not_available:    { label: "Not Available",   bg: "bg-slate-50",    text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400"   },
  self_administered:{ label: "Self Admin",      bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
  scheduled:        { label: "Scheduled",       bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-300"    },
};

const TYPE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  regular:    { label: "Regular",    bg: "bg-blue-100",    text: "text-blue-700"    },
  prn:        { label: "PRN",        bg: "bg-amber-100",   text: "text-amber-700"   },
  controlled: { label: "Controlled", bg: "bg-red-100",     text: "text-red-700"     },
  topical:    { label: "Topical",    bg: "bg-emerald-100", text: "text-emerald-700" },
  inhaler:    { label: "Inhaler",    bg: "bg-sky-100",     text: "text-sky-700"     },
  injection:  { label: "Injection",  bg: "bg-purple-100",  text: "text-purple-700"  },
  other:      { label: "Other",      bg: "bg-slate-100",   text: "text-slate-600"   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function dateOf(iso: string): string {
  return iso.slice(0, 10);
}

// ── Administration Row ────────────────────────────────────────────────────────

function AdminRow({
  admin,
  staffName,
  witnessName,
  defaultOpen = false,
}: {
  admin: MedicationAdministration;
  staffName: string;
  witnessName: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = STATUS_CONFIG[admin.status] ?? STATUS_CONFIG.scheduled;
  const isException = ["refused", "missed", "late"].includes(admin.status);

  return (
    <div className={cn("rounded-xl border transition-all", cfg.border, isException && "border-l-4")}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/50 transition-colors rounded-xl"
      >
        <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", cfg.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-900">{formatDateTime(admin.scheduled_time)}</span>
            <span className={cn("text-xs rounded-full px-2.5 py-0.5 font-medium", cfg.bg, cfg.text, "border", cfg.border)}>
              {cfg.label}
            </span>
            {admin.actual_time && admin.actual_time !== admin.scheduled_time && (
              <span className="text-xs text-slate-400">Actual: {formatTime(admin.actual_time)}</span>
            )}
          </div>
          {!open && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {admin.dose_given ? `Dose: ${admin.dose_given}` : ""}
              {admin.administered_by ? ` · ${staffName}` : ""}
              {admin.reason_not_given ? ` · ${admin.reason_not_given}` : ""}
            </p>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {admin.dose_given && (
              <><dt className="text-slate-500">Dose given</dt><dd className="font-medium text-slate-900">{admin.dose_given}</dd></>
            )}
            {admin.administered_by && (
              <><dt className="text-slate-500">Administered by</dt><dd className="font-medium text-slate-900">{staffName}</dd></>
            )}
            {admin.witnessed_by && (
              <><dt className="text-slate-500">Witnessed by</dt><dd className="font-medium text-slate-900">{witnessName}</dd></>
            )}
            {admin.actual_time && (
              <><dt className="text-slate-500">Actual time</dt><dd className="font-medium text-slate-900">{formatTime(admin.actual_time)}</dd></>
            )}
          </dl>
          {admin.reason_not_given && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
              <strong>Reason not given:</strong> {admin.reason_not_given}
            </div>
          )}
          {admin.prn_reason && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
              <strong>PRN reason:</strong> {admin.prn_reason}
              {admin.prn_effectiveness && <><br /><strong>Effectiveness:</strong> {admin.prn_effectiveness}</>}
            </div>
          )}
          {admin.notes && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-700">
              <strong>Notes:</strong> {admin.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stock Update Modal ────────────────────────────────────────────────────────

function StockModal({ medicationId, current, onClose }: { medicationId: string; current: number | null; onClose: () => void }) {
  const updateMedication = useUpdateMedication();
  const [count, setCount] = useState(current ?? 0);
  const [error, setError] = useState("");

  function handleSave() {
    if (count < 0) { setError("Stock count cannot be negative"); return; }
    updateMedication.mutate(
      { id: medicationId, stock_count: count, stock_last_checked: todayStr() },
      {
        onSuccess: () => onClose(),
        onError: (e) => setError(e.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Update Stock Count</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Current Stock (units)</label>
          <input
            type="number"
            min={0}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={updateMedication.isPending}
          >
            {updateMedication.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MedicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);

  const detailQuery = useMedicationDetail(id);
  const ypQuery     = useYoungPeople();
  const staffQuery  = useStaff();

  const allYP    = ypQuery.data?.data ?? [];
  const allStaff = staffQuery.data?.data ?? [];

  const medication    = detailQuery.data?.data.medication;
  const administrations = detailQuery.data?.data.administrations ?? [];
  const meta            = detailQuery.data?.meta;

  const youngPerson = allYP.find((y) => y.id === medication?.child_id);

  const staffName  = (id2: string | null) => allStaff.find((s) => s.id === id2)?.full_name ?? id2 ?? "Unknown";

  // Filter + group by date
  const filtered = useMemo(() =>
    statusFilter ? administrations.filter((a) => a.status === statusFilter) : administrations,
    [administrations, statusFilter]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, MedicationAdministration[]>();
    for (const a of filtered) {
      const day = dateOf(a.scheduled_time);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(a);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (detailQuery.isLoading) {
    return (
      <PageShell title="Medication" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-sm">Loading medication record…</span>
        </div>
      </PageShell>
    );
  }

  if (detailQuery.isError || !medication) {
    return (
      <PageShell title="Not found" showQuickCreate={false}>
        <div className="max-w-md mx-auto mt-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-sm text-slate-600">Medication record could not be found.</p>
          <Link href="/medication">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const typeCfg = TYPE_STYLES[medication.type] ?? TYPE_STYLES.other;
  const isLowStock = medication.stock_count !== null && medication.stock_count < 10;
  const today = todayStr();

  return (
    <>
      <PageShell
        title={medication.name}
        subtitle={`${medication.dosage} · ${medication.frequency}`}
        showQuickCreate={false}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/medication">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />Medication
              </Button>
            </Link>
            {youngPerson && (
              <Link href={`/young-people/${youngPerson.id}`}>
                <Button variant="outline" size="sm">
                  <User className="h-3.5 w-3.5 mr-1" />{youngPerson.first_name}&apos;s Profile
                </Button>
              </Link>
            )}
          </div>
        }
      >
        <div className="space-y-5">

          {/* ── Hero card ─────────────────────────────────────────────────── */}
          <div className="rounded-3xl border bg-white p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className={cn("rounded-2xl p-3.5", typeCfg.bg)}>
                  <Pill className={cn("h-6 w-6", typeCfg.text)} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{medication.name}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{medication.dosage} · {medication.route}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className={cn("text-sm rounded-full px-3 py-1 font-medium border", typeCfg.bg, typeCfg.text)}>
                  {typeCfg.label}
                </span>
                {!medication.is_active && (
                  <span className="text-sm rounded-full px-3 py-1 font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    Inactive
                  </span>
                )}
                {youngPerson && (
                  <span className="text-sm rounded-full px-3 py-1 font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {youngPerson.first_name} {youngPerson.last_name}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">Frequency</span>
                <span className="font-medium text-slate-900">{medication.frequency}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">Prescriber</span>
                <span className="font-medium text-slate-900">{medication.prescriber}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">Start Date</span>
                <span className="font-medium text-slate-900">{formatDate(medication.start_date)}</span>
              </div>
              {medication.end_date && (
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">End Date</span>
                  <span className={cn("font-medium", medication.end_date < today ? "text-red-600" : "text-slate-900")}>
                    {formatDate(medication.end_date)}
                  </span>
                </div>
              )}
              {medication.pharmacy && (
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Pharmacy</span>
                  <span className="font-medium text-slate-900">{medication.pharmacy}</span>
                </div>
              )}
              {medication.stock_count !== null && (
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Stock</span>
                  <span className={cn("font-medium", isLowStock ? "text-red-600" : "text-slate-900")}>
                    {medication.stock_count} units
                    {medication.stock_last_checked && <span className="text-slate-400 font-normal"> · checked {formatDate(medication.stock_last_checked)}</span>}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Alerts ────────────────────────────────────────────────────── */}
          {(isLowStock || (medication.end_date && medication.end_date < today)) && (
            <div className="space-y-2">
              {isLowStock && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">Low stock — {medication.stock_count} units remaining</p>
                    <p className="text-xs text-amber-600 mt-0.5">Request a prescription renewal or contact the pharmacy.</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setShowStockModal(true)}>
                    Update Stock
                  </Button>
                </div>
              )}
              {medication.end_date && medication.end_date < today && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <p className="text-sm font-semibold text-red-800">Prescription ended on {formatDate(medication.end_date)}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Adherence stats ────────────────────────────────────────────── */}
          {meta && meta.total > 0 && (
            <div className="rounded-2xl border bg-white p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Adherence Overview</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl font-bold text-slate-900">
                  {meta.adherence !== null ? `${meta.adherence}%` : "—"}
                </span>
                <div className="flex-1">
                  <Progress value={meta.adherence ?? 0} className="h-2.5" />
                  <p className="text-xs text-slate-400 mt-1">{meta.given} given of {meta.total} doses</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { label: "Given",   value: meta.given,   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
                  { label: "Late",    value: meta.late,    color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   warn: meta.late > 0 },
                  { label: "Refused", value: meta.refused, color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     warn: meta.refused > 0 },
                  { label: "Missed",  value: meta.missed,  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-300",     warn: meta.missed > 0 },
                ].map(({ label, value, color, bg, border, warn }) => (
                  <div key={label} className={cn("rounded-xl border p-3 text-center", warn ? border : "border-slate-100", warn ? bg : "bg-white")}>
                    <div className={cn("text-xl font-bold", color)}>{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Special info ───────────────────────────────────────────────── */}
          {(medication.special_instructions || medication.side_effects) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medication.special_instructions && (
                <div className="rounded-2xl border bg-white p-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />Special Instructions
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{medication.special_instructions}</p>
                </div>
              )}
              {medication.side_effects && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />Known Side Effects
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">{medication.side_effects}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Stock management card ──────────────────────────────────────── */}
          {medication.stock_count !== null && !isLowStock && (
            <div className="rounded-2xl border bg-white p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-xl p-2.5", isLowStock ? "bg-red-100" : "bg-slate-100")}>
                  <Package className={cn("h-5 w-5", isLowStock ? "text-red-600" : "text-slate-600")} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{medication.stock_count} units in stock</p>
                  {medication.stock_last_checked && (
                    <p className="text-xs text-slate-400">Last checked {formatDate(medication.stock_last_checked)}</p>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowStockModal(true)}>
                Update Stock
              </Button>
            </div>
          )}

          {/* ── Administration history ─────────────────────────────────────── */}
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />Administration History
                {administrations.length > 0 && <span className="text-slate-400 normal-case">({administrations.length} records)</span>}
              </h3>

              {/* Status filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[null, "given", "refused", "missed", "late"].map((s) => (
                  <button
                    key={s ?? "all"}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "text-xs rounded-full px-2.5 py-1 border transition-colors",
                      statusFilter === s
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {s ? (STATUS_CONFIG[s]?.label ?? s) : "All"}
                  </button>
                ))}
              </div>
            </div>

            {administrations.length === 0 ? (
              <div className="rounded-xl bg-slate-50 py-10 text-center">
                <Pill className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No administration records found</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-slate-50 py-8 text-center">
                <Filter className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No records match the selected filter</p>
              </div>
            ) : (
              <div className="space-y-5">
                {byDate.map(([day, entries]) => {
                  const dayLabel = day === todayStr() ? "Today"
                    : day === (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })() ? "Yesterday"
                    : formatDate(day);
                  return (
                    <div key={day}>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{dayLabel}</div>
                      <div className="space-y-2">
                        {entries.map((admin) => (
                          <AdminRow
                            key={admin.id}
                            admin={admin}
                            staffName={staffName(admin.administered_by)}
                            witnessName={staffName(admin.witnessed_by)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </PageShell>

      {showStockModal && medication.stock_count !== null && (
        <StockModal
          medicationId={medication.id}
          current={medication.stock_count}
          onClose={() => setShowStockModal(false)}
        />
      )}
    </>
  );
}
