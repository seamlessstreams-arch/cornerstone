"use client";

// ─── Imports ──────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateReg45Action,
  useCreateReg45Consultation,
  useCreateReg45Cycle,
  useCreateReg45Evidence,
  useCreateReg45Export,
  useCreateReg45Finding,
  useCreateReg45Oversight,
  useGenerateReg45AriaDraft,
  useReg45Actions,
  useReg45Consultations,
  useReg45Cycles,
  useReg45Evidence,
  useReg45Exports,
  useReg45Findings,
  useReg45Report,
  useSaveReg45ReportSection,
  useSignOffReg45Cycle,
  useUpdateReg45Action,
  useUpdateReg45Cycle,
  useVerifyReg45Evidence,
} from "@/hooks/use-reg45";
import { useStaff } from "@/hooks/use-staff";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

// ─── Speech Recognition Types ───────────────────────────────────────────────────────────────────
type SpeechRecognitionConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────────────────────
const EVIDENCE_CATEGORIES = [
  { value: "childrens_voice", label: "Children's Voice" },
  { value: "parent_family_advocate", label: "Parent / Family / Advocate" },
  { value: "placing_authority_professional", label: "Placing Authority / Professional" },
  { value: "staff", label: "Staff" },
  { value: "child_outcomes_lived_experience", label: "Child Outcomes & Lived Experience" },
  { value: "safeguarding_risk", label: "Safeguarding & Risk" },
  { value: "quality_assurance_monitoring", label: "Quality Assurance & Monitoring" },
  { value: "operational_workforce", label: "Operational & Workforce" },
  { value: "environment_house_experience", label: "Environment & House Experience" },
  { value: "notifications_compliance", label: "Notifications & Compliance" },
] as const;

const CONSULTATION_GROUPS = [
  { value: "children", label: "Children" },
  { value: "parents", label: "Parents" },
  { value: "placing_authorities", label: "Placing Authorities" },
  { value: "staff", label: "Staff" },
  { value: "professionals", label: "Professionals" },
  { value: "advocates", label: "Advocates" },
] as const;

const REPORT_SECTIONS = [
  { value: "review_period_context", label: "Review Period & Context" },
  { value: "methodology", label: "Methodology" },
  { value: "children_experiences_progress", label: "Children's Experiences & Progress" },
  { value: "safeguarding_risk_management", label: "Safeguarding & Risk Management" },
  { value: "quality_of_care_evaluation", label: "Quality of Care Evaluation" },
  { value: "feedback_consultation", label: "Feedback & Consultation" },
  { value: "progress_since_previous_review", label: "Progress Since Previous Review" },
  { value: "overall_judgement", label: "Overall Judgement" },
  { value: "action_plan", label: "Action Plan" },
  { value: "sign_off_submission", label: "Sign-Off & Submission" },
] as const;

const EXPORT_TYPES = [
  { value: "final_report_pdf", label: "Final Report PDF", description: "Formal Regulation 45 written report for Ofsted submission" },
  { value: "evidence_index_pdf", label: "Evidence Index PDF", description: "Index of all evidence items with verification status" },
  { value: "evidence_register_csv", label: "Evidence Register CSV", description: "Full evidence register in CSV format for audit" },
  { value: "action_tracker_csv", label: "Action Tracker CSV", description: "Action plan with owner, deadline, and status" },
  { value: "consultation_appendix", label: "Consultation Appendix", description: "Summary of all stakeholder consultation feedback" },
  { value: "inspection_ready_pack", label: "Inspection-Ready Pack", description: "Combined pack: report + evidence + actions + consultations" },
] as const;

const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

const ACTION_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const ARIA_COMMANDS = [
  "Draft this as evaluative Reg 45 language",
  "Summarise the children's feedback",
  "Identify what evidence is missing",
  "Compare this to the previous cycle",
  "Create actions from these findings",
  "Rewrite this for Ofsted",
  "Turn this into a stronger conclusion",
  "Critique the draft for weak conclusions",
  "Make this more concise",
];

// ─── Utility Functions ──────────────────────────────────────────────────────────────────────
function statusTone(s: string) {
  const map: Record<string, string> = {
    planned: "bg-slate-100 text-slate-700",
    evidence_gathering: "bg-sky-100 text-sky-700",
    in_review: "bg-indigo-100 text-indigo-700",
    drafting_report: "bg-amber-100 text-amber-800",
    awaiting_sign_off: "bg-orange-100 text-orange-700",
    finalised: "bg-emerald-100 text-emerald-700",
    submitted: "bg-teal-100 text-teal-700",
    archived: "bg-slate-200 text-slate-500",
  };
  return map[s] ?? "bg-slate-100 text-slate-600";
}
function riskTone(s: string) {
  const map: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return map[s] ?? "bg-slate-100 text-slate-600";
}
function verificationTone(s: string) {
  const map: Record<string, string> = {
    verified: "bg-emerald-100 text-emerald-700",
    viewed: "bg-sky-100 text-sky-700",
    rejected: "bg-red-100 text-red-700",
    pending_review: "bg-amber-100 text-amber-700",
    uploaded: "bg-slate-100 text-slate-600",
    superseded: "bg-slate-200 text-slate-500",
  };
  return map[s] ?? "bg-slate-100 text-slate-600";
}
function actionTone(s: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-blue-100 text-blue-700",
    blocked: "bg-red-100 text-red-700",
    cancelled: "bg-slate-200 text-slate-500",
    open: "bg-amber-100 text-amber-700",
  };
  return map[s] ?? "bg-slate-100 text-slate-600";
}
function isOverdue(d: string | null) { return !!d && new Date(d) < new Date(); }
function safeStr(v: unknown): string { return typeof v === "string" ? v : String(v ?? ""); }
function nextCycleStatus(current: string) {
  const order = ["planned","evidence_gathering","in_review","drafting_report","awaiting_sign_off","finalised","submitted"];
  const i = order.indexOf(current);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : current;
}

// ─── Dictation Hook ─────────────────────────────────────────────────────────────────────────
function useDictation(onTranscript: (t: string) => void) {
  const [active, setActive] = useState(false);
  const ref = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const start = useCallback(() => {
    const R = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!R || active) return;
    const r = new R();
    r.lang = "en-GB"; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => {
      const t = e.results[e.results.length - 1]?.[0]?.transcript ?? "";
      if (t) onTranscript(t.trim());
    };
    r.onerror = () => setActive(false);
    r.onend = () => setActive(false);
    r.start(); ref.current = r; setActive(true);
  }, [active, onTranscript]);
  const stop = useCallback(() => { ref.current?.stop(); setActive(false); }, []);
  return { active, start, stop };
}

// ─── Sub-components ───────────────────────────────────────────────────────────────────────
function ComplianceRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met
        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        : <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
      <span className={met ? "text-slate-700" : "text-slate-500"}>{label}</span>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className={`text-3xl font-bold ${tone}`}>{value}</div>
        <div className="text-xs text-slate-500 mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────────────────
export default function Reg45Page() {
  const [newCycleTitle, setNewCycleTitle] = useState("Regulation 45 Review");
  const [newCycleStart, setNewCycleStart] = useState("");
  const [newCycleEnd, setNewCycleEnd] = useState("");
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [evTitle, setEvTitle] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evCategory, setEvCategory] = useState("quality_assurance_monitoring");
  const [evDate, setEvDate] = useState(new Date().toISOString().slice(0, 10));
  const [evSource, setEvSource] = useState("manual_entry");
  const [evConfidentiality, setEvConfidentiality] = useState("standard");
  const [evFilter, setEvFilter] = useState("all");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState("verified");
  const [verifyNotes, setVerifyNotes] = useState("");

  const [conGroup, setConGroup] = useState("children");
  const [conSummary, setConSummary] = useState("");
  const [conSentiment, setConSentiment] = useState("positive");
  const [conSourceType, setConSourceType] = useState("meeting");
  const [conDate, setConDate] = useState(new Date().toISOString().slice(0, 10));

  const [findTitle, setFindTitle] = useState("");
  const [findSummary, setFindSummary] = useState("");
  const [findRisk, setFindRisk] = useState("medium");
  const [findStrength, setFindStrength] = useState("area_for_improvement");
  const [findSection, setFindSection] = useState("quality_of_care_evaluation");
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  const [actTitle, setActTitle] = useState("");
  const [actRationale, setActRationale] = useState("");
  const [actPriority, setActPriority] = useState("high");
  const [actOwner, setActOwner] = useState("");
  const [actDeadline, setActDeadline] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString().slice(0, 10)
  );
  const [updatingActionId, setUpdatingActionId] = useState<string | null>(null);
  const [updatingActionStatus, setUpdatingActionStatus] = useState("open");

  const [reportSection, setReportSection] = useState("children_experiences_progress");
  const [reportText, setReportText] = useState("");
  const [ariaTone, setAriaTone] = useState("balanced");
  const [ariaCommand, setAriaCommand] = useState("");
  const [ariaWarning, setAriaWarning] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<Record<string, string>>({});

  const [exportType, setExportType] = useState("inspection_ready_pack");
  const [oversightCommentary, setOversightCommentary] = useState("");
  const [oversightDecision, setOversightDecision] = useState("approved");
  const [oversightEntityType, setOversightEntityType] = useState("reg45_cycle");

  const cyclesQuery = useReg45Cycles();
  const createCycle = useCreateReg45Cycle();
  const updateCycle = useUpdateReg45Cycle();
  const evidenceQuery = useReg45Evidence(selectedCycleId ?? undefined);
  const findingsQuery = useReg45Findings(selectedCycleId ?? undefined);
  const actionsQuery = useReg45Actions(selectedCycleId ?? undefined);
  const consultationsQuery = useReg45Consultations(selectedCycleId ?? undefined);
  const reportQuery = useReg45Report(selectedCycleId ?? undefined);
  const exportsQuery = useReg45Exports(selectedCycleId ?? undefined);
  const staffQuery = useStaff();

  const createEvidence = useCreateReg45Evidence();
  const verifyEvidence = useVerifyReg45Evidence();
  const createFinding = useCreateReg45Finding();
  const createAction = useCreateReg45Action();
  const updateAction = useUpdateReg45Action();
  const createConsultation = useCreateReg45Consultation();
  const saveSection = useSaveReg45ReportSection();
  const generateDraft = useGenerateReg45AriaDraft();
  const createExport = useCreateReg45Export();
  const signOff = useSignOffReg45Cycle();
  const createOversight = useCreateReg45Oversight();

  const cycles = cyclesQuery.data?.cycles ?? [];
  const staffList = staffQuery.data?.data ?? [];

  useEffect(() => {
    if (!selectedCycleId && cycles.length > 0) setSelectedCycleId(cycles[0].id);
  }, [cycles, selectedCycleId]);

  const selectedCycle = useMemo(
    () => cycles.find((c) => c.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId]
  );

  const allEvidence = evidenceQuery.data?.evidence ?? [];
  const allFindings = findingsQuery.data?.findings ?? [];
  const allActions = actionsQuery.data?.actions ?? [];
  const completeness = reportQuery.data?.completeness ?? (selectedCycle as any)?.completeness ?? null;
  const reportSections = reportQuery.data?.sections ?? [];
  const overdueActions = allActions.filter(
    (a) => safeStr(a.status) !== "completed" && isOverdue(safeStr(a.deadline) || null)
  );

  const consultationsByGroup = useMemo(() => {
    const entries = consultationsQuery.data?.consultations ?? [];
    const map: Record<string, typeof entries> = {};
    for (const e of entries) {
      const g = safeStr((e as any).consultation_group ?? "unknown");
      if (!map[g]) map[g] = [];
      map[g].push(e);
    }
    return map;
  }, [consultationsQuery.data]);

  const filteredEvidence = useMemo(() => {
    if (evFilter === "all") return allEvidence;
    if (evFilter === "unverified")
      return allEvidence.filter((e) => !["verified","rejected"].includes(safeStr((e as any).verification_status)));
    return allEvidence.filter((e) => safeStr((e as any).category) === evFilter);
  }, [allEvidence, evFilter]);

  useEffect(() => {
    const existing = reportSections.find((s) => safeStr((s as any).section_code) === reportSection);
    const content = safeStr((existing as any)?.content_markdown ?? (existing as any)?.content ?? savedSections[reportSection] ?? "");
    setReportText(content);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportSection]);

  const reportDictation = useDictation((t) => setReportText((p) => `${p}${p ? "\n" : ""}${t}`));
  const conDictation = useDictation((t) => setConSummary((p) => `${p}${p ? "\n" : ""}${t}`));

  function handleGenerateDraft() {
    const evSum = allEvidence.slice(0, 12)
      .map((e) => `[${safeStr((e as any).category)}] ${safeStr((e as any).title)}`).join("; ");
    const findSum = allFindings.slice(0, 10)
      .map((f) => `${safeStr((f as any).title)} (${safeStr((f as any).risk_level ?? (f as any).severity)})`).join("; ");
    const conSum = (consultationsQuery.data?.consultations ?? []).slice(0, 10)
      .map((c) => `${safeStr((c as any).consultation_group)}: ${safeStr((c as any).summary).slice(0, 120)}`).join("; ");
    generateDraft.mutate(
      {
        section: reportSection,
        cycleTitle: selectedCycle?.cycle_title ?? "Review Cycle",
        evidenceSummary: evSum,
        findingsSummary: findSum,
        consultationsSummary: conSum,
        tone: ariaTone,
        voiceCommand: ariaCommand.trim() || undefined,
      },
      { onSuccess: (r) => { setReportText(r.draft); setAriaWarning(r.warning ?? null); } }
    );
  }

  function handleSaveSection() {
    if (!selectedCycleId || !reportText.trim()) return;
    const label = REPORT_SECTIONS.find((s) => s.value === reportSection)?.label ?? reportSection;
    saveSection.mutate({
      cycleId: selectedCycleId, sectionCode: reportSection, sectionTitle: label,
      contentMarkdown: reportText, ariaGenerated: generateDraft.isSuccess,
    });
    setSavedSections((p) => ({ ...p, [reportSection]: reportText }));
  }

  return (
    <PageShell
      title="Regulation 45 Quality of Care"
      subtitle={
        selectedCycle
          ? `${selectedCycle.cycle_title} · ${selectedCycle.review_start_date} → ${selectedCycle.review_end_date}`
          : "Workflow-driven evidence, review, action, and reporting system"
      }
      quickCreateContext={{ module: "audits", defaultTaskCategory: "compliance" }}
      actions={
        selectedCycleId ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                createExport.mutate({
                  cycleId: selectedCycleId,
                  exportType,
                  includeSections: REPORT_SECTIONS.map((s) => s.value),
                })
              }
              disabled={createExport.isPending}
            >
              {createExport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => signOff.mutate({ cycleId: selectedCycleId })}
              disabled={signOff.isPending || completeness?.blockFinalSignOff === true}
            >
              <ShieldCheck className="h-4 w-4" />
              {signOff.isPending ? "Signing Off…" : "Final Sign-Off"}
            </Button>
          </div>
        ) : undefined
      }
    >
      {/* Cycle Selector */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <Input value={newCycleTitle} onChange={(e) => setNewCycleTitle(e.target.value)} placeholder="Cycle title" />
            <Input type="date" value={newCycleStart} onChange={(e) => setNewCycleStart(e.target.value)} />
            <Input type="date" value={newCycleEnd} onChange={(e) => setNewCycleEnd(e.target.value)} />
            <Button
              onClick={() => createCycle.mutate({ cycleTitle: newCycleTitle, reviewStartDate: newCycleStart, reviewEndDate: newCycleEnd })}
              disabled={!newCycleStart || !newCycleEnd || createCycle.isPending}
            >
              {createCycle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Cycle"}
            </Button>
            <div className="text-xs text-slate-500 flex items-center leading-tight">
              Regulation 45 requires a quality of care review at least every 6 months.
            </div>
          </div>
          {cyclesQuery.isPending && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
          <div className="grid gap-2 md:grid-cols-3">
            {cycles.map((cycle) => (
              <button
                key={cycle.id}
                className={`rounded-lg border p-3 text-left transition ${
                  selectedCycleId === cycle.id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => setSelectedCycleId(cycle.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">{cycle.cycle_title}</div>
                  <Badge className={`rounded-full text-xs ${statusTone(cycle.status)}`}>
                    {cycle.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-slate-500">{cycle.review_start_date} → {cycle.review_end_date}</div>
                <div className="mt-2 flex gap-3 text-xs text-slate-600">
                  <span>Evidence {(cycle as any).evidence_count ?? 0}</span>
                  <span>Findings {(cycle as any).findings_count ?? 0}</span>
                  <span>Actions {(cycle as any).open_actions_count ?? 0}</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>Completeness</span>
                    <span className="font-semibold">{(cycle as any).completeness?.score ?? 0}%</span>
                  </div>
                  <Progress value={(cycle as any).completeness?.score ?? 0} className="h-1" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {!selectedCycle && cycles.length === 0 && !cyclesQuery.isPending && (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-medium text-slate-700">No review cycles yet</div>
            <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first Regulation 45 Quality of Care Review cycle above.
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCycle && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">
              Evidence
              {allEvidence.length > 0 && (
                <span className="ml-1 rounded-full bg-sky-100 px-1.5 text-xs text-sky-700">{allEvidence.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="findings">
              Findings
              {allFindings.length > 0 && (
                <span className="ml-1 rounded-full bg-indigo-100 px-1.5 text-xs text-indigo-700">{allFindings.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="actions">
              Actions
              {overdueActions.length > 0 && (
                <span className="ml-1 rounded-full bg-red-100 px-1.5 text-xs text-red-700">{overdueActions.length} overdue</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="report">Report Builder</TabsTrigger>
            <TabsTrigger value="oversight">Oversight</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-semibold">{selectedCycle.cycle_title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {selectedCycle.review_start_date} to {selectedCycle.review_end_date}
                        {(selectedCycle as any).due_date && ` · Ofsted due: ${(selectedCycle as any).due_date}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`rounded-full ${statusTone(selectedCycle.status)}`}>
                        {selectedCycle.status.replace(/_/g, " ")}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCycle.mutate({ cycleId: selectedCycle.id, status: nextCycleStatus(selectedCycle.status) })}
                        disabled={updateCycle.isPending || ["finalised","submitted","archived"].includes(selectedCycle.status)}
                      >
                        Advance Status
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Evidence Completeness</div>
                      <div className="text-2xl font-bold">{completeness?.score ?? 0}%</div>
                    </div>
                    <Progress value={completeness?.score ?? 0} className="h-2" />
                    <div className="space-y-1.5">
                      <ComplianceRow label="Child feedback present" met={!completeness?.alerts?.some((a: string) => a.includes("children consultation"))} />
                      <ComplianceRow label="Previous action evidence present" met={!completeness?.alerts?.some((a: string) => a.includes("previous action"))} />
                      <ComplianceRow label="All findings linked to evidence" met={!completeness?.alerts?.some((a: string) => a.includes("no linked evidence"))} />
                      <ComplianceRow label="All actions have owner and deadline" met={!completeness?.alerts?.some((a: string) => a.includes("no owner"))} />
                      <ComplianceRow label="All consultation groups covered" met={!completeness?.alerts?.some((a: string) => a.includes("Missing"))} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="text-sm font-semibold">Sign-Off Gate</div>
                    {completeness?.blockFinalSignOff === false ? (
                      <div className="flex gap-2 text-emerald-700 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Cycle meets minimum sign-off requirements.
                      </div>
                    ) : (
                      <div className="flex gap-2 text-orange-700 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> Sign-off blocked — resolve alerts below.
                      </div>
                    )}
                    <ul className="space-y-1 text-xs text-slate-700">
                      {(completeness?.alerts ?? ["No alerts — cycle is ready."]).map((a: string, i: number) => (
                        <li key={i} className="flex gap-1.5"><span className="text-amber-500 shrink-0">⚠</span>{a}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <StatCard label="Evidence Items" value={allEvidence.length} tone="text-sky-700" />
                <StatCard label="Findings" value={allFindings.length} tone="text-indigo-700" />
                <StatCard label="Open Actions" value={allActions.filter((a) => ["open","in_progress"].includes(safeStr(a.status))).length} tone="text-amber-700" />
                <StatCard label="Overdue Actions" value={overdueActions.length} tone="text-red-700" />
              </div>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm font-semibold">Stakeholder Consultation Coverage</div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {CONSULTATION_GROUPS.map((g) => {
                      const count = consultationsByGroup[g.value]?.length ?? 0;
                      return (
                        <div key={g.value} className="flex items-center gap-2 text-xs">
                          {count > 0
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            : <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                          <span className={count > 0 ? "text-slate-700" : "text-slate-400"}>{g.label}</span>
                          {count > 0 && <span className="ml-auto text-slate-500">{count}</span>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EVIDENCE */}
          <TabsContent value="evidence">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-semibold">Add Evidence Item</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="Evidence title" />
                    <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={evCategory} onChange={(e) => setEvCategory(e.target.value)}>
                      {EVIDENCE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <textarea value={evDesc} onChange={(e) => setEvDesc(e.target.value)}
                    placeholder="Summary, context, and relevance. What does this evidence show about children's experiences?"
                    className="h-20 w-full rounded-md border p-2 text-sm" />
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Date</label>
                      <Input type="date" value={evDate} onChange={(e) => setEvDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Source type</label>
                      <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={evSource} onChange={(e) => setEvSource(e.target.value)}>
                        <option value="manual_entry">Manual Entry</option>
                        <option value="document_upload">Document Upload</option>
                        <option value="linked_form">Linked Form</option>
                        <option value="meeting_notes">Meeting Notes</option>
                        <option value="survey_response">Survey / Questionnaire</option>
                        <option value="consultation_form">Consultation Form</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Confidentiality</label>
                      <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={evConfidentiality} onChange={(e) => setEvConfidentiality(e.target.value)}>
                        <option value="standard">Standard</option>
                        <option value="sensitive">Sensitive</option>
                        <option value="restricted">Restricted</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full"
                        onClick={() => createEvidence.mutate(
                          { cycleId: selectedCycle.id, title: evTitle, description: evDesc, category: evCategory,
                            sourceType: evSource, evidenceDate: evDate, confidentialityLevel: evConfidentiality, markedUsedInReport: false },
                          { onSuccess: () => { setEvTitle(""); setEvDesc(""); } }
                        )}
                        disabled={!evTitle || createEvidence.isPending}>
                        {createEvidence.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Evidence"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold">Evidence Register</div>
                    <select className="h-8 rounded-md border bg-white px-2 text-xs" value={evFilter} onChange={(e) => setEvFilter(e.target.value)}>
                      <option value="all">All categories</option>
                      <option value="unverified">Awaiting verification</option>
                      {EVIDENCE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {evidenceQuery.isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {EVIDENCE_CATEGORIES.map((cat) => {
                      const has = allEvidence.some((e) => safeStr((e as any).category) === cat.value);
                      return (
                        <span key={cat.value} className={`rounded-full px-2 py-0.5 text-xs ${has ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                          {cat.label.split(" ")[0]}
                        </span>
                      );
                    })}
                  </div>
                  <div className="space-y-2 max-h-[480px] overflow-y-auto">
                    {filteredEvidence.length === 0 && (
                      <div className="text-xs text-slate-400 py-4 text-center">No evidence items for this filter.</div>
                    )}
                    {filteredEvidence.map((item) => (
                      <div key={safeStr((item as any).id)} className="rounded border p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium">{safeStr((item as any).title)}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {EVIDENCE_CATEGORIES.find((c) => c.value === safeStr((item as any).category))?.label ?? safeStr((item as any).category)}
                              {(item as any).evidence_date && ` · ${safeStr((item as any).evidence_date)}`}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {(item as any).confidentiality_level && safeStr((item as any).confidentiality_level) !== "standard" && (
                              <Badge className="text-xs bg-purple-100 text-purple-700 rounded-full">{safeStr((item as any).confidentiality_level)}</Badge>
                            )}
                            <Badge className={`text-xs rounded-full ${verificationTone(safeStr((item as any).verification_status))}`}>
                              {safeStr((item as any).verification_status ?? "uploaded").replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </div>
                        {(item as any).description && <div className="text-xs text-slate-600 line-clamp-2">{safeStr((item as any).description)}</div>}
                        {verifyingId === safeStr((item as any).id) ? (
                          <div className="flex gap-2 flex-wrap">
                            <select className="h-8 rounded-md border bg-white px-2 text-xs" value={verifyStatus} onChange={(e) => setVerifyStatus(e.target.value)}>
                              <option value="viewed">Mark Viewed</option>
                              <option value="verified">Verify</option>
                              <option value="rejected">Reject</option>
                              <option value="superseded">Supersede</option>
                            </select>
                            <Input className="h-8 text-xs flex-1 min-w-[120px]" placeholder="Notes" value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} />
                            <Button size="sm" className="h-8"
                              onClick={() => verifyEvidence.mutate(
                                { evidenceId: safeStr((item as any).id), cycleId: selectedCycle.id, verificationStatus: verifyStatus, verificationNotes: verifyNotes },
                                { onSuccess: () => { setVerifyingId(null); setVerifyNotes(""); } }
                              )}
                              disabled={verifyEvidence.isPending}>Save</Button>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setVerifyingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <button className="text-xs text-sky-600 hover:underline"
                            onClick={() => { setVerifyingId(safeStr((item as any).id)); setVerifyStatus("verified"); }}>
                            Review / Verify
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONSULTATIONS */}
          <TabsContent value="consultations">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-semibold">Add Consultation Entry</div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <select className="h-10 rounded-md border bg-white px-3 text-sm" value={conGroup} onChange={(e) => setConGroup(e.target.value)}>
                      {CONSULTATION_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    <select className="h-10 rounded-md border bg-white px-3 text-sm" value={conSentiment} onChange={(e) => setConSentiment(e.target.value)}>
                      <option value="positive">Positive</option>
                      <option value="mixed">Mixed</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                    </select>
                    <select className="h-10 rounded-md border bg-white px-3 text-sm" value={conSourceType} onChange={(e) => setConSourceType(e.target.value)}>
                      <option value="meeting">Meeting</option>
                      <option value="house_meeting">House Meeting</option>
                      <option value="questionnaire">Questionnaire</option>
                      <option value="direct_conversation">Direct Conversation</option>
                      <option value="email_letter">Email / Letter</option>
                      <option value="phone_call">Phone Call</option>
                      <option value="key_work_session">Key Work Session</option>
                    </select>
                    <Input type="date" value={conDate} onChange={(e) => setConDate(e.target.value)} />
                  </div>
                  <div className="relative">
                    <textarea value={conSummary} onChange={(e) => setConSummary(e.target.value)}
                      placeholder="Summarise views, experiences, and feedback. Use the person's own words where possible."
                      className="h-28 w-full rounded-md border p-2 text-sm pr-10" />
                    <button
                      className={`absolute top-2 right-2 rounded-full p-1 ${conDictation.active ? "bg-red-100 text-red-600" : "text-slate-400 hover:text-slate-600"}`}
                      onClick={conDictation.active ? conDictation.stop : conDictation.start}>
                      {conDictation.active ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button size="sm"
                    onClick={() => createConsultation.mutate(
                      { cycleId: selectedCycle.id, consultationGroup: conGroup, summary: conSummary,
                        sentiment: conSentiment, sourceType: conSourceType, consultationDate: conDate,
                        keyPoints: conSummary.split(/\n|\./).map((s) => s.trim()).filter(Boolean).slice(0, 8) },
                      { onSuccess: () => setConSummary("") }
                    )}
                    disabled={!conSummary.trim() || createConsultation.isPending}>
                    Save Consultation Entry
                  </Button>
                </CardContent>
              </Card>

              {CONSULTATION_GROUPS.map((group) => {
                const entries = consultationsByGroup[group.value] ?? [];
                return (
                  <Card key={group.value}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Users className="h-4 w-4 text-slate-400" />
                          {group.label}
                        </div>
                        {entries.length === 0
                          ? <Badge className="rounded-full bg-amber-100 text-amber-700 text-xs">Not yet recorded</Badge>
                          : <Badge className="rounded-full bg-emerald-100 text-emerald-700 text-xs">{entries.length} {entries.length === 1 ? "entry" : "entries"}</Badge>}
                      </div>
                      {entries.length === 0 && (
                        <div className="text-xs text-slate-400">No entries yet. Reg 45 requires opinions from children, parents, placing authorities, and staff.</div>
                      )}
                      {entries.map((entry) => {
                        const sentimentStyle: Record<string, string> = {
                          positive: "bg-emerald-100 text-emerald-700",
                          negative: "bg-red-100 text-red-700",
                          mixed: "bg-amber-100 text-amber-700",
                          neutral: "bg-slate-100 text-slate-600",
                        };
                        return (
                          <div key={safeStr((entry as any).id)} className="rounded border p-3 text-xs space-y-1">
                            <div className="flex flex-wrap gap-2 text-slate-500">
                              <span>{safeStr((entry as any).source_type ?? "").replace(/_/g, " ")}</span>
                              {(entry as any).consultation_date && <span>· {safeStr((entry as any).consultation_date)}</span>}
                              {(entry as any).sentiment && (
                                <span className={`rounded-full px-1.5 py-0.5 ${sentimentStyle[safeStr((entry as any).sentiment)] ?? "bg-slate-100 text-slate-600"}`}>
                                  {safeStr((entry as any).sentiment)}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-700">{safeStr((entry as any).summary)}</div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* FINDINGS */}
          <TabsContent value="findings">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-semibold">Add Finding</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={findTitle} onChange={(e) => setFindTitle(e.target.value)} placeholder="Finding title — evaluative, outcome-focused" />
                    <select className="h-10 rounded-md border bg-white px-3 text-sm" value={findSection} onChange={(e) => setFindSection(e.target.value)}>
                      {REPORT_SECTIONS.slice(0, 8).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <textarea value={findSummary} onChange={(e) => setFindSummary(e.target.value)}
                    placeholder="Evidence-led narrative. What does the evidence show? What is the impact on children?"
                    className="h-20 w-full rounded-md border p-2 text-sm" />
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Risk level</label>
                      <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={findRisk} onChange={(e) => setFindRisk(e.target.value)}>
                        {RISK_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Classification</label>
                      <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={findStrength} onChange={(e) => setFindStrength(e.target.value)}>
                        <option value="strength">Strength</option>
                        <option value="area_for_improvement">Area for Improvement</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full"
                        onClick={() => createFinding.mutate(
                          { cycleId: selectedCycle.id, title: findTitle, summary: findSummary,
                            severity: findRisk, strengthOrWeakness: findStrength, sectionCode: findSection },
                          { onSuccess: () => { setFindTitle(""); setFindSummary(""); } }
                        )}
                        disabled={!findTitle || createFinding.isPending}>
                        Add Finding
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {allFindings.length === 0 && (
                  <Card><CardContent className="p-6 text-center text-sm text-slate-400">No findings yet.</CardContent></Card>
                )}
                {allFindings.map((finding) => {
                  const isExpanded = expandedFinding === safeStr((finding as any).id);
                  return (
                    <Card key={safeStr((finding as any).id)}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <button className="mt-0.5 text-slate-400" onClick={() => setExpandedFinding(isExpanded ? null : safeStr((finding as any).id))}>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-medium">{safeStr((finding as any).title)}</div>
                              <Badge className={`text-xs rounded-full ${riskTone(safeStr((finding as any).risk_level ?? (finding as any).severity))}`}>
                                {safeStr((finding as any).risk_level ?? (finding as any).severity)}
                              </Badge>
                              {(finding as any).strength_or_weakness && (
                                <Badge className={`text-xs rounded-full ${ safeStr((finding as any).strength_or_weakness) === "strength" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                  {safeStr((finding as any).strength_or_weakness).replace(/_/g, " ")}
                                </Badge>
                              )}
                            </div>
                            {isExpanded && (
                              <div className="mt-2 text-xs text-slate-700">
                                {safeStr((finding as any).finding_narrative ?? (finding as any).summary) || "No narrative recorded."}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ACTIONS */}
          <TabsContent value="actions">
            <div className="space-y-4">
              {overdueActions.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-red-700">{overdueActions.length} overdue {overdueActions.length === 1 ? "action" : "actions"}</div>
                      <div className="text-xs text-red-600 mt-1">
                        {overdueActions.slice(0, 3).map((a) => safeStr(a.title)).join(", ")}
                        {overdueActions.length > 3 && ` and ${overdueActions.length - 3} more`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-semibold">Add Action</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={actTitle} onChange={(e) => setActTitle(e.target.value)} placeholder="Action title — SMART, specific, outcome-focused" />
                    <textarea value={actRationale} onChange={(e) => setActRationale(e.target.value)} placeholder="Rationale — link to finding or evidence" className="h-10 rounded-md border p-2 text-sm w-full" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Priority</label>
                      <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={actPriority} onChange={(e) => setActPriority(e.target.value)}>
                        {RISK_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Action owner</label>
                      <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={actOwner} onChange={(e) => setActOwner(e.target.value)}>
                        <option value="">Unassigned</option>
                        {staffList.map((s: any) => (
                          <option key={safeStr((s as any).id)} value={safeStr((s as any).id)}>
                            {safeStr((s as any).full_name ?? (s as any).name ?? (s as any).email)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Deadline</label>
                      <Input type="date" value={actDeadline} onChange={(e) => setActDeadline(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full"
                        onClick={() => createAction.mutate(
                          { cycleId: selectedCycle.id, title: actTitle, rationale: actRationale,
                            priority: actPriority, ownerUserId: actOwner || undefined, deadline: actDeadline },
                          { onSuccess: () => { setActTitle(""); setActRationale(""); } }
                        )}
                        disabled={!actTitle || createAction.isPending}>
                        Add Action
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {allActions.length === 0 && (
                  <Card><CardContent className="p-6 text-center text-sm text-slate-400">No actions yet. Actions must have an owner and deadline to unlock final sign-off.</CardContent></Card>
                )}
                {allActions.map((action) => {
                  const overdue = isOverdue(safeStr(action.deadline) || null) && safeStr(action.status) !== "completed";
                  const isUpdating = updatingActionId === safeStr(action.id);
                  return (
                    <Card key={safeStr(action.id)} className={overdue ? "border-red-200" : undefined}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-medium">{safeStr(action.title)}</div>
                              <Badge className={`text-xs rounded-full ${actionTone(safeStr(action.status))}`}>
                                {safeStr(action.status).replace(/_/g, " ")}
                              </Badge>
                              <Badge className={`text-xs rounded-full ${riskTone(safeStr(action.priority))}`}>
                                {safeStr(action.priority)}
                              </Badge>
                              {overdue && <Badge className="text-xs rounded-full bg-red-100 text-red-700">overdue</Badge>}
                            </div>
                            {safeStr(action.rationale) && <div className="text-xs text-slate-500 mt-1">{safeStr(action.rationale)}</div>}
                            <div className="text-xs text-slate-500 mt-1 flex gap-3 flex-wrap">
                              {safeStr(action.deadline) && <span>Deadline: {safeStr(action.deadline)}</span>}
                              {!(action as any).owner_user_id && <span className="text-amber-600">⚠ No owner assigned</span>}
                              {!safeStr(action.deadline) && <span className="text-amber-600">⚠ No deadline set</span>}
                            </div>
                          </div>
                          {isUpdating ? (
                            <div className="flex gap-1 shrink-0">
                              <select className="h-8 rounded-md border bg-white px-2 text-xs" value={updatingActionStatus} onChange={(e) => setUpdatingActionStatus(e.target.value)}>
                                {ACTION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                              <Button size="sm" className="h-8"
                                onClick={() => updateAction.mutate(
                                  { actionId: safeStr(action.id), cycleId: selectedCycle.id, status: updatingActionStatus },
                                  { onSuccess: () => setUpdatingActionId(null) }
                                )}
                                disabled={updateAction.isPending}>Save</Button>
                              <Button size="sm" variant="outline" className="h-8" onClick={() => setUpdatingActionId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="shrink-0"
                              onClick={() => { setUpdatingActionId(safeStr(action.id)); setUpdatingActionStatus(safeStr(action.status)); }}>
                              Update
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* REPORT BUILDER */}
          <TabsContent value="report">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <div className="text-sm font-semibold">Formal Written Regulation 45 Report</div>
                  </div>
                  <div className="grid gap-1 md:grid-cols-2">
                    {REPORT_SECTIONS.map((section) => {
                      const saved = reportSections.find((s) => safeStr((s as any).section_code) === section.value) ?? savedSections[section.value];
                      return (
                        <button key={section.value}
                          className={`flex items-center justify-between rounded border p-2 text-left text-xs transition ${
                            reportSection === section.value ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => setReportSection(section.value)}>
                          <span className="font-medium text-slate-800">{section.label}</span>
                          {saved ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> : <span className="text-slate-300 shrink-0">○</span>}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="text-sm font-semibold">{REPORT_SECTIONS.find((s) => s.value === reportSection)?.label}</div>
                    <div className="flex flex-wrap gap-2">
                      <select className="h-8 rounded-md border bg-white px-2 text-xs" value={ariaTone} onChange={(e) => setAriaTone(e.target.value)}>
                        <option value="balanced">Balanced</option>
                        <option value="evaluative">Evaluative</option>
                        <option value="assertive">Assertive</option>
                        <option value="concise">Concise</option>
                        <option value="critical">Critical</option>
                      </select>
                      <select className="h-8 rounded-md border bg-white px-2 text-xs" value={ariaCommand} onChange={(e) => setAriaCommand(e.target.value)}>
                        <option value="">ARIA command…</option>
                        {ARIA_COMMANDS.map((cmd) => <option key={cmd} value={cmd}>{cmd}</option>)}
                      </select>
                      <Button size="sm" variant="outline" className="h-8" onClick={reportDictation.active ? reportDictation.stop : reportDictation.start}>
                        {reportDictation.active
                          ? <><MicOff className="h-3.5 w-3.5 mr-1 text-red-500" />Stop</>
                          : <><Mic className="h-3.5 w-3.5 mr-1" />Dictate</>}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleGenerateDraft} disabled={generateDraft.isPending}>
                        {generateDraft.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {generateDraft.isPending ? "Generating…" : "ARIA Draft"}
                      </Button>
                      <Button size="sm" className="h-8" onClick={handleSaveSection} disabled={!reportText.trim() || saveSection.isPending}>
                        {saveSection.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Section"}
                      </Button>
                    </div>
                  </div>
                  {ariaWarning && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">{ariaWarning}</div>
                  )}
                  {generateDraft.isSuccess && !ariaWarning && (
                    <div className="rounded-md bg-sky-50 border border-sky-200 px-3 py-2 text-xs text-sky-700 flex gap-2">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      [ARIA DRAFT] — Review and edit before saving as the formal record.
                    </div>
                  )}
                  {reportDictation.active && (
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" />
                      Listening… speak clearly. Click Stop when finished.
                    </div>
                  )}
                  <textarea value={reportText} onChange={(e) => setReportText(e.target.value)}
                    placeholder={`Draft the ${REPORT_SECTIONS.find((s) => s.value === reportSection)?.label ?? "section"} here. Use ARIA to generate an evidence-led draft, or dictate.`}
                    className="h-72 w-full rounded-md border p-3 text-sm font-mono leading-relaxed" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Report Completeness Gate</div>
                    <div className="text-2xl font-bold">{completeness?.score ?? 0}%</div>
                  </div>
                  <Progress value={completeness?.score ?? 0} className="h-2" />
                  <div className={`rounded-md px-3 py-2 text-xs ${completeness?.blockFinalSignOff === false ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                    {completeness?.blockFinalSignOff === false ? "✓ Cycle meets minimum sign-off requirements." : "⚠ Final sign-off is blocked. Resolve alerts on the Overview tab."}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* OVERSIGHT */}
          <TabsContent value="oversight">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-semibold">Management Oversight Entry</div>
                  <div className="text-xs text-slate-500">Record oversight, challenge, and approval decisions. All entries are retained in the audit trail.</div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Entity type</label>
                      <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={oversightEntityType} onChange={(e) => setOversightEntityType(e.target.value)}>
                        <option value="reg45_cycle">Review Cycle</option>
                        <option value="reg45_report">Report Draft</option>
                        <option value="reg45_evidence">Evidence Item</option>
                        <option value="reg45_finding">Finding</option>
                        <option value="reg45_action">Action</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Decision</label>
                      <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={oversightDecision} onChange={(e) => setOversightDecision(e.target.value)}>
                        <option value="approved">Approved</option>
                        <option value="return_for_amendment">Return for Amendment</option>
                        <option value="more_evidence_required">More Evidence Required</option>
                        <option value="challenge_conclusion">Challenge Conclusion</option>
                        <option value="escalate">Escalate</option>
                        <option value="pending">Pending Review</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Cycle (auto)</label>
                      <Input disabled value={selectedCycleId ?? ""} className="text-xs" />
                    </div>
                  </div>
                  <textarea value={oversightCommentary} onChange={(e) => setOversightCommentary(e.target.value)}
                    placeholder="Management commentary, challenge, amendment required, or approval rationale."
                    className="h-28 w-full rounded-md border p-2 text-sm" />
                  <Button size="sm"
                    onClick={() => createOversight.mutate(
                      { entityType: oversightEntityType, entityId: selectedCycleId ?? "", cycleId: selectedCycleId,
                        commentary: oversightCommentary, approvalDecision: oversightDecision,
                        signOffStatus: oversightDecision === "approved" ? "signed_off" : "pending" },
                      { onSuccess: () => setOversightCommentary("") }
                    )}
                    disabled={!oversightCommentary.trim() || createOversight.isPending}>
                    {createOversight.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Oversight Entry"}
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm font-semibold">Regulation 45 Legal Requirements</div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    <li>• Quality of care review at least every 6 months (Reg 45, Children's Homes (England) Regulations 2015)</li>
                    <li>• Written report sent to Ofsted within 28 days of completing the review</li>
                    <li>• Opinions of children, parents, placing authorities, and staff must be ascertained and considered</li>
                    <li>• SCCIF guidance focuses on children's experiences and progress, not paperwork volume</li>
                    <li>• The RI/provider should review and where relevant challenge the draft before finalisation</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EXPORTS */}
          <TabsContent value="exports">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-semibold">Export Centre</div>
                  <div className="text-xs text-slate-500">All exports are logged with who generated them, when, the version, and the cycle ID.</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {EXPORT_TYPES.map((exp) => (
                      <button key={exp.value}
                        className={`rounded-lg border p-3 text-left text-sm transition ${
                          exportType === exp.value ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => setExportType(exp.value)}>
                        <div className="font-medium text-slate-800">{exp.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{exp.description}</div>
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() => createExport.mutate({ cycleId: selectedCycle.id, exportType, includeSections: REPORT_SECTIONS.map((s) => s.value) })}
                    disabled={createExport.isPending}>
                    {createExport.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</>
                      : <><Package className="h-4 w-4 mr-2" />Generate {EXPORT_TYPES.find((e) => e.value === exportType)?.label}</>}
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm font-semibold">Export Audit Trail</div>
                  {exportsQuery.isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  {(exportsQuery.data?.exports ?? []).length === 0 && (
                    <div className="text-xs text-slate-400 py-2">No exports generated yet for this cycle.</div>
                  )}
                  {(exportsQuery.data?.exports ?? []).map((row) => (
                    <div key={safeStr((row as any).id)} className="rounded border p-3 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-medium">{EXPORT_TYPES.find((e) => e.value === safeStr((row as any).export_type))?.label ?? safeStr((row as any).export_type)}</div>
                        <div className="text-slate-500 mt-0.5">Generated {safeStr((row as any).generated_at).slice(0, 19).replace("T", " ")}</div>
                      </div>
                      <Badge className="rounded-full bg-slate-100 text-slate-600 text-xs">v{safeStr((row as any).version_number ?? "1")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      )}
    </PageShell>
  );
}
