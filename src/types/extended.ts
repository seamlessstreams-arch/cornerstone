// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EXTENDED TYPES
// New entities: buildings, vehicles, H&S, missing episodes, chronology, etc.
// ══════════════════════════════════════════════════════════════════════════════

// ── Missing from Care Episode ─────────────────────────────────────────────────

export interface MissingEpisode {
  id: string;
  reference: string;
  child_id: string;
  date_missing: string;
  time_missing: string;
  date_returned: string | null;
  time_returned: string | null;
  duration_hours: number | null;
  risk_level: "low" | "medium" | "high" | "critical";
  location_last_seen: string;
  return_location: string | null;
  reported_to_police: boolean;
  police_reference: string | null;
  reported_to_la: boolean;
  la_notified_at: string | null;
  return_interview_completed: boolean;
  return_interview_by: string | null;
  return_interview_date: string | null;
  return_interview_notes: string | null;
  contextual_safeguarding_risk: boolean;
  linked_incident_id: string | null;
  pattern_notes: string | null;
  status: "active" | "returned" | "closed";
  home_id: string;
  created_at: string;
  created_by: string;
}

// ── Chronology Entry ──────────────────────────────────────────────────────────

export type ChronologyCategory =
  | "placement" | "incident" | "missing" | "safeguarding"
  | "health" | "education" | "contact" | "legal"
  | "review" | "behaviour" | "other";

export interface ChronologyEntry {
  id: string;
  child_id: string;
  date: string;
  time: string | null;
  category: ChronologyCategory;
  title: string;
  description: string;
  significance: "routine" | "significant" | "critical";
  recorded_by: string;
  linked_incident_id: string | null;
  home_id: string;
  created_at: string;
}

// ── Building ──────────────────────────────────────────────────────────────────

export type BuildingCheckType =
  | "daily_walkround" | "weekly_walkround" | "monthly_inspection"
  | "fire_alarm_test" | "emergency_lighting" | "fire_extinguisher"
  | "fire_drill" | "smoke_detector" | "carbon_monoxide_detector"
  | "gas_safety" | "electrical_safety" | "pat_testing"
  | "legionella" | "water_temperature" | "asbestos"
  | "window_restrictors" | "bedroom_door_safety"
  | "kitchen_safety" | "food_hygiene" | "fridge_temp" | "freezer_temp"
  | "infection_control" | "first_aid_kit" | "coshh"
  | "cleaning_schedule" | "environmental" | "garden_external"
  | "boundary_security" | "external_security" | "cctv"
  | "internet_device_safety" | "accessibility"
  | "bedroom_furnishing" | "medication_room_security"
  | "maintenance_repair" | "contractor_visit"
  | "near_miss" | "accident" | "hazard";

export interface Building {
  id: string;
  home_id: string;
  name: string;
  type: "residential" | "office" | "outbuilding";
  address: string;
  areas: string[];
  gas_cert_expiry: string | null;
  electrical_cert_expiry: string | null;
  fire_risk_assessment_date: string | null;
  epc_rating: string | null;
  last_full_inspection: string | null;
  next_inspection_due: string | null;
  status: "operational" | "restricted" | "closed";
  created_at: string;
}

export interface BuildingCheck {
  id: string;
  building_id: string;
  home_id: string;
  area: string;
  check_type: BuildingCheckType;
  check_date: string;
  due_date: string;
  responsible_person: string;
  status: "due" | "completed" | "overdue" | "failed" | "waived";
  result: "pass" | "fail" | "advisory" | null;
  risk_level: "low" | "medium" | "high" | "critical" | null;
  notes: string | null;
  action_required: string | null;
  action_due: string | null;
  manager_oversight: boolean;
  linked_maintenance_id: string | null;
  evidence_urls: string[];
  created_at: string;
}

// ── Vehicle ───────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  home_id: string;
  registration: string;
  make: string;
  model: string;
  colour: string;
  year: number;
  seats: number;
  mot_expiry: string | null;
  insurance_expiry: string | null;
  tax_expiry: string | null;
  last_service: string | null;
  next_service_due: string | null;
  mileage: number;
  status: "available" | "in_use" | "restricted" | "off_road" | "disposed";
  breakdown_cover: string | null;
  breakdown_ref: string | null;
  notes: string | null;
  created_at: string;
}

export interface VehicleCheck {
  id: string;
  vehicle_id: string;
  home_id: string;
  check_type: "daily_safety" | "weekly" | "monthly" | "pre_journey" | "post_journey" | "accident" | "damage";
  check_date: string;
  driver: string;
  tyres: "pass" | "fail" | "advisory" | null;
  lights: "pass" | "fail" | "advisory" | null;
  brakes: "pass" | "fail" | "advisory" | null;
  mirrors: "pass" | "fail" | "advisory" | null;
  fluids: "pass" | "fail" | "advisory" | null;
  wipers: "pass" | "fail" | "advisory" | null;
  cleanliness: "pass" | "fail" | "advisory" | null;
  mileage_start: number | null;
  mileage_end: number | null;
  fuel_level: string | null;
  overall_result: "pass" | "fail" | "advisory";
  defects: string | null;
  notes: string | null;
  created_at: string;
}

// ── Handover ──────────────────────────────────────────────────────────────────

export interface HandoverChildUpdate {
  child_id: string;
  mood_score: number | null;
  key_notes: string;
  alerts: string[];
}

export interface HandoverEntry {
  id: string;
  home_id: string;
  shift_date: string;
  shift_from: "day" | "sleep_in" | "waking_night" | "night";
  shift_to: "day" | "sleep_in" | "waking_night" | "morning";
  handover_time: string;
  completed_at: string | null;
  outgoing_staff: string[];
  incoming_staff: string[];
  created_by: string;
  signed_off_by: string | null;
  child_updates: HandoverChildUpdate[];
  general_notes: string;
  flags: string[];
  linked_incident_ids: string[];
  created_at: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  home_id: string;
  recipient_id: string;
  title: string;
  body: string;
  type: "incident" | "safeguarding" | "medication" | "task" | "training" | "building" | "vehicle" | "system";
  priority: "low" | "normal" | "high" | "urgent";
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

// ── Time Saved Entry ──────────────────────────────────────────────────────────

export interface TimeSavedEntry {
  id: string;
  home_id: string;
  staff_id: string;
  action_type: "auto_fill" | "linked_record" | "aria_draft" | "auto_task" | "auto_handover" | "one_click_summary" | "avoided_duplicate";
  minutes_saved: number;
  description: string;
  created_at: string;
}

// ── Aria Interaction ──────────────────────────────────────────────────────────

export type AriaMode = "write" | "review" | "oversee" | "assist";
export type AriaStyle =
  | "professional_formal" | "warm_professional" | "child_friendly"
  | "reflective_practice" | "safeguarding_focused" | "concise_manager"
  | "parent_carer" | "plain_english" | "social_worker_update"
  | "therapeutic" | "complaint_response" | "restorative";

export interface AriaRequest {
  mode: AriaMode;
  style: AriaStyle;
  page_context: string;
  record_type: string;
  source_content: string;
  user_role: string;
  linked_records?: string;
  audience?: string;
}

export interface AriaResponse {
  draft: string;
  suggestions: string[];
  source_references: string[];
  follow_up_tasks: string[];
  compliance_flags: string[];
  confidence: "high" | "medium" | "low";
}

// ── Health Check Score ─────────────────────────────────────────────────────────

export interface HealthCheckScore {
  overall: number;
  operational: number;
  safeguarding: number;
  medication: number;
  staffing: number;
  compliance: number;
  environment: number;
  risk_level: "low" | "medium" | "high" | "critical";
  action_plan: HealthCheckAction[];
  generated_at: string;
}

export interface HealthCheckAction {
  area: string;
  issue: string;
  owner: string | null;
  priority: "urgent" | "high" | "medium" | "low";
  due: string | null;
  escalation_level: "manager" | "ri" | "ofsted" | null;
}

// ── Time Saved Summary ────────────────────────────────────────────────────────

export interface TimeSavedSummary {
  user_today_minutes: number;
  user_week_minutes: number;
  home_week_minutes: number;
  home_month_minutes: number;
  breakdown: { category: string; minutes: number; count: number }[];
}

// ── Audit (Quality Assurance) ─────────────────────────────────────────────────

export interface Audit {
  id: string;
  title: string;
  category: string;
  date: string;
  completed_by: string | null;
  score: number;
  max_score: number;
  status: "completed" | "scheduled" | "in_progress";
  findings: number;
  actions: number;
  home_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

// ── Maintenance Item ──────────────────────────────────────────────────────────

export interface MaintenanceItem {
  id: string;
  title: string;
  category: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "scheduled" | "completed";
  due_date: string;
  assigned_to: string | null;
  notes: string;
  recurring: boolean;
  home_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}
