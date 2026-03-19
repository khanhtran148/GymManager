# ADR: Frontend RBAC Permission System

**Date**: 2026-03-18
**Status**: Accepted
**Deciders**: Project team

## Context

The GymManager backend has a complete RBAC system: 5 roles (Owner, HouseManager, Trainer, Staff, Member), 26 bitwise permissions, and `IPermissionChecker` enforcement on every command handler. The JWT already contains `role` and `permissions` claims.

The frontend ignores these entirely. All 30 dashboard pages, 12 sidebar menu items, and all action buttons are visible to every authenticated user. The only frontend auth check is a cookie-based `isAuthenticated` in Next.js middleware.

## Decision

Implement frontend RBAC as a six-layer system:

1. **Permission Infrastructure** — Decode JWT with `jose`, store role (string) + permissions (BigInt) in Zustand auth store. Expose via `usePermissions()` and `useCanDo(permission)` hooks. Set `user_role` cookie on login for middleware consumption.

2. **Navigation & Route Guards** — Extend middleware to check `user_role` cookie against a route-role config map. Filter sidebar nav entries by `requiredPermission` field. Create `/403` page for unauthorized direct URL access.

3. **Component-Level Gates** — `<PermissionGate permission={Permission.X}>` and `<RoleGate roles={[Role.Owner]}>` wrapper components. Apply to all Create/Edit/Delete buttons per the role-permission matrix.

4. **Role-Specific Dashboard** — Single dashboard page with conditional widget sections wrapped in `<PermissionGate>`.

5. **SSR Safety** — `mounted` state pattern to prevent hydration mismatch. Render skeletons until client-side permissions are available.

6. **Real-Time Sync** — Listen for SignalR `PermissionsChanged` event. Trigger token refresh, re-decode JWT, update Zustand store and role cookie.

## Consequences

### Positive
- Users only see menus and actions they can use — cleaner, less confusing UX
- No extra API calls — JWT claims already exist, just need decoding
- Backend remains the security boundary — frontend checks are UX-only
- SignalR provides real-time permission updates when admin changes roles
- BigInt bitwise matches backend `Permission : long` exactly — O(1) permission checks

### Negative
- Role cookie is unsigned — a user could set `user_role=Owner` to see admin UI (but all API calls would fail 403)
- BigInt adds minor cognitive overhead for developers unfamiliar with `1n << 0n` syntax
- Permission constants file must stay in sync with backend enum — needs CI check
- Skeleton loaders on initial render add slight perceived latency

### Risks
- Permission constant drift (mitigate with CI comparison script)
- Stale role cookie after token expiry (mitigate with re-decode on Zustand rehydration)
- 403 race condition during SignalR-triggered token refresh (mitigate with global 403 retry interceptor)

## Alternatives Considered

- **Decode JWT in middleware** — Works with `jose` in Edge Runtime, but adds complexity. Role cookie is simpler.
- **Separate /me endpoint for permissions** — Extra network round-trip on every page load. JWT claims avoid this.
- **Number instead of BigInt for permissions** — Works for 26 permissions (fits in 32-bit), but doesn't match backend `long` type and limits future growth.
- **Server Component permission checks** — Project uses `"use client"` extensively. Adding RSC checks would require architectural changes with limited security benefit.
- **HOC pattern (withPermission)** — Legacy React pattern. Wrapper components are the modern React idiom.
