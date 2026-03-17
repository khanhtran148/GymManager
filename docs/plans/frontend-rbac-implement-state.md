# Implementation State: Frontend RBAC Permission System

## Topic
Implement frontend RBAC permission system per plan at docs/plans/frontend-rbac/plan.md

## Discovery Context
- **Branch**: Continue on feat/correct_full_flow (no new branch)
- **Requirements**: Plan is complete, no additional constraints
- **Test DB Strategy**: Docker containers (Testcontainers for backend integration tests)
- **Feature Scope**: Fullstack (Frontend + Backend SignalR)
- **Task Type**: feature

## Phase-Specific Context
- **Plan Dir**: docs/plans/frontend-rbac
- **Plan Source**: docs/plans/frontend-rbac/plan.md
- **Discovery Context**: docs/plans/frontend-rbac/discovery-context.md
- **Brainstorm Report**: docs/plans/reports/260318-brainstorm-frontend-rbac.md
- **ADR**: docs/adrs/260318-frontend-rbac-permission-system.md

## Plan Summary
7 phases implementing 6-layer frontend RBAC:
1. Phase 0: Contract definition (JWT claims, SignalR event shape, cookies)
2. Phase 1: Permission Infrastructure (jose, BigInt, Zustand, hooks) — FOUNDATION
3. Phase 2: Navigation + Route Guards (middleware, sidebar, 403 page) — PARALLEL with 3,4
4. Phase 3-Backend: SignalR PermissionsChanged event — PARALLEL with 2,4
5. Phase 4: Component Gates (PermissionGate, RoleGate, apply to pages) — PARALLEL with 2,3
6. Phase 5: SSR Safety + Role Dashboard — PARALLEL with 6
7. Phase 6: Real-Time Sync (SignalR → token refresh → store update) — PARALLEL with 5
8. Phase 7: Integration verification

## Key Decisions
- Decode JWT with jose (no backend AuthResponse changes needed)
- BigInt bitwise for permissions (matches backend Permission : long)
- Unsigned user_role cookie for middleware (UX-only, backend enforces security)
- SignalR PermissionsChanged → token refresh (not direct store mutation)
- mounted state pattern for SSR hydration safety
