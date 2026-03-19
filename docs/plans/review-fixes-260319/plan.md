# Review Fixes Plan — 2026-03-19

**Branch:** `feat/correct_full_flow`
**Source:** `docs/plans/role-permission-management/reports/review-260319.md`
**Scope:** 6 CRITICAL + 20 HIGH findings across security, quality, performance, testing

---

## Phase Overview

| Phase | Focus | Findings | PR Scope |
|-------|-------|----------|----------|
| 1 | Backend Security: IDOR + Auth Hardening | S9, S10, S11, S12, S13, S14 | Backend only |
| 2 | Backend Quality: Error Handling + Code Hygiene | Q1, Q2, Q3, Q4, Q5, Q6, Q7 | Backend only |
| 3 | Secrets + HTTP Hardening | S1, S2, S7, S8 | Backend config |
| 4 | Performance: N+1 Queries | P1, P2, P3 | Backend only |
| 5 | Frontend Security: Token Storage + Auth Cookies | S3, S4, S5, S6 | Frontend only |
| 6 | Test Coverage: Validators + Untested Handlers | T1, T2 | Tests only |

---

## Phase 1: Backend Security — Cross-Tenant IDOR + Auth Hardening

**Findings:** S9, S10, S11, S12, S13, S14
**Dependencies:** None
**Risk:** CRITICAL / HIGH — these are exploitable vulnerabilities

### S12: CreateSubscription cross-tenant IDOR

**File:** `src/core/GymManager.Application/Subscriptions/CreateSubscription/CreateSubscriptionCommandHandler.cs`

**Problem:** After fetching the member by ID (line 28), the handler never checks that `member.GymHouseId == request.GymHouseId`. An attacker managing Gym A can create a subscription for a member belonging to Gym B.

**Fix:** After the null check on line 30, add:
```csharp
if (member.GymHouseId != request.GymHouseId)
    return Result.Failure<SubscriptionDto>(new ForbiddenError("Member does not belong to this gym house.").ToString());
```

**Test:** Write a test that creates a member in GymHouse A, then sends a CreateSubscriptionCommand with GymHouse B. Assert the result is a failure with "does not belong".

### S13: FreezeSubscription + CancelSubscription cross-tenant IDOR

**Files:**
- `src/core/GymManager.Application/Subscriptions/FreezeSubscription/FreezeSubscriptionCommandHandler.cs`
- `src/core/GymManager.Application/Subscriptions/CancelSubscription/CancelSubscriptionCommandHandler.cs`

**Problem:** Both handlers fetch subscription by ID but never verify `subscription.GymHouseId == request.GymHouseId`.

**Fix:** In both handlers, after the null check on the subscription, add:
```csharp
if (subscription.GymHouseId != request.GymHouseId)
    return Result.Failure<SubscriptionDto>(new ForbiddenError("Subscription does not belong to this gym house.").ToString());
```

**Tests:** For each handler, test that operating on a subscription from a different GymHouseId returns failure.

### S9: PermissionChecker ignores userId and tenantId

**File:** `src/core/GymManager.Infrastructure/Auth/PermissionChecker.cs`

**Problem:** `HasPermission(Guid userId, Guid tenantId, Permission required)` ignores both `userId` and `tenantId`, only checking `currentUser.Permissions`. This means any authenticated user's permissions bitmask is checked against the *current* user's claims regardless of the userId/tenantId arguments.

**Fix:** Since permissions are resolved at token-generation time and embedded in claims (via `JwtTokenService.ResolvePermissionsAsync`), and all callers pass `currentUser.UserId` and the request's gymHouseId, the implementation is functionally correct for the current call pattern. However, the interface is misleading.

Two options:
1. **Remove unused params** from the interface — breaking change, touches every handler.
2. **Add a guard** that asserts `userId == currentUser.UserId` and logs a warning if tenantId differs.

**Recommended:** Option 2 — add an assertion. If `userId != currentUser.UserId`, throw `InvalidOperationException`. This catches misuse without changing the interface signature.

**Test:** Unit test that passing a different userId throws.

### S10: JwtTokenService skips issuer/audience validation on refresh

**File:** `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs` (lines 67-77)

**Problem:** `GetPrincipalFromExpiredToken` sets `ValidateIssuer = issuer is not null` — if config omits `Jwt:Issuer`, validation is skipped entirely.

**Fix:** Always validate issuer and audience. Change to:
```csharp
ValidateIssuer = true,
ValidIssuer = configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer configuration is missing."),
ValidateAudience = true,
ValidAudience = configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience configuration is missing."),
```

**Test:** Unit test that `GetPrincipalFromExpiredToken` throws when issuer/audience config is missing.

### S11: Open registration grants Owner + Admin

**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommandHandler.cs`

**Problem:** Every new registration creates a user with `Role.Owner` and `Permission.Admin`. This is by design (gym owner self-registration), but has no guardrail against abuse.

**Fix:** This is an intentional design decision (gym owner onboarding). Add a comment documenting the rationale. If invite-only registration is desired later, add a feature flag. No code change needed now, but add rate limiting to the register endpoint if not already present.

**Verification:** Confirm `RateLimitPolicies.Auth` is applied to the register endpoint.

### S14: Weak password policy

**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommandValidator.cs`

**Problem:** Only requires 8-character minimum length. No uppercase, lowercase, digit, or special character requirements.

**Fix:** Add complexity rules:
```csharp
RuleFor(x => x.Password)
    .NotEmpty().WithMessage("Password is required.")
    .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
    .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
    .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
    .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
    .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");
```

**Test:** Validator unit tests for each rule (covers T1 partially).

### File Ownership
- `src/core/GymManager.Application/Subscriptions/**` — this phase
- `src/core/GymManager.Infrastructure/Auth/PermissionChecker.cs` — this phase
- `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs` — this phase
- `src/core/GymManager.Application/Auth/Register/RegisterCommandValidator.cs` — this phase
- `tests/GymManager.Application.Tests/Subscriptions/**` — this phase
- `tests/GymManager.Infrastructure.Tests/Auth/**` — this phase (new)

---

## Phase 2: Backend Quality — Error Handling + Code Hygiene

**Findings:** Q1, Q2, Q3, Q4, Q5, Q6, Q7
**Dependencies:** None (can run in parallel with Phase 1)
**Risk:** HIGH — fragile error routing, architecture violations

### Q1 + Q2 + Q3: ApiControllerBase string-matching + missing Title + duplication

**File:** `src/apps/GymManager.Api/Controllers/ApiControllerBase.cs`

**Problem:** `HandleResult<T>` and `HandleResult` use substring matching (`"not found"`, `"already"`) to determine HTTP status codes. This is fragile. The `ToProblem` method omits the RFC 7807 `Title` field. Both overloads duplicate the same switch logic.

**Fix:** Introduce an `AppError` base type with discriminated subtypes. Handlers already use `NotFoundError`, `ForbiddenError`, `ConflictError` — but they call `.ToString()` and pass strings into `Result.Failure<T>(string)`.

Step 1 — Create `src/core/GymManager.Application/Common/Models/AppError.cs`:
```csharp
public abstract record AppError(string Message);
// NotFoundError, ForbiddenError, ConflictError, ValidationError already exist — make them extend AppError
```

Step 2 — Change handlers to return `Result<T, AppError>` instead of `Result<T>` with string errors. This is a large change touching all 59 handlers. To keep the PR small, do it in two sub-steps:
- Sub-step A: Add a `MapToStatusCode` extension method on `string` that uses a prefix convention (e.g., `[NOT_FOUND]`, `[FORBIDDEN]`, `[CONFLICT]`) instead of substring matching. Update `HandleResult` to use it. Update error `.ToString()` methods to include the prefix.
- Sub-step B (future phase): Migrate to `Result<T, AppError>` across all handlers.

**Recommended for this PR:** Sub-step A only. Change the error types to prefix their ToString output:
```csharp
public sealed record NotFoundError(string Resource, object Id)
{
    public override string ToString() => $"[NOT_FOUND] {Resource} with id '{Id}' was not found.";
}
```

Then update ApiControllerBase to match on prefix:
```csharp
var e when e.StartsWith("[NOT_FOUND]") => NotFound(ToProblem("Not Found", e, 404)),
var e when e.StartsWith("[FORBIDDEN]") => StatusCode(403, ToProblem("Forbidden", e, 403)),
var e when e.StartsWith("[CONFLICT]") => Conflict(ToProblem("Conflict", e, 409)),
```

Add `Title` to `ToProblem`:
```csharp
private ProblemDetails ToProblem(string title, string detail, int status) => new()
{
    Title = title,
    Status = status,
    Detail = detail,
    Instance = HttpContext.Request.Path
};
```

Extract the shared switch into a private method to eliminate the duplication between `HandleResult<T>` and `HandleResult`.

**Tests:** Unit test the error type `ToString()` outputs. Integration test that a not-found response returns 404 with Title field populated.

### Q4: ICurrentUser injected into 3 controllers

**Files:**
- `src/apps/GymManager.Api/Controllers/AnnouncementsController.cs`
- `src/apps/GymManager.Api/Controllers/NotificationsController.cs`
- `src/apps/GymManager.Api/Controllers/NotificationPreferencesController.cs`

**Problem:** Controllers inject `ICurrentUser` to read `currentUser.UserId` before sending commands. This violates architecture rule 1 ("Controllers only call Sender.Send()").

**Fix:** Move the userId into the command. For `AnnouncementsController.Create`, the `CreateAnnouncementCommand` already has an `AuthorId` field. Instead of injecting `ICurrentUser`, have the handler read `ICurrentUser.UserId` internally (it already does — the controller is duplicating what the handler should own). Remove `ICurrentUser` from the controller constructors. If the command needs userId, the handler should source it from `ICurrentUser`.

For each controller:
1. Remove `ICurrentUser` from the constructor
2. Remove any `currentUser.UserId` usage
3. If the command expects a userId field (like `AuthorId`), either remove that field from the command and let the handler read it, or keep the field but populate it from the handler

**Tests:** Existing tests should still pass. Verify no controller injects `ICurrentUser` after changes.

### Q5: 5 RBAC handlers bypass IPermissionChecker

**Files:**
- `src/core/GymManager.Application/Roles/ChangeUserRole/ChangeUserRoleCommandHandler.cs`
- `src/core/GymManager.Application/Roles/GetRolePermissions/GetRolePermissionsQueryHandler.cs`
- `src/core/GymManager.Application/Roles/ResetDefaultPermissions/ResetDefaultPermissionsCommandHandler.cs`
- `src/core/GymManager.Application/Roles/UpdateRolePermissions/UpdateRolePermissionsCommandHandler.cs`
- `src/core/GymManager.Application/Roles/GetRoleUsers/GetRoleUsersQueryHandler.cs`

**Problem:** All five use `currentUser.Role != Role.Owner` instead of `IPermissionChecker`. This bypasses the permission system.

**Fix:** Replace the inline role check with:
```csharp
var canManage = await permissions.HasPermissionAsync(
    currentUser.UserId, currentUser.TenantId, Permission.ManageRoles, ct);
if (!canManage)
    return Result.Failure(...);
```

Ensure `Permission.ManageRoles` exists in the `Permission` enum (or use whatever flag covers RBAC management). If it does not exist, add it and assign it to the Owner role by default.

**Tests:** Update existing RBAC handler tests to verify permission check is called.

### Q6: Magic numbers for token expiry

**Files:**
- `src/core/GymManager.Application/Auth/Login/LoginCommandHandler.cs` (lines 25, 35)
- `src/core/GymManager.Application/Auth/Register/RegisterCommandHandler.cs` (lines 39, 49)
- `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs` (line 51)

**Problem:** `AddDays(7)` and `AddMinutes(15)` repeated across files without a shared constant.

**Fix:** Create a `TokenDefaults` static class in `Application/Common/Constants/`:
```csharp
public static class TokenDefaults
{
    public const int AccessTokenExpiryMinutes = 15;
    public const int RefreshTokenExpiryDays = 7;
}
```

Replace all magic numbers with references to this class. Alternatively, read from `IConfiguration` and inject the values.

**Tests:** None needed beyond existing tests passing.

### Q7: Duplicated booking creation logic

**File:** `src/core/GymManager.Application/Bookings/CreateBooking/CreateBookingCommandHandler.cs`

**Problem:** Waitlist and direct booking creation share duplicate logic in two private methods.

**Fix:** Extract the shared logic into a single private method that accepts a `BookingStatus` parameter. Both call paths invoke this method with either `BookingStatus.Confirmed` or `BookingStatus.Waitlisted`.

**Tests:** Existing booking tests should continue to pass.

### File Ownership
- `src/apps/GymManager.Api/Controllers/ApiControllerBase.cs` — this phase
- `src/core/GymManager.Application/Common/Models/Errors.cs` — this phase
- `src/apps/GymManager.Api/Controllers/AnnouncementsController.cs` — this phase
- `src/apps/GymManager.Api/Controllers/NotificationsController.cs` — this phase
- `src/apps/GymManager.Api/Controllers/NotificationPreferencesController.cs` — this phase
- `src/core/GymManager.Application/Roles/**/` — this phase (permission check fix)
- `src/core/GymManager.Application/Auth/**/LoginCommandHandler.cs` — this phase (magic numbers)
- `src/core/GymManager.Application/Auth/**/RegisterCommandHandler.cs` — shared with Phase 1
- `src/core/GymManager.Application/Bookings/CreateBooking/CreateBookingCommandHandler.cs` — this phase
- `src/core/GymManager.Application/Common/Constants/` — this phase (new)

---

## Phase 3: Secrets + HTTP Hardening

**Findings:** S1, S2, S7, S8
**Dependencies:** None
**Risk:** CRITICAL (S1, S2) / HIGH (S7, S8)

### S1 + S2: Secrets in appsettings.json

**Files:**
- `src/apps/GymManager.Api/appsettings.json`
- `src/apps/GymManager.BackgroundServices/appsettings.json`

**Problem:** JWT secret, DB connection string with password, and RabbitMQ credentials are committed to source control.

**Fix:**
1. Replace secret values in `appsettings.json` with placeholder references:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "Jwt": {
    "Secret": "",
    "Issuer": "GymManager",
    "Audience": "GymManager"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Username": "",
    "Password": ""
  }
}
```

2. Create `appsettings.Development.json` (already gitignored: NO, it is NOT gitignored per .gitignore line 21) with the local dev values. Since `appsettings.Development.json` is tracked, create `appsettings.Local.json` instead and add it to `.gitignore`.

Actually, looking at the .gitignore again: `!appsettings.Development.json` means it IS tracked. So:

- Move actual secrets to environment variables or `dotnet user-secrets`
- Replace `appsettings.json` values with empty strings or `"CHANGE_ME"` placeholders
- Document in README that developers must set env vars or use `dotnet user-secrets init` + `dotnet user-secrets set`
- For local dev convenience, create `appsettings.Local.json` (add `appsettings.Local.json` to .gitignore) that overrides with local values
- Add `appsettings.Local.json` to the config builder chain in `Program.cs`

3. Generate a strong JWT secret for production (64+ random bytes, base64 encoded).

**Tests:** App should still start with env vars set. No automated test needed, but verify `dotnet build` succeeds.

### S7: AllowedHosts: "*"

**File:** `src/apps/GymManager.Api/appsettings.json`

**Problem:** No host header filtering. Enables host header injection attacks.

**Fix:** Set `AllowedHosts` to the actual expected hostnames for each environment. In dev, use `localhost`. In prod, set via env var.
```json
"AllowedHosts": "localhost"
```

### S8: No HTTP security headers

**File:** `src/apps/GymManager.Api/Program.cs`

**Problem:** No CSP, X-Frame-Options, HSTS, X-Content-Type-Options, or Referrer-Policy headers.

**Fix:** Add security headers middleware after `UseHttpsRedirection()`:
```csharp
app.UseHsts(); // already handles HSTS in production

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
});
```

Or use the `NWebsec.AspNetCore.Middleware` NuGet package for a more robust solution.

**Tests:** Integration test that verifies security headers are present in responses.

### File Ownership
- `src/apps/GymManager.Api/appsettings.json` — this phase
- `src/apps/GymManager.BackgroundServices/appsettings.json` — this phase
- `src/apps/GymManager.Api/Program.cs` — this phase (security headers only; shared with Phase 2)
- `.gitignore` — this phase

---

## Phase 4: Performance — N+1 Queries

**Findings:** P1, P2, P3
**Dependencies:** None
**Risk:** HIGH — observable latency under load

### P1: N+1 in GetBookingsQueryHandler

**File:** `src/core/GymManager.Application/Bookings/GetBookings/GetBookingsQueryHandler.cs`

**Problem:** Line 30 fetches member per booking in a loop: `await memberRepository.GetByIdAsync(booking.MemberId, ct)`. If the booking's `Member` nav property is null (not eagerly loaded), this triggers a DB roundtrip per booking.

**Fix:** Ensure the repository query eagerly loads `.Include(b => b.Member)`. Modify `IBookingRepository.GetByGymHouseAsync` to include members.

Alternatively, collect all distinct `MemberId` values from bookings where `Member` is null, batch-fetch them in one query, then look up from a dictionary:
```csharp
var missingMemberIds = pagedBookings.Items
    .Where(b => b.Member is null)
    .Select(b => b.MemberId)
    .Distinct()
    .ToList();

var members = missingMemberIds.Count > 0
    ? (await memberRepository.GetByIdsAsync(missingMemberIds, ct)).ToDictionary(m => m.Id)
    : new Dictionary<Guid, Member>();
```

Add `GetByIdsAsync(IReadOnlyList<Guid> ids, CancellationToken ct)` to `IMemberRepository` if it does not exist.

**Tests:** Verify GetBookingsQuery returns correct member data. No N+1 observable in test, but ensure the batch method works.

### P2: N+1 in PayrollApprovedConsumer

**File:** `src/apps/GymManager.BackgroundServices/Consumers/PayrollApprovedConsumer.cs`

**Problem:** Lines 31-48 loop over entries, calling `ExistsByRelatedEntityIdAsync` and `RecordAsync` per entry. Each entry triggers 1-2 DB roundtrips.

**Fix:** Batch the existence check and inserts:
1. Collect all `entry.Id` values
2. Call a new `GetExistingRelatedEntityIdsAsync(IReadOnlyList<Guid> entityIds, TransactionType type, ct)` that returns the set of already-recorded IDs
3. Build all `Transaction` objects in memory
4. Call `RecordBatchAsync(IReadOnlyList<Transaction> transactions, ct)` for a single DB insert
5. Publish events after the batch insert

**Tests:** Update `PayrollApprovedConsumerTests` to verify batch behavior.

### P3: N+1 in AnnouncementFcmConsumer

**File:** `src/apps/GymManager.BackgroundServices/Consumers/AnnouncementFcmConsumer.cs`

**Problem:** Line 41 calls `preferenceRepository.GetByUserIdAsync(recipient.Id, ct)` per recipient.

**Fix:** Batch-fetch all preferences for the recipient IDs:
```csharp
var recipientIds = recipients.Select(r => r.Id).ToList();
var allPrefs = await preferenceRepository.GetByUserIdsAsync(recipientIds, ct);
var prefsByUser = allPrefs.GroupBy(p => p.UserId).ToDictionary(g => g.Key, g => g.ToList());
```

Add `GetByUserIdsAsync(IReadOnlyList<Guid> userIds, CancellationToken ct)` to `INotificationPreferenceRepository`.

**Tests:** Update consumer tests to verify single batch call.

### File Ownership
- `src/core/GymManager.Application/Bookings/GetBookings/GetBookingsQueryHandler.cs` — this phase
- `src/core/GymManager.Application/Common/Interfaces/IMemberRepository.cs` — this phase (add batch method)
- `src/core/GymManager.Infrastructure/Persistence/Repositories/MemberRepository.cs` — this phase
- `src/apps/GymManager.BackgroundServices/Consumers/PayrollApprovedConsumer.cs` — this phase
- `src/core/GymManager.Application/Common/Interfaces/ITransactionRepository.cs` — this phase (add batch methods)
- `src/core/GymManager.Infrastructure/Persistence/Repositories/TransactionRepository.cs` — this phase
- `src/apps/GymManager.BackgroundServices/Consumers/AnnouncementFcmConsumer.cs` — this phase
- `src/core/GymManager.Application/Common/Interfaces/INotificationPreferenceRepository.cs` — this phase (add batch method)
- `src/core/GymManager.Infrastructure/Persistence/Repositories/NotificationPreferenceRepository.cs` — this phase

---

## Phase 5: Frontend Security — Token Storage + Auth Cookies

**Findings:** S3, S4, S5, S6
**Dependencies:** Phase 1 (backend auth endpoints may need to set HttpOnly cookies)
**Risk:** HIGH — XSS can steal tokens

### S3: JWT + refresh token in localStorage

**File:** `src/apps/gymmanager-web/src/stores/auth-store.ts`

**Problem:** Lines 63-64 store access and refresh tokens in `localStorage`, which is accessible to any JavaScript running on the page (XSS vector).

**Fix:** Move refresh token to an HttpOnly cookie set by the backend. The access token can remain in memory (Zustand state) but should not be persisted to localStorage.

Backend changes:
- Login and refresh endpoints set `refresh_token` as an HttpOnly, Secure, SameSite=Strict cookie
- Refresh endpoint reads the cookie instead of accepting the token in the request body

Frontend changes:
- Remove `localStorage.setItem("refresh_token", ...)`
- Remove `localStorage.setItem("access_token", ...)`
- Keep the access token in Zustand state only (lost on page refresh, restored via refresh token cookie)
- The refresh endpoint call will automatically include the HttpOnly cookie

### S4 + S5: Client-writable auth cookies

**Files:**
- `src/apps/gymmanager-web/src/stores/auth-store.ts` (lines 22-38)
- `src/apps/gymmanager-web/src/middleware.ts` (lines 99, 114, 117)

**Problem:** `is_authenticated` and `user_role` cookies are set by client-side JavaScript and read by Next.js middleware for route guarding. An attacker can set these cookies via browser console to bypass frontend route guards.

**Fix:** The middleware already comments "backend enforces security" (line 112). These cookies are UX-only route guards, not security boundaries. The fix is:
1. Add a comment in middleware.ts documenting that these are UX hints, not security controls
2. Optionally, sign the cookies with an HMAC using a shared secret between the API and the Next.js server — but this adds complexity for a UX-only feature
3. The real fix is S3 (HttpOnly refresh cookie) — once the backend owns the auth cookie, the middleware can check for its existence

For this phase: document the limitation, ensure backend always revalidates. Consider renaming cookies to `_ux_is_authenticated` to signal their non-security nature.

### S6: dangerouslySetInnerHTML in layout.tsx

**File:** `src/apps/gymmanager-web/src/app/layout.tsx` (lines 30-34)

**Problem:** The inline script reads `localStorage.getItem('theme-storage')` and parses it as JSON. If an attacker controls localStorage (via XSS), they could inject script content.

**Analysis:** The script only reads a theme preference and adds/removes a CSS class. The parsed value is compared with `===` against string literals (`'dark'`, `'system'`). No user input is interpolated into the script itself — the script text is a static string. The actual risk is low because:
- The script itself is hardcoded, not dynamically generated
- `JSON.parse` of a tampered localStorage value would not execute code
- The only action is `classList.add('dark')`

**Fix:** The `dangerouslySetInnerHTML` usage here is a standard pattern for avoiding FOUC (flash of unstyled content) with theme detection. The risk is minimal because the script is static. Add a comment explaining why this is acceptable. No code change needed.

### File Ownership
- `src/apps/gymmanager-web/src/stores/auth-store.ts` — this phase
- `src/apps/gymmanager-web/src/middleware.ts` — this phase
- `src/apps/gymmanager-web/src/app/layout.tsx` — this phase
- Backend auth controllers/handlers for HttpOnly cookie changes — shared with Phase 1

---

## Phase 6: Test Coverage — Validators + Untested Handlers

**Findings:** T1, T2
**Dependencies:** Phases 1-4 (test code written against the fixed implementations)
**Risk:** CRITICAL — half the Application layer has no test coverage

### T1: Zero validator unit tests (29 validators)

**Approach:** Create one test class per validator. Each test class covers:
- Valid input passes
- Each validation rule triggers on invalid input
- Edge cases (empty string, null, boundary values)

**File pattern:** `tests/GymManager.Application.Tests/{Feature}/{ValidatorName}Tests.cs`

Priority validators (highest risk):
1. `RegisterCommandValidator` — password complexity (from Phase 1 fix)
2. `CreateSubscriptionCommandValidator`
3. `CreateMemberCommandValidator`
4. `CreateBookingCommandValidator`
5. `LoginCommandValidator`

Remaining 24 validators: follow the same pattern, one test class each.

### T2: 28 untested handlers

**Approach:** For each untested handler, create a test class with:
- Happy path test
- Permission denied test (for command handlers)
- Not-found test (for handlers that look up entities)
- Business rule violation tests (specific to each handler)

Priority handlers (highest risk — handlers that mutate data):
1. `UpdateMemberCommandHandler`
2. `UpdateGymHouseCommandHandler`
3. `DeleteGymHouseCommandHandler`
4. `UpdateClassScheduleCommandHandler`
5. `RenewSubscriptionCommandHandler`
6. `CreateShiftAssignmentCommandHandler`
7. `UpdateShiftAssignmentCommandHandler`
8. `UpdateStaffCommandHandler`
9. `MarkNoShowCommandHandler`
10. `UpdateNotificationPreferencesCommandHandler`

Query handlers (lower risk but still need coverage):
11-28. Remaining `Get*` query handlers

### File Ownership
- `tests/GymManager.Application.Tests/**` — this phase (new test files only; do not modify existing tests)

---

## Implementation Order

```
Phase 1 (Security IDOR + Auth)  ──┐
                                    ├── can run in parallel
Phase 2 (Quality + Error Handling) ┘
         │
Phase 3 (Secrets + HTTP) ── after Phase 2 (shares Program.cs)
         │
Phase 4 (Performance N+1) ── independent, any time after Phase 1
         │
Phase 5 (Frontend Security) ── after Phase 1 (backend HttpOnly cookie changes)
         │
Phase 6 (Test Coverage) ── last, tests the fixed code from all prior phases
```

---

## Success Criteria Verification

| Criterion | Phase |
|-----------|-------|
| All cross-tenant IDOR vectors closed | Phase 1 (S12, S13 fixes) |
| No secrets in source control | Phase 3 (S1, S2 fixes) |
| ApiControllerBase uses strongly-typed errors | Phase 2 (Q1 fix) |
| Zero N+1 queries in identified locations | Phase 4 (P1, P2, P3 fixes) |
| All existing tests pass after changes | Verified at end of each phase |
| New tests added for fixed code paths | Phases 1-4 include tests; Phase 6 for coverage |
