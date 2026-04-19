# Cornerstone Phase 1 Foundation

Phase 1 establishes the cloud-ready, multi-user foundation for Acacia Therapy Homes with Supabase Auth, Postgres, Storage, SSR cookie auth, RBAC, RLS, audit foundations, and a branded app shell.

## Technology

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth / Postgres / Storage
- @supabase/supabase-js
- @supabase/ssr
- Zod

## Environment Variables

Set these in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

Branding asset location used by the shell and auth pages:

- `public/branding/acacia-logo.png`

## Deliverables Implemented

### Supabase Integration and Auth

- Browser client helper: `lib/supabase/browser.ts`
- Server/component/route/service-role helpers: `lib/supabase/server.ts`
- Shared env validation: `lib/supabase/env.ts`
- Middleware - Middleware - Middleware - Middleware - Middleware - Middleware - Middleware - Middleware - Middleware - Middlctor resolution: `lib/auth/actor-serv- Middleware - Middleware - Middleware - Middleware - Middleware - Middleware - Middleware - Middleware - Middleware - Middlctor resolution: `lib/auth/actor-serv- Middleware - Middleware - Middual- Middlewar
- Registered Manager
- Deputy Manager
- Team Leader
- Residential Support Worker
- Therapist / Clinical Lead
- Education / Tutor
- HR / Recruitment - HR / Recruitecruitment O- HR / Recruitment - HRpliance Lead
- Independent Visitor / Read-only Auditor

### Database, ### Database, ### Databasase 1 migration SQL: `supabase/mi### Database, ### Database, ### Databasase 1 migratS SQL re### Database, ### Database, ### Dasql`
- Storage SQL reference: `s- Storage SQL reference: `ssql`
- T- T- T- T- T- T- T- T- T- T- T- T- T- T- T-.types.t- T- T- T- T- T- T- T- T- T- T- T- T- T- T- T-.types.t- T- T- T- Tes: `lib/audit/events.ts`
- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger helper: `lib- Audit logger torage buckets provisioned in SQL:
- youn- younle-docum- youn- younle-docuhealth-doc- youn- younle-docum-cuments- youn- younle-docdence
- reports
- training-certificates
- temp-generated-files

### UI and Branding Foundations

- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: idebar.t- Branded login: `app/auth/si- Branded login: `app/authd lo- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/she- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: idebar.t- Branded login: `app/auth/si- Branded login: `app/authd lo- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/she- Branded login: `ape SQ- Branded login: `app/auth/si- Branded login: `app/auth/si- Branded login: `app/auth/si- Brances) `su- Brandeql- Branded login: `ad `su- Branded logine1_storag- Branded login: `app/aut``bash
npm install
npm run dev
```

## Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Rotate any key/token that has been shared in chat or terminal history.
- This phase is intentionally modular to support clean Phase 2+ feature additions.
