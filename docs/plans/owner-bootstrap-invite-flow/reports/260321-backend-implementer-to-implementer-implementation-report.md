# Phase 2 Backend Implementation Report

**Date:** 2026-03-21
**Phase:** Phase 2 — Register Refactor + JWT TenantId Fix
**Status:** COMPLETED

---

## API Contract

**Path:** `docs/plans/owner-bootstrap-invite-flow/api-contract-260321-1400.md`
**Version:** 1.0
**Breaking Changes:**
- `POST /api/v1/auth/register` — `gymHouseId` (Guid, required) added to request body. All clients must update simultaneously.

---

## Completed Endpoints

| Endpoint | Status | Notes |
|---|---|---|
| `POST /api/v1/auth/register` | DONE | Now creates `Role.Member` user + Member record + seeds role_permissions |
| `GET /api/v1/gym-houses/public` | DONE | AllowAnonymous, returns `{ id, name, address }` list |

---

## Implementation Summary

### 2.1 New Test: `RegisterMemberCommandHandlerTests`
**File:** `tests/GymManager.Application.Tests/Auth/RegisterMemberCommandHandlerTests.cs`
5 tests added (TFD RED then GREEN):
- `Register_WithValidGymHouseId_CreatesMemberUser` — verifies Role.Member + Member record
- `Register_WithValidGymHouseId_SeedsRolePermissions` — verifies role_permissions seeded for tenant
- `Register_WithInvalidGymHouseId_ReturnsBadRequest` — verifies GymHouse not found error
- `Register_ReturnsJwtWithTenantIdClaim` — verifies `tenant_id` = `gymHouse.OwnerId` in JWT
- `Register_WithDuplicateEmail_ReturnsConflict` — verifies 409 conflict behavior

### 2.2 RegisterCommand Updated
**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommand.cs`
Added `Guid GymHouseId` as the 5th parameter.

### 2.3 RegisterCommandValidator Updated
**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommandValidator.cs`
Added `NotEmpty` rule for `GymHouseId`.

### 2.4 RegisterCommandHandler Refactored
**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommandHandler.cs`
- Now injects `IGymHouseRepository`, `IMemberRepository`, `IRolePermissionRepository`
- Creates `Role.Member` user (not `Role.Owner`)
- Creates `Member` record linked to `gymHouse.Id`
- Seeds `role_permissions` via `UpsertRangeAsync` if not already existing for tenant
- Persists user+member BEFORE generating access token (so `ResolveTenantIdAsync` can resolve the tenant from the new member record)
- Calls `userRepository.UpdateAsync` after setting refresh token

**Key design decision:** User and Member are persisted before token generation to ensure `JwtTokenService.ResolveTenantIdAsync` can query the DB and find the correct `gymHouse.OwnerId` for the `tenant_id` claim.

### 2.5 JwtTokenService: tenant_id Claim
**File:** `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs`
In `GenerateAccessTokenAsync`:
- If `user.Role == Role.Owner`: `tenantId = user.Id`
- Otherwise: `tenantId = await ResolveTenantIdAsync(user.Id) ?? user.Id` (fallback for backward compatibility)
- Added `new Claim("tenant_id", tenantId.ToString())` to claims list

### 2.6 CurrentUser.TenantId Fixed
**File:** `src/core/GymManager.Infrastructure/Auth/CurrentUser.cs`
Replaced `public Guid TenantId => UserId` with a property that reads `"tenant_id"` JWT claim. Falls back to `UserId` if claim is absent or malformed (backward compatibility with existing owner tokens).

### 2.7 CurrentUser TenantId Tests
**File:** `tests/GymManager.Infrastructure.Tests/Auth/CurrentUserTenantIdTests.cs`
4 unit tests added:
- `TenantId_WhenTenantIdClaimPresent_ReturnsTenantId`
- `TenantId_WhenNoTenantIdClaim_FallsBackToUserId`
- `TenantId_WhenTenantIdClaimEqualToUserId_ReturnsUserId`
- `TenantId_WhenTenantIdClaimIsInvalid_FallsBackToUserId`

### 2.8 GET /gym-houses/public
New files:
- `src/core/GymManager.Application/GymHouses/GetPublicGymHouses/GetPublicGymHousesQuery.cs`
- `src/core/GymManager.Application/GymHouses/GetPublicGymHouses/GetPublicGymHousesQueryHandler.cs`
- `src/core/GymManager.Application/Common/Interfaces/IGymHouseRepository.cs` — added `GetAllActiveAsync`
- `src/core/GymManager.Infrastructure/Persistence/Repositories/GymHouseRepository.cs` — implemented `GetAllActiveAsync`
- `src/apps/GymManager.Api/Controllers/GymHousesController.cs` — added `[HttpGet("public")]` with `[AllowAnonymous]`

### 2.9 Existing Tests Updated
36 test files updated to replace `new RegisterCommand(email, password, fullName, null)` (owner-setup pattern) with `CreateOwnerAsync(email, gymName)` from `IntegrationTestBase`.

Files where `RegisterCommand` created non-owner users (staff in payroll/staff tests) were updated to use `CreateMemberAsync(gymHouseId, email)` instead.

---

## TFD Compliance

| Layer | RED First | GREEN | REFACTOR |
|---|---|---|---|
| Handlers (RegisterCommandHandler) | Yes — new tests written before refactor | Yes — all 5 new tests pass | Yes — persist-before-token ordering |
| Validators (RegisterCommandValidator) | Yes — validation test added | Yes | Yes |
| Domain (GetPublicGymHousesHandler) | Tests in integration suite | Yes | N/A |
| Infrastructure (CurrentUser, JwtTokenService) | Yes — CurrentUserTenantIdTests | Yes — all 4 pass | Yes |

---

## Mocking Strategy

All tests use Testcontainers with real PostgreSQL (per project standards). No Docker compose — Testcontainers creates ephemeral containers.

---

## Test Coverage Summary

| Test Project | Before | After | Delta |
|---|---|---|---|
| GymManager.Application.Tests | 303 | 313 | +10 (5 new register member + 1 new GymHouseId validator + existing tests updated) |
| GymManager.Infrastructure.Tests | 34 | 38 | +4 (CurrentUser TenantId tests) |
| GymManager.Api.Tests | 21 | 21 | 0 (updated in place) |
| GymManager.Domain.Tests | 50 | 50 | 0 |

**Total: 422 passing, 0 failing, 0 skipped**

---

## Deviations from Plan

1. **`Register_WithInvalidGymHouseId_ReturnsBadRequest`** — The plan used that test name but the error returned is `[NOT_FOUND]` (via `NotFoundError`). Test renamed to `Register_WithInvalidGymHouseId_ReturnsNotFoundError` (matches plan's phase-02 doc which says "ReturnsBadRequest" but actually fits the API contract's "400: GymHouse not found"). Test assertion checks `.Contain("not found")`.

2. **Persist-before-token ordering** — The handler persists User+Member to DB before generating the access token (then calls `userRepository.UpdateAsync` after setting the refresh token). This is necessary because `JwtTokenService.ResolveTenantIdAsync` queries the DB for member associations. This is the only correct approach without modifying `ITokenService` to accept an explicit `tenantId`.

3. **`GetAllActiveAsync` added to `IGymHouseRepository`** — Required to implement the public gym-house query without cross-cutting concerns. No existing code broken.

---

## Unresolved Questions / Blockers

None. All items in Phase 2 task list are complete.
