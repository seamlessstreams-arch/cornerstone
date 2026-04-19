# Release Notes - 19 April 2026

## Summary
This update delivers a full Phase 3 app shell and protected API foundation for Cornerstone, including authenticated session handling, role-aware navigation, health and safety and recruitment workflows, reporting flows, Supabase migration scaffolding, and localhost runtime stabilization.

## Included Commits
- 2bd5658: fix: stabilize localhost auth flow and Next.js 16 proxy migration
- eacd6ce: feat: add auth actor/session foundation and sign-in flows
- 1d25c67: feat: add unified app shell and phase-3 module pages
- b589324: feat: add protected APIs and phase-3 service layer
- 911f33e: chore: add supabase foundation and phase-3 migrations
- f69b1b5: docs: update README and add client demo script
- b3e0c82: fix: improve sign-in error messaging for auth network failures
- d7d9a11: chore: patch transitive hono server vulnerability via override

## Key Changes

### Runtime and Platform Stability
- Migrated deprecated middleware entrypoint to proxy.
- Stabilized localhost auth behavior and dev preview handling in the app frame.
- Resolved strict TypeScript and lint blockers in key routes and shell components.

### Auth and Access Control
- Added actor resolution and role normalization helpers.
- Added authenticated actor endpoint at /api/auth/me.
- Added sign-in, sign-out, and reset-password page flows.
- Improved sign-in error messaging for network and DNS failures when Supabase auth is unreachable.

### UI Shell and Module Pages
- Added shared shell, top nav, protected banners, and branding components.
- Added and updated Phase 3 pages for health and safety, safer recruitment, reports, registered manager, plus dashboard and operations pages.

### Protected API Layer and Service Logic
- Added protected route handlers with request-id error patterns for aria, daily logs, handover, incidents, maintenance, oversight, reports, safer recruitment, and tasks.
- Added domain and repository services for phase3 health-safety, recruitment, reports, incidents, tasks, and audit logging.

### Data and Migrations
- Added Supabase Phase 1 foundation and Phase 3 migrations.
- Updated Prisma and TypeScript configuration for runtime support.
- Added npm override to pin @hono/node-server to a patched transitive version.
- Updated ignore rules for local artifacts:
  - dev.db
  - supabase/.temp/

### Documentation
- Updated README.
- Added client demo walkthrough script.

## Verification
- npm run lint passed.
- npm run build passed.
- Local routing and auth smoke checks passed at localhost:3001.

## Suggested PR Title
Phase 3 foundation: auth, shell, protected APIs, and Supabase migrations

## Suggested PR Description Opening
This PR introduces the Phase 3 foundation for Cornerstone by delivering a unified app shell, authenticated session and actor resolution, protected operational APIs, migration-backed data scaffolding, and docs updates. Work is split into six logical commits to keep review scope clear and traceable.
