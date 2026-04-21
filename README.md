# Cornerstone App (Phase 1 Foundations)

Cornerstone is the Acacia Therapy Homes operational platform, built with Next.js and Supabase.
This repository currently includes Phase 1 foundations only: authentication, authorization baseline, tenant/home data structure placeholders, RLS/storage policy scripts, and shell branding components.

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Supabase Auth, Postgres, Storage
- Tailwind CSS + shadcn/ui components

## Phase 1 Scope

Included in this phase:
- SSR auth setup for browser/server/middleware contexts
- Protected route middleware and auth pages
- Role and RBAC baseline utilities
- Foundational database tables for multi-tenant operations and placeholders
- RLS helper functions and starter policies
- Storage bucket and policy baseline
- Audit event constants and log writer helper
- Typed Supabase helpers for common CRUD patterns

Not included in this phase:
- Full workflow orchestration for each care/compliance module
- Finalized report/template engines
- Full integration provider implementations

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project with valid API keys

## Environment Variables

Create both `.env` and `.env.local` with the same values for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

## Run Locally

```bash
npm install
npm run dev
```

Default app route is protected. Visit `/auth/sign-in` to authenticate.

## Apply Database Foundations

Apply migration files using your existing workflow (Supabase CLI or SQL editor):

1. Run migration:
   - `supabase/migrations/20260420170000_phase1_foundations.sql`
2. Run RLS policies:
   - `supabase/sql/phase1_rls.sql`
3. Run storage setup:
   - `supabase/sql/phase1_storage.sql`

## Intelligence Layer (Phase 6)

The intelligence layer adds child-level and home-level insight workflows, including:
- Child experience snapshots and pattern alerts
- Intervention quality loops and action effectiveness reviews
- Trusted adult mapping and practice bank entries
- Child voice capture and coverage intelligence
- Manager oversight and quality-of-care intelligence summaries

Primary UI entry points:
- `/reports/intelligence`
- `/young-people/[id]/intelligence`

Primary API entry points:
- `/api/v1/intelligence/home-climate`
- `/api/v1/intelligence/pattern-alerts`
- `/api/v1/intelligence/quality-of-care`
- `/api/v1/intelligence/management-oversight`
- `/api/v1/intelligence/action-effectiveness`
- `/api/v1/intelligence/voice-coverage`
- `/api/v1/intelligence/children/[id]/experience`
- `/api/v1/intelligence/children/[id]/interventions`
- `/api/v1/intelligence/children/[id]/trusted-adults`
- `/api/v1/intelligence/children/[id]/practice-bank`
- `/api/v1/intelligence/children/[id]/voice`

Database migration:
- `supabase/migrations/20260421170000_phase6_intelligence_layer.sql`

## Key Files

- Auth and middleware:
  - `src/lib/supabase/env.ts`
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - `middleware.ts`
- Auth routes/pages:
  - `src/app/auth/sign-in/page.tsx`
  - `src/app/auth/reset-password/page.tsx`
  - `src/app/auth/sign-out/page.tsx`
  - `src/app/api/auth/me/route.ts`
  - `src/app/api/auth/logout/route.ts`
- Security and roles:
  - `src/lib/auth/roles.ts`
  - `src/lib/auth/rbac.ts`
- Audit:
  - `src/lib/audit/events.ts`
  - `src/lib/audit/logger.ts`
- Typed DB helpers:
  - `src/lib/supabase/database.types.ts`
  - `src/lib/db/typed-helpers.ts`
- SQL foundations:
  - `supabase/migrations/20260420170000_phase1_foundations.sql`
  - `supabase/sql/phase1_rls.sql`
  - `supabase/sql/phase1_storage.sql`

## Validation

```bash
npm run lint
npm run build
```

## Notes

- Storage policies are foundation defaults and should be tightened further per module and document sensitivity.
- RLS policies are intentionally baseline and should be expanded with workflow-specific permission checks in the next phase.
