import crypto from "node:crypto";
import * as XLSX from "xlsx";
import type {
  ProviderAssignmentRecord,
  ProviderCompletionRecord,
  ProviderCourseRecord,
  TrainingProviderAdapter,
  TrainingProviderConnection,
  TrainingProviderWebhookResult,
  TrainingSyncDelta,
} from "@/lib/training/types";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  const s = asString(value).trim();
  return s.length > 0 ? s : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const lowered = value.toLowerCase().trim();
    return lowered === "true" || lowered === "1" || lowered === "yes";
  }
  return false;
}

function normalizeDate(value: unknown): string | null {
  const candidate = asNullableString(value);
  if (!candidate) return null;
  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildHeaders(connection: TrainingProviderConnection): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = asNullableString(connection.config.apiToken);
  if (token) headers.Authorization = `Bearer ${token}`;

  const clientId = asNullableString(connection.config.clientId);
  const clientSecret = asNullableString(connection.config.clientSecret);
  if (clientId && clientSecret) {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${encoded}`;
  }

  return headers;
}

function parseCourse(input: Record<string, unknown>, providerName: string): ProviderCourseRecord {
  return {
    provider_course_id: asString(input.provider_course_id || input.course_id || input.id),
    provider_name: providerName,
    course_title: asString(input.course_title || input.title || input.name),
    course_category: asNullableString(input.course_category || input.category),
    mandatory_flag: asBoolean(input.mandatory_flag || input.mandatory),
    accreditation: asNullableString(input.accreditation),
    cpd_hours: asNumber(input.CPD_hours || input.cpd_hours),
    valid_for_days: asNumber(input.valid_for_days),
    valid_for_months: asNumber(input.valid_for_months),
    certificate_available: asBoolean(input.certificate_available),
    direct_course_url: asNullableString(input.direct_course_url || input.course_url),
    archived_flag: asBoolean(input.archived_flag || input.archived),
  };
}

function parseAssignment(input: Record<string, unknown>): ProviderAssignmentRecord {
  return {
    staff_member_id: asString(input.staff_member_id || input.user_id || input.learner_id),
    course_provider_id: asString(input.provider_course_id || input.course_id || input.id),
    provider_assignment_id: asNullableString(input.provider_assignment_id || input.assignment_id),
    provider_learner_id: asNullableString(input.provider_learner_id || input.learner_id),
    assigned_at: normalizeDate(input.assigned_at || input.created_at),
    due_date: normalizeDate(input.due_date),
    status: (asString(input.status).toLowerCase() as ProviderAssignmentRecord["status"]) || "assigned",
    direct_course_url: asNullableString(input.direct_course_url || input.course_url),
    last_provider_sync_at: new Date().toISOString(),
  };
}

function parseCompletion(input: Record<string, unknown>, source: "api" | "webhook" | "import"): ProviderCompletionRecord {
  return {
    staff_member_id: asString(input.staff_member_id || input.user_id || input.learner_id),
    course_provider_id: asString(input.provider_course_id || input.course_id || input.id),
    completed_at: normalizeDate(input.completed_at || input.completion_date),
    completion_status: (asString(input.completion_status || input.status).toLowerCase() as ProviderCompletionRecord["completion_status"]) || "completed",
    score: asNumber(input.score),
    certificate_url: asNullableString(input.certificate_url),
    expires_at: normalizeDate(input.expires_at || input.expiry_date),
    renewal_due_at: normalizeDate(input.renewal_due_at),
    provider_completion_id: asString(input.provider_completion_id || input.completion_id || input.id),
    synced_at: new Date().toISOString(),
    source,
  };
}

export class VthTrainingProvider implements TrainingProviderAdapter {
  providerCode = "vocational_training_hub";
  supportsWebhooks = true;
  supportsPolling = true;
  supportsImports = true;

  async testConnection(connection: TrainingProviderConnection): Promise<{ ok: boolean; message: string }> {
    const baseUrl = asNullableString(connection.config.apiBaseUrl);
    if (!baseUrl) {
      return { ok: false, message: "Missing API base URL" };
    }

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
        method: "GET",
        headers: buildHeaders(connection),
      });

      if (response.ok) {
        return { ok: true, message: "Connection succeeded" };
      }

      return { ok: false, message: `Provider health endpoint returned ${response.status}` };
    } catch (error) {
      return {
        ok: false,
        message: `Connection failed: ${error instanceof Error ? error.message : "unknown error"}`,
      };
    }
  }

  async syncAll(connection: TrainingProviderConnection, sinceIso?: string | null): Promise<TrainingSyncDelta> {
    const baseUrl = asNullableString(connection.config.apiBaseUrl);
    if (!baseUrl) {
      return { courses: [], assignments: [], completions: [] };
    }

    const root = baseUrl.replace(/\/$/, "");
    const query = sinceIso ? `?updated_since=${encodeURIComponent(sinceIso)}` : "";

    const [coursesRes, assignmentsRes, completionsRes] = await Promise.all([
      fetch(`${root}/courses${query}`, { headers: buildHeaders(connection) }),
      fetch(`${root}/assignments${query}`, { headers: buildHeaders(connection) }),
      fetch(`${root}/completions${query}`, { headers: buildHeaders(connection) }),
    ]);

    const providerName = asString(connection.provider_name) || "Vocational Training Hub";

    const coursesJson = coursesRes.ok ? ((await coursesRes.json()) as Record<string, unknown>) : {};
    const assignmentsJson = assignmentsRes.ok ? ((await assignmentsRes.json()) as Record<string, unknown>) : {};
    const completionsJson = completionsRes.ok ? ((await completionsRes.json()) as Record<string, unknown>) : {};

    const courses = Array.isArray(coursesJson.data)
      ? coursesJson.data.map((item) => parseCourse(item as Record<string, unknown>, providerName))
      : [];
    const assignments = Array.isArray(assignmentsJson.data)
      ? assignmentsJson.data.map((item) => parseAssignment(item as Record<string, unknown>))
      : [];
    const completions = Array.isArray(completionsJson.data)
      ? completionsJson.data.map((item) => parseCompletion(item as Record<string, unknown>, "api"))
      : [];

    return {
      courses,
      assignments,
      completions,
      rawEvents: [coursesJson, assignmentsJson, completionsJson],
    };
  }

  async handleWebhook(input: {
    connection: TrainingProviderConnection;
    headers: Headers;
    rawBody: string;
    payload: Record<string, unknown>;
  }): Promise<TrainingProviderWebhookResult> {
    const signature = input.headers.get("x-vth-signature");
    const secret = asNullableString(input.connection.config.webhookSecret);

    if (secret) {
      const digest = crypto.createHmac("sha256", secret).update(input.rawBody).digest("hex");
      if (!signature || digest !== signature) {
        return {
          accepted: false,
          eventType: "invalid_signature",
          externalEventId: null,
          delta: { courses: [], assignments: [], completions: [] },
        };
      }
    }

    const eventType = asString(input.payload.type || input.payload.event || "unknown");
    const eventId = asNullableString(input.payload.id || input.payload.event_id);
    const data = (input.payload.data ?? {}) as Record<string, unknown>;

    if (eventType.includes("course.completed") || eventType.includes("certificate.issued")) {
      return {
        accepted: true,
        eventType,
        externalEventId: eventId,
        delta: {
          courses: [],
          assignments: [],
          completions: [parseCompletion(data, "webhook")],
          rawEvents: [input.payload],
        },
      };
    }

    if (eventType.includes("course.assigned") || eventType.includes("course.started")) {
      return {
        accepted: true,
        eventType,
        externalEventId: eventId,
        delta: {
          courses: [],
          assignments: [parseAssignment(data)],
          completions: [],
          rawEvents: [input.payload],
        },
      };
    }

    if (eventType.includes("course.updated") || eventType.includes("course.created")) {
      const providerName = asString(input.connection.provider_name) || "Vocational Training Hub";
      return {
        accepted: true,
        eventType,
        externalEventId: eventId,
        delta: {
          courses: [parseCourse(data, providerName)],
          assignments: [],
          completions: [],
          rawEvents: [input.payload],
        },
      };
    }

    return {
      accepted: true,
      eventType,
      externalEventId: eventId,
      delta: { courses: [], assignments: [], completions: [], rawEvents: [input.payload] },
    };
  }

  async importRecords(input: {
    connection: TrainingProviderConnection;
    fileName: string;
    contentType: string;
    buffer: Buffer;
  }): Promise<TrainingSyncDelta> {
    const providerName = asString(input.connection.provider_name) || "Vocational Training Hub";
    const lowerName = input.fileName.toLowerCase();

    if (lowerName.endsWith(".csv")) {
      const content = input.buffer.toString("utf8");
      const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        return { courses: [], assignments: [], completions: [] };
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",");
        const mapped: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          mapped[header] = cols[index] ?? "";
        });
        return mapped;
      });

      return {
        courses: rows.filter((r) => asString(r.record_type) === "course").map((r) => parseCourse(r, providerName)),
        assignments: rows.filter((r) => asString(r.record_type) === "assignment").map((r) => parseAssignment(r)),
        completions: rows.filter((r) => asString(r.record_type) === "completion").map((r) => parseCompletion(r, "import")),
        rawEvents: rows,
      };
    }

    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      const workbook = XLSX.read(input.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      return {
        courses: rows.filter((r) => asString(r.record_type) === "course").map((r) => parseCourse(r, providerName)),
        assignments: rows.filter((r) => asString(r.record_type) === "assignment").map((r) => parseAssignment(r)),
        completions: rows.filter((r) => asString(r.record_type) === "completion").map((r) => parseCompletion(r, "import")),
        rawEvents: rows,
      };
    }

    throw new Error(`Unsupported import format: ${input.fileName}`);
  }

  resolveLearnerCourseUrl(input: {
    connection: TrainingProviderConnection;
    providerLearnerId: string | null;
    providerCourseId: string;
    fallbackCourseUrl: string | null;
  }): string | null {
    if (input.fallbackCourseUrl) {
      return input.fallbackCourseUrl;
    }

    const baseUrl = asNullableString(input.connection.config.portalBaseUrl || input.connection.config.apiBaseUrl);
    if (!baseUrl) {
      return null;
    }

    const root = baseUrl.replace(/\/$/, "");
    if (input.providerLearnerId) {
      return `${root}/learners/${encodeURIComponent(input.providerLearnerId)}/courses/${encodeURIComponent(input.providerCourseId)}`;
    }

    return `${root}/courses/${encodeURIComponent(input.providerCourseId)}`;
  }
}
