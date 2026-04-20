"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — YOUNG PERSON PROFILE PAGE
// Full profile for an individual young person: placement, health, education,
// contacts, risk, incidents, tasks, medications, chronology, missing episodes.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft, Heart, AlertTriangle, Shield, Pill, Calendar,
  GraduationCap, Phone, Mail, User, MapPin, FileText,
  CheckSquare, BookOpen, Activity, Loader2, AlertCircle,
  ChevronRight, Clock,
} from "lucide-react";
import { useYoungPerson } from "@/hooks/use-young-people";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { INCIDENT_TYPE_LABELS } from "@/lib/constants";
import type { Incident, Task, Medication, CareForm, DailyLogEntry } from "@/types";

// ── Severity badge config ─────────────────────────────────────────────────────
const SEV_BADGE: Record<string, string> = {
  low:      "bg-slate-100 text-slate-700",
  medium:   "bg-amber-100 text-amber-800",
  high:     "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" />{label}
      {count !== undefined && (
        <span className="ml-auto text-[10px] font-normal text-slate-400">{count} record{count !== 1 ? "s" : ""}</span>
      )}
    </h3>
  );
}

// ── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />}
      <span className="text-slate-500 shrink-0 w-32">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}

// ── Tab types ─────────────────────────────────────────────────────────────────
type ProfileTab = "overview" | "incidents" | "tasks" | "medications" | "chronology" | "forms";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function YoungPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTab>("overview");

  const query = useYoungPerson(id);
  const yp      = query.data?.data;
  const related = query.data?.related;
  const meta    = query.data?.meta;

  if (query.isLoading) {
    return (
      <PageShell title="Young Person Profile" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading profile…</span>
        </div>
      </PageShell>
    );
  }

  if (query.isError || !yp) {
    return (
      <PageShell title="Young Person Profile" showQuickCreate={false}>
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-slate-600">Profile not found</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/young-people")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
          </Button>
        </div>
      </PageShell>
    );
  }

  const displayName = yp.preferred_name ?? yp.first_name;
  const hasRisk     = yp.risk_flags.length > 0;

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview",    label: "Overview",    icon: User },
    { id: "incidents",   label: "Incidents",   icon: AlertTriangle, count: meta?.total_incidents },
    { id: "tasks",       label: "Tasks",       icon: CheckSquare,   count: meta?.active_tasks    },
    { id: "medications", label: "Medication",  icon: Pill,          count: related?.medications.length },
    { id: "chronology",  label: "Chronology",  icon: Activity,      count: (related?.chronology as unknown[])?.length },
    { id: "forms",       label: "Forms",       icon: FileText,      count: related?.care_forms.length },
  ];

  return (
    <PageShell
      title={`${displayName} ${yp.last_name}`}
      subtitle={`${yp.legal_status} · ${yp.local_authority} · Age ${yp.age}`}
      showQuickCreate={false}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push("/young-people")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />All Young People
        </Button>
      }
    >
      <div className="space-y-5 animate-fade-in">

        {/* ── Profile header ────────────────────────────────────────────────── */}
        <div className={cn(
          "rounded-2xl border bg-white p-5",
          hasRisk && "border-l-4 border-l-amber-400"
        )}>
          <div className="flex items-start gap-4">
            <Avatar name={displayName} size="lg" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{displayName} {yp.last_name}</h2>
                <Badge variant={yp.status === "current" ? "success" : "secondary"} className="rounded-full capitalize text-[10px]">
                  {yp.status}
                </Badge>
                {hasRisk && (
                  <Badge variant="warning" className="rounded-full text-[9px] gap-0.5">
                    <AlertTriangle className="h-2.5 w-2.5" />Risk flags
                  </Badge>
                )}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">{yp.placement_type} · {yp.local_authority}</div>

              {/* Stat row */}
              <div className="mt-3 flex flex-wrap gap-4">
                {[
                  { label: "Open Incidents", value: meta?.open_incidents ?? 0, color: meta?.open_incidents ? "text-red-600" : "text-emerald-600" },
                  { label: "Active Tasks",   value: meta?.active_tasks    ?? 0, color: meta?.active_tasks   ? "text-amber-600" : "text-slate-700" },
                  { label: "Medications",    value: yp.active_medications ?? 0, color: "text-blue-600"  },
                  { label: "Missing Eps",    value: yp.missing_episodes_total ?? 0, color: yp.missing_episodes_total ? "text-violet-600" : "text-slate-700" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <div className={cn("text-2xl font-bold leading-none", color)}>{value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk flags */}
          {hasRisk && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {yp.risk_flags.map((flag) => (
                <Badge key={flag} variant="warning" className="text-[9px] rounded-full gap-0.5 px-2 py-0.5">
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" />{flag}
                </Badge>
              ))}
            </div>
          )}

          {/* Allergies */}
          {yp.allergies.length > 0 && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              <strong>Allergy:</strong> {yp.allergies.join(", ")}
            </div>
          )}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="flex gap-0.5 overflow-x-auto pb-0.5">
          {tabs.map(({ id: tabId, label, icon: Icon, count }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-semibold border-b-2 whitespace-nowrap transition-all",
                tab === tabId
                  ? "border-slate-900 text-slate-900 bg-slate-50"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" />{label}
              {count !== undefined && count > 0 && (
                <span className={cn("ml-0.5 rounded-full px-1.5 text-[9px] font-bold", tab === tabId ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600")}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview tab ──────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Placement */}
            <div className="rounded-2xl border bg-white p-4 space-y-2">
              <SectionHeading icon={MapPin} label="Placement Details" />
              <InfoRow label="Placement start"  value={formatDate(yp.placement_start)} />
              {yp.placement_end && <InfoRow label="Placement end" value={formatDate(yp.placement_end)} />}
              <InfoRow label="Placement type"   value={yp.placement_type} />
              <InfoRow label="Legal status"     value={yp.legal_status} />
              <InfoRow label="Local authority"  value={yp.local_authority} />
              <InfoRow label="Date of birth"    value={formatDate(yp.date_of_birth)} />
              <InfoRow label="Gender"           value={yp.gender} />
              {yp.ethnicity && <InfoRow label="Ethnicity"  value={yp.ethnicity} />}
              {yp.religion  && <InfoRow label="Religion"   value={yp.religion}  />}
              {yp.dietary_requirements && <InfoRow label="Dietary req." value={yp.dietary_requirements} />}
            </div>

            {/* Key contacts */}
            <div className="rounded-2xl border bg-white p-4 space-y-4">
              <SectionHeading icon={User} label="Key Contacts" />

              {/* Key worker */}
              {yp.key_worker && (
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Key Worker</div>
                  <div className="flex items-center gap-2">
                    <Avatar name={yp.key_worker.full_name} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{yp.key_worker.full_name}</div>
                      <div className="text-[10px] text-slate-500">{yp.key_worker.job_title}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary worker */}
              {yp.secondary_worker && (
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Secondary Worker</div>
                  <div className="flex items-center gap-2">
                    <Avatar name={yp.secondary_worker.full_name} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{yp.secondary_worker.full_name}</div>
                      <div className="text-[10px] text-slate-500">{yp.secondary_worker.job_title}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social worker */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Social Worker</div>
                <div className="text-xs font-semibold text-slate-900">{yp.social_worker_name}</div>
                {yp.social_worker_phone && (
                  <a href={`tel:${yp.social_worker_phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Phone className="h-3 w-3" />{yp.social_worker_phone}
                  </a>
                )}
                {yp.social_worker_email && (
                  <a href={`mailto:${yp.social_worker_email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Mail className="h-3 w-3" />{yp.social_worker_email}
                  </a>
                )}
              </div>

              {/* IRO */}
              {yp.iro_name && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">IRO</div>
                  <div className="text-xs font-semibold text-slate-900">{yp.iro_name}</div>
                  {yp.iro_phone && (
                    <a href={`tel:${yp.iro_phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Phone className="h-3 w-3" />{yp.iro_phone}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Health */}
            <div className="rounded-2xl border bg-white p-4 space-y-2">
              <SectionHeading icon={Pill} label="Health" />
              {yp.gp_name && <InfoRow label="GP" value={yp.gp_name} />}
              {yp.gp_phone && (
                <div className="flex items-center gap-1 text-xs">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <a href={`tel:${yp.gp_phone}`} className="text-blue-600 hover:underline">{yp.gp_phone}</a>
                </div>
              )}
              {yp.dietary_requirements && <InfoRow label="Dietary req." value={yp.dietary_requirements} />}
              {yp.allergies.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-2 py-1.5 text-xs text-red-700">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  <strong>Allergies:</strong> {yp.allergies.join(", ")}
                </div>
              )}
              {related?.medications.length === 0 && (
                <p className="text-xs text-slate-400 italic">No active medications</p>
              )}
              {related?.medications.map((med: Medication) => (
                <div key={med.id} className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-xs">
                  <div className="font-semibold text-blue-900">{med.name} {med.dosage}</div>
                  <div className="text-blue-700 mt-0.5">{med.frequency}</div>
                  {med.special_instructions && <div className="text-blue-600 mt-0.5 italic">{med.special_instructions}</div>}
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="rounded-2xl border bg-white p-4 space-y-2">
              <SectionHeading icon={GraduationCap} label="Education" />
              {yp.school_name
                ? (
                  <>
                    <InfoRow label="School" value={yp.school_name} />
                    {yp.school_contact && (
                      <a href={`tel:${yp.school_contact}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <Phone className="h-3 w-3" />{yp.school_contact}
                      </a>
                    )}
                  </>
                )
                : <p className="text-xs text-slate-400 italic">No school placement recorded</p>
              }
            </div>
          </div>
        )}

        {/* ── Incidents tab ─────────────────────────────────────────────────── */}
        {tab === "incidents" && (
          <div className="space-y-2">
            {!related?.incidents.length && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <div className="text-sm text-slate-500">No incidents recorded</div>
              </div>
            )}
            {related?.incidents.map((inc: Incident) => (
              <div
                key={inc.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/incidents/${inc.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/incidents/${inc.id}`)}
                className="rounded-2xl border bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{inc.reference}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", SEV_BADGE[inc.severity])}>
                        {inc.severity}
                      </span>
                      <Badge variant={inc.status === "open" ? "destructive" : inc.status === "closed" ? "success" : "warning"}
                        className="text-[9px] rounded-full capitalize">
                        {inc.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{INCIDENT_TYPE_LABELS[inc.type]}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">{formatDate(inc.date)}</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2">{inc.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tasks tab ─────────────────────────────────────────────────────── */}
        {tab === "tasks" && (
          <div className="space-y-2">
            {!related?.tasks.length && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <div className="text-sm text-slate-500">No active tasks linked to this young person</div>
              </div>
            )}
            {related?.tasks.map((task: Task) => (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/tasks/${task.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/tasks/${task.id}`)}
                className="rounded-2xl border bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                    {task.assigned_to && (
                      <div className="text-xs text-slate-500 mt-0.5">Assigned to {getStaffName(task.assigned_to)}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.due_date && (
                      <span className={cn("text-xs font-medium", task.due_date < new Date().toISOString().slice(0, 10) ? "text-red-600" : "text-slate-500")}>
                        {formatRelative(task.due_date)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Medications tab ───────────────────────────────────────────────── */}
        {tab === "medications" && (
          <div className="space-y-3">
            {!related?.medications.length && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                <Pill className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <div className="text-sm text-slate-500">No active medications</div>
              </div>
            )}
            {related?.medications.map((med: Medication) => (
              <div key={med.id} className="rounded-2xl border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{med.name} — {med.dosage}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{med.type === "regular" ? "Regular" : "PRN (as required)"}</div>
                  </div>
                  <Badge variant={med.type === "regular" ? "default" : "secondary"} className="text-[9px] rounded-full capitalize">
                    {med.type}
                  </Badge>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Frequency: </span><span className="font-medium text-slate-700">{med.frequency}</span></div>
                  <div><span className="text-slate-400">Route: </span><span className="font-medium text-slate-700">{med.route}</span></div>
                  <div><span className="text-slate-400">Prescriber: </span><span className="font-medium text-slate-700">{med.prescriber}</span></div>
                  <div><span className="text-slate-400">Pharmacy: </span><span className="font-medium text-slate-700">{med.pharmacy}</span></div>
                  <div><span className="text-slate-400">Stock: </span><span className="font-medium text-slate-700">{med.stock_count} remaining</span></div>
                  <div><span className="text-slate-400">Started: </span><span className="font-medium text-slate-700">{formatDate(med.start_date)}</span></div>
                </div>
                {med.special_instructions && (
                  <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800">
                    {med.special_instructions}
                  </div>
                )}
                {med.side_effects && (
                  <div className="mt-2 text-xs text-slate-500">
                    <span className="font-medium">Side effects: </span>{med.side_effects}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Chronology tab ────────────────────────────────────────────────── */}
        {tab === "chronology" && (
          <div className="space-y-2">
            {!(related?.chronology as unknown[])?.length && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <div className="text-sm text-slate-500">No chronology entries recorded</div>
              </div>
            )}
            {(related?.chronology as Array<{ id: string; date: string; time: string | null; category: string; title: string; description: string; significance: string; recorded_by: string }>)?.map((entry) => (
              <div key={entry.id} className={cn(
                "rounded-2xl border bg-white p-4 border-l-4",
                entry.significance === "critical" ? "border-l-red-500" :
                entry.significance === "significant" ? "border-l-amber-500" : "border-l-slate-300"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{entry.title}</span>
                      {entry.significance === "critical" && (
                        <Badge variant="destructive" className="text-[9px] rounded-full">Critical</Badge>
                      )}
                      {entry.significance === "significant" && (
                        <Badge variant="warning" className="text-[9px] rounded-full">Significant</Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 capitalize">
                      {entry.category.replace("_", " ")} · {formatDate(entry.date)}{entry.time && ` at ${entry.time}`}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{entry.description}</p>
                <div className="text-[10px] text-slate-400 mt-2">Recorded by {getStaffName(entry.recorded_by)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Forms tab ─────────────────────────────────────────────────────── */}
        {tab === "forms" && (
          <div className="space-y-2">
            {!related?.care_forms.length && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <div className="text-sm text-slate-500">No care forms linked to this young person</div>
              </div>
            )}
            {related?.care_forms.map((form: CareForm) => (
              <div
                key={form.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/forms/${form.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/forms/${form.id}`)}
                className="rounded-2xl border bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{form.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 capitalize">{form.form_type.replace("_", " ")}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={form.status === "approved" ? "success" : form.status === "pending_review" ? "warning" : "secondary"}
                      className="text-[9px] rounded-full capitalize">
                      {form.status.replace("_", " ")}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </PageShell>
  );
}
