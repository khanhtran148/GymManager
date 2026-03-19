---
type: doc-index
updated: 2026-03-19
---

# Documentation Index

All documentation files for the GymManager platform.

---

## Core Docs

| File | Type | Description |
|---|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | project-instructions | Development standards, architecture rules, patterns, anti-guessing rules |
| [`README.md`](../README.md) | readme | Project overview, quick start, solution structure |
| [`docs/product-overview.md`](product-overview.md) | product-overview | Product vision, user roles, core features, phase status |
| [`docs/domain-glossary.md`](domain-glossary.md) | domain-glossary | Domain entities, business terms, enum values, entity relationships |
| [`docs/codebase-summary.md`](codebase-summary.md) | codebase-summary | Entity inventory, API endpoints, frontend routes, infrastructure components |
| [`docs/architecture.md`](architecture.md) | architecture | System diagrams, multi-tenancy, auth flow, permission system, error handling |
| [`docs/api-reference.md`](api-reference.md) | api-reference | All REST endpoints, request/response shapes, error format, rate limits |
| [`docs/doc-index.md`](doc-index.md) | doc-index | This file |

---

## Architecture Decision Records

| File | Status | Decision |
|---|---|---|
| [`docs/adrs/260317-gymmanager-platform-architecture.md`](adrs/260317-gymmanager-platform-architecture.md) | Accepted | Shared-DB multi-tenancy, unified booking, append-only ledger, 6 aggregates |

---

## Plans

| File | Type | Description |
|---|---|---|
| [`docs/plans/gymmanager-platform/plan.md`](plans/gymmanager-platform/plan.md) | master-plan | Full platform roadmap across 6 phases |
| [`docs/plans/gymmanager-platform/phases/00-foundation-setup.md`](plans/gymmanager-platform/phases/00-foundation-setup.md) | phase-plan | Phase 0 — Project scaffold |
| [`docs/plans/gymmanager-platform/phases/01-foundation.md`](plans/gymmanager-platform/phases/01-foundation.md) | phase-plan | Phase 1 — Users, GymHouses, Members, Subscriptions, Auth |
| [`docs/plans/gymmanager-platform/phases/02-booking.md`](plans/gymmanager-platform/phases/02-booking.md) | phase-plan | Phase 2 — TimeSlots, ClassSchedules, Bookings, Waitlist, Check-In |
| [`docs/plans/gymmanager-platform/phases/03-finance.md`](plans/gymmanager-platform/phases/03-finance.md) | phase-plan | Phase 3 — Transactions, P&L, Revenue dashboards |
| [`docs/plans/gymmanager-platform/phases/04-staff-hr.md`](plans/gymmanager-platform/phases/04-staff-hr.md) | phase-plan | Phase 4 — Staff, Shifts, Payroll |
| [`docs/plans/gymmanager-platform/phases/05-communications.md`](plans/gymmanager-platform/phases/05-communications.md) | phase-plan | Phase 5 — Announcements, SignalR, FCM push |
| [`docs/plans/gymmanager-platform/phases/06-hardening.md`](plans/gymmanager-platform/phases/06-hardening.md) | phase-plan | Phase 6 — PostgreSQL RLS, load testing, offline mobile |

---

## API Contracts

| File | Phase | Description |
|---|---|---|
| [`docs/plans/gymmanager-platform/api-contract-260317-1200.md`](plans/gymmanager-platform/api-contract-260317-1200.md) | Phase 1 | Foundation API contract snapshot |
| [`docs/plans/gymmanager-platform/api-contract-260317-booking.md`](plans/gymmanager-platform/api-contract-260317-booking.md) | Phase 2 | Booking API contract snapshot |

For the living, consolidated reference see [`docs/api-reference.md`](api-reference.md).

---

## Reports

| File | Type | Description |
|---|---|---|
| [`docs/plans/gymmanager-platform/reports/`](plans/gymmanager-platform/reports/) | report | Implementation and review reports per phase |

---

## Brainstorms

| File | Type | Description |
|---|---|---|
| [`docs/brainstorms/gym-management-platform-20260317-1100/brainstorm-results.md`](brainstorms/gym-management-platform-20260317-1100/brainstorm-results.md) | brainstorm | Initial platform brainstorm — features, scope, constraints |

---

## Design System

| File | Type | Description |
|---|---|---|
| [`docs/plans/frontend-design-system/plan.md`](plans/frontend-design-system/plan.md) | design-plan | Frontend design system plan — components, tokens, Tailwind setup |

---

## Phase Status

| Phase | Status |
|---|---|
| Phase 1 — Foundation | Complete |
| Phase 2 — Booking | Complete |
| Phase 3 — Finance | Complete |
| Phase 4 — Staff/HR | Complete |
| Phase 5 — Communications + RBAC | Complete |
| Phase 6 — Hardening | Pending |
