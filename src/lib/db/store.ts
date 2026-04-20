// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MUTABLE IN-MEMORY DATA STORE
//
// This is the single source of truth for all API routes.
// Initialized from seed data on first access.
// Each collection is mutable — API routes read/write here.
//
// TO CONNECT SUPABASE: replace each collection's read/write with
// Supabase queries. The API route signatures stay identical.
// ══════════════════════════════════════════════════════════════════════════════

import {
  STAFF, YOUNG_PEOPLE, TASKS, INCIDENTS, SHIFTS, MEDICATIONS,
  DAILY_LOG, LEAVE_REQUESTS, TRAINING_RECORDS, HOME,
} from "@/lib/seed-data";
import type {
  StaffMember, YoungPerson, Task, Incident, Shift, Medication,
  MedicationAdministration, DailyLogEntry, LeaveRequest,
  TrainingRecord, Home, CareForm, Supervision,
} from "@/types";
import type {
  Building, BuildingCheck, Vehicle, VehicleCheck,
  MissingEpisode, ChronologyEntry, HandoverEntry,
  Notification, TimeSavedEntry,
  Audit, MaintenanceItem,
} from "@/types/extended";
import type { Document, DocumentReadReceipt, Expense } from "@/types";
import type {
  Vacancy, CandidateProfile, CandidateCheck, CandidateReference,
  EmploymentHistoryEntry, GapExplanation, CandidateInterview,
  ConditionalOffer, RecruitmentAuditEntry,
} from "@/types/recruitment";
import { generateId, todayStr, daysFromNow } from "@/lib/utils";

// ── Mutable collections ───────────────────────────────────────────────────────

const store = {
  home: { ...HOME } as Home,
  staff: [...STAFF] as StaffMember[],
  youngPeople: [...YOUNG_PEOPLE] as YoungPerson[],
  tasks: [...TASKS] as Task[],
  incidents: [...INCIDENTS] as Incident[],
  shifts: [...SHIFTS] as Shift[],
  medications: [...MEDICATIONS] as Medication[],
  medicationAdministrations: [] as MedicationAdministration[],
  dailyLog: [...DAILY_LOG] as DailyLogEntry[],
  leaveRequests: [...LEAVE_REQUESTS] as LeaveRequest[],
  trainingRecords: [...TRAINING_RECORDS] as TrainingRecord[],
  missingEpisodes: [] as MissingEpisode[],
  chronology: [] as ChronologyEntry[],
  handovers: [] as HandoverEntry[],
  buildings: [] as Building[],
  buildingChecks: [] as BuildingCheck[],
  vehicles: [] as Vehicle[],
  vehicleChecks: [] as VehicleCheck[],
  notifications: [] as Notification[],
  timeSaved: [] as TimeSavedEntry[],
  careForms: [] as CareForm[],
  supervisions: [] as Supervision[],
  vacancies: [] as Vacancy[],
  candidateProfiles: [] as CandidateProfile[],
  candidateChecks: [] as CandidateCheck[],
  candidateReferences: [] as CandidateReference[],
  employmentHistory: [] as EmploymentHistoryEntry[],
  gapExplanations: [] as GapExplanation[],
  candidateInterviews: [] as CandidateInterview[],
  conditionalOffers: [] as ConditionalOffer[],
  recruitmentAudit: [] as RecruitmentAuditEntry[],
  documents: [] as Document[],
  documentReadReceipts: [] as DocumentReadReceipt[],
  expenses: [] as Expense[],
  audits: [] as Audit[],
  maintenance: [] as MaintenanceItem[],
};

// Seed missing episodes
store.missingEpisodes = [
  {
    id: "mfc_001", reference: "MFC-2026-001", child_id: "yp_alex",
    date_missing: "2026-01-15", time_missing: "21:30",
    date_returned: "2026-01-15", time_returned: "23:25",
    duration_hours: 1.9, risk_level: "medium",
    location_last_seen: "Outside Oak House — said going to shop",
    return_location: "Local park, returned voluntarily",
    reported_to_police: false, police_reference: null,
    reported_to_la: true, la_notified_at: "2026-01-16T09:00:00Z",
    return_interview_completed: true, return_interview_by: "staff_ryan",
    return_interview_date: "2026-01-16",
    return_interview_notes: "Alex said he lost track of time. No safeguarding concerns disclosed. Agreed to check in next time.",
    contextual_safeguarding_risk: false,
    linked_incident_id: null,
    pattern_notes: "First episode. Informal community time.",
    status: "closed", home_id: "home_oak",
    created_at: "2026-01-15T23:30:00Z", created_by: "staff_edward",
  },
  {
    id: "mfc_002", reference: "MFC-2026-002", child_id: "yp_alex",
    date_missing: "2026-02-28", time_missing: "19:00",
    date_returned: "2026-02-28", time_returned: "23:10",
    duration_hours: 4.2, risk_level: "high",
    location_last_seen: "Leaving for 'mate's house' — no address given",
    return_location: "Town centre, collected by staff",
    reported_to_police: true, police_reference: "DERBYSHIRE/2026/001122",
    reported_to_la: true, la_notified_at: "2026-02-28T20:00:00Z",
    return_interview_completed: true, return_interview_by: "staff_darren",
    return_interview_date: "2026-03-01",
    return_interview_notes: "Alex disclosed spending time with a group of older males he met online. Names not provided. CS risk assessment initiated.",
    contextual_safeguarding_risk: true,
    linked_incident_id: null,
    pattern_notes: "Second episode. Increasing duration. CS risk flagged — older peer network.",
    status: "closed", home_id: "home_oak",
    created_at: "2026-02-28T19:15:00Z", created_by: "staff_lackson",
  },
  {
    id: "mfc_003", reference: "MFC-2026-003", child_id: "yp_alex",
    date_missing: "2026-04-01", time_missing: "20:45",
    date_returned: "2026-04-01", time_returned: "22:20",
    duration_hours: 1.6, risk_level: "high",
    location_last_seen: "Community — said going to shop",
    return_location: "Local park, with unknown males",
    reported_to_police: true, police_reference: "DERBYSHIRE/2026/002876",
    reported_to_la: true, la_notified_at: "2026-04-01T21:00:00Z",
    return_interview_completed: true, return_interview_by: "staff_edward",
    return_interview_date: "2026-04-02",
    return_interview_notes: "Alex was evasive. Wouldn't name contacts. Mobile phone observed — not usual device. Risk assessment updated. Strategy discussion arranged.",
    contextual_safeguarding_risk: true,
    linked_incident_id: "inc_001",
    pattern_notes: "Third episode this year. Pattern emerging — always late evening, always community. Same unknown peer group suspected. Escalated to MASH.",
    status: "closed", home_id: "home_oak",
    created_at: "2026-04-01T20:55:00Z", created_by: "staff_edward",
  },
];

// Seed chronology
store.chronology = [
  // Alex chronology
  { id: "chr_001", child_id: "yp_alex", date: "2025-09-01", time: "14:00", category: "placement", title: "Placement commenced at Oak House", description: "Alex admitted to Oak House under S20. Initial placement meeting held with LA, IRO, and social worker. Risk assessment reviewed.", significance: "critical", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2025-09-01T14:00:00Z" },
  { id: "chr_002", child_id: "yp_alex", date: "2025-10-01", time: null, category: "education", title: "School placement arranged — Derby Alternative Provision", description: "Education arranged with Derby AP following exclusion from previous school. Alex settled well in first week.", significance: "significant", recorded_by: "staff_ryan", linked_incident_id: null, home_id: "home_oak", created_at: "2025-10-01T10:00:00Z" },
  { id: "chr_003", child_id: "yp_alex", date: "2026-01-15", time: "21:30", category: "missing", title: "First missing from care episode (MFC-2026-001)", description: "Alex absent 1h 55m. Returned voluntarily. Low-risk return interview completed.", significance: "significant", recorded_by: "staff_edward", linked_incident_id: null, home_id: "home_oak", created_at: "2026-01-15T23:30:00Z" },
  { id: "chr_004", child_id: "yp_alex", date: "2026-02-05", time: null, category: "review", title: "LAC Review — Alex W", description: "Looked After Child review held at Derby City Council. Placement stable. Education engagement improved. No change to Care Order.", significance: "significant", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2026-02-05T11:00:00Z" },
  { id: "chr_005", child_id: "yp_alex", date: "2026-02-28", time: "19:00", category: "missing", title: "Second missing from care episode (MFC-2026-002) — CS risk flagged", description: "Alex absent 4h 10m. Police informed. CS risk identified — older peer network. Strategy discussion booked.", significance: "critical", recorded_by: "staff_lackson", linked_incident_id: null, home_id: "home_oak", created_at: "2026-02-28T19:15:00Z" },
  { id: "chr_006", child_id: "yp_alex", date: "2026-04-01", time: "20:45", category: "missing", title: "Third missing from care episode (MFC-2026-003) — pattern escalated", description: "Alex absent 1h 35m. Police informed. Contextual safeguarding escalation — MASH referral made. Unknown peer group suspected.", significance: "critical", recorded_by: "staff_edward", linked_incident_id: "inc_001", home_id: "home_oak", created_at: "2026-04-01T20:55:00Z" },
  { id: "chr_007", child_id: "yp_alex", date: "2026-04-14", time: "19:10", category: "safeguarding", title: "Safeguarding disclosure — criminal exploitation risk", description: "Alex disclosed older peer asking him to carry items. Immediate safeguarding response. Social worker, police, and RM notified. Strategy discussion arranged.", significance: "critical", recorded_by: "staff_edward", linked_incident_id: "inc_004", home_id: "home_oak", created_at: "2026-04-14T19:15:00Z" },
  // Jordan chronology
  { id: "chr_010", child_id: "yp_jordan", date: "2025-11-15", time: null, category: "placement", title: "Placement commenced at Oak House", description: "Jordan admitted under Full Care Order (S31). Placement plan agreed with Nottinghamshire CC. Halal food and dietary requirements confirmed.", significance: "critical", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2025-11-15T12:00:00Z" },
  { id: "chr_011", child_id: "yp_jordan", date: "2025-12-01", time: null, category: "education", title: "School placement — Highfields Academy", description: "Jordan started at Highfields Academy. Initial settling in period. Positive engagement with PE.", significance: "significant", recorded_by: "staff_ryan", linked_incident_id: null, home_id: "home_oak", created_at: "2025-12-01T09:00:00Z" },
  { id: "chr_012", child_id: "yp_jordan", date: "2026-04-14", time: "14:30", category: "behaviour", title: "Complaint raised — noise during study time (INC-2026-0042)", description: "Jordan raised formal complaint about noise levels. Complaint logged and investigation commenced.", significance: "significant", recorded_by: "staff_chervelle", linked_incident_id: "inc_003", home_id: "home_oak", created_at: "2026-04-14T14:35:00Z" },
  // Casey chronology
  { id: "chr_020", child_id: "yp_casey", date: "2026-01-10", time: null, category: "placement", title: "Placement commenced at Oak House", description: "Casey admitted under Full Care Order. From previous placement that broke down. Settling-in plan agreed. CAMHS referral in place.", significance: "critical", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2026-01-10T13:00:00Z" },
  { id: "chr_021", child_id: "yp_casey", date: "2026-01-15", time: null, category: "health", title: "Melatonin prescribed — sleep support", description: "Dr Chen prescribed Melatonin 3mg for sleep difficulties. MAR commenced.", significance: "significant", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2026-01-15T10:00:00Z" },
  { id: "chr_022", child_id: "yp_casey", date: "2026-02-01", time: null, category: "health", title: "Fluoxetine prescribed — mood support", description: "Dr Chen prescribed Fluoxetine 10mg for low mood. Risk assessment updated. CAMHS oversight confirmed.", significance: "significant", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2026-02-01T11:00:00Z" },
  { id: "chr_023", child_id: "yp_casey", date: "2026-04-13", time: "08:15", category: "health", title: "Medication late administration — refusal episode (INC-2026-0040)", description: "Casey refused morning Fluoxetine. Incident logged. Late administration at 08:45 following second attempt.", significance: "significant", recorded_by: "staff_anna", linked_incident_id: "inc_002", home_id: "home_oak", created_at: "2026-04-13T08:20:00Z" },
];

// Seed medication administrations (MAR data)
const today = todayStr();
const mar_base = { home_id: "home_oak", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "staff_darren", updated_by: "staff_darren" };
store.medicationAdministrations = [
  // Casey Fluoxetine (med_002) — last 5 days
  { ...mar_base, id: "mar_001", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-11T08:00:00Z", actual_time: "2026-04-11T08:05:00Z", status: "given", administered_by: "staff_darren", witnessed_by: "staff_ryan", dose_given: "10mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_002", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-12T08:00:00Z", actual_time: "2026-04-12T08:10:00Z", status: "given", administered_by: "staff_ryan", witnessed_by: "staff_edward", dose_given: "10mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_003", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-13T08:00:00Z", actual_time: "2026-04-13T08:45:00Z", status: "late", administered_by: "staff_anna", witnessed_by: "staff_chervelle", dose_given: "10mg", reason_not_given: null, notes: "Initial refusal at 08:00. Second attempt successful at 08:45. Casey settled after 10 mins.", prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_004", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-14T08:00:00Z", actual_time: "2026-04-14T08:08:00Z", status: "given", administered_by: "staff_darren", witnessed_by: "staff_ryan", dose_given: "10mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_005", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-15T08:00:00Z", actual_time: "2026-04-15T08:03:00Z", status: "given", administered_by: "staff_ryan", witnessed_by: "staff_darren", dose_given: "10mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_006", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-16T08:00:00Z", actual_time: null, status: "scheduled", administered_by: null, witnessed_by: null, dose_given: null, reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  // Casey Melatonin (med_001) — last 5 nights
  { ...mar_base, id: "mar_010", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-11T21:30:00Z", actual_time: "2026-04-11T21:35:00Z", status: "given", administered_by: "staff_edward", witnessed_by: "staff_anna", dose_given: "3mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_011", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-12T21:30:00Z", actual_time: "2026-04-12T22:15:00Z", status: "late", administered_by: "staff_anna", witnessed_by: "staff_lackson", dose_given: "3mg", reason_not_given: null, notes: "Casey initially refused. Settled 45 mins later. Late administration documented.", prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_012", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-13T21:30:00Z", actual_time: "2026-04-13T21:32:00Z", status: "given", administered_by: "staff_chervelle", witnessed_by: "staff_diane", dose_given: "3mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_013", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-14T21:30:00Z", actual_time: "2026-04-14T21:30:00Z", status: "given", administered_by: "staff_diane", witnessed_by: "staff_mirela", dose_given: "3mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_014", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-15T21:30:00Z", actual_time: "2026-04-15T21:28:00Z", status: "given", administered_by: "staff_edward", witnessed_by: "staff_anna", dose_given: "3mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_015", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-16T21:30:00Z", actual_time: null, status: "scheduled", administered_by: null, witnessed_by: null, dose_given: null, reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  // Alex Ibuprofen PRN (med_003)
  { ...mar_base, id: "mar_020", medication_id: "med_003", child_id: "yp_alex", scheduled_time: "2026-04-13T16:00:00Z", actual_time: "2026-04-13T16:05:00Z", status: "given", administered_by: "staff_edward", witnessed_by: "staff_lackson", dose_given: "200mg", reason_not_given: null, notes: null, prn_reason: "Headache — Alex complained of head pain post-school", prn_effectiveness: "Effective — resolved within 1 hour" },
  { ...mar_base, id: "mar_021", medication_id: "med_003", child_id: "yp_alex", scheduled_time: "2026-04-15T17:30:00Z", actual_time: "2026-04-15T17:35:00Z", status: "given", administered_by: "staff_lackson", witnessed_by: "staff_chervelle", dose_given: "200mg", reason_not_given: null, notes: null, prn_reason: "Knee pain following football training", prn_effectiveness: "Partially effective — advised rest and elevation" },
  // Jordan Piriton PRN (med_004)
  { ...mar_base, id: "mar_030", medication_id: "med_004", child_id: "yp_jordan", scheduled_time: "2026-03-20T14:00:00Z", actual_time: "2026-03-20T14:10:00Z", status: "given", administered_by: "staff_ryan", witnessed_by: "staff_anna", dose_given: "4mg", reason_not_given: null, notes: null, prn_reason: "Mild rash on forearm — suspected mild allergic reaction after outdoor activity", prn_effectiveness: "Effective — rash resolved within 2 hours. No further symptoms." },
];

// Seed buildings and H&S
store.buildings = [
  {
    id: "bld_001", home_id: "home_oak", name: "Oak House — Main Building",
    type: "residential", address: "Oak House, Derby, DE1 3AA",
    areas: ["bedroom_alex", "bedroom_jordan", "bedroom_casey", "lounge", "kitchen", "bathroom_main", "bathroom_staff", "office", "medication_room", "garden"],
    gas_cert_expiry: "2026-12-01", electrical_cert_expiry: "2027-03-01",
    fire_risk_assessment_date: "2026-01-15", epc_rating: "C",
    last_full_inspection: "2026-01-15", next_inspection_due: "2027-01-15",
    status: "operational", created_at: new Date().toISOString(),
  },
];

store.buildingChecks = [
  { id: "bchk_001", building_id: "bld_001", home_id: "home_oak", area: "whole_home", check_type: "daily_walkround", check_date: today, due_date: today, responsible_person: "staff_chervelle", status: "due", result: null, risk_level: null, notes: null, action_required: null, action_due: null, manager_oversight: false, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_002", building_id: "bld_001", home_id: "home_oak", area: "medication_room", check_type: "medication_room_security", check_date: today, due_date: today, responsible_person: "staff_ryan", status: "completed", result: "pass", risk_level: "low", notes: "Medication room secure. Controlled drugs register checked. Stock counts match MAR.", action_required: null, action_due: null, manager_oversight: false, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_003", building_id: "bld_001", home_id: "home_oak", area: "kitchen", check_type: "food_hygiene", check_date: today, due_date: today, responsible_person: "staff_edward", status: "completed", result: "pass", risk_level: "low", notes: "Fridge temp 4°C. Freezer -18°C. Surfaces clean. Halal/non-halal separation maintained.", action_required: null, action_due: null, manager_oversight: false, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_004", building_id: "bld_001", home_id: "home_oak", area: "whole_home", check_type: "fire_alarm_test", check_date: "2026-04-14", due_date: "2026-04-21", responsible_person: "staff_darren", status: "completed", result: "pass", risk_level: "low", notes: "Weekly fire alarm test completed. All zones activated and reset correctly.", action_required: null, action_due: null, manager_oversight: false, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_005", building_id: "bld_001", home_id: "home_oak", area: "garden", check_type: "external_security", check_date: "2026-04-15", due_date: "2026-04-15", responsible_person: "staff_lackson", status: "completed", result: "fail", risk_level: "medium", notes: "Rear gate latch is loose. Could be forced. Risk to perimeter security.", action_required: "Replace rear gate latch. Interim fix — padlock applied.", action_due: "2026-04-18", manager_oversight: true, linked_maintenance_id: "mnt_001", evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_006", building_id: "bld_001", home_id: "home_oak", area: "whole_home", check_type: "emergency_lighting", check_date: "2026-03-15", due_date: "2026-04-15", responsible_person: "staff_ryan", status: "overdue", result: null, risk_level: "high", notes: null, action_required: "Emergency lighting test overdue — schedule immediately", action_due: today, manager_oversight: true, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
];

// Seed vehicles
store.vehicles = [
  {
    id: "veh_001", home_id: "home_oak",
    registration: "AB21 CDE", make: "Ford", model: "Transit Custom",
    colour: "White", year: 2021, seats: 5,
    mot_expiry: "2026-08-15", insurance_expiry: "2026-09-01",
    tax_expiry: "2026-07-01", last_service: "2025-10-20",
    next_service_due: "2026-10-20", mileage: 34800,
    status: "available", breakdown_cover: "RAC", breakdown_ref: "RAC-OAK-2024",
    notes: null, created_at: new Date().toISOString(),
  },
  {
    id: "veh_002", home_id: "home_oak",
    registration: "FG23 HIJ", make: "Vauxhall", model: "Vivaro",
    colour: "Silver", year: 2023, seats: 7,
    mot_expiry: "2026-05-10", insurance_expiry: "2026-09-01",
    tax_expiry: "2026-08-01", last_service: "2026-02-10",
    next_service_due: "2026-08-10", mileage: 18200,
    status: "available", breakdown_cover: "RAC", breakdown_ref: "RAC-OAK-2024",
    notes: "Check tyre pressure — flagged at last check",
    created_at: new Date().toISOString(),
  },
];

store.vehicleChecks = [
  { id: "vchk_001", vehicle_id: "veh_001", home_id: "home_oak", check_type: "daily_safety", check_date: today, driver: "staff_lackson", tyres: "pass", lights: "pass", brakes: "pass", mirrors: "pass", fluids: "pass", wipers: "pass", cleanliness: "pass", mileage_start: 34780, mileage_end: null, fuel_level: "3/4", overall_result: "pass", defects: null, notes: "Vehicle in good condition.", created_at: new Date().toISOString() },
  { id: "vchk_002", vehicle_id: "veh_002", home_id: "home_oak", check_type: "daily_safety", check_date: "2026-04-15", driver: "staff_anna", tyres: "advisory", lights: "pass", brakes: "pass", mirrors: "pass", fluids: "pass", wipers: "pass", cleanliness: "pass", mileage_start: 18190, mileage_end: 18200, fuel_level: "1/2", overall_result: "advisory", defects: "Nearside front tyre borderline — tread depth 2.1mm. Recommend replacement within 2 weeks.", notes: "Tyre pressure also low — inflated at garage.", created_at: new Date().toISOString() },
];

// Seed handovers
store.handovers = [
  {
    id: "hnd_001", home_id: "home_oak",
    shift_date: today, shift_from: "night", shift_to: "day",
    handover_time: "07:30", completed_at: "07:45",
    outgoing_staff: ["staff_edward"], incoming_staff: ["staff_darren", "staff_ryan"],
    created_by: "staff_edward", signed_off_by: "staff_darren",
    child_updates: [
      { child_id: "yp_alex", mood_score: 6, key_notes: "Alex had a settled night. Some restlessness at 02:00 — checked, was on phone. Phone discussion needed. Mood okay this morning.", alerts: ["Phone usage overnight — third time this week"] },
      { child_id: "yp_jordan", mood_score: 8, key_notes: "Jordan slept well. Up at 07:00, positive this morning. Prepared own breakfast.", alerts: [] },
      { child_id: "yp_casey", mood_score: 5, key_notes: "Casey had a difficult night. Woke at 01:30 distressed — contact with mother earlier affected mood. Settled with support from Edward.", alerts: ["Sleep disturbance linked to contact", "Medication refusal risk for morning"] },
    ],
    general_notes: "Rear gate latch needs fixing urgently — flagged to Ryan. CCTV camera still not installed.",
    flags: ["gate_security", "alex_phone_overnight", "casey_sleep_disturbance"],
    linked_incident_ids: ["inc_001", "inc_004"],
    created_at: new Date().toISOString(),
  },
];

// ── Safer Recruitment Seed Data ───────────────────────────────────────────────

store.vacancies = [
  {
    id: "vac_001",
    home_id: "home_oak",
    title: "Residential Care Worker",
    role_code: "RCW",
    employment_type: "permanent",
    contract_type: "full_time",
    salary_min: 24000,
    salary_max: 27000,
    hours: 40,
    shift_pattern: "Rotating days, evenings and sleep-ins across a 4-week rota",
    reports_to: "staff_darren",
    safeguarding_statement: "Oak House is committed to safeguarding and promoting the welfare of children and young people. All posts are subject to an enhanced DBS check, barred list check, and satisfactory references.",
    status: "open",
    approval_status: "approved",
    created_by: "staff_darren",
    approved_by: "staff_darren",
    approved_at: "2026-03-10T09:00:00Z",
    created_at: "2026-03-08T10:00:00Z",
    updated_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "vac_002",
    home_id: "home_oak",
    title: "Team Leader",
    role_code: "TL",
    employment_type: "permanent",
    contract_type: "full_time",
    salary_min: 30000,
    salary_max: 34000,
    hours: 40,
    shift_pattern: "Supernumerary management shifts plus on-call cover",
    reports_to: "staff_darren",
    safeguarding_statement: "Oak House is committed to safeguarding and promoting the welfare of children and young people. All posts are subject to an enhanced DBS check, barred list check, and satisfactory references.",
    status: "open",
    approval_status: "approved",
    created_by: "staff_darren",
    approved_by: "staff_darren",
    approved_at: "2026-03-15T11:00:00Z",
    created_at: "2026-03-14T14:00:00Z",
    updated_at: "2026-03-15T11:00:00Z",
  },
];

// Candidate IDs
const CAND_AMARA = "cand_001";
const CAND_DANIEL = "cand_002";
const CAND_PRISCILLA = "cand_003";

store.candidateProfiles = [
  {
    id: CAND_AMARA,
    home_id: "home_oak",
    vacancy_id: "vac_001",
    first_name: "Amara",
    last_name: "Osei",
    preferred_name: null,
    email: "amara.osei@email.com",
    phone: "07712 345678",
    dob: "1998-06-14",
    current_address: "12 Maple Close, Derby, DE3 9PL",
    source: "indeed",
    current_stage: "interview_scheduled",
    compliance_status: "in_progress",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    assigned_manager_id: "staff_darren",
    cv_url: "/uploads/candidates/cand_001_cv.pdf",
    application_form_url: "/uploads/candidates/cand_001_application.pdf",
    cover_letter_url: null,
    adjustments_requested: false,
    adjustments_notes: null,
    notes: "Strong application. Good values statement. Worked in a similar environment previously. Panel interview arranged for 22 April.",
    created_at: "2026-03-20T10:30:00Z",
    updated_at: "2026-04-10T09:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: CAND_DANIEL,
    home_id: "home_oak",
    vacancy_id: "vac_001",
    first_name: "Daniel",
    last_name: "Wright",
    preferred_name: "Dan",
    email: "d.wright@email.co.uk",
    phone: "07823 456789",
    dob: "1994-11-03",
    current_address: "45 Regent Street, Nottingham, NG1 5BS",
    source: "total_jobs",
    current_stage: "references_received",
    compliance_status: "in_progress",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    assigned_manager_id: "staff_darren",
    cv_url: "/uploads/candidates/cand_002_cv.pdf",
    application_form_url: "/uploads/candidates/cand_002_application.pdf",
    cover_letter_url: "/uploads/candidates/cand_002_cover.pdf",
    adjustments_requested: false,
    adjustments_notes: null,
    notes: "6 years experience in residential care. One reference received and satisfactory. Awaiting second reference from Paul Reeves. DBS not yet submitted — chasing candidate.",
    created_at: "2026-03-22T14:00:00Z",
    updated_at: "2026-04-12T11:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: CAND_PRISCILLA,
    home_id: "home_oak",
    vacancy_id: "vac_002",
    first_name: "Priscilla",
    last_name: "Mensah",
    preferred_name: null,
    email: "p.mensah@email.com",
    phone: "07934 567890",
    dob: "1989-02-22",
    current_address: "8 Birch Lane, Leicester, LE4 2KT",
    source: "staff_referral",
    current_stage: "pre_start_checks",
    compliance_status: "in_progress",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    assigned_manager_id: "staff_darren",
    cv_url: "/uploads/candidates/cand_003_cv.pdf",
    application_form_url: "/uploads/candidates/cand_003_application.pdf",
    cover_letter_url: "/uploads/candidates/cand_003_cover.pdf",
    adjustments_requested: true,
    adjustments_notes: "Requires parking space at site — uses crutches intermittently following knee surgery. Ground floor office access preferred.",
    notes: "Excellent candidate. 10 years in residential care, 3 as a senior. Both references satisfactory. DBS submitted 8 April — awaiting certificate. Conditional offer sent.",
    created_at: "2026-03-18T09:00:00Z",
    updated_at: "2026-04-14T10:00:00Z",
    created_by: "staff_darren",
  },
];

// Checks — Amara
store.candidateChecks = [
  {
    id: "chk_001", candidate_id: CAND_AMARA, check_type: "enhanced_dbs",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-30", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-20T10:30:00Z", updated_at: "2026-03-20T10:30:00Z",
  },
  {
    id: "chk_002", candidate_id: CAND_AMARA, check_type: "right_to_work",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-30", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-20T10:30:00Z", updated_at: "2026-03-20T10:30:00Z",
  },
  {
    id: "chk_003", candidate_id: CAND_AMARA, check_type: "identity",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-30", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-20T10:30:00Z", updated_at: "2026-03-20T10:30:00Z",
  },
  {
    id: "chk_004", candidate_id: CAND_AMARA, check_type: "references",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-30", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-20T10:30:00Z", updated_at: "2026-03-20T10:30:00Z",
  },
  // Checks — Daniel
  {
    id: "chk_005", candidate_id: CAND_DANIEL, check_type: "enhanced_dbs",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-28", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-22T14:00:00Z", updated_at: "2026-03-22T14:00:00Z",
  },
  {
    id: "chk_006", candidate_id: CAND_DANIEL, check_type: "right_to_work",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-04-28", requested_at: "2026-04-01T09:00:00Z",
    received_at: "2026-04-03T11:00:00Z", verified_at: "2026-04-03T14:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: "UK Passport", document_expiry: "2031-05-10",
    metadata: {},
    created_at: "2026-03-22T14:00:00Z", updated_at: "2026-04-03T14:00:00Z",
  },
  {
    id: "chk_007", candidate_id: CAND_DANIEL, check_type: "identity",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-04-28", requested_at: "2026-04-01T09:00:00Z",
    received_at: "2026-04-03T11:00:00Z", verified_at: "2026-04-03T14:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: "UK Passport", document_expiry: null,
    metadata: {},
    created_at: "2026-03-22T14:00:00Z", updated_at: "2026-04-03T14:00:00Z",
  },
  {
    id: "chk_008", candidate_id: CAND_DANIEL, check_type: "references",
    status: "in_progress", required: true, owner_id: "staff_darren",
    due_date: "2026-04-28", requested_at: "2026-04-01T09:00:00Z",
    received_at: null, verified_at: null, verified_by: null,
    concern_flag: false, concern_summary: null, override_used: false,
    override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: null, document_expiry: null,
    metadata: { refs_received: 1, refs_required: 2 },
    created_at: "2026-03-22T14:00:00Z", updated_at: "2026-04-10T09:00:00Z",
  },
  // Checks — Priscilla
  {
    id: "chk_009", candidate_id: CAND_PRISCILLA, check_type: "enhanced_dbs",
    status: "in_progress", required: true, owner_id: "staff_darren",
    due_date: "2026-05-01", requested_at: "2026-04-08T10:00:00Z",
    received_at: null, verified_at: null, verified_by: null,
    concern_flag: false, concern_summary: null, override_used: false,
    override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: null, document_expiry: null,
    metadata: { submitted_via: "DBS online portal", tracking_reference: "DBS-2026-78432" },
    created_at: "2026-03-18T09:00:00Z", updated_at: "2026-04-08T10:00:00Z",
  },
  {
    id: "chk_010", candidate_id: CAND_PRISCILLA, check_type: "right_to_work",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-05-01", requested_at: "2026-03-28T09:00:00Z",
    received_at: "2026-03-30T10:00:00Z", verified_at: "2026-03-30T11:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: "British Passport", document_expiry: "2029-11-22",
    metadata: {},
    created_at: "2026-03-18T09:00:00Z", updated_at: "2026-03-30T11:00:00Z",
  },
  {
    id: "chk_011", candidate_id: CAND_PRISCILLA, check_type: "identity",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-05-01", requested_at: "2026-03-28T09:00:00Z",
    received_at: "2026-03-30T10:00:00Z", verified_at: "2026-03-30T11:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: "British Passport", document_expiry: null,
    metadata: {},
    created_at: "2026-03-18T09:00:00Z", updated_at: "2026-03-30T11:00:00Z",
  },
  {
    id: "chk_012", candidate_id: CAND_PRISCILLA, check_type: "references",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-05-01", requested_at: "2026-03-28T09:00:00Z",
    received_at: "2026-04-10T14:00:00Z", verified_at: "2026-04-11T09:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: null, document_expiry: null,
    metadata: { refs_received: 2, refs_required: 2 },
    created_at: "2026-03-18T09:00:00Z", updated_at: "2026-04-11T09:00:00Z",
  },
];

// References — Amara
store.candidateReferences = [
  {
    id: "ref_001", candidate_id: CAND_AMARA,
    referee_name: "Sarah Jenkins", referee_role: "Residential Manager",
    organisation_name: "Bright Futures Care Ltd",
    email: "s.jenkins@brightfutures.co.uk", phone: "01332 890123",
    relationship_to_candidate: "Direct line manager",
    is_most_recent_employer: true,
    requested_at: "2026-04-08T09:00:00Z", chased_at: null,
    received_at: null, structured_response: null,
    verbal_verification_completed: false, verbal_verified_by: null, verbal_verified_at: null,
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: null,
    status: "requested",
    created_at: "2026-04-08T09:00:00Z", updated_at: "2026-04-08T09:00:00Z",
  },
  {
    id: "ref_002", candidate_id: CAND_AMARA,
    referee_name: "Mark Bhatt", referee_role: "Senior Care Worker",
    organisation_name: "Bright Futures Care Ltd",
    email: "m.bhatt@brightfutures.co.uk", phone: null,
    relationship_to_candidate: "Colleague",
    is_most_recent_employer: false,
    requested_at: "2026-04-08T09:00:00Z", chased_at: null,
    received_at: null, structured_response: null,
    verbal_verification_completed: false, verbal_verified_by: null, verbal_verified_at: null,
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: null,
    status: "requested",
    created_at: "2026-04-08T09:00:00Z", updated_at: "2026-04-08T09:00:00Z",
  },
  // References — Daniel
  {
    id: "ref_003", candidate_id: CAND_DANIEL,
    referee_name: "Emma Holt", referee_role: "Registered Manager",
    organisation_name: "Turning Point Children's Services",
    email: "emma.holt@turningpoint.org", phone: "0115 234 5678",
    relationship_to_candidate: "Direct line manager",
    is_most_recent_employer: true,
    requested_at: "2026-04-01T09:00:00Z", chased_at: null,
    received_at: "2026-04-09T14:00:00Z",
    structured_response: {
      dates_of_employment_confirmed: true,
      role_confirmed: true,
      performance_rating: "good",
      disciplinary_concerns: false,
      safeguarding_concerns: false,
      would_re_employ: true,
      additional_comments: "Daniel is a reliable and compassionate care worker. He demonstrates a strong understanding of safeguarding and works well with young people with complex needs.",
    },
    verbal_verification_completed: true,
    verbal_verified_by: "staff_darren",
    verbal_verified_at: "2026-04-09T16:00:00Z",
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: "high",
    status: "satisfactory",
    created_at: "2026-04-01T09:00:00Z", updated_at: "2026-04-09T16:00:00Z",
  },
  {
    id: "ref_004", candidate_id: CAND_DANIEL,
    referee_name: "Paul Reeves", referee_role: "Deputy Manager",
    organisation_name: "Kingsway Residential Care",
    email: "paul.reeves@kingsway.care", phone: null,
    relationship_to_candidate: "Previous line manager",
    is_most_recent_employer: false,
    requested_at: "2026-04-01T09:00:00Z", chased_at: "2026-04-12T09:00:00Z",
    received_at: null, structured_response: null,
    verbal_verification_completed: false, verbal_verified_by: null, verbal_verified_at: null,
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: null,
    status: "chased",
    created_at: "2026-04-01T09:00:00Z", updated_at: "2026-04-12T09:00:00Z",
  },
  // References — Priscilla
  {
    id: "ref_005", candidate_id: CAND_PRISCILLA,
    referee_name: "Jane Kimber", referee_role: "Registered Manager",
    organisation_name: "Heatherwood Children's Services",
    email: "j.kimber@heatherwood.co.uk", phone: "0116 876 5432",
    relationship_to_candidate: "Direct line manager",
    is_most_recent_employer: true,
    requested_at: "2026-03-28T09:00:00Z", chased_at: null,
    received_at: "2026-04-05T11:00:00Z",
    structured_response: {
      dates_of_employment_confirmed: true,
      role_confirmed: true,
      performance_rating: "excellent",
      disciplinary_concerns: false,
      safeguarding_concerns: false,
      would_re_employ: true,
      additional_comments: "Priscilla is an exceptional team leader. She has a natural ability to support both young people and staff teams. I have no hesitation in recommending her.",
    },
    verbal_verification_completed: true,
    verbal_verified_by: "staff_darren",
    verbal_verified_at: "2026-04-05T14:00:00Z",
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: "high",
    status: "satisfactory",
    created_at: "2026-03-28T09:00:00Z", updated_at: "2026-04-05T14:00:00Z",
  },
  {
    id: "ref_006", candidate_id: CAND_PRISCILLA,
    referee_name: "Richard Park", referee_role: "Head of Operations",
    organisation_name: "Heatherwood Children's Services",
    email: "r.park@heatherwood.co.uk", phone: "0116 876 5433",
    relationship_to_candidate: "Senior manager",
    is_most_recent_employer: false,
    requested_at: "2026-03-28T09:00:00Z", chased_at: null,
    received_at: "2026-04-10T14:00:00Z",
    structured_response: {
      dates_of_employment_confirmed: true,
      role_confirmed: true,
      performance_rating: "excellent",
      disciplinary_concerns: false,
      safeguarding_concerns: false,
      would_re_employ: true,
      additional_comments: "Priscilla consistently led her team to high standards. A thoroughly professional and safeguarding-conscious practitioner.",
    },
    verbal_verification_completed: true,
    verbal_verified_by: "staff_darren",
    verbal_verified_at: "2026-04-10T16:00:00Z",
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: "high",
    status: "satisfactory",
    created_at: "2026-03-28T09:00:00Z", updated_at: "2026-04-10T16:00:00Z",
  },
];

// Conditional offer for Priscilla
store.conditionalOffers = [
  {
    id: "offer_001", candidate_id: CAND_PRISCILLA,
    status: "conditional_sent",
    conditional_offer_sent_at: "2026-04-12T10:00:00Z",
    proposed_start_date: "2026-05-12",
    salary: 32000, hours: 40, probation_months: 6,
    conditions: ["Clear enhanced DBS certificate", "Satisfactory occupational health screening"],
    exceptional_start: false,
    exceptional_start_approved_by: null,
    exceptional_start_rationale: null,
    exceptional_start_risk_mitigation: null,
    final_clearance_completed_at: null,
    final_clearance_by: null,
    created_at: "2026-04-12T10:00:00Z", updated_at: "2026-04-12T10:00:00Z",
  },
];

// Audit entries
store.recruitmentAudit = [
  {
    id: generateId("aud"),
    candidate_id: CAND_AMARA, vacancy_id: "vac_001",
    actor_id: "staff_darren",
    event_type: "candidate_created",
    entity_type: "candidate_profile", entity_id: CAND_AMARA,
    before_state: null,
    after_state: { stage: "application_received", compliance_status: "not_started" },
    notes: "Application received via Indeed. Shortlisted for interview.",
    created_at: "2026-03-20T10:30:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_AMARA, vacancy_id: "vac_001",
    actor_id: "staff_darren",
    event_type: "stage_changed",
    entity_type: "candidate_profile", entity_id: CAND_AMARA,
    before_state: { stage: "sift" },
    after_state: { stage: "interview_scheduled" },
    notes: "Panel interview scheduled for 22 April 2026 at 10:00.",
    created_at: "2026-04-10T09:00:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_DANIEL, vacancy_id: "vac_001",
    actor_id: "staff_darren",
    event_type: "check_verified",
    entity_type: "candidate_check", entity_id: "chk_006",
    before_state: { status: "requested" },
    after_state: { status: "verified", document_type: "UK Passport" },
    notes: "Right to work confirmed — UK passport sighted and verified in person.",
    created_at: "2026-04-03T14:00:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_DANIEL, vacancy_id: "vac_001",
    actor_id: "staff_darren",
    event_type: "reference_received",
    entity_type: "candidate_reference", entity_id: "ref_003",
    before_state: { status: "requested" },
    after_state: { status: "satisfactory" },
    notes: "Reference received from Emma Holt at Turning Point. Satisfactory. Verbal verification completed.",
    created_at: "2026-04-09T16:00:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_PRISCILLA, vacancy_id: "vac_002",
    actor_id: "staff_darren",
    event_type: "dbs_submitted",
    entity_type: "candidate_check", entity_id: "chk_009",
    before_state: { status: "not_started" },
    after_state: { status: "in_progress", metadata: { submitted_via: "DBS online portal", tracking_reference: "DBS-2026-78432" } },
    notes: "Enhanced DBS submitted via online portal. Tracking reference: DBS-2026-78432.",
    created_at: "2026-04-08T10:00:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_PRISCILLA, vacancy_id: "vac_002",
    actor_id: "staff_darren",
    event_type: "conditional_offer_sent",
    entity_type: "conditional_offer", entity_id: "offer_001",
    before_state: { status: "draft" },
    after_state: { status: "conditional_sent", salary: 32000, proposed_start_date: "2026-05-12" },
    notes: "Conditional offer letter sent to candidate. Conditions: clear DBS, occupational health clearance.",
    created_at: "2026-04-12T10:00:00Z",
  },
];

// Seed care forms
store.careForms = [
  {
    id: "form_001", home_id: "home_oak",
    title: "Alex W — Return from Missing Interview", form_type: "return_from_missing",
    status: "submitted", priority: "high",
    linked_child_id: "yp_alex", linked_staff_id: null,
    linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
    description: "Return interview following MFC-2026-003 on 01 April 2026.",
    body: { questions_asked: ["Where were you?", "Who were you with?", "Are you safe?"], young_person_disclosed: "Alex was evasive but mentioned spending time in the park." },
    submitted_at: "2026-04-02T10:30:00Z", submitted_by: "staff_edward",
    reviewed_by: "staff_darren", reviewed_at: "2026-04-02T14:00:00Z",
    review_notes: "Return interview thorough. CS risk noted. Strategy discussion to follow.",
    approved_at: null, approved_by: null,
    due_date: "2026-04-02", tags: ["missing", "safeguarding", "yp_alex"],
    created_at: "2026-04-02T10:00:00Z", updated_at: "2026-04-02T14:00:00Z",
    created_by: "staff_edward", updated_by: "staff_darren",
  },
  {
    id: "form_002", home_id: "home_oak",
    title: "Casey T — CAMHS Risk Assessment (April 2026)", form_type: "risk_assessment",
    status: "approved", priority: "high",
    linked_child_id: "yp_casey", linked_staff_id: null,
    linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
    description: "Monthly risk assessment updated following medication refusal episode.",
    body: { risk_level: "medium", protective_factors: ["therapeutic relationship", "medication now stable"], risk_factors: ["self-harm history", "low mood"] },
    submitted_at: "2026-04-14T09:00:00Z", submitted_by: "staff_darren",
    reviewed_by: "staff_darren", reviewed_at: "2026-04-14T09:30:00Z",
    review_notes: "Risk level confirmed medium. CAMHS oversight maintained.",
    approved_at: "2026-04-14T09:30:00Z", approved_by: "staff_darren",
    due_date: "2026-04-15", tags: ["risk", "camhs", "yp_casey"],
    created_at: "2026-04-13T16:00:00Z", updated_at: "2026-04-14T09:30:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "form_003", home_id: "home_oak",
    title: "Jordan T — Weekly Supervision Note (Week 15)", form_type: "supervision_record",
    status: "draft", priority: "medium",
    linked_child_id: "yp_jordan", linked_staff_id: "staff_ryan",
    linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
    description: "Weekly therapeutic support session note.",
    body: {},
    submitted_at: null, submitted_by: null,
    reviewed_by: null, reviewed_at: null, review_notes: null,
    approved_at: null, approved_by: null,
    due_date: "2026-04-19", tags: ["supervision", "yp_jordan"],
    created_at: "2026-04-17T11:00:00Z", updated_at: "2026-04-17T11:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "form_004", home_id: "home_oak",
    title: "Oak House — Monthly Health & Safety Check", form_type: "health_safety_check",
    status: "pending_review", priority: "medium",
    linked_child_id: null, linked_staff_id: "staff_chervelle",
    linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
    description: "Monthly H&S walkround checklist for April 2026.",
    body: { areas_checked: ["kitchen", "garden", "bedrooms", "fire exits"], issues_found: ["rear gate latch loose — padlock applied"] },
    submitted_at: "2026-04-15T16:00:00Z", submitted_by: "staff_chervelle",
    reviewed_by: null, reviewed_at: null, review_notes: null,
    approved_at: null, approved_by: null,
    due_date: "2026-04-16", tags: ["health_safety", "maintenance"],
    created_at: "2026-04-15T15:00:00Z", updated_at: "2026-04-15T16:00:00Z",
    created_by: "staff_chervelle", updated_by: "staff_chervelle",
  },
  {
    id: "form_005", home_id: "home_oak",
    title: "Alex W — Contextual Safeguarding Referral", form_type: "safeguarding_referral",
    status: "submitted", priority: "urgent",
    linked_child_id: "yp_alex", linked_staff_id: null,
    linked_incident_id: "inc_004", linked_shift_id: null, linked_task_id: null,
    description: "MASH referral following disclosure of possible criminal exploitation.",
    body: { referral_type: "MASH", reason: "Young person disclosed carrying items for older males. Criminal exploitation indicators present." },
    submitted_at: "2026-04-14T20:00:00Z", submitted_by: "staff_darren",
    reviewed_by: null, reviewed_at: null, review_notes: null,
    approved_at: null, approved_by: null,
    due_date: "2026-04-14", tags: ["safeguarding", "ce", "mash", "yp_alex", "urgent"],
    created_at: "2026-04-14T19:30:00Z", updated_at: "2026-04-14T20:00:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
];

// Seed supervision records
store.supervisions = [
  // ── Completed supervisions (historical) ────────────────────────────────────
  {
    id: "sup_001", staff_id: "staff_edward", supervisor_id: "staff_ryan",
    type: "formal", scheduled_date: "2026-03-26", actual_date: "2026-03-26",
    duration_minutes: 60, status: "completed",
    discussion_points: "Performance review following incident involvement on 2026-02-28. Alex's contextual safeguarding risk — Edward's response was timely and appropriate. Discussed de-escalation techniques. Identified further training need: trauma-informed practice refresher.",
    actions_agreed: [
      { id: "act_001a", description: "Book trauma-informed practice refresher", owner: "staff_edward", due_date: "2026-04-15", status: "pending", completed_at: null },
      { id: "act_001b", description: "Shadow senior staff at next strategy discussion", owner: "staff_edward", due_date: "2026-04-30", status: "pending", completed_at: null },
    ],
    wellbeing_score: 7, staff_signature: true, supervisor_signature: true,
    next_date: "2026-04-19", linked_document_id: null, home_id: "home_oak",
    created_at: "2026-03-26T14:00:00Z", updated_at: "2026-03-26T15:10:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "sup_002", staff_id: "staff_anna", supervisor_id: "staff_ryan",
    type: "formal", scheduled_date: "2026-04-03", actual_date: "2026-04-03",
    duration_minutes: 55, status: "completed",
    discussion_points: "Monthly formal supervision. Anna managing a full caseload and on sleep-in rota. Discussed medication refusal incident on 2026-04-13 — handled well initially. Concern raised around fatigue from consecutive shifts. Reviewed MAR competency sign-off. Wellbeing discussed — Anna reported feeling supported.",
    actions_agreed: [
      { id: "act_002a", description: "Complete online GDPR refresher before next shift", owner: "staff_anna", due_date: "2026-04-10", status: "completed", completed_at: "2026-04-08T18:00:00Z" },
    ],
    wellbeing_score: 8, staff_signature: true, supervisor_signature: true,
    next_date: "2026-04-23", linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-03T10:00:00Z", updated_at: "2026-04-03T11:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "sup_003", staff_id: "staff_lackson", supervisor_id: "staff_ryan",
    type: "formal", scheduled_date: "2026-03-28", actual_date: "2026-03-28",
    duration_minutes: 50, status: "completed",
    discussion_points: "Monthly supervision. Lackson has settled well and relationships with young people are strong. Discussed Alex's missing pattern — Lackson was present during the second episode and handled it appropriately. Punctuality concern raised — two late arrivals this month. Agreed plan to address.",
    actions_agreed: [
      { id: "act_003a", description: "No further late arrivals — review at next supervision", owner: "staff_lackson", due_date: "2026-04-25", status: "pending", completed_at: null },
    ],
    wellbeing_score: 8, staff_signature: true, supervisor_signature: true,
    next_date: "2026-04-25", linked_document_id: null, home_id: "home_oak",
    created_at: "2026-03-28T11:30:00Z", updated_at: "2026-03-28T12:20:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  // ── Scheduled / upcoming supervisions ──────────────────────────────────────
  {
    id: "sup_004", staff_id: "staff_diane", supervisor_id: "staff_ryan",
    type: "formal", scheduled_date: "2026-04-20", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-10T09:00:00Z", updated_at: "2026-04-10T09:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "sup_005", staff_id: "staff_chervelle", supervisor_id: "staff_darren",
    type: "formal", scheduled_date: "2026-04-23", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-10T09:00:00Z", updated_at: "2026-04-10T09:00:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "sup_006", staff_id: "staff_alex", supervisor_id: "staff_ryan",
    type: "probation_review", scheduled_date: "2026-04-20", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-08T09:00:00Z", updated_at: "2026-04-08T09:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "sup_007", staff_id: "staff_mirela", supervisor_id: "staff_darren",
    type: "probation_review", scheduled_date: "2026-04-25", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-08T09:00:00Z", updated_at: "2026-04-08T09:00:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "sup_008", staff_id: "staff_ryan", supervisor_id: "staff_darren",
    type: "formal", scheduled_date: "2026-04-21", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-10T09:00:00Z", updated_at: "2026-04-10T09:00:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  // ── Overdue (missed) ───────────────────────────────────────────────────────
  {
    id: "sup_009", staff_id: "staff_lackson", supervisor_id: "staff_ryan",
    type: "informal", scheduled_date: "2026-04-10", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-01T09:00:00Z", updated_at: "2026-04-01T09:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
];

// ── Seed Documents ────────────────────────────────────────────────────────────

store.documents = [
  {
    id: "doc_1", title: "Behaviour Support Plan — Tyler",
    category: "behaviour_support", description: "Updated following MDT review on 10 April 2026",
    file_url: "#", file_name: "Tyler_BSP_v3.pdf", file_size: 245000, mime_type: "application/pdf",
    version: 3, previous_version_id: "doc_1_v2", requires_read_sign: true,
    linked_child_id: "yp_tyler", linked_staff_id: null, linked_incident_id: null,
    expiry_date: daysFromNow(180), tags: ["behaviour", "mandatory", "mdt"],
    home_id: "home_oak", created_at: daysFromNow(-5), updated_at: daysFromNow(-5),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_2", title: "Missing from Care Protocol",
    category: "missing_protocol", description: "Procedure to follow when a young person goes missing from the home",
    file_url: "#", file_name: "MFC_Protocol_2026.pdf", file_size: 180000, mime_type: "application/pdf",
    version: 2, previous_version_id: "doc_2_v1", requires_read_sign: true,
    linked_child_id: null, linked_staff_id: null, linked_incident_id: null,
    expiry_date: daysFromNow(365), tags: ["safeguarding", "mandatory"],
    home_id: "home_oak", created_at: daysFromNow(-30), updated_at: daysFromNow(-30),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_3", title: "Oak House — Child Protection Policy",
    category: "policy", description: "Whole-home child protection and safeguarding policy",
    file_url: "#", file_name: "CP_Policy_2026.pdf", file_size: 320000, mime_type: "application/pdf",
    version: 4, previous_version_id: "doc_3_v3", requires_read_sign: true,
    linked_child_id: null, linked_staff_id: null, linked_incident_id: null,
    expiry_date: daysFromNow(90), tags: ["policy", "safeguarding", "mandatory"],
    home_id: "home_oak", created_at: daysFromNow(-60), updated_at: daysFromNow(-10),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_4", title: "Risk Assessment — Jordan (Contextual Safeguarding)",
    category: "risk_assessment", description: "Dynamic risk assessment updated following recent intelligence",
    file_url: "#", file_name: "Jordan_RiskAssess_Apr26.pdf", file_size: 95000, mime_type: "application/pdf",
    version: 1, previous_version_id: null, requires_read_sign: false,
    linked_child_id: "yp_jordan", linked_staff_id: null, linked_incident_id: "inc_006",
    expiry_date: daysFromNow(30), tags: ["risk", "safeguarding"],
    home_id: "home_oak", created_at: daysFromNow(-3), updated_at: daysFromNow(-3),
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "doc_5", title: "Medication Administration Policy",
    category: "procedure", description: "Full procedure for MAR, controlled drugs, and PRN",
    file_url: "#", file_name: "Medication_Policy_v2.pdf", file_size: 210000, mime_type: "application/pdf",
    version: 2, previous_version_id: "doc_5_v1", requires_read_sign: true,
    linked_child_id: null, linked_staff_id: null, linked_incident_id: null,
    expiry_date: daysFromNow(270), tags: ["medication", "mandatory"],
    home_id: "home_oak", created_at: daysFromNow(-90), updated_at: daysFromNow(-15),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_6", title: "Ryan Forsythe — Employment Contract",
    category: "contract", description: "Permanent contract — Deputy Manager",
    file_url: "#", file_name: "Ryan_Contract_2024.pdf", file_size: 145000, mime_type: "application/pdf",
    version: 1, previous_version_id: null, requires_read_sign: false,
    linked_child_id: null, linked_staff_id: "staff_ryan", linked_incident_id: null,
    expiry_date: null, tags: ["hr", "contract"],
    home_id: "home_oak", created_at: daysFromNow(-400), updated_at: daysFromNow(-400),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_7", title: "Reg 44 Report — March 2026",
    category: "reg44_report", description: "Independent person's report — March 2026",
    file_url: "#", file_name: "Reg44_March2026.pdf", file_size: 87000, mime_type: "application/pdf",
    version: 1, previous_version_id: null, requires_read_sign: false,
    linked_child_id: null, linked_staff_id: null, linked_incident_id: null,
    expiry_date: null, tags: ["ofsted", "regulation"],
    home_id: "home_oak", created_at: daysFromNow(-15), updated_at: daysFromNow(-15),
    created_by: "staff_alicia", updated_by: "staff_alicia",
  },
];

store.documentReadReceipts = [
  { id: "rr_1", document_id: "doc_1", staff_id: "staff_darren", read_at: daysFromNow(-4), signed_at: daysFromNow(-4) },
  { id: "rr_2", document_id: "doc_1", staff_id: "staff_ryan", read_at: daysFromNow(-3), signed_at: daysFromNow(-3) },
  { id: "rr_3", document_id: "doc_2", staff_id: "staff_darren", read_at: daysFromNow(-29), signed_at: daysFromNow(-29) },
  { id: "rr_4", document_id: "doc_2", staff_id: "staff_ryan", read_at: daysFromNow(-28), signed_at: daysFromNow(-28) },
  { id: "rr_5", document_id: "doc_2", staff_id: "staff_sarah", read_at: daysFromNow(-27), signed_at: daysFromNow(-27) },
  { id: "rr_6", document_id: "doc_3", staff_id: "staff_darren", read_at: daysFromNow(-8), signed_at: daysFromNow(-8) },
  { id: "rr_7", document_id: "doc_5", staff_id: "staff_darren", read_at: daysFromNow(-14), signed_at: daysFromNow(-14) },
  { id: "rr_8", document_id: "doc_5", staff_id: "staff_ryan", read_at: daysFromNow(-13), signed_at: daysFromNow(-13) },
  { id: "rr_9", document_id: "doc_5", staff_id: "staff_priya", read_at: daysFromNow(-12), signed_at: daysFromNow(-12) },
];

// ── Seed Expenses ─────────────────────────────────────────────────────────────

store.expenses = [
  {
    id: "exp_1", submitted_by: "staff_ryan", category: "young_person_activities",
    description: "Cinema trip for Tyler and Jordan — Odeon Derby", amount: 28.50,
    receipt_url: "#", date: daysFromNow(-3), status: "submitted",
    approved_by: null, approved_at: null, linked_child_id: "yp_tyler",
    payment_method: "personal card", home_id: "home_oak",
    created_at: daysFromNow(-3), updated_at: daysFromNow(-3),
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "exp_2", submitted_by: "staff_sarah", category: "food_shopping",
    description: "Weekly food shop — Tesco Derby", amount: 142.80,
    receipt_url: "#", date: daysFromNow(-5), status: "approved",
    approved_by: "staff_darren", approved_at: daysFromNow(-4),
    linked_child_id: null, payment_method: "house card", home_id: "home_oak",
    created_at: daysFromNow(-5), updated_at: daysFromNow(-4),
    created_by: "staff_sarah", updated_by: "staff_darren",
  },
  {
    id: "exp_3", submitted_by: "staff_darren", category: "training",
    description: "Level 7 Diploma study materials — Books & online access", amount: 95.00,
    receipt_url: "#", date: daysFromNow(-10), status: "approved",
    approved_by: "staff_alicia", approved_at: daysFromNow(-9),
    linked_child_id: null, payment_method: "personal card", home_id: "home_oak",
    created_at: daysFromNow(-10), updated_at: daysFromNow(-9),
    created_by: "staff_darren", updated_by: "staff_alicia",
  },
  {
    id: "exp_4", submitted_by: "staff_priya", category: "transport",
    description: "Mileage — hospital appointment with Ayo (62 miles @ 0.45)", amount: 27.90,
    receipt_url: null, date: daysFromNow(-7), status: "submitted",
    approved_by: null, approved_at: null, linked_child_id: "yp_ayo",
    payment_method: "mileage", home_id: "home_oak",
    created_at: daysFromNow(-7), updated_at: daysFromNow(-7),
    created_by: "staff_priya", updated_by: "staff_priya",
  },
  {
    id: "exp_5", submitted_by: "staff_marcus", category: "maintenance",
    description: "Emergency plumber call-out — broken pipe in bathroom", amount: 185.00,
    receipt_url: "#", date: daysFromNow(-14), status: "paid",
    approved_by: "staff_darren", approved_at: daysFromNow(-13),
    linked_child_id: null, payment_method: "house card", home_id: "home_oak",
    created_at: daysFromNow(-14), updated_at: daysFromNow(-10),
    created_by: "staff_marcus", updated_by: "staff_darren",
  },
  {
    id: "exp_6", submitted_by: "staff_gemma", category: "clothing",
    description: "School uniform and shoes for Jordan (LA approved)", amount: 67.40,
    receipt_url: "#", date: daysFromNow(-1), status: "submitted",
    approved_by: null, approved_at: null, linked_child_id: "yp_jordan",
    payment_method: "personal card", home_id: "home_oak",
    created_at: daysFromNow(-1), updated_at: daysFromNow(-1),
    created_by: "staff_gemma", updated_by: "staff_gemma",
  },
  {
    id: "exp_7", submitted_by: "staff_ryan", category: "petty_cash",
    description: "Haircut for Tyler (arranged by social worker)", amount: 15.00,
    receipt_url: null, date: daysFromNow(-2), status: "draft",
    approved_by: null, approved_at: null, linked_child_id: "yp_tyler",
    payment_method: "petty cash", home_id: "home_oak",
    created_at: daysFromNow(-2), updated_at: daysFromNow(-2),
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
];

// ── Seed Audits ───────────────────────────────────────────────────────────────

store.audits = [
  {
    id: "a1", title: "Medication Administration Audit", category: "medication",
    date: daysFromNow(-14), completed_by: "staff_darren", score: 92, max_score: 100,
    status: "completed", findings: 1, actions: 1,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "a2", title: "Health & Safety Walk-around", category: "health_safety",
    date: daysFromNow(-7), completed_by: "staff_ryan", score: 87, max_score: 100,
    status: "completed", findings: 2, actions: 2,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "a3", title: "Records Quality Audit — Care Plans", category: "care_records",
    date: daysFromNow(7), completed_by: null, score: 0, max_score: 100,
    status: "scheduled", findings: 0, actions: 0,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "a4", title: "Finance Audit — Petty Cash", category: "finance",
    date: daysFromNow(-30), completed_by: "staff_darren", score: 78, max_score: 100,
    status: "completed", findings: 3, actions: 2,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "a5", title: "Safeguarding & Child Protection Audit", category: "safeguarding",
    date: daysFromNow(21), completed_by: null, score: 0, max_score: 100,
    status: "scheduled", findings: 0, actions: 0,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

// ── Seed Maintenance ──────────────────────────────────────────────────────────

store.maintenance = [
  {
    id: "m1", title: "Boiler annual service", category: "hvac",
    priority: "high", status: "scheduled", due_date: daysFromNow(14),
    assigned_to: "Homeserve", notes: "Annual gas safety certificate required", recurring: true,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m2", title: "Fire alarm weekly test", category: "fire_safety",
    priority: "urgent", status: "completed", due_date: daysFromNow(-1),
    assigned_to: "staff_marcus", notes: "All zones tested — pass", recurring: true,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m3", title: "Bathroom tap dripping — YP2 room", category: "plumbing",
    priority: "medium", status: "open", due_date: daysFromNow(3),
    assigned_to: null, notes: "Needs new washer", recurring: false,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m4", title: "External gate lock faulty", category: "security",
    priority: "urgent", status: "open", due_date: daysFromNow(1),
    assigned_to: null, notes: "Latch not catching — security risk", recurring: false,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m5", title: "PAT testing — electrical equipment", category: "electrical",
    priority: "medium", status: "open", due_date: daysFromNow(30),
    assigned_to: "Electrician TBC", notes: "Due annually", recurring: true,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m6", title: "Deep clean — kitchen", category: "cleaning",
    priority: "low", status: "completed", due_date: daysFromNow(-7),
    assigned_to: "Cleaning company", notes: "Done — signed off by Ryan", recurring: true,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export function getStore() { return store; }

export const db = {
  // ── Staff ─────────────────────────────────────────────────────────────────
  staff: {
    findAll: () => store.staff,
    findById: (id: string) => store.staff.find((s) => s.id === id),
    findActive: () => store.staff.filter((s) => s.is_active),
  },

  // ── Young People ──────────────────────────────────────────────────────────
  youngPeople: {
    findAll: () => store.youngPeople,
    findById: (id: string) => store.youngPeople.find((yp) => yp.id === id),
    findCurrent: () => store.youngPeople.filter((yp) => yp.status === "current"),
  },

  // ── Incidents ─────────────────────────────────────────────────────────────
  incidents: {
    findAll: () => store.incidents,
    findById: (id: string) => store.incidents.find((i) => i.id === id),
    findOpen: () => store.incidents.filter((i) => i.status === "open"),
    findNeedingOversight: () => store.incidents.filter((i) => i.requires_oversight && !i.oversight_by),
    create: (data: Partial<Incident>): Incident => {
      const incident = { ...data, id: generateId("inc"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Incident;
      store.incidents.push(incident);
      return incident;
    },
    addOversight: (id: string, note: string, by: string): Incident | null => {
      const idx = store.incidents.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      store.incidents[idx] = { ...store.incidents[idx], oversight_note: note, oversight_by: by, oversight_at: new Date().toISOString() };
      return store.incidents[idx];
    },
  },

  // ── Missing Episodes ──────────────────────────────────────────────────────
  missingEpisodes: {
    findAll: () => store.missingEpisodes,
    findByChild: (childId: string) => store.missingEpisodes.filter((m) => m.child_id === childId),
    findActive: () => store.missingEpisodes.filter((m) => m.status === "active"),
    create: (data: Partial<MissingEpisode>): MissingEpisode => {
      const totalCount = store.missingEpisodes.length + 1;
      const episode = {
        ...data,
        id: generateId("mfc"),
        reference: `MFC-${new Date().getFullYear()}-${String(totalCount).padStart(3, "0")}`,
        status: data.status ?? "active",
        created_at: new Date().toISOString(),
        created_by: data.created_by ?? "staff_darren",
      } as MissingEpisode;
      store.missingEpisodes.push(episode);
      return episode;
    },
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  tasks: {
    findAll: () => store.tasks,
    findById: (id: string) => store.tasks.find((t) => t.id === id),
    findActive: () => store.tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled"),
    findOverdue: () => store.tasks.filter((t) => t.due_date && t.due_date < todayStr() && t.status !== "completed" && t.status !== "cancelled"),
    create: (data: Partial<Task>): Task => {
      const task = { ...data, id: generateId("task"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Task;
      store.tasks.push(task);
      return task;
    },
    complete: (id: string, by: string, note?: string): Task | null => {
      const idx = store.tasks.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      store.tasks[idx] = { ...store.tasks[idx], status: "completed", completed_at: new Date().toISOString(), completed_by: by, evidence_note: note || store.tasks[idx].evidence_note };
      return store.tasks[idx];
    },
  },

  // ── Care Forms ────────────────────────────────────────────────────────────
  careForms: {
    findAll: () => store.careForms,
    findById: (id: string) => store.careForms.find((f) => f.id === id),
    findByChild: (childId: string) => store.careForms.filter((f) => f.linked_child_id === childId),
    findByStatus: (status: string) => store.careForms.filter((f) => f.status === status),
    findByType: (type: string) => store.careForms.filter((f) => f.form_type === type),
    findPendingReview: () => store.careForms.filter((f) => f.status === "pending_review" || f.status === "submitted"),
    create: (data: Partial<CareForm>): CareForm => {
      const form = {
        ...data,
        id: generateId("form"),
        status: data.status ?? "draft",
        body: data.body ?? {},
        tags: data.tags ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as CareForm;
      store.careForms.push(form);
      return form;
    },
    update: (id: string, data: Partial<CareForm>): CareForm | null => {
      const idx = store.careForms.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      store.careForms[idx] = { ...store.careForms[idx], ...data, updated_at: new Date().toISOString() };
      return store.careForms[idx];
    },
    submit: (id: string, by: string): CareForm | null => {
      const idx = store.careForms.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      store.careForms[idx] = {
        ...store.careForms[idx],
        status: "submitted",
        submitted_at: new Date().toISOString(),
        submitted_by: by,
        updated_at: new Date().toISOString(),
        updated_by: by,
      };
      return store.careForms[idx];
    },
    approve: (id: string, by: string, notes?: string): CareForm | null => {
      const idx = store.careForms.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      store.careForms[idx] = {
        ...store.careForms[idx],
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: by,
        reviewed_by: by,
        reviewed_at: new Date().toISOString(),
        review_notes: notes ?? store.careForms[idx].review_notes,
        updated_at: new Date().toISOString(),
        updated_by: by,
      };
      return store.careForms[idx];
    },
  },

  // ── Medication ────────────────────────────────────────────────────────────
  medications: {
    findAll: () => store.medications,
    findActive: () => store.medications.filter((m) => m.is_active),
    findByChild: (childId: string) => store.medications.filter((m) => m.child_id === childId && m.is_active),
  },
  medicationAdministrations: {
    findAll: () => store.medicationAdministrations,
    findByMed: (medId: string) => store.medicationAdministrations.filter((a) => a.medication_id === medId),
    findByChild: (childId: string) => store.medicationAdministrations.filter((a) => a.child_id === childId),
    findScheduled: () => store.medicationAdministrations.filter((a) => a.status === "scheduled"),
    findExceptions: () => store.medicationAdministrations.filter((a) => a.status === "refused" || a.status === "late" || a.status === "missed"),
    administer: (id: string, data: Partial<MedicationAdministration>): MedicationAdministration | null => {
      const idx = store.medicationAdministrations.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      store.medicationAdministrations[idx] = { ...store.medicationAdministrations[idx], ...data, actual_time: new Date().toISOString() };
      return store.medicationAdministrations[idx];
    },
  },

  // ── Daily Log ─────────────────────────────────────────────────────────────
  dailyLog: {
    findAll: () => store.dailyLog,
    findByChild: (childId: string) => store.dailyLog.filter((e) => e.child_id === childId),
    findToday: () => store.dailyLog.filter((e) => e.date === todayStr()),
    create: (data: Partial<DailyLogEntry>): DailyLogEntry => {
      const entry = { ...data, id: generateId("log"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as DailyLogEntry;
      store.dailyLog.push(entry);
      return entry;
    },
  },

  // ── Chronology ────────────────────────────────────────────────────────────
  chronology: {
    findAll: () => store.chronology,
    findByChild: (childId: string) => store.chronology.filter((c) => c.child_id === childId).sort((a, b) => b.date.localeCompare(a.date)),
    create: (data: Partial<ChronologyEntry>): ChronologyEntry => {
      const entry = { ...data, id: generateId("chr"), created_at: new Date().toISOString() } as ChronologyEntry;
      store.chronology.push(entry);
      return entry;
    },
  },

  // ── Handovers ─────────────────────────────────────────────────────────────
  handovers: {
    findAll: () => store.handovers,
    findLatest: () => store.handovers.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null,
    findByDate: (date: string) => store.handovers.filter((h) => h.shift_date === date),
    create: (data: Partial<HandoverEntry>): HandoverEntry => {
      const entry = { ...data, id: generateId("hnd"), created_at: new Date().toISOString() } as HandoverEntry;
      store.handovers.push(entry);
      return entry;
    },
  },

  // ── Buildings ─────────────────────────────────────────────────────────────
  buildings: {
    findAll: () => store.buildings,
    findById: (id: string) => store.buildings.find((b) => b.id === id),
  },
  buildingChecks: {
    findAll: () => store.buildingChecks,
    findDue: () => store.buildingChecks.filter((c) => c.status === "due" || c.status === "overdue"),
    findOverdue: () => store.buildingChecks.filter((c) => c.status === "overdue"),
    create: (data: Partial<BuildingCheck>): BuildingCheck => {
      const check = { ...data, id: generateId("bchk"), created_at: new Date().toISOString() } as BuildingCheck;
      store.buildingChecks.push(check);
      return check;
    },
  },

  // ── Vehicles ──────────────────────────────────────────────────────────────
  vehicles: {
    findAll: () => store.vehicles,
    findById: (id: string) => store.vehicles.find((v) => v.id === id),
    findAvailable: () => store.vehicles.filter((v) => v.status === "available"),
  },
  vehicleChecks: {
    findAll: () => store.vehicleChecks,
    findByVehicle: (vehicleId: string) => store.vehicleChecks.filter((c) => c.vehicle_id === vehicleId),
    findDefects: () => store.vehicleChecks.filter((c) => c.overall_result === "fail" || c.overall_result === "advisory"),
    create: (data: Partial<VehicleCheck>): VehicleCheck => {
      const check = { ...data, id: generateId("vchk"), created_at: new Date().toISOString() } as VehicleCheck;
      store.vehicleChecks.push(check);
      return check;
    },
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    findAll: () => store.notifications,
    findForUser: (userId: string) => store.notifications.filter((n) => n.recipient_id === userId && !n.read),
    create: (data: Partial<Notification>): Notification => {
      const notif = { ...data, id: generateId("notif"), created_at: new Date().toISOString() } as Notification;
      store.notifications.push(notif);
      return notif;
    },
  },

  // ── Training ──────────────────────────────────────────────────────────────
  training: {
    findAll: () => store.trainingRecords,
    findByStaff: (staffId: string) => store.trainingRecords.filter((t) => t.staff_id === staffId),
    findExpired: () => store.trainingRecords.filter((t) => t.status === "expired"),
    findExpiringSoon: () => store.trainingRecords.filter((t) => t.status === "expiring_soon"),
  },

  // ── Leave ─────────────────────────────────────────────────────────────────
  leave: {
    findAll: () => store.leaveRequests,
    findPending: () => store.leaveRequests.filter((l) => l.status === "pending"),
    findOnLeaveToday: () => {
      const t = todayStr();
      return store.leaveRequests.filter((l) => l.status === "approved" && l.start_date <= t && l.end_date >= t);
    },
  },

  // ── Shifts ────────────────────────────────────────────────────────────────
  shifts: {
    findAll: () => store.shifts,
    findToday: () => store.shifts.filter((s) => s.date === todayStr()),
    findOpen: () => store.shifts.filter((s) => s.is_open_shift && s.date >= todayStr()),
  },

  // ── Safer Recruitment ─────────────────────────────────────────────────────
  vacancies: {
    findAll: () => store.vacancies,
    findById: (id: string) => store.vacancies.find((v) => v.id === id),
    findOpen: () => store.vacancies.filter((v) => v.status === "open"),
    create: (data: Partial<Vacancy>): Vacancy => {
      const vacancy = { ...data, id: generateId("vac"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Vacancy;
      store.vacancies.push(vacancy);
      return vacancy;
    },
  },
  candidateProfiles: {
    findAll: () => store.candidateProfiles,
    findById: (id: string) => store.candidateProfiles.find((c) => c.id === id),
    findByVacancy: (vacancyId: string) => store.candidateProfiles.filter((c) => c.vacancy_id === vacancyId),
    findByStage: (stage: string) => store.candidateProfiles.filter((c) => c.current_stage === stage),
    create: (data: Partial<CandidateProfile>): CandidateProfile => {
      const candidate = { ...data, id: generateId("cand"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CandidateProfile;
      store.candidateProfiles.push(candidate);
      return candidate;
    },
    update: (id: string, data: Partial<CandidateProfile>): CandidateProfile | null => {
      const idx = store.candidateProfiles.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      store.candidateProfiles[idx] = { ...store.candidateProfiles[idx], ...data, updated_at: new Date().toISOString() };
      return store.candidateProfiles[idx];
    },
  },
  candidateChecks: {
    findAll: () => store.candidateChecks,
    findByCandidate: (candidateId: string) => store.candidateChecks.filter((c) => c.candidate_id === candidateId),
    findById: (id: string) => store.candidateChecks.find((c) => c.id === id),
    create: (data: Partial<CandidateCheck>): CandidateCheck => {
      const check = { ...data, id: generateId("chk"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CandidateCheck;
      store.candidateChecks.push(check);
      return check;
    },
    update: (id: string, data: Partial<CandidateCheck>): CandidateCheck | null => {
      const idx = store.candidateChecks.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      store.candidateChecks[idx] = { ...store.candidateChecks[idx], ...data, updated_at: new Date().toISOString() };
      return store.candidateChecks[idx];
    },
  },
  candidateReferences: {
    findAll: () => store.candidateReferences,
    findByCandidate: (candidateId: string) => store.candidateReferences.filter((r) => r.candidate_id === candidateId),
    findById: (id: string) => store.candidateReferences.find((r) => r.id === id),
    create: (data: Partial<CandidateReference>): CandidateReference => {
      const ref = { ...data, id: generateId("ref"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CandidateReference;
      store.candidateReferences.push(ref);
      return ref;
    },
    update: (id: string, data: Partial<CandidateReference>): CandidateReference | null => {
      const idx = store.candidateReferences.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.candidateReferences[idx] = { ...store.candidateReferences[idx], ...data, updated_at: new Date().toISOString() };
      return store.candidateReferences[idx];
    },
  },
  employmentHistory: {
    findAll: () => store.employmentHistory,
    findByCandidate: (candidateId: string) => store.employmentHistory.filter((e) => e.candidate_id === candidateId),
    create: (data: Partial<EmploymentHistoryEntry>): EmploymentHistoryEntry => {
      const entry = { ...data, id: generateId("emp"), created_at: new Date().toISOString() } as EmploymentHistoryEntry;
      store.employmentHistory.push(entry);
      return entry;
    },
  },
  gapExplanations: {
    findAll: () => store.gapExplanations,
    findByCandidate: (candidateId: string) => store.gapExplanations.filter((g) => g.candidate_id === candidateId),
    create: (data: Partial<GapExplanation>): GapExplanation => {
      const gap = { ...data, id: generateId("gap"), created_at: new Date().toISOString() } as GapExplanation;
      store.gapExplanations.push(gap);
      return gap;
    },
  },
  candidateInterviews: {
    findAll: () => store.candidateInterviews,
    findByCandidate: (candidateId: string) => store.candidateInterviews.filter((i) => i.candidate_id === candidateId),
    findById: (id: string) => store.candidateInterviews.find((i) => i.id === id),
    create: (data: Partial<CandidateInterview>): CandidateInterview => {
      const interview = { ...data, id: generateId("int"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CandidateInterview;
      store.candidateInterviews.push(interview);
      return interview;
    },
  },
  conditionalOffers: {
    findAll: () => store.conditionalOffers,
    findByCandidate: (candidateId: string) => store.conditionalOffers.find((o) => o.candidate_id === candidateId) || null,
    findById: (id: string) => store.conditionalOffers.find((o) => o.id === id),
    create: (data: Partial<ConditionalOffer>): ConditionalOffer => {
      const offer = { ...data, id: generateId("offer"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ConditionalOffer;
      store.conditionalOffers.push(offer);
      return offer;
    },
    update: (id: string, data: Partial<ConditionalOffer>): ConditionalOffer | null => {
      const idx = store.conditionalOffers.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      store.conditionalOffers[idx] = { ...store.conditionalOffers[idx], ...data, updated_at: new Date().toISOString() };
      return store.conditionalOffers[idx];
    },
  },
  recruitmentAudit: {
    findAll: () => store.recruitmentAudit,
    findByCandidate: (candidateId: string) => store.recruitmentAudit.filter((a) => a.candidate_id === candidateId),
    findRecent: (limit = 20) => [...store.recruitmentAudit].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit),
    create: (data: Partial<RecruitmentAuditEntry>): RecruitmentAuditEntry => {
      const entry = { ...data, id: generateId("aud"), created_at: new Date().toISOString() } as RecruitmentAuditEntry;
      store.recruitmentAudit.push(entry);
      return entry;
    },
  },

  // ── Supervisions ──────────────────────────────────────────────────────────
  supervisions: {
    findAll: () => store.supervisions,
    findById: (id: string) => store.supervisions.find((s) => s.id === id),
    findByStaff: (staffId: string) => store.supervisions.filter((s) => s.staff_id === staffId),
    findBySupervisor: (supervisorId: string) => store.supervisions.filter((s) => s.supervisor_id === supervisorId),
    findScheduled: () => store.supervisions.filter((s) => s.status === "scheduled"),
    findCompleted: () => store.supervisions.filter((s) => s.status === "completed"),
    findOverdue: () => {
      const today = todayStr();
      return store.supervisions.filter((s) => s.status === "scheduled" && s.scheduled_date < today);
    },
    findDueSoon: (days = 7) => {
      const today = todayStr();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return store.supervisions.filter((s) => s.status === "scheduled" && s.scheduled_date >= today && s.scheduled_date <= cutoffStr);
    },
    create: (data: Partial<Supervision>): Supervision => {
      const supervision = {
        ...data,
        id: generateId("sup"),
        status: data.status ?? "scheduled",
        actions_agreed: data.actions_agreed ?? [],
        staff_signature: false,
        supervisor_signature: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Supervision;
      store.supervisions.push(supervision);
      return supervision;
    },
    complete: (id: string, data: Partial<Supervision>): Supervision | null => {
      const idx = store.supervisions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.supervisions[idx] = {
        ...store.supervisions[idx],
        ...data,
        status: "completed",
        actual_date: data.actual_date ?? todayStr(),
        updated_at: new Date().toISOString(),
      };
      return store.supervisions[idx];
    },
    update: (id: string, data: Partial<Supervision>): Supervision | null => {
      const idx = store.supervisions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.supervisions[idx] = { ...store.supervisions[idx], ...data, updated_at: new Date().toISOString() };
      return store.supervisions[idx];
    },
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  documents: {
    findAll: () => store.documents,
    findById: (id: string) => store.documents.find((d) => d.id === id),
    create: (data: Partial<Document>): Document => {
      const doc = { ...data, id: generateId("doc"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Document;
      store.documents.push(doc);
      return doc;
    },
  },

  // ── Document Read Receipts ────────────────────────────────────────────────
  documentReadReceipts: {
    findAll: () => store.documentReadReceipts,
    findByDocument: (docId: string) => store.documentReadReceipts.filter((r) => r.document_id === docId),
    findByStaff: (staffId: string) => store.documentReadReceipts.filter((r) => r.staff_id === staffId),
    upsertSignature: (docId: string, staffId: string): DocumentReadReceipt => {
      const existing = store.documentReadReceipts.find((r) => r.document_id === docId && r.staff_id === staffId);
      if (existing) {
        existing.signed_at = new Date().toISOString();
        return existing;
      }
      const receipt: DocumentReadReceipt = { id: generateId("rr"), document_id: docId, staff_id: staffId, read_at: new Date().toISOString(), signed_at: new Date().toISOString() };
      store.documentReadReceipts.push(receipt);
      return receipt;
    },
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: {
    findAll: () => store.expenses,
    findById: (id: string) => store.expenses.find((e) => e.id === id),
    findPending: () => store.expenses.filter((e) => e.status === "submitted"),
    create: (data: Partial<Expense>): Expense => {
      const exp = { ...data, id: generateId("exp"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Expense;
      store.expenses.push(exp);
      return exp;
    },
    update: (id: string, data: Partial<Expense>): Expense | null => {
      const idx = store.expenses.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      store.expenses[idx] = { ...store.expenses[idx], ...data, updated_at: new Date().toISOString() };
      return store.expenses[idx];
    },
  },

  // ── Audits ────────────────────────────────────────────────────────────────
  audits: {
    findAll: () => store.audits,
    findById: (id: string) => store.audits.find((a) => a.id === id),
    create: (data: Partial<Audit>): Audit => {
      const audit = { ...data, id: generateId("aud"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Audit;
      store.audits.push(audit);
      return audit;
    },
    update: (id: string, data: Partial<Audit>): Audit | null => {
      const idx = store.audits.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      store.audits[idx] = { ...store.audits[idx], ...data, updated_at: new Date().toISOString() };
      return store.audits[idx];
    },
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  maintenance: {
    findAll: () => store.maintenance,
    findById: (id: string) => store.maintenance.find((m) => m.id === id),
    findOpen: () => store.maintenance.filter((m) => m.status !== "completed"),
    create: (data: Partial<MaintenanceItem>): MaintenanceItem => {
      const item = { ...data, id: generateId("mnt"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as MaintenanceItem;
      store.maintenance.push(item);
      return item;
    },
    update: (id: string, data: Partial<MaintenanceItem>): MaintenanceItem | null => {
      const idx = store.maintenance.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      store.maintenance[idx] = { ...store.maintenance[idx], ...data, updated_at: new Date().toISOString() };
      return store.maintenance[idx];
    },
  },
};
