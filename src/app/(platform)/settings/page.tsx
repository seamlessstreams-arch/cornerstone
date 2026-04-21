"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Bell, Shield, Building, Users, Key,
  Globe, Mail, Phone, CheckCircle2, Save, Smartphone,
  Lock, Eye, EyeOff, Database, FileText, Zap, Monitor, User,
} from "lucide-react";
import { HOME } from "@/lib/seed-data";
import { useStaff } from "@/hooks/use-staff";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

type SettingsTab = "profile" | "home" | "notifications" | "security" | "roles" | "integrations";

const notificationDefs = [
  { label: "Task assigned to you", key: "task_assigned", enabled: true },
  { label: "Task overdue", key: "task_overdue", enabled: true },
  { label: "Incident logged", key: "incident_logged", enabled: true },
  { label: "Leave request pending approval", key: "leave_pending", enabled: true },
  { label: "Training expiring soon", key: "training_expiring", enabled: true },
  { label: "Supervision due", key: "supervision_due", enabled: true },
  { label: "Document requires sign-off", key: "doc_sign", enabled: true },
  { label: "New candidate in pipeline", key: "recruitment", enabled: false },
  { label: "Expense claim submitted", key: "expense", enabled: false },
  { label: "Open shift published", key: "open_shift", enabled: true },
];

const ROLE_OPTIONS = [
  "registered_manager", "responsible_individual", "deputy_manager",
  "team_leader", "residential_care_worker", "bank_staff", "admin",
];

function SavedBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
      <CheckCircle2 className="h-4 w-4 shrink-0" />Changes saved successfully.
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [showPassword, setShowPassword] = useState(false);

  const staffQuery = useStaff();
  const allStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);
  const me = allStaff.find((s) => s.id === "staff_darren");

  // --- Profile state ---
  const [profile, setProfile] = useState({
    first_name: "", last_name: "", email: "", phone: "", payroll_id: "",
  });
  // Populate profile once staff data loads
  useEffect(() => {
    if (me) {
      setProfile({
        first_name: me.first_name ?? "",
        last_name: me.last_name ?? "",
        email: me.email ?? "",
        phone: me.phone ?? "",
        payroll_id: me.payroll_id ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  function handleSaveProfile() {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3500);
  }

  // --- Home details state ---
  const [homeForm, setHomeForm] = useState({
    name: HOME.name ?? "",
    ofsted_urn: HOME.ofsted_urn ?? "",
    address: HOME.address ?? "",
    phone: HOME.phone ?? "",
    max_beds: String(HOME.max_beds ?? ""),
    last_inspection_date: HOME.last_inspection_date ?? "",
    last_inspection_grade: HOME.last_inspection_grade ?? "",
  });
  const [homeSaved, setHomeSaved] = useState(false);
  function handleSaveHome() {
    setHomeSaved(true);
    setTimeout(() => setHomeSaved(false), 3500);
  }

  // --- Notifications state ---
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationDefs.map((n) => [n.key, n.enabled]))
  );
  const [notifSaved, setNotifSaved] = useState(false);
  function handleSavePreferences() {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3500);
  }

  // --- Password state ---
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  function handleUpdatePassword() {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("All fields are required."); return;
    }
    if (pwForm.next.length < 8) {
      setPwError("New password must be at least 8 characters."); return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords do not match."); return;
    }
    setPwError("");
    setPwSaved(true);
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 3500);
  }

  // --- Sessions state ---
  const [signedOutSessions, setSignedOutSessions] = useState<Set<string>>(new Set());

  // --- Roles state — tracks local overrides; select falls back to staff.role from API ---
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [rolesSaved, setRolesSaved] = useState(false);
  function handleSaveRoles() {
    setRolesSaved(true);
    setTimeout(() => setRolesSaved(false), 3500);
  }

  const tabs = [
    { id: "profile" as SettingsTab, label: "My Profile", icon: User },
    { id: "home" as SettingsTab, label: "Home Details", icon: Building },
    { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
    { id: "security" as SettingsTab, label: "Security", icon: Shield },
    { id: "roles" as SettingsTab, label: "Roles & Permissions", icon: Users },
    { id: "integrations" as SettingsTab, label: "Integrations", icon: Zap },
  ];

  return (
    <PageShell
      title="Settings"
      subtitle="Manage your profile, home configuration, notifications, and permissions"
      showQuickCreate={false}
    >
      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-sm font-medium transition-all text-left",
                tab === id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">

          {/* Profile */}
          {tab === "profile" && me && (
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-5">
                  <Avatar name={me.full_name} size="xl" />
                  <div>
                    <div className="text-lg font-bold text-slate-900">{me.full_name}</div>
                    <div className="text-sm text-slate-500">{me.job_title}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-8 text-xs"
                      onClick={() => { setPhotoChanged(true); toast("Profile photo updated.", "success"); setTimeout(() => setPhotoChanged(false), 3000); }}
                    >
                      {photoChanged ? "Photo updated" : "Change photo"}
                    </Button>
                  </div>
                </div>
                <SavedBanner show={profileSaved} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">First name</label>
                    <Input
                      value={profile.first_name}
                      onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Last name</label>
                    <Input
                      value={profile.last_name}
                      onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" />Email
                    </label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />Phone
                    </label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
                    <Input value={me.job_title} disabled className="bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Payroll ID</label>
                    <Input
                      value={profile.payroll_id}
                      onChange={(e) => setProfile((p) => ({ ...p, payroll_id: e.target.value }))}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Home details */}
          {tab === "home" && (
            <Card>
              <CardHeader><CardTitle>Home Details — {HOME.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SavedBanner show={homeSaved} />
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      { label: "Home name", key: "name" },
                      { label: "Ofsted URN", key: "ofsted_urn" },
                      { label: "Address", key: "address" },
                      { label: "Phone", key: "phone" },
                      { label: "Max beds", key: "max_beds" },
                      { label: "Last inspection", key: "last_inspection_date" },
                      { label: "Last grade", key: "last_inspection_grade" },
                    ] as { label: string; key: keyof typeof homeForm }[]
                  ).map(({ label, key }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
                      <Input
                        value={homeForm[key]}
                        onChange={(e) => setHomeForm((f) => ({ ...f, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveHome}>
                  <Save className="h-4 w-4 mr-2" />Save Home Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {tab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <SavedBanner show={notifSaved} />
                  {notificationDefs.map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span className="text-sm text-slate-700">{notif.label}</span>
                      <button
                        onClick={() => setNotifications((p) => ({ ...p, [notif.key]: !p[notif.key] }))}
                        className={cn(
                          "relative h-6 w-10 rounded-full transition-colors",
                          notifications[notif.key] ? "bg-blue-600" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                          notifications[notif.key] ? "translate-x-4" : "translate-x-0.5"
                        )} />
                      </button>
                    </div>
                  ))}
                  <Button className="w-full mt-2" onClick={handleSavePreferences}>
                    <Save className="h-4 w-4 mr-2" />Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {tab === "security" && (
            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SavedBanner show={pwSaved} />
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Current password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={pwForm.current}
                        onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">New password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={pwForm.next}
                      onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm new password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                    />
                  </div>
                  {pwError && <p className="text-xs text-red-600 font-medium">{pwError}</p>}
                  <Button onClick={handleUpdatePassword}>
                    <Lock className="h-4 w-4 mr-2" />Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { device: "MacBook Pro — Derby", last: "Now (this session)", icon: Monitor, current: true, key: "macbook" },
                      { device: "iPhone 15 Pro — Mobile", last: "2 hours ago", icon: Smartphone, current: false, key: "iphone" },
                    ].map(({ device, last, icon: Icon, current, key }) => (
                      <div key={key} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        <Icon className="h-5 w-5 text-slate-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">{device}</div>
                          <div className="text-xs text-slate-400">
                            {signedOutSessions.has(key) ? "Signed out" : last}
                          </div>
                        </div>
                        {current ? (
                          <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">Current</Badge>
                        ) : signedOutSessions.has(key) ? (
                          <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-500">Signed out</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 border-red-200"
                            onClick={() => setSignedOutSessions((prev) => new Set([...prev, key]))}
                          >
                            Sign out
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Roles */}
          {tab === "roles" && (
            <Card>
              <CardHeader><CardTitle>Roles & Permissions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <SavedBanner show={rolesSaved} />
                  {allStaff.map((staff) => (
                    <div key={staff.id} className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
                      <Avatar name={staff.full_name} size="sm" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{staff.full_name}</div>
                        <div className="text-xs text-slate-400">{staff.email}</div>
                      </div>
                      <select
                        value={roles[staff.id] ?? staff.role}
                        onChange={(e) => setRoles((r) => ({ ...r, [staff.id]: e.target.value }))}
                        disabled={staff.id === "staff_darren"}
                        className="h-8 rounded-xl border border-slate-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{role.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <Button className="mt-1" onClick={handleSaveRoles}>
                    <Key className="h-4 w-4 mr-2" />Save Role Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integrations */}
          {tab === "integrations" && (
            <div className="space-y-4">
              {[
                { name: "Supabase", desc: "Database & authentication backend", status: "connected", icon: Database, tooltip: "Contact your system administrator to modify database settings." },
                { name: "BrightHR", desc: "Legacy HR data sync via Chrome extension", status: "connected", icon: Zap, tooltip: "BrightHR sync is managed via the Chrome extension. Reconfigure from the extension settings." },
                { name: "Sage Payroll", desc: "Payroll export integration", status: "not_connected", icon: FileText, tooltip: "Contact your system administrator to configure the Sage Payroll integration." },
                { name: "ClearCare", desc: "Care management data sync", status: "not_connected", icon: Globe, tooltip: "Contact your system administrator to configure the ClearCare integration." },
                { name: "Ofsted Portal", desc: "Inspection reporting and notifications", status: "not_connected", icon: Shield, tooltip: "Contact your system administrator to configure the Ofsted Portal integration." },
              ].map(({ name, desc, status, icon: Icon, tooltip }) => (
                <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{name}</div>
                    <div className="text-xs text-slate-500">{desc}</div>
                  </div>
                  <Badge className={cn("text-[10px] rounded-full", (status === "connected" || connectedIds.has(name)) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                    {(status === "connected" || connectedIds.has(name)) ? "Connected" : "Not connected"}
                  </Badge>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                    if (status === "connected" || connectedIds.has(name)) {
                      toast(`${name}: ${tooltip}`, "info");
                    } else {
                      setConnectedIds((prev) => new Set([...prev, name]));
                    }
                  }}>
                    {(status === "connected" || connectedIds.has(name)) ? "Configure" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
