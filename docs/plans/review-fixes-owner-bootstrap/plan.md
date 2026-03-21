# Review Fixes: Owner Bootstrap & Invite Flow

**Date:** 2026-03-22
**Type:** Backend-only, single-phase (targeted fixes)
**Branch:** `fix/review-owner-bootstrap`
**Source:** `docs/plans/owner-bootstrap-invite-flow/reports/260321-review-report.md`

---

## Overview

11 fixes (1 CRITICAL, 10 HIGH) from the code review of the owner bootstrap and invite flow. All are small, targeted changes grouped by file to minimize context switching. TFD applies: write failing test first where the fix has testable behavior.

---

## Phase 1: Fixes (single phase)

### Execution Order

Fix issues grouped by file. Within each file group, write the failing test first (TFD), then implement the fix, then verify green.

---

### Group A: AcceptInvitationHandler (Issues #1, #7, #8-partial, #10)

**FILES OWNED:**
- `src/core/GymManager.Application/Invitations/AcceptInvitation/AcceptInvitationHandler.cs`
- `src/core/GymManager.Application/Common/Interfaces/IInvitationRepository.cs`
- `src/core/GymManager.Infrastructure/Persistence/Repositories/InvitationRepository.cs`
- `src/core/GymManager.Domain/Entities/Invitation.cs`
- `tests/GymManager.Application.Tests/Invitations/AcceptInvitationCommandHandlerTests.cs`

#### Fix #1 (CRITICAL): TOCTOU race on invite acceptance

**Problem:** `GetByTokenAsync` reads with `AsNoTracking`, then handler checks `IsAccepted` in memory, then calls `UpdateAsync`. Two concurrent requests can both pass the check and accept the same token.

**Solution:** Add a new repository method `TryAcceptByTokenAsync(string token, CancellationToken ct)` that performs an atomic operation:
1. Read the invitation WITH tracking (remove `AsNoTracking` for this method).
2. Add a concurrency token (`xmin` system column for PostgreSQL / EF Core `UseXminAsConcurrencyToken()`).
3. In the handler, after validation, set `AcceptedAt` and call `SaveChangesAsync`. If a `DbUpdateConcurrencyException` is thrown, return a conflict error.

Alternative (simpler): Add `MarkAcceptedAsync(string token, CancellationToken ct)` to `IInvitationRepository` that does:
```sql
UPDATE invitations SET accepted_at = now()
WHERE token = @token AND accepted_at IS NULL AND expires_at > now() AND deleted_at IS NULL
RETURNING *
```
This is a single atomic UPDATE. If `rowsAffected == 0`, return null (already accepted or expired). The handler calls this instead of the read-check-update sequence.

**Chosen approach:** Atomic UPDATE via `AcceptByTokenAsync`. Cleaner, no concurrency token needed, fewer round-trips.

**Changes:**
- `IInvitationRepository`: Add `Task<Invitation?> AcceptByTokenAsync(string token, CancellationToken ct)`
- `InvitationRepository`: Implement using `ExecuteUpdateAsync` + re-fetch, or raw SQL `RETURNING`.
- `InvitationConfiguration`: Add `UseXminAsConcurrencyToken()` as defense-in-depth for other future writes.
- `AcceptInvitationHandler`: Replace `GetByTokenAsync` + manual check + `UpdateAsync` with `AcceptByTokenAsync`. If null, determine whether token was not found, expired, or already accepted by doing a secondary read (no-tracking) to produce the correct error message.

**TFD:** Test concurrent acceptance returns failure for the second caller. Test already-accepted returns appropriate error.

**Size:** S

---

#### Fix #7 (HIGH): Existing-user path skips auth verification

**Problem:** When an existing user accepts an invitation, the handler links them to the new gym without verifying they own the email (no password check, no session check). Anyone who intercepts a token for a registered email can link that user to a gym.

**Solution:** For existing users, the accept endpoint is anonymous. Two options:
1. Require the existing user to be authenticated (bearer token) and verify `user.Email == invitation.Email`.
2. Require the existing user to provide their password in the request body.

Option 2 is simpler and does not require the user to already be logged in (common UX for invite links).

**Changes:**
- `AcceptInvitationHandler`: When `existingUser is not null`, require `request.Password` is not null/empty, then verify `passwordHasher.Verify(request.Password, existingUser.PasswordHash)`. Return `"Invalid credentials."` on mismatch.

**TFD:** Test that existing user without password fails. Test that existing user with wrong password fails. Test that existing user with correct password succeeds.

**Size:** S

---

#### Fix #10 (HIGH/TFD): Missing test coverage for AcceptInvitationHandler

**Problem:** No tests for: staff role-type mapping (Trainer vs Reception), null password for new user validation, idempotent skip when user is already a member/staff of the gym.

**Tests to add:**
1. `Accept_NewUser_AsTrainer_CreatesStaffWithTrainerType` -- verifies `Role.Trainer` maps to `StaffType.Trainer`.
2. `Accept_NewUser_AsStaff_CreatesStaffWithReceptionType` -- verifies non-Trainer staff maps to `StaffType.Reception`.
3. `Accept_NewUser_NullPassword_ReturnsFailure` -- verifies password required for new user.
4. `Accept_NewUser_NullFullName_ReturnsFailure` -- verifies full name required for new user.
5. `Accept_ExistingUser_AlreadyMemberOfGym_SkipsCreation` -- idempotent path.
6. `Accept_ExistingUser_AlreadyStaffOfGym_SkipsCreation` -- idempotent path.

**Size:** S

---

#### Fix #8-partial (AcceptInvitationHandler): `.ToString()` on error types

**Problem:** Lines 32, 36, 39, 54, 57 use plain strings or `.ToString()`. The `ApiControllerBase.MapErrorToResult` dispatches on string prefixes like `[NOT_FOUND]`, `[FORBIDDEN]`, `[CONFLICT]`. The `.ToString()` calls produce the correct prefix format already (e.g., `"[NOT_FOUND] Invitation with id '...' was not found."`). So the `.ToString()` pattern is actually correct for the `Result<T>` (string-based) overload used here.

**Re-assessment:** The codebase consistently uses `Result<T>` (which carries `string` error), NOT `Result<T, E>`. The `ToString()` calls produce prefix-tagged strings that `MapErrorToResult` parses. This is the established pattern across all handlers (GetGymHouses, GetStaffById, ChangeUserRole, etc.). The pattern works.

However, the plain string errors on lines 36, 39, 54, 57 lack a prefix tag, so they all fall through to `BadRequest` -- which is correct behavior for validation-type errors. But for consistency and to enable future error type dispatch, wrap them:
- Line 36: `"This invitation link has expired."` -- this is a validation error, `BadRequest` is correct. Leave as-is OR wrap in a new `ExpiredError` if we want 410 Gone. Keep as `BadRequest` for now.
- Lines 54, 57: These are validation errors. Keep as plain strings (correct behavior).

**Decision:** No change needed for #8 in AcceptInvitationHandler. The `.ToString()` calls produce the correct tagged strings. The plain strings correctly map to 400.

**But** -- check other handlers. The review says "all handlers call `.ToString()`". Let me verify the actual issue is that `Result<T>` uses string errors when it should use typed `Result<T, ErrorType>`.

**Final assessment:** The codebase uses `Result<T>` (string error) everywhere, and `ApiControllerBase` has string-prefix-based dispatch. The `.ToString()` pattern is the established convention. `Result<T, E>` overloads exist in `ApiControllerBase` but are unused. Changing to typed errors would be a large refactor touching every handler. The review finding is valid in principle but low-impact given the consistent convention.

**Action:** No changes for #8. Document that the string-prefix pattern is intentional. If the team wants typed errors, that is a separate refactor PR.

**Size:** N/A (no change)

---

### Group B: CreateInvitationHandler (Issues #8-partial, #11)

**FILES OWNED:**
- `src/core/GymManager.Application/Invitations/CreateInvitation/CreateInvitationHandler.cs`
- `tests/GymManager.Application.Tests/Invitations/CreateInvitationCommandHandlerTests.cs`

#### Fix #11 (HIGH/TFD): ManageRoles permission path not tested

**Problem:** Tests only cover `ManageStaff` permission. The handler also allows `ManageRoles` but no test verifies it.

**Test to add:**
1. `Create_WithManageRolesPermission_Succeeds` -- set `CurrentUser.Permissions = Permission.ManageRoles`, verify success.

**Size:** S

---

### Group C: InviteOptions (Issue #2)

**FILES OWNED:**
- `src/core/GymManager.Application/Common/Options/InviteOptions.cs`
- DI registration file where `InviteOptions` is bound (find and update)

#### Fix #2 (HIGH/Security): InviteOptions defaults to `http://`

**Problem:** Default `InviteBaseUrl` is `http://localhost:3000/invite`. In production this could leak tokens over plain HTTP if misconfigured.

**Changes:**
- Add `[Required]` and `[Url]` data annotations to `InviteBaseUrl`.
- Remove the default value (force explicit configuration).
- Add `ValidateOnStart()` in the DI registration so misconfiguration fails at startup, not at runtime.

**Size:** S

---

### Group D: SeedOptions (Issue #3)

**FILES OWNED:**
- `src/core/GymManager.Application/Common/Options/SeedOptions.cs`

#### Fix #3 (HIGH/Security): SeedOptions lacks password complexity validation

**Problem:** `SeedOptions.Password` only requires `MinLength(8)`. `RegisterCommandValidator` requires uppercase, lowercase, digit, and special character. A seed password that passes `SeedOptions` validation could fail at runtime or create a weak owner account.

**Changes:**
- Add `[RegularExpression]` attribute matching the same rules as `RegisterCommandValidator`: at least one uppercase, one lowercase, one digit, one special character.
- Or add a custom validation attribute `StrongPasswordAttribute` reusable by both.

**Chosen approach:** `[RegularExpression]` with a pattern that enforces all four character classes. Simpler, no new class needed.

Pattern: `^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$`

**Size:** S

---

### Group E: CurrentUser (Issue #4)

**FILES OWNED:**
- `src/core/GymManager.Infrastructure/Auth/CurrentUser.cs`

#### Fix #4 (HIGH/Security): TenantId silent fallback to UserId

**Problem:** When `tenant_id` claim is missing, `TenantId` silently returns `UserId`. This masks auth bugs -- a user without a tenant claim gets treated as if they are the tenant (Owner), which could grant elevated access.

**Changes:**
- Return `Guid.Empty` when `tenant_id` claim is missing or unparseable, instead of falling back to `UserId`.
- Callers that rely on the fallback (Owner users where `tenant_id == user_id`) already get the correct claim from `JwtTokenService` which explicitly sets `tenant_id` for Owners.

**Size:** S

---

### Group F: JwtTokenService (Issues #5, #9)

**FILES OWNED:**
- `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs`

#### Fix #5 (HIGH/Security): ResolveTenantIdAsync fallback fabricates tenant_id

**Problem:** Line 38: `(await ResolveTenantIdAsync(user.Id, ct) ?? user.Id)`. When no gym association exists, the fallback uses `user.Id` as tenant_id. This fabricated claim could grant access to resources the user has no association with.

**Changes:**
- When `ResolveTenantIdAsync` returns null for a non-Owner user, use `Guid.Empty` instead of `user.Id`. This makes the JWT honestly reflect "no tenant association."
- Downstream permission checks will correctly deny access when `tenant_id` is `Guid.Empty`.

**Size:** S

---

#### Fix #9 (HIGH/Performance): IConfiguration re-read + double ResolveTenantIdAsync

**Problem:**
1. `GenerateAccessTokenAsync` reads `configuration["Jwt:Secret"]`, `["Jwt:Issuer"]`, `["Jwt:Audience"]` on every call. These values never change at runtime.
2. `ResolvePermissionsAsync` calls `ResolveTenantIdAsync`, and then `GenerateAccessTokenAsync` calls it again independently. Two DB round-trips for the same data.

**Changes:**
1. Cache JWT settings in a `JwtSettings` record resolved once in the constructor (or use `IOptions<JwtSettings>` if the options pattern is set up; otherwise, resolve from `IConfiguration` once in constructor and store in fields).
2. Refactor so `ResolveTenantIdAsync` is called once in `GenerateAccessTokenAsync`, and the result is passed to `ResolvePermissionsAsync` as a parameter.

**Size:** S

---

### Group G: RegisterCommandHandler (Issue #6)

**FILES OWNED:**
- `src/core/GymManager.Application/Auth/Register/RegisterCommandHandler.cs`

#### Fix #6 (HIGH/Security): Accepts any GymHouseId without enrollment control

**Problem:** Any user can register as a member of any gym house by providing its ID. There is no check whether the gym allows public self-registration.

**Assessment:** For a SaaS platform where gym discovery and self-signup is a core feature, this is intentional behavior. The gym house is publicly listed, and registration creates a Member record. There is no enrollment restriction by design at this stage.

**Action:** Add a code comment documenting that public self-registration is intentional. If the team later wants enrollment control (e.g., invite-only gyms), add a `GymHouse.AllowPublicRegistration` flag and check it here.

**Size:** S (comment only)

---

## Fix Summary Table

| # | Severity | Issue | File(s) | Size | TFD |
|---|----------|-------|---------|------|-----|
| 1 | CRITICAL | TOCTOU race on invite acceptance | InvitationRepository, AcceptInvitationHandler, IInvitationRepository, InvitationConfiguration | S | Yes |
| 2 | HIGH | InviteOptions http:// default | InviteOptions, DI registration | S | No (config) |
| 3 | HIGH | SeedOptions weak password validation | SeedOptions | S | No (config) |
| 4 | HIGH | CurrentUser.TenantId silent fallback | CurrentUser | S | No (infra) |
| 5 | HIGH | JwtTokenService fabricated tenant_id | JwtTokenService | S | No (infra) |
| 6 | HIGH | Register accepts any GymHouseId | RegisterCommandHandler | S | No (comment) |
| 7 | HIGH | Existing-user path skips password check | AcceptInvitationHandler | S | Yes |
| 8 | HIGH | Result.Failure .ToString() pattern | -- | N/A | -- |
| 9 | HIGH | JwtTokenService perf: re-read config + double resolve | JwtTokenService | S | No (infra) |
| 10 | HIGH | AcceptInvitationHandler missing tests | AcceptInvitationCommandHandlerTests | S | Yes (tests themselves) |
| 11 | HIGH | CreateInvitationHandler ManageRoles not tested | CreateInvitationCommandHandlerTests | S | Yes (test itself) |

---

## Issue #8 Decision

The `.ToString()` pattern is the established convention in this codebase. All handlers use `Result<T>` with string errors. `ApiControllerBase.MapErrorToResult` dispatches on `[NOT_FOUND]`, `[FORBIDDEN]`, `[CONFLICT]` prefixes produced by the error records' `ToString()` methods. Changing to typed `Result<T, E>` would touch every handler and controller -- a separate refactor PR, not a bug fix. No changes for this issue.

---

## Execution Order

1. **#10, #11** -- Write all missing tests first (they fail against current code where applicable).
2. **#1** -- Fix TOCTOU (critical path). Update tests to match new API.
3. **#7** -- Add password verification for existing users. Existing tests update.
4. **#4** -- Fix CurrentUser.TenantId fallback.
5. **#5** -- Fix JwtTokenService tenant_id fallback.
6. **#9** -- Fix JwtTokenService performance.
7. **#2** -- Fix InviteOptions validation.
8. **#3** -- Fix SeedOptions password complexity.
9. **#6** -- Add documentation comment to RegisterCommandHandler.
10. Run full test suite, verify all green.

---

## Verification

```bash
dotnet test tests/GymManager.Application.Tests --filter "Invitations"
dotnet test
```

All 11 issues addressed. Tests must pass after all fixes applied.
