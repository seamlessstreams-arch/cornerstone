import { randomUUID } from "node:crypto";

interface Reg45FallbackCycle {
  id: string;
  organisation_id: string;
  home_id: string | null;
  cycle_title: string;
  status: string;
  review_start_date: string;
  review_end_date: string;
  due_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface Reg45FallbackStore {
  cycles: Map<string, Reg45FallbackCycle>;
}

const GLOBAL_KEY = "__cornerstone_reg45_fallback_store__";

function getStore(): Reg45FallbackStore {
  const root = globalThis as Record<string, unknown>;
  const existing = root[GLOBAL_KEY] as Reg45FallbackStore | undefined;
  if (existing) return existing;

  const created: Reg45FallbackStore = {
    cycles: new Map<string, Reg45FallbackCycle>(),
  };
  root[GLOBAL_KEY] = created;
  return created;
}

export function isReg45FallbackEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function reg45FallbackCompleteness() {
  return {
    score: 0,
    alerts: ["Reg45 DB tables missing: running in dev fallback mode"],
    blockFinalSignOff: true,
  };
}

export function listFallbackCycles(organisationId: string) {
  const store = getStore();
  return [...store.cycles.values()]
    .filter((cycle) => cycle.organisation_id === organisationId)
    .sort((a, b) => b.review_start_date.localeCompare(a.review_start_date));
}

export function getFallbackCycle(organisationId: string, cycleId: string) {
  const store = getStore();
  const cycle = store.cycles.get(cycleId);
  if (!cycle || cycle.organisation_id !== organisationId) return null;
  return cycle;
}

export function createFallbackCycle(input: {
  organisationId: string;
  homeId: string | null;
  cycleTitle: string;
  reviewStartDate: string;
  reviewEndDate: string;
  dueDate?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const store = getStore();
  const now = new Date().toISOString();
  const cycle: Reg45FallbackCycle = {
    id: randomUUID(),
    organisation_id: input.organisationId,
    home_id: input.homeId,
    cycle_title: input.cycleTitle,
    status: "planned",
    review_start_date: input.reviewStartDate,
    review_end_date: input.reviewEndDate,
    due_date: input.dueDate ?? null,
    metadata: input.metadata ?? {},
    created_at: now,
    updated_at: now,
  };

  store.cycles.set(cycle.id, cycle);
  return cycle;
}

export function updateFallbackCycle(
  organisationId: string,
  cycleId: string,
  updates: Record<string, unknown>
) {
  const cycle = getFallbackCycle(organisationId, cycleId);
  if (!cycle) return null;

  const next = {
    ...cycle,
    ...updates,
    updated_at: new Date().toISOString(),
  } as Reg45FallbackCycle;

  const store = getStore();
  store.cycles.set(cycleId, next);
  return next;
}
