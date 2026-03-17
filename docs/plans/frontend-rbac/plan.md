# Frontend RBAC Permission System -- Implementation Plan

**Date**: 2026-03-18
**Scope**: Fullstack (Frontend-heavy, Backend-light)
**ADR**: `docs/adrs/260318-frontend-rbac-permission-system.md`
**Discovery**: `docs/plans/frontend-rbac/discovery-context.md`

---

## Overview

Add role-based and permission-based access control to the GymManager frontend. The backend already has full RBAC; the frontend ignores it. This plan adds six layers: permission infrastructure, route guards, component gates, role-specific dashboard, SSR safety, and real-time sync.

All frontend permission checks are UX-only. The backend `IPermissionChecker` remains the security boundary.

---

## Phase 0: Contract -- Backend AuthResponse + SignalR Event

**Goal**: Define the data shapes that frontend and backend agree on.

### 0.1 Backend AuthResponse Extension

The backend `AuthResponse` record currently lacks `role` and `permissions`. Two options:

**Option A (chosen)**: Do NOT change `AuthResponse`. The frontend decodes `role` and `permissions` directly from the JWT access token using `jose`. This avoids backend changes and keeps the contract minimal. The JWT already contains both claims.

**Option B (rejected)**: Add `Role` and `Permissions` to `AuthResponse`. Rejected because it duplicates data already in the JWT and requires backend changes across login/register/refresh handlers.

### 0.2 SignalR PermissionsChanged Event Contract

```typescript
// Event name: "PermissionsChanged"
// Sent to: user:{userId} group
interface PermissionsChangedPayload {
  userId: string;
  newRole: string;
  newPermissions: string; // long as string, matching JWT claim format
}
```

**Backend task**: When a user's role or permissions change, publish `PermissionsChanged` via `INotificationHub.SendToGroupAsync($"user:{userId}", "PermissionsChanged", payload)`.

### Files

| File | Action |
|---|---|
| `docs/plans/frontend-rbac/api-contract-260318-1500.md` | CREATE -- contract doc |

---

## Phase 1: Permission Infrastructure (Frontend)

**PARALLEL: no (dependency for all later phases)**
**Complexity: L**

### 1.1 Install jose

```bash
cd src/apps/gymmanager-web && npm install jose
```

**Size**: S

### 1.2 Create Permission + Role TypeScript Constants

Mirror the backend `Permission.cs` and `Role.cs` exactly.

**File**: `src/apps/gymmanager-web/src/lib/permissions.ts`

```typescript
// BigInt bitwise constants matching backend Permission : long
export const Permission = {
  None: 0n,
  ViewMembers: 1n << 0n,
  ManageMembers: 1n << 1n,
  // ... all 26 permissions
  Admin: ~0n, // all bits set (same as backend ~0L, but masked to 64-bit)
} as const;

export type PermissionFlag = (typeof Permission)[keyof typeof Permission];

export function hasPermission(userPermissions: bigint, required: bigint): boolean {
  return (userPermissions & required) === required;
}

export function hasAnyPermission(userPermissions: bigint, ...required: bigint[]): boolean {
  return required.some(p => (userPermissions & p) === p);
}
```

**File**: `src/apps/gymmanager-web/src/lib/roles.ts`

```typescript
export const Role = {
  Owner: "Owner",
  HouseManager: "HouseManager",
  Trainer: "Trainer",
  Staff: "Staff",
  Member: "Member",
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];
```

**Size**: M

### 1.3 Create JWT Decode Utility

**File**: `src/apps/gymmanager-web/src/lib/jwt.ts`

Uses `jose.decodeJwt()` (no verification needed -- backend already verified on issue; frontend decode is UX-only).

```typescript
import { decodeJwt } from "jose";

export interface JwtPermissionClaims {
  role: string;
  permissions: string; // long as string
}

export function decodePermissionClaims(token: string): JwtPermissionClaims | null {
  try {
    const claims = decodeJwt(token);
    return {
      role: claims.role as string,
      permissions: claims.permissions as string,
    };
  } catch {
    return null;
  }
}
```

**Size**: S

### 1.4 Extend Auth Store with Role + Permissions

**File**: `src/apps/gymmanager-web/src/stores/auth-store.ts` (MODIFY)

Add to `AuthState`:
- `role: RoleType | null`
- `permissions: bigint` (stored as string in persist, converted on rehydrate)

Modify `login()`:
1. Call `decodePermissionClaims(response.accessToken)`
2. Set `role` and `permissions` in store
3. Set `user_role` cookie for middleware

Add `updateFromToken(token: string)`:
- Re-decode JWT, update role/permissions/cookie (used by SignalR handler and token refresh)

Add custom `storage` adapter for persist middleware to handle BigInt serialization (BigInt to string on serialize, string to BigInt on deserialize).

**Size**: M

### 1.5 Create Permission Hooks

**File**: `src/apps/gymmanager-web/src/hooks/use-permissions.ts`

```typescript
export function usePermissions(): bigint { ... }
export function useCanDo(permission: bigint): boolean { ... }
export function useRole(): RoleType | null { ... }
export function useHasRole(...roles: RoleType[]): boolean { ... }
```

All read from `useAuthStore`.

**Size**: S

### 1.6 Update Token Refresh to Sync Permissions

**File**: `src/apps/gymmanager-web/src/lib/api-client.ts` (MODIFY)

After successful token refresh (line ~91), call `useAuthStore.getState().updateFromToken(accessToken)` to re-decode JWT and update role/permissions/cookie.

**Size**: S

### Tests (TFD)

**File**: `src/apps/gymmanager-web/src/__tests__/lib/permissions.test.ts`
- `hasPermission` returns true when bit is set
- `hasPermission` returns false when bit is missing
- `hasAnyPermission` returns true if any match
- Admin permission matches everything

**File**: `src/apps/gymmanager-web/src/__tests__/lib/jwt.test.ts`
- `decodePermissionClaims` extracts role and permissions from valid JWT
- Returns null for malformed token

**File**: `src/apps/gymmanager-web/src/__tests__/stores/auth-store-permissions.test.ts`
- `login()` sets role and permissions from JWT
- `updateFromToken()` updates role and permissions
- BigInt survives persist serialization round-trip

**File**: `src/apps/gymmanager-web/src/__tests__/hooks/use-permissions.test.ts`
- `useCanDo` returns correct boolean for permission check
- `useHasRole` returns correct boolean for role check

### FILE OWNERSHIP (Phase 1)
- `src/apps/gymmanager-web/src/lib/permissions.ts` -- CREATE
- `src/apps/gymmanager-web/src/lib/roles.ts` -- CREATE
- `src/apps/gymmanager-web/src/lib/jwt.ts` -- CREATE
- `src/apps/gymmanager-web/src/stores/auth-store.ts` -- MODIFY
- `src/apps/gymmanager-web/src/hooks/use-permissions.ts` -- CREATE
- `src/apps/gymmanager-web/src/lib/api-client.ts` -- MODIFY (token refresh section only)
- `src/apps/gymmanager-web/src/__tests__/lib/permissions.test.ts` -- CREATE
- `src/apps/gymmanager-web/src/__tests__/lib/jwt.test.ts` -- CREATE
- `src/apps/gymmanager-web/src/__tests__/stores/auth-store-permissions.test.ts` -- CREATE
- `src/apps/gymmanager-web/src/__tests__/hooks/use-permissions.test.ts` -- CREATE

---

## Phase 2: Navigation + Route Guards (Frontend)

**Depends on**: Phase 1
**PARALLEL: yes (with Phase 3-Backend)**
**Complexity: L**

### 2.1 Create Route-Role Config Map

**File**: `src/apps/gymmanager-web/src/lib/route-access.ts`

Single source of truth mapping routes to minimum role access and required permissions.

```typescript
interface RouteAccess {
  path: string;
  allowedRoles: RoleType[];
  requiredPermission?: bigint; // optional finer check
}

export const routeAccessMap: RouteAccess[] = [
  { path: "/", allowedRoles: [Owner, HouseManager, Trainer, Staff, Member] },
  { path: "/gym-houses", allowedRoles: [Owner, HouseManager, Trainer, Staff] },
  { path: "/members", allowedRoles: [Owner, HouseManager, Trainer, Staff, Member] },
  { path: "/bookings", allowedRoles: [Owner, HouseManager, Trainer, Staff, Member] },
  { path: "/class-schedules", allowedRoles: [Owner, HouseManager, Trainer, Staff, Member] },
  { path: "/time-slots", allowedRoles: [Owner, HouseManager, Trainer, Staff, Member] },
  { path: "/check-in", allowedRoles: [Owner, HouseManager, Trainer, Staff] },
  { path: "/finance", allowedRoles: [Owner, HouseManager, Staff] },
  { path: "/finance/transactions", allowedRoles: [Owner, HouseManager, Staff] },
  { path: "/finance/pnl", allowedRoles: [Owner, HouseManager] },
  { path: "/staff", allowedRoles: [Owner, HouseManager] },
  { path: "/shifts", allowedRoles: [Owner, HouseManager] },
  { path: "/payroll", allowedRoles: [Owner, HouseManager] },
  { path: "/announcements", allowedRoles: [Owner, HouseManager, Trainer, Staff, Member] },
];

export function canAccessRoute(pathname: string, role: string): boolean { ... }
```

**Size**: M

### 2.2 Extend Middleware for Role-Based Routing

**File**: `src/apps/gymmanager-web/src/middleware.ts` (MODIFY)

After the existing `is_authenticated` check, read `user_role` cookie. If set, check against `canAccessRoute()`. If denied, redirect to `/403`.

The `user_role` cookie is unsigned (set by client JS). This is acceptable because frontend checks are UX-only; the backend enforces security.

**Size**: M

### 2.3 Create 403 Forbidden Page

**File**: `src/apps/gymmanager-web/src/app/403/page.tsx`

Static page with:
- "Access Denied" heading
- Explanation text
- "Go to Dashboard" button
- Uses existing UI components (Card, Button)

**Size**: S

### 2.4 Add Permission Metadata to Sidebar Nav Entries

**File**: `src/apps/gymmanager-web/src/components/sidebar.tsx` (MODIFY)

1. Add `allowedRoles` field to `NavItem` and `NavGroup` interfaces
2. Populate from the role-permission matrix
3. Filter `navEntries` at render time using `useRole()` hook
4. For NavGroups: filter children first, hide group if no children visible
5. Wrap filtering in `useMemo` for performance

**Size**: M

### Tests (TFD)

**File**: `src/apps/gymmanager-web/src/__tests__/lib/route-access.test.ts`
- `canAccessRoute` allows Owner to access all routes
- `canAccessRoute` blocks Member from /finance, /staff, /shifts, /payroll, /check-in
- `canAccessRoute` blocks Trainer from /finance, /staff, /shifts, /payroll
- Unknown routes default to allowed (fail-open for UX, backend enforces)

**File**: `src/apps/gymmanager-web/src/__tests__/components/sidebar-permissions.test.tsx`
- Member sees 7 nav items (Dashboard, Members, Bookings, Class Schedules, Time Slots, Announcements)
- Owner sees all 12 nav items
- Staff sees correct subset (no Staff & HR group)

### FILE OWNERSHIP (Phase 2)
- `src/apps/gymmanager-web/src/lib/route-access.ts` -- CREATE
- `src/apps/gymmanager-web/src/middleware.ts` -- MODIFY
- `src/apps/gymmanager-web/src/app/403/page.tsx` -- CREATE
- `src/apps/gymmanager-web/src/components/sidebar.tsx` -- MODIFY
- `src/apps/gymmanager-web/src/__tests__/lib/route-access.test.ts` -- CREATE
- `src/apps/gymmanager-web/src/__tests__/components/sidebar-permissions.test.tsx` -- CREATE

---

## Phase 3-Backend: SignalR PermissionsChanged Event

**Depends on**: Phase 0 (contract)
**PARALLEL: yes (with Phase 2)**
**Complexity: M**

### 3.1 Create PermissionsChanged Domain Event

**File**: `src/core/GymManager.Domain/Events/PermissionsChangedEvent.cs`

```csharp
public sealed record PermissionsChangedEvent(
    Guid UserId, string NewRole, long NewPermissions) : INotification;
```

**Size**: S

### 3.2 Publish Event When Role/Permissions Change

Identify where user role or permissions are modified. Add `publisher.Publish(new PermissionsChangedEvent(...))` after the change is persisted.

Likely locations:
- Any "UpdateUserRole" or "AssignRole" command handler (check if exists)
- If no handler exists yet, note this as a prerequisite

**Size**: S-M (depends on whether the handler exists)

### 3.3 Create SignalR Consumer for PermissionsChanged

**File**: `src/apps/GymManager.BackgroundServices/Consumers/PermissionsChangedSignalRConsumer.cs`

Or, if using MediatR notification handler in the API project:

**File**: `src/apps/GymManager.Api/EventHandlers/PermissionsChangedSignalRHandler.cs`

Pattern: same as `AnnouncementSignalRConsumer`. Receives the domain event, calls `INotificationHub.SendToGroupAsync($"user:{userId}", "PermissionsChanged", payload)`.

**Size**: S

### Tests (TFD)

**File**: `tests/GymManager.Application.Tests/EventHandlers/PermissionsChangedSignalRHandlerTests.cs`
- Handler calls `SendToGroupAsync` with correct group name and payload
- Handler includes correct role and permissions in payload

### FILE OWNERSHIP (Phase 3-Backend)
- `src/core/GymManager.Domain/Events/PermissionsChangedEvent.cs` -- CREATE
- Consumer/handler file -- CREATE (location TBD based on existing patterns)
- Test file -- CREATE

---

## Phase 4: Component-Level Permission Gates (Frontend)

**Depends on**: Phase 1
**PARALLEL: yes (with Phase 2)**
**Complexity: M**

### 4.1 Create PermissionGate Component

**File**: `src/apps/gymmanager-web/src/components/permission-gate.tsx`

```typescript
interface PermissionGateProps {
  permission: bigint;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Renders children only if user has the required permission
// Renders fallback (or nothing) if not
```

**Size**: S

### 4.2 Create RoleGate Component

**File**: `src/apps/gymmanager-web/src/components/role-gate.tsx`

```typescript
interface RoleGateProps {
  roles: RoleType[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
```

**Size**: S

### 4.3 Apply Permission Gates to Action Buttons

Modify existing pages to wrap Create/Edit/Delete/Process/Approve buttons:

| Page | Button | Permission |
|---|---|---|
| `/members` | "Add Member" | `ManageMembers` |
| `/members/[id]` | Edit/Delete actions | `ManageMembers` |
| `/gym-houses` | "Add Gym House" | `ManageTenant` |
| `/gym-houses/[id]` | Edit/Delete | `ManageTenant` |
| `/bookings` | "New Booking" | `ManageBookings` |
| `/class-schedules` | "New Schedule" | `ManageSchedule` |
| `/finance/transactions` | "New Transaction" | `ProcessPayments` |
| `/finance/transactions/new` | Full page gate | `ProcessPayments` |
| `/staff` | "Add Staff" | `ManageStaff` |
| `/staff/new` | Full page gate | `ManageStaff` |
| `/shifts` | Manage actions | `ManageShifts` |
| `/payroll` | "New Payroll" | `ManageStaff` |
| `/payroll/[id]` | "Approve" button | `ApprovePayroll` |
| `/announcements` | "New Announcement" | `ManageAnnouncements` |
| `/check-in` | Process check-in | `ManageMembers` |

**Size**: L (many files, but each change is small)

### Tests (TFD)

**File**: `src/apps/gymmanager-web/src/__tests__/components/permission-gate.test.tsx`
- Shows children when permission is present
- Hides children when permission is absent
- Shows fallback when provided and permission is absent

**File**: `src/apps/gymmanager-web/src/__tests__/components/role-gate.test.tsx`
- Shows children for allowed role
- Hides children for disallowed role

### FILE OWNERSHIP (Phase 4)
- `src/apps/gymmanager-web/src/components/permission-gate.tsx` -- CREATE
- `src/apps/gymmanager-web/src/components/role-gate.tsx` -- CREATE
- All `(dashboard)/**/*.tsx` page files -- MODIFY (wrapping buttons)
- `src/apps/gymmanager-web/src/__tests__/components/permission-gate.test.tsx` -- CREATE
- `src/apps/gymmanager-web/src/__tests__/components/role-gate.test.tsx` -- CREATE

---

## Phase 5: SSR Safety + Role Dashboard (Frontend)

**Depends on**: Phase 1, Phase 4
**Complexity: M**

### 5.1 Create useMounted Hook

**File**: `src/apps/gymmanager-web/src/hooks/use-mounted.ts`

```typescript
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
```

**Size**: S

### 5.2 Create PermissionSkeleton Component

**File**: `src/apps/gymmanager-web/src/components/permission-skeleton.tsx`

Wraps permission-gated content. Shows skeleton placeholder during SSR/hydration, then shows real content or nothing after mount.

```typescript
interface PermissionSkeletonProps {
  permission: bigint;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}
```

Uses `useMounted()` internally. Before mount: renders skeleton. After mount: delegates to `PermissionGate`.

**Size**: S

### 5.3 Role-Conditional Dashboard Widgets

**File**: `src/apps/gymmanager-web/src/app/(dashboard)/page.tsx` (MODIFY)

Wrap dashboard sections with `<RoleGate>` and `<PermissionGate>`:
- Revenue stat card: `RoleGate roles={[Owner, HouseManager, Staff]}`
- "Add Gym House" quick action: `PermissionGate permission={ManageTenant}`
- "Add Member" quick action: `PermissionGate permission={ManageMembers}`
- System Overview (full): `RoleGate roles={[Owner, HouseManager]}`

Member dashboard shows: own stats only (Total Members count hidden, own bookings shown).

**Size**: M

### Tests (TFD)

**File**: `src/apps/gymmanager-web/src/__tests__/hooks/use-mounted.test.ts`
- Returns false on initial render, true after mount

**File**: `src/apps/gymmanager-web/src/__tests__/components/permission-skeleton.test.tsx`
- Shows skeleton before mount
- Shows gated content after mount

### FILE OWNERSHIP (Phase 5)
- `src/apps/gymmanager-web/src/hooks/use-mounted.ts` -- CREATE
- `src/apps/gymmanager-web/src/components/permission-skeleton.tsx` -- CREATE
- `src/apps/gymmanager-web/src/app/(dashboard)/page.tsx` -- MODIFY
- Test files -- CREATE

---

## Phase 6: Real-Time Permission Sync (Frontend + Backend)

**Depends on**: Phase 1, Phase 3-Backend
**Complexity: M**

### 6.1 Create usePermissionSync Hook

**File**: `src/apps/gymmanager-web/src/hooks/use-permission-sync.ts`

Listens for `PermissionsChanged` SignalR event on the existing notification connection.

On event:
1. Call the `/auth/refresh` endpoint to get a fresh JWT (with updated claims)
2. Call `useAuthStore.getState().updateFromToken(newAccessToken)`
3. Show a toast: "Your permissions have been updated"

Fallback: permissions also update on regular 15-minute token refresh cycle.

**Size**: M

### 6.2 Wire usePermissionSync into Dashboard Layout

**File**: `src/apps/gymmanager-web/src/app/(dashboard)/layout.tsx` (MODIFY)

Add `"use client"` directive (if not already present -- it's currently a Server Component).

Option: create a thin client wrapper component `PermissionSyncProvider` that calls `usePermissionSync()` and renders children. Add it inside the layout so it runs on all dashboard pages.

**Size**: S

### 6.3 Add Toast Component (if not exists)

Check if a toast/notification UI exists. If not, create a minimal one or reuse the existing notification store's toast capability.

**Size**: S

### Tests (TFD)

**File**: `src/apps/gymmanager-web/src/__tests__/hooks/use-permission-sync.test.ts`
- On PermissionsChanged event, triggers token refresh
- On PermissionsChanged event, updates auth store

### FILE OWNERSHIP (Phase 6)
- `src/apps/gymmanager-web/src/hooks/use-permission-sync.ts` -- CREATE
- `src/apps/gymmanager-web/src/app/(dashboard)/layout.tsx` -- MODIFY
- `src/apps/gymmanager-web/src/components/permission-sync-provider.tsx` -- CREATE
- Test files -- CREATE

---

## Phase 7: Integration + Smoke Test

**Depends on**: All previous phases
**Complexity: M**

### 7.1 End-to-End Verification Checklist

Manual verification (or extend existing e2e if present):

1. Login as Owner: all 12 sidebar items visible, all action buttons present
2. Login as Member: ~6 sidebar items, no Create/Edit/Delete buttons on restricted resources
3. Direct URL `/finance/pnl` as Member: redirected to `/403`
4. Direct URL `/staff/new` as Trainer: redirected to `/403`
5. Admin changes Member to HouseManager: SignalR event fires, sidebar updates without page reload
6. No hydration flash: restricted content shows skeleton then resolves correctly
7. Token refresh: permissions survive refresh cycle

### 7.2 CI Permission Drift Check (optional, recommended)

Script that parses `Permission.cs` and `permissions.ts`, compares enum names and bit positions, fails CI if they diverge.

**Size**: S

### FILE OWNERSHIP (Phase 7)
- CI script (optional) -- CREATE

---

## Dependency Graph

```
Phase 0 (Contract)
  |
  +---> Phase 1 (Permission Infrastructure)
  |       |
  |       +---> Phase 2 (Nav + Route Guards)      ---|
  |       |                                          |---> Phase 5 (SSR + Dashboard)
  |       +---> Phase 4 (Component Gates)          ---|
  |
  +---> Phase 3-Backend (SignalR Event)
          |
          +---> Phase 6 (Real-Time Sync) <--- Phase 1
                  |
                  +---> Phase 7 (Integration)
```

**Critical path**: Phase 0 -> Phase 1 -> Phase 2 + Phase 4 (parallel) -> Phase 5 -> Phase 7

**Parallelizable**:
- Phase 2 + Phase 3-Backend + Phase 4 (all depend only on Phase 0/1)
- Phase 5 + Phase 6 (Phase 5 depends on 1+4; Phase 6 depends on 1+3)

---

## Summary of All New/Modified Files

### New Files (Frontend)
| File | Phase |
|---|---|
| `src/lib/permissions.ts` | 1 |
| `src/lib/roles.ts` | 1 |
| `src/lib/jwt.ts` | 1 |
| `src/hooks/use-permissions.ts` | 1 |
| `src/lib/route-access.ts` | 2 |
| `src/app/403/page.tsx` | 2 |
| `src/components/permission-gate.tsx` | 4 |
| `src/components/role-gate.tsx` | 4 |
| `src/hooks/use-mounted.ts` | 5 |
| `src/components/permission-skeleton.tsx` | 5 |
| `src/hooks/use-permission-sync.ts` | 6 |
| `src/components/permission-sync-provider.tsx` | 6 |

(All paths relative to `src/apps/gymmanager-web/`)

### Modified Files (Frontend)
| File | Phase |
|---|---|
| `src/stores/auth-store.ts` | 1 |
| `src/lib/api-client.ts` | 1 |
| `src/middleware.ts` | 2 |
| `src/components/sidebar.tsx` | 2 |
| `src/app/(dashboard)/page.tsx` | 5 |
| `src/app/(dashboard)/layout.tsx` | 6 |
| All page files with action buttons | 4 |

### New Files (Backend)
| File | Phase |
|---|---|
| `src/core/GymManager.Domain/Events/PermissionsChangedEvent.cs` | 3 |
| SignalR handler/consumer | 3 |
| Backend test file | 3 |

### New Files (Tests -- Frontend)
| File | Phase |
|---|---|
| `src/__tests__/lib/permissions.test.ts` | 1 |
| `src/__tests__/lib/jwt.test.ts` | 1 |
| `src/__tests__/stores/auth-store-permissions.test.ts` | 1 |
| `src/__tests__/hooks/use-permissions.test.ts` | 1 |
| `src/__tests__/lib/route-access.test.ts` | 2 |
| `src/__tests__/components/sidebar-permissions.test.tsx` | 2 |
| `src/__tests__/components/permission-gate.test.tsx` | 4 |
| `src/__tests__/components/role-gate.test.tsx` | 4 |
| `src/__tests__/hooks/use-mounted.test.ts` | 5 |
| `src/__tests__/components/permission-skeleton.test.tsx` | 5 |
| `src/__tests__/hooks/use-permission-sync.test.ts` | 6 |

---

## Estimated Effort

| Phase | Size | Estimated Time |
|---|---|---|
| Phase 0: Contract | S | 0.5h |
| Phase 1: Permission Infrastructure | L | 3h |
| Phase 2: Nav + Route Guards | L | 3h |
| Phase 3: Backend SignalR Event | M | 2h |
| Phase 4: Component Gates | M-L | 3h |
| Phase 5: SSR Safety + Dashboard | M | 2h |
| Phase 6: Real-Time Sync | M | 2h |
| Phase 7: Integration | M | 1.5h |
| **Total** | | **~17h** |

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Permission constants drift between C# and TS | CI comparison script (Phase 7.2) |
| Unsigned `user_role` cookie could be forged | All API calls still hit backend `IPermissionChecker`; frontend is UX-only |
| BigInt not supported in old browsers | BigInt has 96%+ browser support; project already targets modern browsers |
| Stale role cookie after logout/re-login | `login()` always re-decodes JWT and sets fresh cookie |
| Hydration mismatch from permission checks | `useMounted()` pattern + skeleton loaders (Phase 5) |
| Token refresh race with SignalR event | Use existing `isRefreshing` queue in api-client.ts |

---

## Approval

Approve this plan to proceed with implementation via `/mk-implement`.
