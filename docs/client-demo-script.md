# Client Demo Script

## Goal
Demonstrate the Acacia Therapy Homes super version with 3001-style shell polish and working Phase 3 workflows.

## Demo Flow (7-10 minutes)

1. Dashboard overview
- Route: /dashboard
- Talk track: "This is the operational command center for the home, with role-aware navigation, task and compliance visibility, and prioritized actions."
- Show:
  - KPI cards (incidents, completion, compliance risk, notifications)
  - Status-badged action table
  - Grouped sidebar sections for faster orientation

2. Health & Safety workflow
- Route: /health-safety
- Talk track: "Staff can create structured H&S records and trigger maintenance follow-up from the same form."
- Show:
  - Create a record with severity and due date
  - Tick defect toggle to demonstrate linked maintenance behavior
  - Confirm metrics and recent checks update

3. Safer Recruitment workflow
- Route: /safer-recruitment
- Talk track: "Recruitment is managed end-to-end from candidate creation through evidence verification."
- Show:
  - Create candidate
  - Add evidence using application ID
  - Verify evidence using document ID
  - Confirm register tables reflect changes

4. Reports workflow
- Route: /reports
- Talk track: "Managers can generate structured compliance reports and export outputs with audit traceability."
- Show:
  - Generate report from template/date range
  - Preview summary and metrics
  - Export PDF/Print and show export log row

## Optional Closing
- Route: /settings
- Talk track: "Foundations are in place for organisation-level configuration and provider integrations."

## Q&A Readiness Notes
- Role-based visibility is enforced in app navigation and middleware.
- Request IDs are returned in API responses for operational traceability.
- UI shell has been unified for client-facing consistency across all core modules.

## Demo Reliability Note
- Current Phase 3 rehearsal data is mock-mode and may reset after hard reload or dev server refresh.
- For a smooth client demo, run the flow continuously without manually refreshing between steps.
- If a reset occurs, repeat create actions in-sequence; each flow completes quickly.
