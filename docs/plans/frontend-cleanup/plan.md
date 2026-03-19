# Plan: Remove Hardcoded Frontend Data, Replace with API-Driven Data

**Date:** 2026-03-18
**Scope:** Fullstack (backend + frontend)
**Branch:** `feat/frontend-cleanup-dynamic-rbac`

---

## Problem

The Next.js frontend duplicates role names, permission flags, permission categories, and route-access mappings as static TypeScript constants. When the backend adds a role or permission, a developer must update both sides. The middleware route guard also depends on a hardcoded map. This plan replaces all hardcoded data with API-fetched values.

---

## Key Design Decisions

1. **New backend endpoint: `GET /api/v1/roles/metadata`** -- Returns roles, permission definitions (name + bit position + category), and route-access rules. This is a single, public-after-auth endpoint that the frontend calls once on login and caches aggressively.

2. **Route access lives in the database** -- A new `RouteAccessRule` entity maps path patterns to allowed roles. Seeded with current hardcoded values. The `GET /roles/metadata` endpoint returns these rules alongside roles and permissions.

3. **Middleware uses a cookie-synced approach** -- The Next.js middleware cannot call React hooks or make async API calls. The route-access map is serialized into a `route_access` cookie (JSON, base64-encoded) when auth state updates. Middleware reads this cookie. Fallback: if cookie is missing, fail-open (current behavior for unknown routes).

4. **Frontend `lib/permissions.ts` becomes a thin utility** -- `hasPermission()` and `hasAnyPermission()` stay as pure functions. The `Permission` constant object is replaced by a dynamic map built from API data and stored in Zustand.

5. **TanStack Query with `staleTime: Infinity`** -- Roles/permissions metadata changes rarely. The query is invalidated only when the user updates permissions or changes roles.

---

## Phases

### Phase 0: API Contract (Contract Phase)

**File:** `docs/plans/frontend-cleanup/api-contract-260318-1200.md`

Define the new endpoint contract before any implementation begins.

#### New Endpoint: `GET /api/v1/roles/metadata`

```
Response 200:
{
  "roles": [
    { "name": "Owner", "value": 0, "isAssignable": false },
    { "name": "HouseManager", "value": 1, "isAssignable": true },
    ...
  ],
  "permissions": [
    { "name": "ViewMembers", "bitPosition": 0, "category": "Members" },
    { "name": "ManageMembers", "bitPosition": 1, "category": "Members" },
    ...
  ],
  "routeAccess": [
    { "path": "/settings/roles/users", "allowedRoles": ["Owner"] },
    { "path": "/settings/roles", "allowedRoles": ["Owner"] },
    ...
  ]
}
```

**Access:** Any authenticated user (no permission check -- this is UX metadata, not sensitive data). The current `GET /roles/permissions` is Owner-only; this new endpoint is intentionally less restrictive because it returns structural metadata, not tenant-specific permission assignments.

#### Modified Existing Endpoints

No changes to existing endpoints. The new endpoint supplements them.

---

### Phase 1: Backend -- New Metadata Endpoint

**PARALLEL: yes (with Phase 2 frontend scaffolding)**

**Estimated effort:** Medium

**File ownership (backend only):**
- `src/core/GymManager.Domain/Entities/RouteAccessRule.cs` -- NEW
- `src/core/GymManager.Domain/Enums/PermissionCategory.cs` -- NEW (optional, can derive from convention)
- `src/core/GymManager.Application/Roles/GetRolesMetadata/` -- NEW slice folder
  - `GetRolesMetadataQuery.cs`
  - `GetRolesMetadataQueryHandler.cs`
  - `RolesMetadataDto.cs`
- `src/core/GymManager.Infrastructure/Persistence/Configurations/RouteAccessRuleConfiguration.cs` -- NEW
- `src/core/GymManager.Infrastructure/Persistence/Migrations/` -- NEW migration for `route_access_rules` table
- `src/core/GymManager.Infrastructure/Persistence/Seeding/RouteAccessSeedData.cs` -- NEW
- `src/apps/GymManager.Api/Controllers/RolesController.cs` -- ADD new action
- `tests/GymManager.Application.Tests/Roles/GetRolesMetadata/` -- NEW

#### Tasks

1. **Write tests first** for `GetRolesMetadataQueryHandler`:
   - Returns all 5 roles with correct `isAssignable` flag (Owner = false)
   - Returns all 26 permission definitions with name, bitPosition, category
   - Returns route access rules from DB
   - Works for any authenticated user (no Owner-only check)

2. **Create `RouteAccessRule` entity:**
   ```csharp
   public sealed class RouteAccessRule
   {
       public Guid Id { get; set; }
       public string Path { get; set; } = string.Empty;
       public List<Role> AllowedRoles { get; set; } = [];
       public int SortOrder { get; set; } // most-specific first
   }
   ```
   This is a global (not tenant-scoped) table since route structure is application-wide.

3. **Create DTOs:**
   - `RoleDefinitionDto(string Name, int Value, bool IsAssignable)`
   - `PermissionDefinitionDto(string Name, int BitPosition, string Category)`
   - `RouteAccessDto(string Path, List<string> AllowedRoles)`
   - `RolesMetadataDto(List<RoleDefinitionDto> Roles, List<PermissionDefinitionDto> Permissions, List<RouteAccessDto> RouteAccess)`

4. **Create handler** that:
   - Builds role list from `Enum.GetValues<Role>()`
   - Builds permission list from `Enum.GetValues<Permission>()` (skip None/Admin), deriving category from naming convention (e.g., `ViewMembers` -> `Members`) or a static map
   - Reads route access rules from DB (or falls back to seed data)

5. **Create EF migration** for `route_access_rules` table.

6. **Seed route access data** matching the current `routeAccessMap` in `route-access.ts`.

7. **Add controller action** `GetMetadata()` on `RolesController`.

---

### Phase 2: Frontend -- API Hook and Zustand Store

**PARALLEL: yes (with Phase 1 backend)**

**Estimated effort:** Medium

**File ownership (frontend only):**
- `src/apps/gymmanager-web/src/hooks/use-roles-metadata.ts` -- NEW
- `src/apps/gymmanager-web/src/stores/rbac-store.ts` -- NEW
- `src/apps/gymmanager-web/src/types/rbac.ts` -- NEW
- `src/apps/gymmanager-web/src/lib/permissions.ts` -- MODIFY (keep utility functions, remove constants)
- `src/apps/gymmanager-web/src/lib/roles.ts` -- MODIFY (keep type, remove constants)
- `src/apps/gymmanager-web/src/lib/route-access.ts` -- MODIFY (keep utility functions, remove hardcoded map)

#### Tasks

1. **Create `types/rbac.ts`** with TypeScript interfaces matching the API contract:
   ```typescript
   interface RoleDefinition { name: string; value: number; isAssignable: boolean; }
   interface PermissionDefinition { name: string; bitPosition: number; category: string; }
   interface RouteAccessRule { path: string; allowedRoles: string[]; }
   interface RolesMetadata { roles: RoleDefinition[]; permissions: PermissionDefinition[]; routeAccess: RouteAccessRule[]; }
   ```

2. **Create `hooks/use-roles-metadata.ts`** -- TanStack Query hook:
   - `queryFn: () => get<RolesMetadata>("/roles/metadata")`
   - `staleTime: Infinity` (invalidated on permission/role changes)
   - `gcTime: 1000 * 60 * 60` (1 hour)

3. **Create `stores/rbac-store.ts`** -- Zustand store that holds the fetched metadata:
   - `roles`, `permissions`, `routeAccess` fields
   - `isLoaded` flag
   - `setMetadata(data: RolesMetadata)` action
   - Derives `permissionMap: Record<string, bigint>` from permission definitions
   - Derives `assignableRoles` from roles where `isAssignable === true`
   - Derives `permissionCategories` grouped by category

4. **Modify `lib/permissions.ts`:**
   - Remove the `Permission` constant object
   - Keep `hasPermission()` and `hasAnyPermission()` (pure functions, no changes)
   - Export a `buildPermissionFlag(bitPosition: number): bigint` helper

5. **Modify `lib/roles.ts`:**
   - Remove the `Role` constant object
   - Keep `RoleType` as `string` (no longer a union of hardcoded values)

6. **Modify `lib/route-access.ts`:**
   - Remove `routeAccessMap` constant
   - Change `canAccessRoute()` to accept the route map as a parameter (injected from store)
   - Keep the matching algorithm unchanged

---

### Phase 3: Frontend -- Wire Components to Dynamic Data

**Depends on:** Phase 1 (backend deployed) + Phase 2 (frontend scaffolding)

**Estimated effort:** Medium

**File ownership:**
- `src/apps/gymmanager-web/src/components/permission-toggle-grid.tsx` -- MODIFY
- `src/apps/gymmanager-web/src/components/role-user-table.tsx` -- MODIFY
- `src/apps/gymmanager-web/src/components/change-role-dialog.tsx` -- MODIFY
- `src/apps/gymmanager-web/src/components/sidebar.tsx` -- MODIFY
- `src/apps/gymmanager-web/src/middleware.ts` -- MODIFY
- `src/apps/gymmanager-web/src/stores/auth-store.ts` -- MODIFY

#### Tasks

1. **Create an `RbacProvider` component** (or integrate into existing layout):
   - Calls `useRolesMetadata()` on mount
   - Writes fetched data to `rbac-store`
   - Syncs route-access to a `route_access` cookie (base64 JSON) for middleware
   - Shows loading skeleton until metadata is loaded

2. **Update `permission-toggle-grid.tsx`:**
   - Replace `PERMISSION_CATEGORIES` constant with data from `rbac-store`
   - Replace `DISPLAY_ROLES` constant with `roles` from store
   - Permission flags computed from `bitPosition` instead of imported constants

3. **Update `role-user-table.tsx`:**
   - Replace `ROLE_TABS` with `assignableRoles` from store (Owner excluded)

4. **Update `change-role-dialog.tsx`:**
   - Replace `ASSIGNABLE_ROLES` with `assignableRoles` from store

5. **Update `sidebar.tsx`:**
   - Replace `getAllowedRolesForRoute()` calls with lookups into `rbac-store.routeAccess`
   - Nav entries derive `allowedRoles` from store data at render time

6. **Update `middleware.ts`:**
   - Read `route_access` cookie instead of importing `canAccessRoute` with hardcoded data
   - Parse the base64 JSON route map
   - Apply same matching algorithm
   - Fallback: if cookie missing or unparseable, fail-open (unchanged behavior)

7. **Update `auth-store.ts`:**
   - On login, trigger metadata fetch invalidation
   - On `updateFromToken`, sync the route-access cookie

---

### Phase 4: Integration and Cleanup

**Depends on:** Phase 3

**Estimated effort:** Small

#### Tasks

1. **Verify end-to-end flow:**
   - Login -> metadata fetched -> sidebar renders correct nav -> middleware blocks forbidden routes -> permission grid works

2. **Delete dead code:**
   - Remove hardcoded `Permission` object from `lib/permissions.ts` (if not already done in Phase 2)
   - Remove hardcoded `Role` object from `lib/roles.ts`
   - Remove hardcoded `routeAccessMap` from `lib/route-access.ts`

3. **Verify no remaining imports of removed constants:**
   - grep for `Permission.ViewMembers`, `Role.Owner`, etc.
   - Fix any remaining references

4. **Run full test suite** (backend + frontend if applicable)

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Middleware cannot make async calls | Cookie-based approach. Route map synced to cookie on auth state change. |
| Metadata endpoint latency on first load | `staleTime: Infinity` + Zustand persistence. Data loaded once, cached across sessions. |
| Backend not deployed when frontend is updated | Phase 2 scaffolding can use mock data. Phase 3 wiring requires real backend. |
| Route access cookie grows too large | Current map is ~30 entries. At ~1KB JSON, well within cookie limits (4KB). |
| Breaking change if roles/permissions are renamed | Frontend treats all values as strings. No compile-time coupling to specific names. |

---

## What This Plan Does NOT Do

- Does not change the permission bitmask encoding (BigInt stays)
- Does not change the JWT claims structure
- Does not add a UI for managing route-access rules (future feature)
- Does not change existing `GET /roles/permissions` or `PUT /roles/{role}/permissions` endpoints

---

## Estimated Total Effort

| Phase | Effort | Parallelizable |
|---|---|---|
| Phase 0: Contract | Small | No (must complete first) |
| Phase 1: Backend | Medium | Yes (with Phase 2) |
| Phase 2: Frontend scaffolding | Medium | Yes (with Phase 1) |
| Phase 3: Frontend wiring | Medium | No (depends on 1+2) |
| Phase 4: Cleanup | Small | No (depends on 3) |
