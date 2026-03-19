# ADR: Fullstack Role & Permission Management

**Date:** 2026-03-18
**Status:** Accepted
**Context:** Role management brainstorm — replace static frontend permissions with Owner-managed DB-driven RBAC

## Decision

Implement a relational `role_permissions` table with tenant-scoped bitmask storage, Owner-only CQRS API, and management UI. Keep bitmask format in JWT for zero-migration on frontend and O(1) runtime permission checks.

## Role Hierarchy

| Role | Scope | Access |
|---|---|---|
| Owner | All houses | Full access. Manages roles, permissions, and all resources. Cannot be demoted. |
| HouseManager | Their house/tenant | Full access to their gym house — manages staff, trainers, and members within it. |
| Trainer | Their members | Access to assigned members. Cannot manage staff or house settings. |
| Staff | Basic | Same level as Member. Task-oriented access. |
| Member | Basic | Self-service access (profile, bookings, schedules). |

## Key Decisions

### 1. Storage: `role_permissions` table with bitmask column
- Schema: `(tenant_id UUID, role smallint, permissions bigint, PRIMARY KEY(tenant_id, role))`
- 5 rows per tenant. Bitmask aligns with existing `Permission : long` enum.
- Source of truth for permission compilation. `User.Permissions` column deprecated for writes.

### 2. JWT: Keep compiled bitmask
- `JwtTokenService.GenerateAccessToken` looks up `role_permissions` for the user's tenant and role.
- Compiles bitmask into JWT `permissions` claim.
- Frontend BigInt parsing, `PermissionChecker` bitwise checks — no changes needed.

### 3. Frontend: Decode from JWT + SignalR refresh
- Permissions decoded from JWT into Zustand store (unchanged).
- `PermissionsChangedEvent` published on permission updates.
- `usePermissionSync` triggers token refresh (already wired).
- 15-minute token TTL as fallback.

### 4. Migration: Additive
- Add `role_permissions` table. Keep `users.permissions` column (deprecated).
- Seed default rows per tenant using `RoleSeedData.GetDefaultPermissions()`.
- No breaking changes to existing tokens or API contracts.

## API Endpoints (Owner-only)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/roles/permissions` | List all roles with current permission bitmasks for tenant |
| PUT | `/api/v1/roles/{role}/permissions` | Update permissions for a role |
| POST | `/api/v1/roles/reset-defaults` | Reset all roles to seed defaults |
| GET | `/api/v1/roles/{role}/users` | List users with a given role |
| PUT | `/api/v1/users/{userId}/role` | Change a user's role |

## Frontend Pages (Owner-only)

- `/settings/roles` — Permission toggle grid (roles x permissions, grouped by category)
- `/settings/roles/users` — User-role assignment with role change confirmation dialog

## Consequences

### Positive
- Owner can customize permissions per role per gym — no code changes needed
- Existing permission infrastructure (JWT bitmask, PermissionChecker, frontend BigInt) unchanged
- Real-time permission propagation via existing SignalR wiring
- Seed defaults provide sensible out-of-box configuration

### Negative
- 15-minute stale permission window if SignalR fails (backend enforces; UX-only impact)
- `users.permissions` column becomes deprecated ghost column until cleanup migration
- No per-GymHouse permission overrides (all houses under one Owner share config)
- No custom roles (fixed 5 roles)

### Risks
- New permissions added to enum must be seeded to existing tenants via migration
- Owner lockout prevented by hardcoding Owner to full permissions
- DB lookup in token issuance mitigated by in-memory cache with 5-min TTL

## Implementation Order (8 days)

1. Data Model & Migration (Day 1-2)
2. Role-Permission Management API (Day 2-3)
3. User-Role Assignment API (Day 3-4)
4. SignalR Integration (Day 4)
5. Permission Toggles UI (Day 5-7)
6. User Assignment UI (Day 7-8)
