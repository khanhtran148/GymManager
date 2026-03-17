# Brainstorm Report: Frontend Permission/Role Enhancement

**Date**: 2026-03-18
**Topic**: Enhance frontend UI with correct permission/role-based access control

## Problem Statement

Backend has full RBAC (5 roles, 26 permissions, `IPermissionChecker`). Frontend shows everything to everyone — no menu filtering, no route guards, no action-level permission checks. JWT already contains `role` and `permissions` claims but frontend ignores them.

## Discovery

- **Granularity**: Role-based for menus/pages, permission-based for action buttons
- **Data source**: Decode from JWT claims (already emitted by backend)
- **UX**: Hide restricted menus + show 403 page for direct URL access
- **Real-time**: SignalR push when permissions change

## Role-Permission Matrix

| Page/Feature | Owner | HouseManager | Trainer | Staff | Member |
|---|---|---|---|---|---|
| Dashboard | Full analytics | Full analytics | Limited | Limited | Own data |
| Gym Houses | Full CRUD | Full CRUD | View | View | Hidden |
| Members | Full CRUD | Full CRUD | View | Full CRUD | View own |
| Bookings | Full CRUD | Full CRUD | Manage | Manage | View own |
| Class Schedules | Full CRUD | Full CRUD | View | View | View |
| Time Slots | Full CRUD | Full CRUD | View | View | View |
| Check-in | Full | Full | View | Full | Hidden |
| Finance Dashboard | Full | View | Hidden | View | Hidden |
| Transactions | Full CRUD | View | Hidden | Process | Hidden |
| P&L Report | Full | View | Hidden | Hidden | Hidden |
| Staff | Full CRUD | Full CRUD | Hidden | Hidden | Hidden |
| Shifts | Full CRUD | Full CRUD | Hidden | Hidden | Hidden |
| Payroll | Full + Approve | View | Hidden | Hidden | Hidden |
| Announcements | Full CRUD | Full CRUD | View | View | View |

## Recommended Approach: 6-Layer Frontend RBAC

### Layer 1: Permission Infrastructure
- `jose` library for JWT decode (zero deps, browser-native, Edge Runtime compatible)
- BigInt bitwise permissions matching backend `Permission : long`
- Zustand auth store extension with `role` and `permissions` fields
- `usePermissions()` hook returning full permission set
- `useCanDo(permission)` hook returning boolean
- `user_role` cookie set on login for middleware consumption
- TypeScript `Permission` constants file mirroring backend enum

### Layer 2: Navigation & Route Guards
- Route-to-role config map (single source of truth)
- Middleware reads `user_role` cookie, checks against config
- Sidebar nav entries gain `requiredPermission` field, filtered at render
- `/403` page for unauthorized direct URL access
- Redirect-after-login to role-appropriate landing

### Layer 3: Component-Level Gates
- `<PermissionGate permission={Permission.X}>` — hides children if permission missing
- `<PermissionGate permission={Permission.X} fallback={<Disabled/>}>` — shows fallback
- `<RoleGate roles={[Role.Owner, Role.HouseManager]}>` — role-based sections
- Applied to all Create/Edit/Delete/Process/Approve buttons

### Layer 4: Role-Specific Dashboard
- Single dashboard page with conditional widget sections
- Owner/HouseManager see full analytics
- Trainer sees schedule and bookings
- Staff sees check-in and member management
- Member sees own bookings and subscriptions

### Layer 5: SSR Safety
- `mounted` state pattern to prevent hydration mismatch
- Skeleton loaders until client-side permissions available
- Middleware handles page-level access before SSR renders

### Layer 6: Real-Time Permission Sync
- SignalR `PermissionsChanged` event on existing `NotificationHub`
- Client triggers token refresh on event
- Re-decode JWT, update Zustand store and role cookie
- Toast notification to user
- Fallback: permissions update on regular token refresh (~15 min)

## Key Technical Decisions

| Decision | Choice | Why |
|---|---|---|
| JWT library | `jose` | Zero deps, browser+Edge, TS-native, tree-shakeable |
| Permission storage | BigInt bitwise | Matches backend `long` exactly, O(1) checks |
| Route guard mechanism | Role cookie in middleware | Thin middleware, no crypto overhead per navigation |
| Component pattern | Wrapper components + hooks | Modern React idiom, declarative, reusable |
| Real-time sync | SignalR → token refresh | Keeps JWT and store in sync, avoids split-brain |
| SSR approach | Client-only with mounted guard | Matches existing `"use client"` architecture |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Permission constants drift | Medium | High | CI script comparing .cs and .ts files |
| Stale role cookie | Medium | Medium | Re-decode on Zustand rehydration |
| Hydration flash | Low | Low | `mounted` pattern + skeletons |
| 403 during token refresh | Low | Medium | Global 403 retry interceptor |
| Developer misapplies permission | Medium | Medium | Code review + permission mapping doc |

## ADR Reference
See `docs/adrs/260318-frontend-rbac-permission-system.md`
