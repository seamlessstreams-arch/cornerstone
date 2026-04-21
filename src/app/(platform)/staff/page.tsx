"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Search, Plus, Users, Clock, Shield, GraduationCap,
  Mail, Phone, ChevronRight, AlertTriangle,
  Loader2, Calendar,
} from "lucide-react";
import { useStaff, useCreateStaff, type StaffEnriched } from "@/hooks/use-staff";
import { cn, todayStr, formatDate } from "@/lib/utils";
import { ROLE_LABELS, SYSTEM_ROLES, EMPLOYMENT_TYPES } from "@/lib/constants";
import { api } from "@/hooks/use-api";
import { useOpenTrainingLink } from "@/hooks/use-training-open-link";

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffEnriched | null>(null);
  const [activeStaffTab, setActiveStaffTab] = useState<"overview" | "training">("overview");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: "", last_name: "", role: "residential_care_worker", employment_type: "permanent", email: "", phone: "", start_date: "", contracted_hours: "37.5", dbs_number: "", dbs_issue_date: "" });
  const [addError, setAddError] = useState("");
  const createStaff = useCreateStaff();
  const today = todayStr();
  const openTrainingMutation = useOpenTrainingLink();

  const { data, isLoading, isError } = useStaff();
  const staffList: StaffEnriched[] = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const roles = useMemo(() => [...new Set(staffList.map((s) => s.role))], [staffList]);

  const filtered = useMemo(() => {
    let list = staffList;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q) || s.job_title.toLowerCase().includes(q));
    }
    if (filterRole) list = list.filter((s) => s.role === filterRole);
    return list;
  }, [staffList, search, filterRole]);

  const staffTrainingQuery = useQuery({
    queryKey: ["staff-training-detail", selectedStaff?.id],
    enabled: Boolean(selectedStaff?.id),
    queryFn: () =>
      api.get<{
        data: Array<{
          id: string;
          course_name: string;
          status: "compliant" | "expiring_soon" | "expired" | "not_started";
          completed_date: string | null;
          expiry_date: string | null;
          certificate_url: string | null;
          is_mandatory: boolean;
          direct_course_url?: string | null;
          course_id?: string;
        }>;
      }>(`/training?staff_id=${selectedStaff?.id ?? ""}`),
  });

  return (
    <>
    <PageShell
      title="Staff"
      subtitle={meta ? `${meta.total} active team members · ${meta.on_shift} on shift today` : "Loading…"}
      quickCreateContext={{ module: "staff", defaultTaskCategory: "admin" }}
      actions={
        <Button size="sm" onClick={() => setShowAddStaff(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Staff Member
        </Button>
      }
    >
      <div className="space-y-6 animate-fade-in">

        {/* Stats bar */}
        {meta && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Active Staff", value: meta.total, icon: Users, color: "text-slate-900", bg: "bg-slate-50" },
              { label: "On Shift Today", value: meta.on_shift, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "On Leave", value: meta.on_leave, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Bank Staff", value: meta.bank, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Supervision Overdue", value: meta.supervision_overdue, icon: AlertTriangle, color: meta.supervision_overdue > 0 ? "text-red-600" : "text-emerald-600", bg: meta.supervision_overdue > 0 ? "bg-red-50" : "bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-3">
                <div className={cn("rounded-xl p-2", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div>
                  <div className={cn("text-xl font-bold tabular-nums", color)}>{value}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant={!filterRole ? "default" : "outline"} size="sm" onClick={() => setFilterRole(null)}>All</Button>
            {roles.map((role) => (
              <Button key={role} variant={filterRole === role ? "default" : "outline"} size="sm" onClick={() => setFilterRole(filterRole === role ? null : role)}>
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 inline mr-2" />Failed to load staff. Please refresh.
          </div>
        )}

        {/* Staff Grid */}
        {!isLoading && !isError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((staff) => (
              <Card
                key={staff.id}
                className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
                onClick={() => router.push(`/staff/${staff.id}`)}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar name={staff.full_name} size="lg" />
                      {staff.is_on_shift_today && staff.today_shift_status === "in_progress" && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" title="On shift" />
                      )}
                      {staff.is_on_leave_today && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 border-2 border-white" title="On leave" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{staff.full_name}</div>
                      <div className="text-xs text-slate-500">{staff.job_title}</div>
                      {staff.probation_end_date && staff.probation_end_date > today && (
                        <Badge variant="warning" className="text-[9px] mt-1 rounded-full">Probation</Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className={cn("text-lg font-bold", staff.overdue_tasks > 0 ? "text-red-600" : "text-slate-900")}>
                        {staff.active_tasks}
                      </div>
                      <div className="text-[10px] text-slate-500">Tasks</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className={cn("text-lg font-bold", staff.training_expired_count > 0 ? "text-red-600" : "text-emerald-600")}>
                        {staff.training_total_count - staff.training_expired_count}/{staff.training_total_count}
                      </div>
                      <div className="text-[10px] text-slate-500">Training</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className="text-lg font-bold text-slate-900">{staff.contracted_hours}h</div>
                      <div className="text-[10px] text-slate-500">Contracted</div>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {staff.is_on_shift_today && (
                      <Badge variant="success" className="text-[9px] rounded-full gap-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse-dot" />
                        {staff.today_shift_type === "day" ? "Day shift" : staff.today_shift_type === "sleep_in" ? "Sleep-in" : staff.today_shift_type ?? "On shift"}
                      </Badge>
                    )}
                    {staff.is_on_leave_today && <Badge variant="warning" className="text-[9px] rounded-full">On leave</Badge>}
                    {staff.overdue_tasks > 0 && <Badge variant="destructive" className="text-[9px] rounded-full">{staff.overdue_tasks} overdue</Badge>}
                    {staff.training_expired_count > 0 && <Badge variant="destructive" className="text-[9px] rounded-full">{staff.training_expired_count} training expired</Badge>}
                    {staff.supervision_overdue && <Badge variant="warning" className="text-[9px] rounded-full">Supervision due</Badge>}
                  </div>

                  {/* Contact */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400">
                    {staff.email && <span className="flex items-center gap-0.5 truncate"><Mail className="h-3 w-3" />{staff.email}</span>}
                    {staff.phone && <span className="flex items-center gap-0.5 shrink-0"><Phone className="h-3 w-3" />{staff.phone}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filtered.length === 0 && !isLoading && (
              <div className="col-span-4 flex flex-col items-center justify-center py-20 text-center">
                <Users className="h-10 w-10 text-slate-200 mb-3" />
                <div className="text-slate-500 font-medium">No staff members match your search</div>
                <div className="text-xs text-slate-400 mt-1">Try adjusting your filters</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff Detail Panel */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={() => setSelectedStaff(null)}>
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selectedStaff.full_name} size="lg" />
                <div>
                  <div className="text-lg font-bold text-slate-900">{selectedStaff.full_name}</div>
                  <div className="text-sm text-slate-500">{selectedStaff.job_title}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelectedStaff(null)}>
                <span className="sr-only">Close</span>&times;
              </Button>
                <div className="flex items-center gap-1 rounded-lg border bg-slate-50 p-1">
                  <Button
                    variant={activeStaffTab === "overview" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveStaffTab("overview")}
                  >
                    Overview
                  </Button>
                  <Button
                    variant={activeStaffTab === "training" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveStaffTab("training")}
                  >
                    Training Tab
                  </Button>
                </div>
            </div>

            <div className="p-6 space-y-6">
              {activeStaffTab === "overview" && (
                <>
              {/* Status chips */}
              <div className="flex flex-wrap gap-2">
                {selectedStaff.is_on_shift_today && (
                  <Badge variant="success" className="rounded-full gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse-dot" />
                    {selectedStaff.today_shift_type === "day" ? "On day shift" : selectedStaff.today_shift_type === "sleep_in" ? "Sleep-in tonight" : "On shift"}
                  </Badge>
                )}
                {selectedStaff.is_on_leave_today && <Badge variant="warning" className="rounded-full">On leave today</Badge>}
                {selectedStaff.supervision_overdue && <Badge variant="destructive" className="rounded-full">Supervision overdue</Badge>}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className={cn("text-2xl font-bold", selectedStaff.overdue_tasks > 0 ? "text-red-600" : "text-slate-900")}>{selectedStaff.active_tasks}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Active Tasks</div>
                  {selectedStaff.overdue_tasks > 0 && <div className="text-[9px] text-red-500 mt-0.5">{selectedStaff.overdue_tasks} overdue</div>}
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className={cn("text-2xl font-bold", selectedStaff.training_expired_count > 0 ? "text-red-600" : "text-emerald-600")}>
                    {selectedStaff.training_total_count - selectedStaff.training_expired_count}/{selectedStaff.training_total_count}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Training</div>
                  {selectedStaff.training_expiring_count > 0 && <div className="text-[9px] text-amber-500 mt-0.5">{selectedStaff.training_expiring_count} expiring</div>}
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{selectedStaff.contracted_hours}h</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Contracted</div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Employment Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-500 mb-0.5">Start Date</div><div className="text-sm font-medium">{formatDate(selectedStaff.start_date)}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-500 mb-0.5">Employment</div><div className="text-sm font-medium capitalize">{selectedStaff.employment_type}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-500 mb-0.5">Contracted Hours</div><div className="text-sm font-medium">{selectedStaff.contracted_hours}h/week</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-500 mb-0.5">Payroll ID</div><div className="text-sm font-medium">{selectedStaff.payroll_id || "N/A"}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-500 mb-0.5">DBS Number</div><div className="text-sm font-medium">{selectedStaff.dbs_number || "N/A"}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-500 mb-0.5">Next Supervision</div><div className={cn("text-sm font-medium", selectedStaff.supervision_overdue ? "text-red-600" : "text-slate-900")}>{selectedStaff.next_supervision_due ? formatDate(selectedStaff.next_supervision_due) : "Not set"}</div></div>
                </div>
              </div>

              {/* Training summary */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                  Training &amp; Compliance
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                    <div className="text-xl font-bold text-emerald-700">{selectedStaff.training_total_count - selectedStaff.training_expired_count - selectedStaff.training_expiring_count}</div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">Compliant</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                    <div className="text-xl font-bold text-amber-700">{selectedStaff.training_expiring_count}</div>
                    <div className="text-[10px] text-amber-600 mt-0.5">Expiring soon</div>
                  </div>
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
                    <div className="text-xl font-bold text-red-700">{selectedStaff.training_expired_count}</div>
                    <div className="text-[10px] text-red-600 mt-0.5">Expired</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">Full training matrix available in the Training module</p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact</h3>
                <div className="space-y-2">
                  {selectedStaff.email && (
                    <a href={`mailto:${selectedStaff.email}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700">{selectedStaff.email}</span>
                    </a>
                  )}
                  {selectedStaff.phone && (
                    <a href={`tel:${selectedStaff.phone}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700">{selectedStaff.phone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedStaff.emergency_contact_name && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Emergency Contact</h3>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-sm font-medium">{selectedStaff.emergency_contact_name}</div>
                    <div className="text-xs text-slate-500">{selectedStaff.emergency_contact_phone}</div>
                  </div>
                </div>
              )}

              {/* Quick navigation */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setSelectedStaff(null); window.location.href = "/supervision"; }}>
                  <Shield className="h-3.5 w-3.5" />View Supervision
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setSelectedStaff(null); window.location.href = "/training"; }}>
                  <GraduationCap className="h-3.5 w-3.5" />View Training
                </Button>
              </div>
                </>
              )}

              {activeStaffTab === "training" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Training</h3>
                  {staffTrainingQuery.isPending && (
                    <div className="text-sm text-slate-500">Loading training profile...</div>
                  )}

                  {!staffTrainingQuery.isPending && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-[10px] text-slate-500">Required Courses</div>
                          <div className="text-lg font-semibold text-slate-900">
                            {(staffTrainingQuery.data?.data ?? []).filter((row) => row.is_mandatory).length}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-[10px] text-slate-500">Completed Courses</div>
                          <div className="text-lg font-semibold text-emerald-700">
                            {(staffTrainingQuery.data?.data ?? []).filter((row) => row.status === "compliant").length}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-[10px] text-slate-500">In Progress</div>
                          <div className="text-lg font-semibold text-amber-700">
                            {(staffTrainingQuery.data?.data ?? []).filter((row) => row.status === "expiring_soon").length}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-[10px] text-slate-500">Expired / Non-compliant</div>
                          <div className="text-lg font-semibold text-red-700">
                            {(staffTrainingQuery.data?.data ?? []).filter((row) => row.status === "expired" || row.status === "not_started").length}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[340px] overflow-y-auto rounded-xl border p-3">
                        {(staffTrainingQuery.data?.data ?? []).map((row) => (
                          <div key={row.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-medium text-slate-900">{row.course_name}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {row.completed_date ? `Completed ${formatDate(row.completed_date)}` : "Not completed"}
                                  {row.expiry_date ? ` • Expires ${formatDate(row.expiry_date)}` : ""}
                                </div>
                              </div>
                              <Badge variant={row.status === "compliant" ? "success" : row.status === "expiring_soon" ? "warning" : "destructive"}>
                                {row.status.replace("_", " ")}
                              </Badge>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openTrainingMutation.mutate({
                                    providerCourseId: row.course_id ?? row.id,
                                    fallbackCourseUrl: row.direct_course_url ?? undefined,
                                    courseId: row.course_id,
                                  })
                                }
                              >
                                Open Training
                              </Button>
                              {row.certificate_url && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={row.certificate_url} target="_blank" rel="noreferrer">View Certificate</a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}

                        {(staffTrainingQuery.data?.data ?? []).length === 0 && (
                          <div className="text-sm text-slate-500">No training assignments found for this staff member.</div>
                        )}
                      </div>

                      <div className="rounded-xl border bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-700 mb-2">Training Actions</div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline">Sync Now</Button>
                          <Button size="sm" variant="outline">Assign Course</Button>
                          <Button size="sm" variant="outline">Mark Exemption</Button>
                          <Button size="sm" variant="outline">Download Training Report</Button>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-2">Actions respect role permissions and provider capabilities.</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>

    {/* Add Staff Modal */}
    {showAddStaff && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        onClick={() => setShowAddStaff(false)}
      >
        <div
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="text-base font-bold text-slate-900">Add Staff Member</span>
            <button onClick={() => setShowAddStaff(false)} className="text-slate-400 hover:text-slate-600 text-xl font-light">&times;</button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">First Name <span className="text-red-500">*</span></label>
                <Input value={addForm.first_name} onChange={(e) => setAddForm((f) => ({ ...f, first_name: e.target.value }))} placeholder="First name" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Last Name <span className="text-red-500">*</span></label>
                <Input value={addForm.last_name} onChange={(e) => setAddForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Last name" className="text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Role <span className="text-red-500">*</span></label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {SYSTEM_ROLES.filter((r) => r !== "responsible_individual").map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Employment Type</label>
                <select
                  value={addForm.employment_type}
                  onChange={(e) => setAddForm((f) => ({ ...f, employment_type: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email</label>
                <Input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Phone</label>
                <Input value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} placeholder="07700 000000" className="text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Start Date</label>
                <Input type="date" value={addForm.start_date} onChange={(e) => setAddForm((f) => ({ ...f, start_date: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Contracted Hours / wk</label>
                <Input type="number" value={addForm.contracted_hours} onChange={(e) => setAddForm((f) => ({ ...f, contracted_hours: e.target.value }))} placeholder="37.5" className="text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">DBS Number</label>
                <Input value={addForm.dbs_number} onChange={(e) => setAddForm((f) => ({ ...f, dbs_number: e.target.value }))} placeholder="001234567890" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">DBS Issue Date</label>
                <Input type="date" value={addForm.dbs_issue_date} onChange={(e) => setAddForm((f) => ({ ...f, dbs_issue_date: e.target.value }))} className="text-sm" />
              </div>
            </div>

            {addError && <p className="text-xs text-red-600 font-medium">{addError}</p>}
          </div>

          <div className="mt-5 flex gap-3">
            <Button
              className="flex-1"
              disabled={createStaff.isPending}
              onClick={() => {
                if (!addForm.first_name.trim()) { setAddError("First name is required."); return; }
                if (!addForm.last_name.trim()) { setAddError("Last name is required."); return; }
                setAddError("");
                createStaff.mutate(
                  {
                    first_name: addForm.first_name.trim(),
                    last_name: addForm.last_name.trim(),
                    role: addForm.role,
                    employment_type: addForm.employment_type,
                    email: addForm.email.trim() || undefined,
                    phone: addForm.phone.trim() || undefined,
                    start_date: addForm.start_date || undefined,
                    contracted_hours: Number(addForm.contracted_hours) || 37.5,
                    dbs_number: addForm.dbs_number.trim() || undefined,
                    dbs_issue_date: addForm.dbs_issue_date || undefined,
                  },
                  {
                    onSuccess: () => {
                      setShowAddStaff(false);
                      setAddForm({ first_name: "", last_name: "", role: "residential_care_worker", employment_type: "permanent", email: "", phone: "", start_date: "", contracted_hours: "37.5", dbs_number: "", dbs_issue_date: "" });
                    },
                    onError: () => setAddError("Failed to add staff member. Please try again."),
                  }
                );
              }}
            >
              <Plus className="h-4 w-4" />
              {createStaff.isPending ? "Adding…" : "Add Staff Member"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddStaff(false)}>Cancel</Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
