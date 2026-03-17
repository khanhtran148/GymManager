# Plan: Fullstack Role & Permission Management

**Date:** 2026-03-18
**ADR:** [260318-fullstack-role-permission-management](../../adrs/260318-fullstack-role-permission-management.md)
**Contract:** [api-contract-260318-1600](api-contract-260318-1600.md)
**Timeline:** 8 working days (4 phases)

## Summary

Replace static permission system with Owner-managed DB-driven RBAC. Add `role_permissions` table, 5 CQRS endpoints, management UI, and SignalR real-time propagation. Keep bitmask in JWT for zero-change on existing permission checks.

## Architecture Decisions

- **Storage:** `role_permissions` table with composite PK `(tenant_id, role)`, bitmask column
- **JWT:** Compile permissions from `role_permissions` at token issuance (not from `users.permissions`)
- **Frontend:** Decode from JWT (unchanged). SignalR triggers token refresh on permission changes.
- **Migration:** Additive. `users.permissions` kept but deprecated for writes.
- **Owner protection:** Owner always gets `Permission.Admin` (~0L). Cannot be demoted or have permissions reduced.
- **Cache:** In-memory cache for `role_permissions` lookups during token issuance (5-min TTL)

---

## Phase 1: Data Model, Migration & Repository (Day 1-2)

**Goal:** Create `RolePermission` entity, EF Core configuration, migration, seed data, and repository. All behind TFD.

### FILE OWNERSHIP (Backend)
- `src/core/GymManager.Domain/Entities/RolePermission.cs` -- NEW
- `src/core/GymManager.Infrastructure/Persistence/Configurations/RolePermissionConfiguration.cs` -- NEW
- `src/core/GymManager.Infrastructure/Persistence/GymManagerDbContext.cs` -- MODIFY (add DbSet)
- `src/core/GymManager.Infrastructure/Persistence/Seeding/RoleSeedData.cs` -- MODIFY (add seed method for role_permissions)
- `src/core/GymManager.Application/Common/Interfaces/IRolePermissionRepository.cs` -- NEW
- `src/core/GymManager.Infrastructure/Persistence/Repositories/RolePermissionRepository.cs` -- NEW
- `tests/GymManager.Infrastructure.Tests/Persistence/RolePermissionRepositoryTests.cs` -- NEW
- Migration file (auto-generated)

### Tasks

#### 1.1 Create RolePermission entity
**File:** `src/core/GymManager.Domain/Entities/RolePermission.cs`

```csharp
public sealed class RolePermission
{
    public Guid TenantId { get; set; }
    public Role Role { get; set; }
    public Permission Permissions { get; set; }
}
```

No `AuditableEntity` inheritance -- this is a lookup/configuration table, not an auditable resource.

#### 1.2 Create EF Core configuration
**File:** `src/core/GymManager.Infrastructure/Persistence/Configurations/RolePermissionConfiguration.cs`

- Table name: `role_permissions`
- Composite PK: `(tenant_id, role)`
- `permissions` column: `bigint`, required
- No soft delete (no `deleted_at`)
- Follow existing pattern from `UserConfiguration.cs`

#### 1.3 Add DbSet to GymManagerDbContext
**File:** `src/core/GymManager.Infrastructure/Persistence/GymManagerDbContext.cs`

Add: `public DbSet<RolePermission> RolePermissions => Set<RolePermission>();`

#### 1.4 Create and run migration
```bash
dotnet ef migrations add AddRolePermissionsTable -p src/core/GymManager.Infrastructure -s src/apps/GymManager.Api
```

#### 1.5 Extend RoleSeedData for bulk seeding
**File:** `src/core/GymManager.Infrastructure/Persistence/Seeding/RoleSeedData.cs`

Add method:
```csharp
public static List<RolePermission> GetDefaultRolePermissions(Guid tenantId)
```

Returns 5 `RolePermission` rows (one per role) using existing `GetDefaultPermissions()`.

#### 1.6 Create IRolePermissionRepository
**File:** `src/core/GymManager.Application/Common/Interfaces/IRolePermissionRepository.cs`

```csharp
public interface IRolePermissionRepository
{
    Task<List<RolePermission>> GetByTenantAsync(Guid tenantId, CancellationToken ct = default);
    Task<RolePermission?> GetByTenantAndRoleAsync(Guid tenantId, Role role, CancellationToken ct = default);
    Task UpsertAsync(RolePermission rolePermission, CancellationToken ct = default);
    Task UpsertRangeAsync(IEnumerable<RolePermission> rolePermissions, CancellationToken ct = default);
    Task<bool> ExistsForTenantAsync(Guid tenantId, CancellationToken ct = default);
}
```

#### 1.7 Implement RolePermissionRepository
**File:** `src/core/GymManager.Infrastructure/Persistence/Repositories/RolePermissionRepository.cs`

Standard EF Core implementation. `UpsertAsync` uses `ExecuteUpdateAsync` or add-if-not-exists pattern.

#### 1.8 Register in DI
**File:** `src/core/GymManager.Infrastructure/DependencyInjection.cs`

Add `IRolePermissionRepository` -> `RolePermissionRepository` registration.

#### 1.9 Write integration tests (TFD -- write FIRST)
**File:** `tests/GymManager.Infrastructure.Tests/Persistence/RolePermissionRepositoryTests.cs`

Tests:
- `GetByTenantAsync_ReturnsAllRolesForTenant`
- `GetByTenantAndRoleAsync_ReturnsCorrectRole`
- `GetByTenantAndRoleAsync_ReturnsNull_WhenNotFound`
- `UpsertAsync_InsertsNewRecord`
- `UpsertAsync_UpdatesExistingRecord`
- `UpsertRangeAsync_SeedsAllRoles`
- `ExistsForTenantAsync_ReturnsFalse_WhenNoData`
- `ExistsForTenantAsync_ReturnsTrue_WhenSeeded`

### Definition of Done
- [ ] Migration runs clean on fresh DB
- [ ] All 8 repository tests pass
- [ ] `RoleSeedData.GetDefaultRolePermissions()` returns 5 rows with correct bitmasks
- [ ] No changes to existing User entity or its tests

---

## Phase 2: Backend API -- Role-Permission & User-Role Management (Day 2-4)

**Goal:** Implement 5 CQRS endpoints behind Owner permission checks. Modify `JwtTokenService` to compile permissions from `role_permissions` table. Publish `PermissionsChangedEvent` on mutations.

**Depends on:** Phase 1

### FILE OWNERSHIP (Backend)
- `src/core/GymManager.Application/Roles/GetRolePermissions/` -- NEW (query + handler + DTO)
- `src/core/GymManager.Application/Roles/UpdateRolePermissions/` -- NEW (command + handler + validator)
- `src/core/GymManager.Application/Roles/ResetDefaultPermissions/` -- NEW (command + handler)
- `src/core/GymManager.Application/Roles/GetRoleUsers/` -- NEW (query + handler + DTO)
- `src/core/GymManager.Application/Roles/ChangeUserRole/` -- NEW (command + handler + validator)
- `src/core/GymManager.Application/Roles/Shared/` -- NEW (DTOs)
- `src/apps/GymManager.Api/Controllers/RolesController.cs` -- NEW
- `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs` -- MODIFY
- `src/core/GymManager.Application/Common/Interfaces/ITokenService.cs` -- MODIFY (add overload or change signature)
- `src/core/GymManager.Application/Auth/RefreshToken/RefreshTokenCommandHandler.cs` -- MODIFY (use new token generation)
- `tests/GymManager.Application.Tests/Roles/` -- NEW (all handler tests)
- `tests/GymManager.Api.Tests/Controllers/RolesControllerTests.cs` -- NEW

### Tasks

#### 2.1 Shared DTOs
**File:** `src/core/GymManager.Application/Roles/Shared/RolePermissionDto.cs`
**File:** `src/core/GymManager.Application/Roles/Shared/RoleUserDto.cs`

Per API contract.

#### 2.2 GetRolePermissions query
**Files:**
- `src/core/GymManager.Application/Roles/GetRolePermissions/GetRolePermissionsQuery.cs`
- `src/core/GymManager.Application/Roles/GetRolePermissions/GetRolePermissionsQueryHandler.cs`

Handler flow:
1. Permission check: `currentUser.Role == Role.Owner` (or `Permission.Admin`)
2. Get tenant ID from `currentUser.TenantId`
3. If no `role_permissions` rows exist for tenant, seed defaults (lazy initialization)
4. Return all 5 role-permission mappings as DTOs
5. Include `permissionNames` by iterating `Permission` enum flags

#### 2.3 UpdateRolePermissions command
**Files:**
- `src/core/GymManager.Application/Roles/UpdateRolePermissions/UpdateRolePermissionsCommand.cs`
- `src/core/GymManager.Application/Roles/UpdateRolePermissions/UpdateRolePermissionsCommandHandler.cs`
- `src/core/GymManager.Application/Roles/UpdateRolePermissions/UpdateRolePermissionsCommandValidator.cs`

Handler flow:
1. Permission check: Owner only
2. Reject if `role == Role.Owner` (Owner always has Admin)
3. Parse permissions string to `long`, validate it represents valid Permission flags
4. Upsert `role_permissions` row
5. Query all users with the affected role in this tenant
6. Publish `PermissionsChangedEvent` for each affected user
7. Return `Result.Success()`

Validator: role must be valid enum value (not Owner), permissions must be parseable as long.

#### 2.4 ResetDefaultPermissions command
**Files:**
- `src/core/GymManager.Application/Roles/ResetDefaultPermissions/ResetDefaultPermissionsCommand.cs`
- `src/core/GymManager.Application/Roles/ResetDefaultPermissions/ResetDefaultPermissionsCommandHandler.cs`

Handler flow:
1. Permission check: Owner only
2. Generate defaults via `RoleSeedData.GetDefaultRolePermissions(tenantId)`
3. Upsert all 5 rows
4. Publish `PermissionsChangedEvent` for all non-Owner users in tenant
5. Return `Result.Success()`

#### 2.5 GetRoleUsers query
**Files:**
- `src/core/GymManager.Application/Roles/GetRoleUsers/GetRoleUsersQuery.cs`
- `src/core/GymManager.Application/Roles/GetRoleUsers/GetRoleUsersQueryHandler.cs`

Handler flow:
1. Permission check: Owner only
2. Use `IUserRepository.GetByRoleAndHouseAsync(role, null, ct)` for chain-wide listing
3. Map to `RoleUserDto` with pagination

#### 2.6 ChangeUserRole command
**Files:**
- `src/core/GymManager.Application/Roles/ChangeUserRole/ChangeUserRoleCommand.cs`
- `src/core/GymManager.Application/Roles/ChangeUserRole/ChangeUserRoleCommandHandler.cs`
- `src/core/GymManager.Application/Roles/ChangeUserRole/ChangeUserRoleCommandValidator.cs`

Handler flow:
1. Permission check: Owner only
2. Load user by ID
3. Reject if target user is Owner (cannot demote Owner)
4. Update `user.Role` to new role
5. Look up new role's permissions from `role_permissions` table
6. Update `user.Permissions` (keep in sync for backward compat during migration period)
7. Publish `PermissionsChangedEvent` with new role + compiled permissions
8. Return `Result.Success()`

Validator: userId required, role must be valid enum (not Owner).

#### 2.7 Modify JwtTokenService
**File:** `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs`

Change `GenerateAccessToken` to accept a `Permission` override parameter or inject `IRolePermissionRepository` to look up permissions from `role_permissions` table instead of reading `user.Permissions`.

Approach: Add `IRolePermissionRepository` as a constructor dependency. In `GenerateAccessToken`:
1. Look up `role_permissions` for the user's tenant and role
2. If found, use that permission bitmask in the JWT
3. If not found (tenant not yet seeded), fall back to `user.Permissions`
4. Owner always gets `Permission.Admin` regardless

Add in-memory cache (5-min TTL) using `IMemoryCache` to avoid DB hit on every token issuance.

**Also modify:** `ITokenService.GenerateAccessToken` signature needs `tenantId` parameter, or the service resolves it internally. Preferred: keep `User` parameter, add `IRolePermissionRepository` lookup inside the service since it already has the user's role.

**Impact:** `RefreshTokenCommandHandler` calls `tokenService.GenerateAccessToken(user)` -- no signature change needed if the service resolves tenant internally.

#### 2.8 Add ICurrentUser.Role property
**File:** `src/core/GymManager.Application/Common/Interfaces/ICurrentUser.cs` -- MODIFY
**File:** `src/core/GymManager.Infrastructure/Auth/CurrentUser.cs` -- MODIFY

Add `Role Role { get; }` property to `ICurrentUser`, parsed from the JWT `role` claim. This enables Owner checks in handlers without loading the user from DB.

#### 2.9 RolesController
**File:** `src/apps/GymManager.Api/Controllers/RolesController.cs`

```csharp
[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/roles")]
public sealed class RolesController(ISender sender) : ApiControllerBase(sender)
```

5 actions mapping to the 5 endpoints in the API contract. PUT/POST endpoints use `RateLimitPolicies.Strict`.

#### 2.10 Write tests (TFD -- write FIRST)
**Directory:** `tests/GymManager.Application.Tests/Roles/`

Handler tests (mocked repositories):
- `GetRolePermissionsQueryHandlerTests` (3 tests: success, seeds on first access, forbidden for non-Owner)
- `UpdateRolePermissionsCommandHandlerTests` (4 tests: success, rejects Owner role, forbidden, publishes events)
- `ResetDefaultPermissionsCommandHandlerTests` (3 tests: success, forbidden, publishes events for all users)
- `GetRoleUsersQueryHandlerTests` (2 tests: success with pagination, forbidden)
- `ChangeUserRoleCommandHandlerTests` (5 tests: success, rejects Owner demotion, user not found, forbidden, publishes event)

Controller tests:
- `RolesControllerTests` -- verify correct HTTP status codes and Sender.Send dispatch

JwtTokenService tests:
- `JwtTokenServiceTests` -- verify permissions compiled from role_permissions table, not user.Permissions

### Definition of Done
- [ ] All 17+ handler/controller tests pass
- [ ] GET `/api/v1/roles/permissions` returns all 5 roles with bitmasks
- [ ] PUT `/api/v1/roles/{role}/permissions` updates and publishes SignalR events
- [ ] POST `/api/v1/roles/reset-defaults` resets and publishes events
- [ ] GET `/api/v1/roles/{role}/users` returns paginated user list
- [ ] PUT `/api/v1/users/{userId}/role` changes role and publishes event
- [ ] JwtTokenService reads from `role_permissions` table (cached)
- [ ] Owner always gets Admin permissions regardless of table state
- [ ] Non-Owner callers receive 403 on all endpoints

---

## Phase 3: Frontend -- Permission Management UI (Day 5-7)

PARALLEL: yes (with Phase 2 backend, using contract mocks)

**Goal:** Build Owner-only settings pages for permission toggles and user-role assignment. Wire TanStack Query hooks.

**Depends on:** API Contract (Phase 2 can run in parallel using MSW mocks)

### FILE OWNERSHIP (Frontend)
- `src/apps/gymmanager-web/src/app/(dashboard)/settings/roles/page.tsx` -- NEW
- `src/apps/gymmanager-web/src/app/(dashboard)/settings/roles/users/page.tsx` -- NEW
- `src/apps/gymmanager-web/src/app/(dashboard)/settings/layout.tsx` -- NEW (optional)
- `src/apps/gymmanager-web/src/components/permission-toggle-grid.tsx` -- NEW
- `src/apps/gymmanager-web/src/components/role-user-table.tsx` -- NEW
- `src/apps/gymmanager-web/src/components/change-role-dialog.tsx` -- NEW
- `src/apps/gymmanager-web/src/components/reset-defaults-dialog.tsx` -- NEW
- `src/apps/gymmanager-web/src/hooks/use-role-permissions.ts` -- NEW (TanStack Query)
- `src/apps/gymmanager-web/src/hooks/use-role-users.ts` -- NEW (TanStack Query)
- `src/apps/gymmanager-web/src/lib/route-access.ts` -- MODIFY (add /settings/roles routes)
- `src/apps/gymmanager-web/src/components/sidebar.tsx` -- MODIFY (add Settings nav group)
- `src/apps/gymmanager-web/src/__tests__/pages/settings-roles.test.tsx` -- NEW
- `src/apps/gymmanager-web/src/__tests__/pages/settings-roles-users.test.tsx` -- NEW

### Tasks

#### 3.1 TanStack Query hooks
**File:** `src/apps/gymmanager-web/src/hooks/use-role-permissions.ts`

- `useRolePermissions()` -- GET `/roles/permissions`, returns `RolePermissionDto[]`
- `useUpdateRolePermissions()` -- PUT mutation, invalidates query on success
- `useResetDefaultPermissions()` -- POST mutation, invalidates query on success

**File:** `src/apps/gymmanager-web/src/hooks/use-role-users.ts`

- `useRoleUsers(role, page, pageSize)` -- GET `/roles/{role}/users`
- `useChangeUserRole()` -- PUT `/users/{userId}/role` mutation, invalidates queries

#### 3.2 Permission Toggle Grid component
**File:** `src/apps/gymmanager-web/src/components/permission-toggle-grid.tsx`

- Renders a matrix: rows = permission categories (Members, Subscriptions, Classes, etc.), columns = roles (excluding Owner)
- Each cell is a toggle switch
- Groups permissions by category (matching the comments in Permission.cs)
- Owner column shown as always-on (disabled toggles)
- On toggle: compute new bitmask, call `useUpdateRolePermissions` mutation
- Optimistic updates for snappy UX
- Toast notification on success/error

#### 3.3 Permission toggles page
**File:** `src/apps/gymmanager-web/src/app/(dashboard)/settings/roles/page.tsx`

- Page title: "Role Permissions"
- Wraps `PermissionToggleGrid`
- "Reset to Defaults" button with confirmation dialog
- Loading skeleton while fetching
- Owner-only gate (redirect to /403 if not Owner)

#### 3.4 Role User Table component
**File:** `src/apps/gymmanager-web/src/components/role-user-table.tsx`

- Tab bar to filter by role
- Table with: name, email, role, created date, actions (change role button)
- Pagination controls
- "Change Role" button opens dialog

#### 3.5 Change Role Dialog
**File:** `src/apps/gymmanager-web/src/components/change-role-dialog.tsx`

- Modal with role dropdown (exclude Owner from options)
- Confirmation text: "Change {name}'s role from {current} to {new}?"
- Warning: "This will immediately change their permissions."
- Calls `useChangeUserRole` mutation on confirm

#### 3.6 Reset Defaults Dialog
**File:** `src/apps/gymmanager-web/src/components/reset-defaults-dialog.tsx`

- Confirmation modal: "Reset all role permissions to factory defaults?"
- Warning: "This will overwrite any custom permission changes."
- Calls `useResetDefaultPermissions` mutation

#### 3.7 User-role assignment page
**File:** `src/apps/gymmanager-web/src/app/(dashboard)/settings/roles/users/page.tsx`

- Page title: "User Roles"
- Wraps `RoleUserTable`
- Owner-only gate

#### 3.8 Update route-access.ts
**File:** `src/apps/gymmanager-web/src/lib/route-access.ts`

Add entries:
```typescript
{ path: "/settings/roles", allowedRoles: ["Owner"] },
{ path: "/settings", allowedRoles: ["Owner"] },
```

#### 3.9 Update sidebar
**File:** `src/apps/gymmanager-web/src/components/sidebar.tsx`

Add "Settings" nav group (Owner-only) with children:
- "Role Permissions" -> `/settings/roles`
- "User Roles" -> `/settings/roles/users`

Use `Settings` icon from lucide-react.

#### 3.10 Write frontend tests
**File:** `src/apps/gymmanager-web/src/__tests__/pages/settings-roles.test.tsx`

Tests:
- Renders permission grid with all roles and permissions
- Toggle updates the correct permission bit
- Reset defaults shows confirmation dialog
- Non-Owner users see 403 redirect

**File:** `src/apps/gymmanager-web/src/__tests__/pages/settings-roles-users.test.tsx`

Tests:
- Renders user table with role tabs
- Change role dialog opens and submits
- Pagination works

### Definition of Done
- [ ] `/settings/roles` renders permission toggle grid
- [ ] Toggling a permission calls PUT and updates UI optimistically
- [ ] "Reset to Defaults" works with confirmation
- [ ] `/settings/roles/users` lists users by role with pagination
- [ ] "Change Role" dialog changes role and shows toast
- [ ] Non-Owner users redirected to /403
- [ ] Settings link visible in sidebar only for Owner
- [ ] All frontend tests pass

---

## Phase 4: Integration, SignalR Wiring & Cleanup (Day 7-8)

**Goal:** Wire real-time permission propagation end-to-end. Seed existing tenants. Verify full flow.

**Depends on:** Phase 2 + Phase 3

### FILE OWNERSHIP
- `src/core/GymManager.Infrastructure/Persistence/Seeding/RoleSeedData.cs` -- MODIFY (add migration seeder)
- `src/core/GymManager.Application/Auth/RefreshToken/RefreshTokenCommandHandler.cs` -- VERIFY (uses updated JwtTokenService)
- `src/apps/gymmanager-web/src/hooks/use-permission-sync.ts` -- VERIFY (already wired)
- `src/apps/gymmanager-web/src/components/permission-sync-provider.tsx` -- VERIFY (already in layout)
- `tests/GymManager.Api.Tests/Integration/RolePermissionFlowTests.cs` -- NEW

### Tasks

#### 4.1 Seed existing tenants
Create a one-time data migration that seeds `role_permissions` rows for all existing tenants (users with `Role.Owner`).

Approach: EF Core migration with raw SQL or a hosted service that runs on startup:
```sql
INSERT INTO role_permissions (tenant_id, role, permissions)
SELECT u.id, r.role, r.default_permissions
FROM users u
CROSS JOIN (VALUES (0, <owner_bits>), (1, <hm_bits>), ...) AS r(role, default_permissions)
WHERE u.role = 0 AND u.deleted_at IS NULL
ON CONFLICT (tenant_id, role) DO NOTHING;
```

Preferred: Data migration in EF Core migration file for reliability and audit trail.

#### 4.2 Verify SignalR end-to-end flow
Manual + automated test:
1. Owner changes Trainer permissions via UI
2. `UpdateRolePermissionsCommandHandler` publishes `PermissionsChangedEvent` per user
3. `PermissionsChangedSignalRHandler` sends to `user:{userId}` group
4. `usePermissionSync` hook receives event, calls `/auth/refresh`
5. `RefreshTokenCommandHandler` calls `JwtTokenService.GenerateAccessToken` which reads from `role_permissions`
6. New JWT has updated permissions. Frontend auth store updates.

#### 4.3 Verify token refresh path
Confirm `RefreshTokenCommandHandler` produces tokens with DB-sourced permissions (not stale `user.Permissions`). The change in Phase 2 (JwtTokenService reading from role_permissions) handles this automatically.

#### 4.4 Integration tests
**File:** `tests/GymManager.Api.Tests/Integration/RolePermissionFlowTests.cs`

Tests (using Testcontainers):
- `Owner_CanGetRolePermissions_AfterSeed`
- `Owner_CanUpdateTrainerPermissions_AndSignalRFires`
- `Owner_CanResetDefaults`
- `Owner_CanChangeUserRole_AndNewTokenHasCorrectPermissions`
- `NonOwner_Gets403_OnAllRoleEndpoints`
- `OwnerRole_CannotBeModified`

#### 4.5 Cleanup and deprecation notes
- Add `[Obsolete("Use role_permissions table. Will be removed in v2.")]` comment on `User.Permissions` setter usage in `CreateMemberCommandHandler` and similar places
- Update `CreateMemberCommandHandler` to look up default permissions from `role_permissions` instead of hardcoding `Permission.ViewMembers | Permission.ViewSubscriptions`

### Definition of Done
- [ ] Existing tenants have `role_permissions` rows after migration
- [ ] SignalR flow works: permission change -> event -> token refresh -> UI update
- [ ] Token refresh produces JWT with DB-sourced permissions
- [ ] All 6 integration tests pass
- [ ] No regressions in existing test suite

---

## Risk Mitigations

| Risk | Mitigation | Phase |
|---|---|---|
| Seed data drift (new permissions not seeded) | `GetDefaultRolePermissions` is the single source. New permissions added there propagate to `reset-defaults`. Migration needed for existing tenants. | 1, 4 |
| Owner lockout | Owner hardcoded to `Permission.Admin` in JwtTokenService and UpdateRolePermissions rejects Owner role modification | 2 |
| Stale permissions (SignalR failure) | 15-min token TTL as fallback. Backend always enforces via `IPermissionChecker`. | 2, 4 |
| Token issuance latency | IMemoryCache with 5-min TTL on role_permissions lookups | 2 |
| TenantId mapping | Currently `TenantId == UserId` for Owner. This works for the single-owner model. Document this assumption. | 1 |
| Frontend parallel development | API contract frozen before frontend starts. MSW mocks for development. | 3 |

## Dependencies Graph

```
Phase 1 (Data Model)
    |
    v
Phase 2 (Backend API) ----parallel----> Phase 3 (Frontend UI)
    |                                        |
    v                                        v
                Phase 4 (Integration)
```

## Out of Scope

- Custom roles (fixed 5 roles)
- Per-GymHouse permission overrides
- Audit log for permission changes
- Instant token revocation (rely on 15-min TTL + SignalR refresh)
- Mobile app changes (Flutter)

## Planning Notes

**Key findings from codebase scout:**
- `PermissionsChangedEvent` and `PermissionsChangedSignalRHandler` already exist and work. Just need to publish the event.
- `usePermissionSync` hook already listens for SignalR and triggers token refresh. Already wired in `PermissionSyncProvider` in the dashboard layout.
- `JwtTokenService` currently reads `user.Permissions` directly. Needs modification to read from `role_permissions`.
- `CurrentUser` does not expose `Role` property -- needs to be added for handler-level Owner checks.
- `IUserRepository.GetByRoleAndHouseAsync` already exists, useful for `GetRoleUsers` query.
- No `tenant_id` claim in JWT currently. `TenantId` is derived from `UserId` for Owners. This is sufficient for the current single-owner-per-tenant model.
