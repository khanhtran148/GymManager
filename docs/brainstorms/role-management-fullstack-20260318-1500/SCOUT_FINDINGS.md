# Scout Findings: Role Management & Permissions — Full Stack
**Date:** 2026-03-18
**Branch:** feat/correct_full_flow
**Scope:** All role, permission, route-access, and authorization artefacts across backend (C#/.NET 10) and frontend (Next.js).

---

## 1. Backend — Domain Layer

### 1.1 Role Enum
**File:** `src/core/GymManager.Domain/Enums/Role.cs`

```csharp
public enum Role { Owner, HouseManager, Trainer, Staff, Member }
```

Five fixed roles, no flags. Stored as `integer` in the `users` table.

---

### 1.2 Permission Enum (Flags / Bitfield)
**File:** `src/core/GymManager.Domain/Enums/Permission.cs`

```csharp
[Flags]
public enum Permission : long
{
    None = 0,
    ViewMembers       = 1L << 0,   ManageMembers       = 1L << 1,
    ViewSubscriptions = 1L << 2,   ManageSubscriptions = 1L << 3,
    ViewClasses       = 1L << 4,   ManageClasses       = 1L << 5,
    ViewTrainers      = 1L << 6,   ManageTrainers      = 1L << 7,
    ViewPayments      = 1L << 8,   ProcessPayments     = 1L << 9,
    ManageTenant      = 1L << 10,  ViewReports         = 1L << 11,
    ManageBookings    = 1L << 12,  ViewBookings        = 1L << 13,
    ManageSchedule    = 1L << 14,  ViewSchedule        = 1L << 15,
    ManageFinance     = 1L << 16,  ViewFinance         = 1L << 17,
    ManageStaff       = 1L << 18,  ViewStaff           = 1L << 19,
    ManageAnnouncements = 1L << 20, ViewAnnouncements  = 1L << 21,
    ApprovePayroll    = 1L << 22,
    ManageShifts      = 1L << 23,  ViewShifts          = 1L << 24,
    ManageWaitlist    = 1L << 25,
    Admin             = ~0L        // all bits set
}
```

26 named bits used; 37 bits remain for future flags before hitting the `long` ceiling.

---

### 1.3 StaffType Enum
**File:** `src/core/GymManager.Domain/Enums/StaffType.cs`

```csharp
public enum StaffType { Trainer, SecurityGuard, CleaningStaff, Reception }
```

Distinguishes the job category of a `Staff` record. **Separate from `Role`** — a user has one `Role` on the `User` entity; `StaffType` is supplementary HR metadata on the `Staff` entity.

---

### 1.4 PermissionsChangedEvent (Domain Event)
**File:** `src/core/GymManager.Domain/Events/PermissionsChangedEvent.cs`

```csharp
public sealed record PermissionsChangedEvent(
    Guid UserId, string NewRole, long NewPermissions) : IDomainEvent;
```

Published when a user's role or permission bitmask changes. Consumed by the API to push real-time updates via SignalR.

---

## 2. Backend — Domain Entities

### 2.1 User Entity
**File:** `src/core/GymManager.Domain/Entities/User.cs`

Key fields relevant to role/permission:

| Property | Type | Notes |
|---|---|---|
| `Role` | `Role` (enum) | Single role per user, stored as `integer` |
| `Permissions` | `Permission` (bitfield long) | Override/custom permissions beyond role defaults |
| `RefreshToken` | `string?` | For JWT rotation |
| `RefreshTokenExpiresAt` | `DateTime?` | 7-day expiry |

`User` is the **single source of truth** for both role and permissions. There is no separate role-assignment or permissions table.

---

### 2.2 Staff Entity
**File:** `src/core/GymManager.Domain/Entities/Staff.cs`

```csharp
public sealed class Staff : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid GymHouseId { get; set; }
    public StaffType StaffType { get; set; }
    public decimal BaseSalary { get; set; }
    public decimal PerClassBonus { get; set; }
    public DateTime HiredAt { get; set; }
    public User User { get; set; } = null!;
    public GymHouse GymHouse { get; set; } = null!;
    public List<ShiftAssignment> ShiftAssignments { get; set; } = [];
}
```

`Staff` is an HR record linking a `User` to a `GymHouse`. It does **not** carry role or permission data itself — those remain on `User`.

---

## 3. Backend — Application Layer

### 3.1 IPermissionChecker Interface
**File:** `src/core/GymManager.Application/Common/Interfaces/IPermissionChecker.cs`

```csharp
public interface IPermissionChecker
{
    bool HasPermission(Guid userId, Guid tenantId, Permission required);
    Task<bool> HasPermissionAsync(Guid userId, Guid tenantId, Permission required, CancellationToken ct = default);
}
```

The single authorisation boundary used by all command handlers. Controllers never do permission checks.

---

### 3.2 ICurrentUser Interface
**File:** `src/core/GymManager.Application/Common/Interfaces/ICurrentUser.cs`

```csharp
public interface ICurrentUser
{
    Guid UserId { get; }
    Guid TenantId { get; }  // NOTE: currently equals UserId for Owner role
    string Email { get; }
    Permission Permissions { get; }
    bool IsAuthenticated { get; }
}
```

Notable gap: `Role` is not exposed on `ICurrentUser`. Permission checks are purely bitmask-based at the application layer.

---

### 3.3 ITokenService
**File:** `src/core/GymManager.Application/Common/Interfaces/ITokenService.cs`

```csharp
public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
```

---

### 3.4 Auth Handlers (Command Handlers)

#### Register
**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommandHandler.cs`

- All new registrations are created as `Role.Owner` with `Permission.Admin`.
- No invitation or multi-role registration flow exists yet.

#### Login
**File:** `src/core/GymManager.Application/Auth/Login/LoginCommandHandler.cs`

- Generates access token from `user.Role` and `user.Permissions` directly.
- Access token expires in **15 minutes**; refresh token in **7 days**.

#### RefreshToken
**File:** `src/core/GymManager.Application/Auth/RefreshToken/RefreshTokenCommandHandler.cs`

- Validates expired access token, verifies refresh token against DB.
- Regenerates both tokens from the **current** `User` record, so any role/permission changes are naturally picked up on the next refresh.

---

### 3.5 Staff Command Handlers (Permission Enforcement Example)

#### CreateStaffCommandHandler
**File:** `src/core/GymManager.Application/Staff/CreateStaff/CreateStaffCommandHandler.cs`

Checks `Permission.ManageStaff` before creating. Publishes `StaffCreatedEvent` after success.

#### UpdateStaffCommandHandler
**File:** `src/core/GymManager.Application/Staff/UpdateStaff/UpdateStaffCommandHandler.cs`

Checks `Permission.ManageStaff` before updating. No `PermissionsChangedEvent` is raised here — role/permission changes must be done via a dedicated command (not yet implemented as a standalone slice).

---

## 4. Backend — Infrastructure Layer

### 4.1 PermissionChecker Implementation
**File:** `src/core/GymManager.Infrastructure/Auth/PermissionChecker.cs`

```csharp
public sealed class PermissionChecker(ICurrentUser currentUser) : IPermissionChecker
{
    public bool HasPermission(Guid userId, Guid tenantId, Permission required) =>
        (currentUser.Permissions & required) == required;

    public Task<bool> HasPermissionAsync(...) =>
        Task.FromResult((currentUser.Permissions & required) == required);
}
```

**Key observation:** `userId` and `tenantId` parameters are accepted but currently **ignored** — the check reads `ICurrentUser.Permissions` directly from the JWT claim. There is no DB lookup per check; all permissions are embedded in the token.

---

### 4.2 CurrentUser Implementation (JWT Claim Reader)
**File:** `src/core/GymManager.Infrastructure/Auth/CurrentUser.cs`

Claims used from JWT:

| Claim | Maps to |
|---|---|
| `ClaimTypes.NameIdentifier` / `sub` | `UserId` |
| `ClaimTypes.Email` | `Email` |
| `"permissions"` (custom) | `Permission` bitmask as `long` string |

`TenantId` is currently hardcoded to `UserId`. This will need revisiting for multi-tenant access where a manager oversees multiple houses.

---

### 4.3 JwtTokenService
**File:** `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs`

Claims embedded in access token:

```csharp
new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
new Claim(ClaimTypes.Email, user.Email),
new Claim("role", user.Role.ToString()),          // string e.g. "Owner"
new Claim("permissions", ((long)user.Permissions).ToString()) // bigint as decimal string
```

- Token lifetime: **15 minutes**.
- Algorithm: HMAC-SHA256.
- No `tenant_id` claim is embedded (the `NotificationHub.OnConnectedAsync` tries to read `"tenant_id"` but it will always be null with the current token shape — a latent bug).

---

### 4.4 RoleSeedData (Default Permissions per Role)
**File:** `src/core/GymManager.Infrastructure/Persistence/Seeding/RoleSeedData.cs`

Default permission sets assigned when a user is assigned a role:

| Role | Notable Permissions |
|---|---|
| Owner | `Admin` (~0L — all bits) |
| HouseManager | Everything except `ManageFinance`, `ApprovePayroll`, `ManageWaitlist` |
| Trainer | View-only: Members, Subscriptions, Classes, Bookings, Schedule, Announcements + ManageBookings |
| Staff | View+Manage: Members, Subscriptions, Payments, Bookings; View: Classes, Schedule, Announcements |
| Member | View-only: Members, Subscriptions, Classes, Bookings, Schedule, Announcements |

This is a static helper; it is **not automatically invoked** anywhere in the application code visible in this scan — integration point is not yet wired.

---

### 4.5 EF Configuration for User (role + permissions columns)
**File:** `src/core/GymManager.Infrastructure/Persistence/Configurations/UserConfiguration.cs`

```csharp
builder.Property(u => u.Role).HasColumnName("role").IsRequired();
builder.Property(u => u.Permissions).HasColumnName("permissions").HasColumnType("bigint").IsRequired();
```

---

## 5. Backend — Database / Migration

### 5.1 InitialCreate Migration
**File:** `src/core/GymManager.Infrastructure/Persistence/Migrations/20260317161055_InitialCreate.cs`

`users` table schema (role/permission relevant columns):

```sql
role        INTEGER  NOT NULL,
permissions BIGINT   NOT NULL,
```

No separate `roles` table, `role_assignments` table, or `role_permissions` table — the schema is flat: role+permissions live directly on the `users` row.

---

## 6. Backend — API Layer

### 6.1 AuthController
**File:** `src/apps/GymManager.Api/Controllers/AuthController.cs`

Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`.
Rate-limited with `RateLimitPolicies.Auth` (10/min). No role-assignment endpoint exists yet.

### 6.2 StaffController
**File:** `src/apps/GymManager.Api/Controllers/StaffController.cs`

Manages HR records. Does **not** set user roles or permissions — those changes require a separate, not-yet-implemented command/controller.

### 6.3 NotificationHub (SignalR)
**File:** `src/apps/GymManager.Api/Hubs/NotificationHub.cs`

On connect, adds the connection to:
- `tenant:{tenantId}` group — reads `"tenant_id"` claim (currently missing from JWT, latent bug)
- `user:{userId}` group — reads `NameIdentifier` or `sub` claim (works correctly)

### 6.4 PermissionsChangedSignalRHandler
**File:** `src/apps/GymManager.Api/EventHandlers/PermissionsChangedSignalRHandler.cs`

Handles `PermissionsChangedEvent` (MediatR `INotificationHandler`). Pushes payload to `user:{UserId}` group with method name `"PermissionsChanged"`.

---

## 7. Frontend — Auth Store

### 7.1 auth-store.ts (Zustand)
**File:** `src/apps/gymmanager-web/src/stores/auth-store.ts`

State shape:

```ts
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  role: RoleType | null;       // extracted from JWT "role" claim
  permissions: bigint;         // extracted from JWT "permissions" claim
  login(response: AuthResponse): void;
  logout(): void;
  updateFromToken(token: string): void;  // called by SignalR sync
}
```

Persistence strategy:
- Persisted to `localStorage` via `zustand/middleware persist`.
- `bigint` is serialised as a decimal string for JSON compatibility.
- On rehydration it is parsed back to `bigint`.

Cookie side-effects on login/logout:
- `is_authenticated=1` — used by Next.js middleware (Edge runtime, no Zustand access).
- `user_role=<RoleType>` — used by middleware for route guards.

---

## 8. Frontend — JWT Decoding

### 8.1 jwt.ts
**File:** `src/apps/gymmanager-web/src/lib/jwt.ts`

```ts
export function decodePermissionClaims(token: string): JwtPermissionClaims | null
// Returns { role: string, permissions: string } or null
// Uses jose decodeJwt (no signature verification — UX only)
```

---

## 9. Frontend — Permission & Role Logic

### 9.1 permissions.ts
**File:** `src/apps/gymmanager-web/src/lib/permissions.ts`

Bitfield constants mirror `Permission.cs` exactly (BigInt). Helper functions:

```ts
hasPermission(userPermissions: bigint, required: bigint): boolean
hasAnyPermission(userPermissions: bigint, ...required: bigint[]): boolean
```

### 9.2 roles.ts
**File:** `src/apps/gymmanager-web/src/lib/roles.ts`

```ts
export const Role = { Owner, HouseManager, Trainer, Staff, Member } as const;
export type RoleType = ...;
```

Mirrors `Role.cs` exactly.

---

## 10. Frontend — Hooks

### 10.1 use-permissions.ts
**File:** `src/apps/gymmanager-web/src/hooks/use-permissions.ts`

| Hook | Returns |
|---|---|
| `usePermissions()` | `bigint` bitmask from store |
| `useCanDo(permission)` | `boolean` — single permission check |
| `useRole()` | `RoleType \| null` |
| `useHasRole(...roles)` | `boolean` — role membership check |

### 10.2 use-permission-sync.ts
**File:** `src/apps/gymmanager-web/src/hooks/use-permission-sync.ts`

Listens to SignalR `"PermissionsChanged"` event. On receipt:
1. Calls `POST /auth/refresh` with current tokens.
2. Calls `useAuthStore.getState().updateFromToken(newAccessToken)`.

Fallback: If SignalR is unavailable, permissions update on the regular 15-minute token expiry cycle.

### 10.3 use-mounted.ts
**File:** `src/apps/gymmanager-web/src/hooks/use-mounted.ts`

Returns `false` during SSR/hydration, `true` after client mount. Used to prevent hydration mismatches when rendering permission-gated content.

---

## 11. Frontend — Gate Components

### 11.1 PermissionGate
**File:** `src/apps/gymmanager-web/src/components/permission-gate.tsx`

```tsx
<PermissionGate permission={Permission.ManageStaff} fallback={<p>No access</p>}>
  <StaffTable />
</PermissionGate>
```

UX-only gate using `useCanDo`. Backend enforces security.

### 11.2 RoleGate
**File:** `src/apps/gymmanager-web/src/components/role-gate.tsx`

```tsx
<RoleGate roles={["Owner", "HouseManager"]}>
  <AdminPanel />
</RoleGate>
```

UX-only gate using `useHasRole`.

### 11.3 PermissionSyncProvider
**File:** `src/apps/gymmanager-web/src/components/permission-sync-provider.tsx`

Thin wrapper that activates `usePermissionSync()`. Placed in the dashboard layout, so real-time sync is active on all dashboard pages.

### 11.4 permission-skeleton.tsx
**File:** `src/apps/gymmanager-web/src/components/permission-skeleton.tsx`

Loading skeleton component used while permission state hydrates from localStorage.

---

## 12. Frontend — Route Guards

### 12.1 route-access.ts
**File:** `src/apps/gymmanager-web/src/lib/route-access.ts`

Single source of truth for route-to-role mapping. Fail-open for unknown routes (UX only).

Key access rules:

| Route | Allowed Roles |
|---|---|
| `/finance/pnl` | Owner, HouseManager |
| `/finance/transactions` | Owner, HouseManager, Staff |
| `/staff`, `/shifts`, `/payroll` | Owner, HouseManager |
| `/check-in`, `/gym-houses` | Owner, HouseManager, Trainer, Staff |
| `/members`, `/bookings`, `/class-schedules` | All roles |
| `/announcements`, `/` | All roles |

### 12.2 middleware.ts
**File:** `src/apps/gymmanager-web/src/middleware.ts`

Edge middleware logic:
1. Public paths bypass all guards: `/login`, `/register`, `/403`.
2. Unauthenticated users redirected to `/login` (checks `is_authenticated` cookie).
3. Authenticated users on public paths redirected to `/` (except `/403`).
4. Role guard: reads `user_role` cookie, calls `canAccessRoute()`, redirects to `/403` on mismatch.

---

## 13. Frontend — Sidebar Navigation
**File:** `src/apps/gymmanager-web/src/components/sidebar.tsx`

Navigation entries are filtered client-side using `useRole()`. Each `NavItem` and `NavGroup` declares `allowedRoles`. Groups with no visible children are hidden entirely.

---

## 14. Frontend — 403 Page
**File:** `src/apps/gymmanager-web/src/app/403/page.tsx`

Static page shown on role-guard redirect. Link back to dashboard (`/`).

---

## 15. Frontend — Dashboard Layout
**File:** `src/apps/gymmanager-web/src/app/(dashboard)/layout.tsx`

Wraps all dashboard content in `<PermissionSyncProvider>`, activating SignalR permission sync for the entire dashboard.

---

## 16. Test Fakes

### FakePermissionChecker
**File:** `tests/GymManager.Tests.Common/Fakes/FakePermissionChecker.cs`

Constructor arg `bool allow = true` controls whether all checks pass or fail. No per-permission granularity.

### FakeCurrentUser
**File:** `tests/GymManager.Tests.Common/Fakes/FakeCurrentUser.cs`

Mutable properties. Defaults: `Permission.Admin`, `IsAuthenticated = true`.

---

## 17. Key Patterns & Cross-Cutting Observations

### Auth Flow (end-to-end)

```
Register → User created with Role.Owner + Permission.Admin
Login    → JWT minted with "role" + "permissions" claims (15-min lifetime)
           → Frontend decodes JWT → stores role + permissions bigint in Zustand
           → Cookies set: is_authenticated=1, user_role=<role>
Refresh  → New JWT generated from current User row (picks up any DB changes)
           → Zustand updateFromToken() called
           → SignalR PermissionsChanged event can trigger early refresh
```

### JWT Claims Shape
```json
{
  "sub": "<userId UUID>",
  "email": "user@example.com",
  "role": "Owner",
  "permissions": "4611686018427387903"
}
```

Note: No `tenant_id` claim — this is a latent gap (SignalR hub reads it; it will never resolve).

### TenantId == UserId (Current Design Constraint)
`CurrentUser.TenantId` is hardcoded to `UserId`. This means multi-tenant permission checks (e.g., a HouseManager overseeing multiple gym houses) are not currently enforced at the infrastructure layer — the `tenantId` parameter in `IPermissionChecker.HasPermissionAsync` is ignored.

### No Role-Assignment Endpoint
There is no API endpoint or application command for changing a user's role or permissions. `RoleSeedData.GetDefaultPermissions()` exists but is not wired into any command handler visible in this scan.

### PermissionsChanged Event — Not Yet Published
`PermissionsChangedEvent` and its SignalR handler (`PermissionsChangedSignalRHandler`) are in place, but no command handler in the current codebase publishes this event. The real-time sync pathway is wired but dormant.

---

## 18. File Index (All Relevant Files)

### Backend
| File | Purpose |
|---|---|
| `src/core/GymManager.Domain/Enums/Permission.cs` | Bitfield enum — 26 flags |
| `src/core/GymManager.Domain/Enums/Role.cs` | 5-value role enum |
| `src/core/GymManager.Domain/Enums/StaffType.cs` | HR job-type enum (separate from Role) |
| `src/core/GymManager.Domain/Entities/User.cs` | Role + Permissions stored on user |
| `src/core/GymManager.Domain/Entities/Staff.cs` | HR entity linking User to GymHouse |
| `src/core/GymManager.Domain/Events/PermissionsChangedEvent.cs` | Domain event for role/perm changes |
| `src/core/GymManager.Application/Common/Interfaces/IPermissionChecker.cs` | Permission check contract |
| `src/core/GymManager.Application/Common/Interfaces/ICurrentUser.cs` | Current user context contract |
| `src/core/GymManager.Application/Common/Interfaces/ITokenService.cs` | JWT generation contract |
| `src/core/GymManager.Application/Common/Interfaces/INotificationHub.cs` | SignalR push contract |
| `src/core/GymManager.Application/Auth/Login/LoginCommandHandler.cs` | Login, issues JWT |
| `src/core/GymManager.Application/Auth/Register/RegisterCommandHandler.cs` | Register as Owner+Admin |
| `src/core/GymManager.Application/Auth/RefreshToken/RefreshTokenCommandHandler.cs` | Token refresh |
| `src/core/GymManager.Application/Staff/CreateStaff/CreateStaffCommandHandler.cs` | Permission check example |
| `src/core/GymManager.Application/Staff/UpdateStaff/UpdateStaffCommandHandler.cs` | Permission check example |
| `src/core/GymManager.Infrastructure/Auth/PermissionChecker.cs` | Bitmask check from JWT claim |
| `src/core/GymManager.Infrastructure/Auth/CurrentUser.cs` | Reads claims from HttpContext |
| `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs` | Mints JWT with role+permissions |
| `src/core/GymManager.Infrastructure/Persistence/Configurations/UserConfiguration.cs` | EF column mapping |
| `src/core/GymManager.Infrastructure/Persistence/Seeding/RoleSeedData.cs` | Default permissions per role |
| `src/core/GymManager.Infrastructure/Persistence/Migrations/20260317161055_InitialCreate.cs` | role+permissions columns |
| `src/apps/GymManager.Api/Controllers/AuthController.cs` | Auth endpoints |
| `src/apps/GymManager.Api/Controllers/StaffController.cs` | Staff CRUD (uses ManageStaff perm) |
| `src/apps/GymManager.Api/Hubs/NotificationHub.cs` | SignalR hub (user group join) |
| `src/apps/GymManager.Api/EventHandlers/PermissionsChangedSignalRHandler.cs` | Pushes perm changes via SignalR |
| `tests/GymManager.Tests.Common/Fakes/FakePermissionChecker.cs` | Test double |
| `tests/GymManager.Tests.Common/Fakes/FakeCurrentUser.cs` | Test double |
| `tests/GymManager.Api.Tests/EventHandlers/PermissionsChangedSignalRHandlerTests.cs` | Tests for SignalR handler |

### Frontend
| File | Purpose |
|---|---|
| `src/apps/gymmanager-web/src/lib/permissions.ts` | BigInt bitfield constants + helpers |
| `src/apps/gymmanager-web/src/lib/roles.ts` | Role constants + RoleType |
| `src/apps/gymmanager-web/src/lib/route-access.ts` | Route-to-role access map |
| `src/apps/gymmanager-web/src/lib/jwt.ts` | JWT decode (no verification) |
| `src/apps/gymmanager-web/src/middleware.ts` | Edge route guard |
| `src/apps/gymmanager-web/src/stores/auth-store.ts` | Zustand store (role + permissions) |
| `src/apps/gymmanager-web/src/hooks/use-permissions.ts` | useCanDo, useHasRole, useRole |
| `src/apps/gymmanager-web/src/hooks/use-permission-sync.ts` | SignalR perm sync hook |
| `src/apps/gymmanager-web/src/hooks/use-mounted.ts` | SSR hydration guard |
| `src/apps/gymmanager-web/src/components/permission-gate.tsx` | Permission-based render gate |
| `src/apps/gymmanager-web/src/components/role-gate.tsx` | Role-based render gate |
| `src/apps/gymmanager-web/src/components/permission-sync-provider.tsx` | Activates SignalR sync |
| `src/apps/gymmanager-web/src/components/permission-skeleton.tsx` | Loading skeleton for gated UI |
| `src/apps/gymmanager-web/src/components/sidebar.tsx` | Role-filtered navigation |
| `src/apps/gymmanager-web/src/app/(dashboard)/layout.tsx` | Dashboard layout (mounts sync provider) |
| `src/apps/gymmanager-web/src/app/403/page.tsx` | Forbidden page |
| `src/apps/gymmanager-web/src/__tests__/components/permission-gate.test.tsx` | Gate tests |
| `src/apps/gymmanager-web/src/__tests__/components/role-gate.test.tsx` | Gate tests |
| `src/apps/gymmanager-web/src/__tests__/components/permission-skeleton.test.tsx` | Skeleton tests |
| `src/apps/gymmanager-web/src/__tests__/components/sidebar-permissions.test.tsx` | Sidebar filter tests |
| `src/apps/gymmanager-web/src/__tests__/hooks/use-permissions.test.ts` | Hook tests |
| `src/apps/gymmanager-web/src/__tests__/hooks/use-permission-sync.test.ts` | Sync hook tests |
| `src/apps/gymmanager-web/src/__tests__/stores/auth-store-permissions.test.ts` | Store tests |
