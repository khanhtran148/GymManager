# RBAC E2E Test Coverage -- Implementation Plan

**Date:** 2026-03-19
**Scope:** E2E test files only (no app code changes)
**Branch:** `feat/correct_full_flow`
**Target:** ~355 tests covering 5 roles x all endpoints x all UI routes

---

## Current State

- All existing E2E tests run as Owner only -- zero multi-role coverage.
- `role.fixture.ts` exists but only supports Owner + Trainer + Member (no HouseManager, no Staff).
- `auth.fixture.ts` creates a fresh user per test (always Owner).
- `apiRequestRaw()` returns raw `Response` -- ideal for asserting 403 without throwing.
- 50+ backend handlers check permissions via `IPermissionChecker`, none verified by E2E.
- 18 frontend files use `PermissionGate` or `RoleGate`, untested in E2E.
- Sidebar visibility is role-filtered via `getAllowedRolesForRoute()` from RBAC metadata API.
- Route access rules are served by `GET /roles/metadata` and enforced by Next.js middleware.
- Role assignment via `PUT /users/{userId}/role` with `{ Role: number }` body (0=Owner, 1=HouseManager, 2=Trainer, 3=Staff, 4=Member).
- Staff/Trainer roles require a staff record via `POST /staff` after role assignment.

## Approach

**Hybrid (Approach D):** API tests for permission enforcement (fast, no browser). UI tests for route access and element visibility (browser-based, fewer tests).

---

## Phase 1: Test Infrastructure

**Goal:** Build shared fixtures and helpers that all RBAC tests depend on.

### Files to Create

| File | Purpose |
|---|---|
| `fixtures/tenant.fixture.ts` | Worker-scoped fixture: creates 1 Owner + GymHouse + 4 role users + seed data |
| `helpers/role-helpers.ts` | `createUserWithRole()`, `loginAsRole()`, role assignment chain |
| `data/permission-matrix.data.ts` | Declarative `{ method, path, allowedRoles, bodyFactory?, deniedStatus? }` array |
| `data/route-access.data.ts` | 16 routes x 5 roles expected access map (mirrors backend metadata) |

### File Ownership

- `fixtures/tenant.fixture.ts` -- Phase 1 only
- `helpers/role-helpers.ts` -- Phase 1 only
- `data/permission-matrix.data.ts` -- Phase 1 creates, Phase 2 consumes
- `data/route-access.data.ts` -- Phase 1 creates, Phase 3 consumes

### Details

#### `tenant.fixture.ts` (worker-scoped)

```
TenantContext {
  owner:        { auth, token, userId }
  houseManager: { auth, token, userId, staffId? }
  trainer:      { auth, token, userId, staffId }
  staff:        { auth, token, userId, staffId }
  member:       { auth, token, userId, memberId }
  gymHouse:     GymHouseDto
  seed: {
    memberId, subscriptionId, timeSlotId,
    classScheduleId, bookingId, transactionId,
    staffId (trainer), announcementId, shiftAssignmentId
  }
}
```

Setup sequence (9 API calls for users, ~6 for seed data):
1. Register Owner, create GymHouse
2. Register 4 users, assign each a role via `PUT /users/{id}/role`
3. Create staff records for Trainer (staffType=0) and Staff (staffType=3)
4. Create seed member + subscription
5. Create seed timeSlot, classSchedule, booking, transaction, announcement
6. Set fixture timeout to 60s (15 API calls at ~2s each worst-case)

The fixture exposes a `tokenFor(role)` helper so tests can grab any role's JWT.

#### `role-helpers.ts`

```typescript
createUserWithRole(ownerToken, gymHouseId, role) => { auth, token, userId, staffId? }
```

Handles the full chain: register, assign role, create staff record if Trainer/Staff.

#### `permission-matrix.data.ts`

Declarative array derived from `RolePermissionDefaults.cs` and controller audit. Each entry:

```typescript
interface MatrixRow {
  description: string;           // e.g. "Create member"
  method: string;                // GET | POST | PUT | PATCH | DELETE
  path: string;                  // e.g. "/gymhouses/{gymHouseId}/members"
  allowedRoles: Role[];          // roles that should get 2xx
  bodyFactory?: (seed) => object; // returns request body for mutations
  deniedStatus?: number;         // default 403, override to 404 for resource-hiding
  pathParams?: string[];         // which seed IDs to substitute in path
}
```

### Tasks

- [ ] 1.1 Create `helpers/role-helpers.ts` with `createUserWithRole()` and `loginAsRole()`
- [ ] 1.2 Create `fixtures/tenant.fixture.ts` with worker-scoped `TenantContext`
- [ ] 1.3 Create `data/permission-matrix.data.ts` with all endpoint rows
- [ ] 1.4 Create `data/route-access.data.ts` with 16 routes x 5 roles
- [ ] 1.5 Smoke-test: write a single test that creates a tenant context and asserts all 5 tokens are valid JWTs
- [ ] 1.6 Add `rbac-api` and `rbac-ui` projects to `playwright.config.ts`

---

## Phase 2: API Permission Matrix Tests (~200 tests)

**Goal:** For every permission-gated endpoint, verify allowed roles get 2xx and denied roles get 403.

**Depends on:** Phase 1

### Files to Create

| File | Purpose |
|---|---|
| `specs/rbac/permission-matrix.spec.ts` | Data-driven test iterating the matrix |

### File Ownership

- `specs/rbac/permission-matrix.spec.ts` -- Phase 2 only

### How It Works

```typescript
for (const row of permissionMatrix) {
  test.describe(row.description, () => {
    for (const role of ALL_ROLES) {
      test(`${role} => ${row.allowedRoles.includes(role) ? 'allowed' : 'denied'}`, async ({ tenantContext }) => {
        const token = tenantContext.tokenFor(role);
        const path = substitutePath(row.path, tenantContext.seed);
        const body = row.bodyFactory?.(tenantContext.seed);
        const res = await apiRequestRaw(row.method, path, body, token);

        if (row.allowedRoles.includes(role)) {
          expect(res.status).not.toBe(403);
          expect(res.status).toBeLessThan(500);
        } else {
          expect(res.status).toBe(row.deniedStatus ?? 403);
        }
      });
    }
  });
}
```

### Endpoint Coverage

Based on the API client and `RolePermissionDefaults.cs`, the matrix covers:

| Domain | Endpoints | Mutations | Reads |
|---|---|---|---|
| Gym Houses | 4 | create, update, delete | list, getById |
| Members | 3 | create, update | list, getById |
| Subscriptions | 4 | create, freeze, cancel, renew | list |
| Time Slots | 2 | create | list |
| Class Schedules | 3 | create, update | list, getById |
| Bookings | 5 | create, cancel, checkIn, markNoShow | list, getById |
| Transactions | 3 | create, reverse | list |
| Staff | 3 | create, update | list, getById |
| Shifts | 3 | create, update | list |
| Payroll | 3 | create, approve | list, getById |
| Announcements | 2 | create | list, getById |
| Finance Reports | 2 | -- | P&L, revenue metrics |
| Roles/Settings | 4 | updatePermissions, resetDefaults, changeRole | getPermissions, metadata |
| **Total** | **~41** | | |

41 endpoints x 5 roles = 205 tests.

### Tasks

- [ ] 2.1 Write `specs/rbac/permission-matrix.spec.ts` with the data-driven loop
- [ ] 2.2 Add `substitutePath()` helper that replaces `{gymHouseId}`, `{id}`, etc. from seed IDs
- [ ] 2.3 Add body factories for all mutation endpoints
- [ ] 2.4 Run matrix and fix any false failures (wrong expected status, missing seed data)
- [ ] 2.5 Verify all 205 tests pass with `npx playwright test --project rbac-api`

---

## Phase 3: UI Route Access Tests (~80 tests)

**Goal:** For each of 16 routes, verify each role can or cannot navigate there.

**Depends on:** Phase 1

### Files to Create

| File | Purpose |
|---|---|
| `specs/rbac-ui/route-access.spec.ts` | Parameterized route x role test |

### File Ownership

- `specs/rbac-ui/route-access.spec.ts` -- Phase 3 only

### Routes (16)

From `routeAccess` in the RBAC metadata:

| Route | Owner | HouseManager | Trainer | Staff | Member |
|---|---|---|---|---|---|
| `/` | Y | Y | Y | Y | Y |
| `/gym-houses` | Y | Y | Y | Y | N |
| `/members` | Y | Y | Y | Y | Y |
| `/bookings` | Y | Y | Y | Y | Y |
| `/class-schedules` | Y | Y | Y | Y | Y |
| `/time-slots` | Y | Y | Y | Y | Y |
| `/check-in` | Y | Y | Y | Y | N |
| `/finance` | Y | Y | N | Y | N |
| `/finance/transactions` | Y | Y | N | Y | N |
| `/finance/pnl` | Y | Y | N | N | N |
| `/staff` | Y | Y | N | N | N |
| `/shifts` | Y | Y | N | N | N |
| `/payroll` | Y | Y | N | N | N |
| `/announcements` | Y | Y | Y | Y | Y |
| `/settings/roles` | Y | N | N | N | N |
| `/settings/roles/users` | Y | N | N | N | N |

16 routes x 5 roles = 80 tests.

### How It Works

For each (route, role) pair:
1. Inject the role's auth state into localStorage (reusing `auth.fixture.ts` pattern)
2. Navigate to the route
3. If allowed: assert page loaded (no redirect to `/403` or `/login`)
4. If denied: assert redirect to `/403` or that an "Access Denied" element is visible

### Tasks

- [ ] 3.1 Write `specs/rbac-ui/route-access.spec.ts` with parameterized loop
- [ ] 3.2 Add browser auth injection helper that works for any role (extract from `auth.fixture.ts`)
- [ ] 3.3 Run all 80 tests and fix selector issues
- [ ] 3.4 Verify with `npx playwright test --project rbac-ui --grep "route-access"`

---

## Phase 4: UI Visibility Tests (~55 tests)

**Goal:** Verify sidebar items and PermissionGate-wrapped buttons render/hide per role.

**Depends on:** Phase 1

### Files to Create

| File | Purpose |
|---|---|
| `specs/rbac-ui/sidebar-visibility.spec.ts` | Sidebar nav items per role |
| `specs/rbac-ui/action-visibility.spec.ts` | PermissionGate buttons per role on key pages |

### File Ownership

- `specs/rbac-ui/sidebar-visibility.spec.ts` -- Phase 4 only
- `specs/rbac-ui/action-visibility.spec.ts` -- Phase 4 only

### Sidebar Visibility (5 tests)

One test per role. Navigate to `/` (accessible to all), then assert:
- **Owner:** All 16 nav items visible (Dashboard, Gym Houses, Members, Bookings, Class Schedules, Time Slots, Check-in, Finance group, Staff & HR group, Announcements, Settings group)
- **HouseManager:** Same as Owner minus Settings
- **Trainer:** Dashboard, Members, Bookings, Class Schedules, Time Slots, Check-in, Announcements
- **Staff:** Dashboard, Gym Houses, Members, Bookings, Class Schedules, Time Slots, Check-in, Finance group (dashboard + transactions), Announcements
- **Member:** Dashboard, Members, Bookings, Class Schedules, Time Slots, Announcements

Use `data-testid` or link `href` selectors (sidebar renders `<Link href="...">` elements).

### Action Visibility (~50 tests)

For each page that uses `PermissionGate`, test which roles see action buttons:

| Page | Action | Visible to |
|---|---|---|
| `/members` | Add Member button | Owner, HouseManager, Staff |
| `/members/[id]` | Edit Member button | Owner, HouseManager, Staff |
| `/bookings` | Create Booking button | Owner, HouseManager, Trainer, Staff |
| `/bookings` | Check-in button | Owner, HouseManager, Trainer, Staff |
| `/class-schedules` | Add Class button | Owner, HouseManager |
| `/staff` | Add Staff button | Owner, HouseManager |
| `/shifts` | Add Shift button | Owner, HouseManager |
| `/payroll` | Create Payroll button | Owner, HouseManager |
| `/payroll/[id]` | Approve Payroll button | Owner |
| `/announcements` | Create Announcement button | Owner, HouseManager |
| `/finance/transactions` | Add Transaction button | Owner, HouseManager, Staff |

~11 actions x 5 roles = ~55 tests (but only roles that can access the route are tested).

### Tasks

- [ ] 4.1 Write `specs/rbac-ui/sidebar-visibility.spec.ts`
- [ ] 4.2 Write `specs/rbac-ui/action-visibility.spec.ts`
- [ ] 4.3 Identify the correct selectors for each PermissionGate-wrapped element
- [ ] 4.4 Run and verify with `npx playwright test --project rbac-ui --grep "visibility"`

---

## Phase 5: Cross-Role Workflow & Tenant Isolation Tests (~20 tests)

**Goal:** Test multi-actor workflows and cross-tenant data isolation.

**Depends on:** Phase 1, Phase 2

### Files to Create

| File | Purpose |
|---|---|
| `specs/rbac/cross-tenant-isolation.spec.ts` | Tenant A roles cannot access Tenant B resources |
| `specs/rbac/cross-role-workflows.spec.ts` | Multi-actor business flows |

### File Ownership

- `specs/rbac/cross-tenant-isolation.spec.ts` -- Phase 5 only
- `specs/rbac/cross-role-workflows.spec.ts` -- Phase 5 only

### Cross-Tenant Isolation (~10 tests)

Create two independent tenants (two separate worker fixtures). For each of ~10 key endpoints, Tenant A's Owner/HouseManager/Member attempts to access Tenant B's gymHouseId. Expected: 403 or 404.

### Cross-Role Workflows (~10 tests)

| Workflow | Steps |
|---|---|
| Member lifecycle | Owner creates member -> HouseManager manages subscription -> Staff processes payment -> Member views own data |
| Class scheduling | Owner creates gym house -> HouseManager creates class -> Trainer views schedule -> Member books class |
| Staff management | Owner creates staff -> HouseManager assigns shift -> Trainer cannot modify shift |
| Payroll flow | HouseManager creates payroll period -> Owner approves -> Trainer cannot approve |
| Announcement flow | HouseManager creates announcement -> All roles can view -> Member cannot create |

### Tasks

- [ ] 5.1 Write `specs/rbac/cross-tenant-isolation.spec.ts`
- [ ] 5.2 Write `specs/rbac/cross-role-workflows.spec.ts`
- [ ] 5.3 Run full suite and measure execution time

---

## Playwright Config Changes

Add two new projects to `playwright.config.ts`:

```typescript
{
  name: "rbac-api",
  testDir: "./specs/rbac",
  // No browser needed -- pure API tests
},
{
  name: "rbac-ui",
  testDir: "./specs/rbac-ui",
  use: { ...devices["Desktop Chrome"] },
},
```

---

## Final File Tree

```
tests/GymManager.E2E/
  fixtures/
    auth.fixture.ts          (existing, unchanged)
    gym-house.fixture.ts     (existing, unchanged)
    role.fixture.ts          (existing, unchanged)
    tenant.fixture.ts        (NEW -- Phase 1)
  helpers/
    api-client.ts            (existing, unchanged)
    test-data.ts             (existing, unchanged)
    role-helpers.ts          (NEW -- Phase 1)
  data/
    permission-matrix.data.ts (NEW -- Phase 1)
    route-access.data.ts      (NEW -- Phase 1)
  specs/
    rbac/
      permission-matrix.spec.ts       (NEW -- Phase 2)
      cross-tenant-isolation.spec.ts  (NEW -- Phase 5)
      cross-role-workflows.spec.ts    (NEW -- Phase 5)
    rbac-ui/
      route-access.spec.ts            (NEW -- Phase 3)
      sidebar-visibility.spec.ts      (NEW -- Phase 4)
      action-visibility.spec.ts       (NEW -- Phase 4)
  playwright.config.ts       (MODIFIED -- add rbac-api + rbac-ui projects)
```

---

## Execution Order

```
Phase 1 (infrastructure)
  |
  +---> Phase 2 (API matrix, ~200 tests)    -- can run in parallel with Phase 3
  +---> Phase 3 (UI route access, ~80 tests) -- can run in parallel with Phase 2
  |
  +---> Phase 4 (UI visibility, ~55 tests)   -- depends on Phase 3 selectors
  |
  +---> Phase 5 (workflows + isolation, ~20 tests) -- depends on Phase 1+2
```

## Estimated Test Counts

| Phase | Tests | Runtime (est.) |
|---|---|---|
| Phase 2: API matrix | ~205 | ~60-90s (pure HTTP) |
| Phase 3: Route access | ~80 | ~3-5 min (browser) |
| Phase 4: Visibility | ~55 | ~2-3 min (browser) |
| Phase 5: Workflows | ~20 | ~1-2 min (mixed) |
| **Total** | **~360** | **~7-11 min** |

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Worker fixture timeout (15+ API calls) | Set fixture timeout to 60s; parallelize user registration where possible |
| `PUT /users/{id}/role` may require additional context | Fixture logs clear error: "Failed to assign role {role}: {detail}" |
| Backend returns 404 instead of 403 for some denied ops | Matrix supports per-row `deniedStatus` override |
| Sidebar uses text labels that may change | Select sidebar links by `href` attribute, not visible text |
| Matrix drifts as endpoints are added | Add comment in matrix file: "Keep in sync with controllers. Run `grep -r HttpPost\|HttpGet\|HttpPut\|HttpPatch\|HttpDelete src/apps/GymManager.Api/Controllers/ --include=*.cs` to audit." |
| Mutation tests leave dirty state for subsequent tests | All mutations in Phase 2 use seed data that is not shared with other matrix rows; worker-scoped fixture creates fresh tenant per worker |
