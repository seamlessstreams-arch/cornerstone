# Cornerstone Production Readiness Action Plan

This plan turns the platform audit into a practical engineering roadmap. The goal is to move Cornerstone from a strong demo/foundation build into a persistent, secure, auditable production application.

## Current Position

Cornerstone already has strong foundations:

- Next.js App Router with TypeScript
- Supabase Auth, Postgres and Storage foundations
- Role and permission model
- Multi-tenant organisation and home schema
- Dashboard, forms, tasks, reports and intelligence UI areas
- Aria drafting pathway
- Baseline RLS and storage SQL

The next work should focus on production safety, persistence and test coverage before adding more features.

---

## Non-Negotiable Production Rules

1. Live records must persist in Supabase, not in memory.
2. API routes must use real server-side Supabase authentication.
3. API routes must not trust client-provided demo headers in production.
4. Row Level Security must enforce organisation and home separation.
5. Sensitive actions must create audit logs.
6. AI output must remain human-reviewed before becoming a formal record.
7. Demo-only role switching must be disabled in production.
8. Build and lint checks must pass before merging to main.

---

## Phase 1: CI and Safety Gate

- [x] Add GitHub Actions workflow for install, lint and build.
- [ ] Add branch protection requiring CI before merge.
- [ ] Add production environment validation.
- [ ] Add `.env.example` with required variables and safe placeholders.
- [ ] Add a visible demo-mode banner when demo mode is enabled.

Acceptance criteria:

- Pull requests cannot be merged without passing CI.
- Missing production environment variables fail clearly.
- Demo mode cannot be mistaken for production.

---

## Phase 2: Replace Demo Auth in API Routes

Current risk:

Some API code still resolves user identity from `X-User-Id` and falls back to a seeded demo user. This is acceptable for local demonstration only.

Required work:

- [ ] Create a production server auth helper using Supabase server client.
- [ ] Resolve the authenticated user from the Supabase session or JWT.
- [ ] Load profile, organisation, home assignment and role from Supabase.
- [ ] Replace header-based permission checks in API routes.
- [ ] Keep demo auth only behind an explicit demo flag.
- [ ] Add tests for unauthenticated API calls.
- [ ] Add tests for cross-organisation and cross-home access prevention.

Acceptance criteria:

- No production API route trusts `X-User-Id` as identity.
- No production API route falls back to a seeded demo user.
- All protected routes check permission and scope.

---

## Phase 3: Replace In-Memory Store with Supabase Repositories

Current risk:

`src/lib/db/store.ts` is a mutable in-memory data store and currently supports many API routes. This must be replaced module by module.

Recommended migration order:

1. Tasks
2. Forms
3. Young people
4. Daily logs
5. Incidents
6. Missing episodes
7. Medication
8. Documents
9. Management oversight
10. Report evidence
11. Child voice
12. Intelligence and automation logs

Recommended pattern:

```txt
API route -> auth/context -> repository/service -> Supabase -> audit log
```

Acceptance criteria:

- Create, update and delete actions persist after restart or redeploy.
- Records are scoped by organisation and home.
- Sensitive mutations create audit logs.
- UI hooks no longer rely on seeded demo state for live records.

---

## Phase 4: Forms and Workflow Engine

Required work:

- [ ] Connect templates, versions, sections and fields to Supabase.
- [ ] Add required field validation.
- [ ] Add conditional logic support.
- [ ] Add status history for draft, submitted, review, approved, rejected and archived.
- [ ] Add oversight workflow.
- [ ] Add task creation from form answers.
- [ ] Add evidence tagging for reports and inspection readiness.
- [ ] Add signatures and read receipts where required.

Acceptance criteria:

- A completed form can be traced from author to approval to audit log.
- Managers can see which forms need review.
- Aria can suggest improvements while preserving human approval.

---

## Phase 5: Aria Governance

Required work:

- [ ] Standardise AI generation records.
- [ ] Store prompt hash, model, evidence inputs, output, confidence, reviewer and final decision.
- [ ] Add human approval workflow: accepted, edited or rejected.
- [ ] Display evidence used and evidence not available.
- [ ] Prevent AI suggestions from silently becoming formal records.

Acceptance criteria:

- AI output is always reviewable.
- Users can explain what evidence Aria used.
- Final records show who approved or edited AI output.

---

## Phase 6: Assurance and Reporting Spine

Required work:

- [ ] Add evidence mapping to regulations, standards and inspection areas.
- [ ] Build action tracker for external review findings.
- [ ] Build report cycle builder and evidence pack.
- [ ] Build senior leadership challenge log.
- [ ] Add inspection readiness score with explainable gaps.
- [ ] Link operational records to report evidence.

Acceptance criteria:

- Leaders can see live compliance drift.
- Governance challenge is visible and auditable.
- Reports can be built from live evidence rather than copied text.

---

## Phase 7: UX Simplification

Create role-based workspaces:

1. Today
2. Children
3. Home Operations
4. Workforce
5. Assurance

Acceptance criteria:

- Frontline staff see shift-critical actions first.
- Team leaders see shift control and completion.
- Deputies see review queues and practice drift.
- Managers see assurance, risk, compliance and approvals.
- Senior leaders see governance, challenge and escalation.

---

## Immediate Next Tickets

1. Replace demo `requirePermission` with Supabase-backed auth.
2. Create Supabase repository for tasks.
3. Create Supabase repository for care forms.
4. Add audit logging to task and form mutations.
5. Add production demo-mode guard.
6. Add branch protection after CI workflow is merged.

---

## Definition of Done for Production Beta

- [ ] CI passes on main.
- [ ] Demo auth is disabled in production.
- [ ] Core records persist in Supabase.
- [ ] RLS is tested with multiple roles and homes.
- [ ] Audit logs are created for sensitive actions.
- [ ] Aria output requires human approval.
- [ ] Backup/export route exists for critical records.
- [ ] Core modules are tested end-to-end.
- [ ] Rollback plan exists.
