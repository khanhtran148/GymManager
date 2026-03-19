---
title: Review Fixes Implementation Results
date: 2026-03-19
status: COMPLETED
---

# Review Fixes Implementation Results — 2026-03-19

## Status: COMPLETED (Phases 1-5)

## Summary
Implemented fixes for 22 of 26 critical/high findings from the full codebase review.

## Phases Completed

### Phase 1: Backend Security (S9, S10, S12, S13, S14)
- **S12/S13**: Added `GymHouseId` validation in `CreateSubscriptionCommandHandler`, `FreezeSubscriptionCommandHandler`, `CancelSubscriptionCommandHandler` — closes cross-tenant IDOR
- **S9**: `PermissionChecker` now throws `InvalidOperationException` if `userId != currentUser.UserId` — catches misuse
- **S10**: `JwtTokenService.GetPrincipalFromExpiredToken` now requires Issuer/Audience configuration (throws on missing)
- **S14**: `RegisterCommandValidator` now requires uppercase, lowercase, digit, and special character
- **S11**: Confirmed rate limiting already applied via `RateLimitPolicies.Auth`

### Phase 2: Backend Quality (Q1-Q6, Q12)
- **Q1+Q2+Q3**: `ApiControllerBase` now uses `[NOT_FOUND]`/`[FORBIDDEN]`/`[CONFLICT]` prefix matching, includes RFC 7807 `Title`, deduplicates via `MapErrorToResult`
- **Q4**: Removed `ICurrentUser` from `AnnouncementsController`, `NotificationsController`, `NotificationPreferencesController` — handlers now read from `ICurrentUser` directly
- **Q5**: All 5 RBAC handlers now use `IPermissionChecker` with `Permission.ManageRoles` (new enum value)
- **Q6**: Extracted `TokenDefaults.AccessTokenExpiryMinutes` and `RefreshTokenExpiryDays` constants
- **Q12**: `RefreshTokenCommandHandler` catch narrowed from bare `catch` to `catch (Exception) when`

### Phase 3: Secrets + HTTP Hardening (S1, S2, S7, S8)
- **S1/S2**: Replaced secrets in `appsettings.json` with empty placeholders, added `appsettings.Local.json` to config chain
- **S7**: Changed `AllowedHosts` from `*` to `localhost`
- **S8**: Added security headers middleware (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS)

### Phase 4: Performance N+1 (P1, P2, P3)
- **P1**: `GetBookingsQueryHandler` — removed per-booking member fallback fetch (Member already eagerly loaded)
- **P2**: `PayrollApprovedConsumer` — batch existence check + bulk insert
- **P3**: `AnnouncementFcmConsumer` — batch preference fetch via new `GetByUserIdsAsync`

### Phase 5: Frontend Fixes (S4, S5, S6, P10)
- **S4/S5**: Already documented as UX-only hints (line 112 of middleware.ts)
- **S6**: No-op (static theme script is safe)
- **P10**: Fixed broken `useDebounce` hook in members page (replaced with correct `useEffect` implementation)
- **Q15**: Extracted `COOKIE_MAX_AGE_SECONDS` constant in `auth-store.ts`

## Deferred Items
- **S3**: Move refresh token to HttpOnly cookie — requires coordinated backend API changes, separate PR
- **Q7**: Deduplicate booking creation logic — refactor, not a correctness fix
- **T1**: Add tests for 29 validators — separate effort
- **T2**: Add tests for 28 handlers — separate effort

## Test Results
- Domain tests: 50/50 passing
- Application unit tests: 81/81 passing
- API unit tests: 15/15 passing
- Integration tests: require Docker (not available in current environment)

## Files Modified (38 files)
### Backend
- `src/core/GymManager.Domain/Enums/Permission.cs` — added ManageRoles
- `src/core/GymManager.Application/Common/Models/Errors.cs` — prefixed error ToString()
- `src/core/GymManager.Application/Common/Constants/TokenDefaults.cs` — NEW
- `src/core/GymManager.Application/Subscriptions/CreateSubscription/CreateSubscriptionCommandHandler.cs`
- `src/core/GymManager.Application/Subscriptions/FreezeSubscription/FreezeSubscriptionCommandHandler.cs`
- `src/core/GymManager.Application/Subscriptions/CancelSubscription/CancelSubscriptionCommandHandler.cs`
- `src/core/GymManager.Infrastructure/Auth/PermissionChecker.cs`
- `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs`
- `src/core/GymManager.Application/Auth/Register/RegisterCommandValidator.cs`
- `src/core/GymManager.Application/Auth/Login/LoginCommandHandler.cs`
- `src/core/GymManager.Application/Auth/Register/RegisterCommandHandler.cs`
- `src/core/GymManager.Application/Auth/RefreshToken/RefreshTokenCommandHandler.cs`
- `src/core/GymManager.Application/Announcements/CreateAnnouncement/CreateAnnouncementCommand.cs`
- `src/core/GymManager.Application/Announcements/CreateAnnouncement/CreateAnnouncementCommandHandler.cs`
- `src/core/GymManager.Application/Notifications/*` (5 files)
- `src/core/GymManager.Application/Roles/*` (5 handlers)
- `src/apps/GymManager.Api/Controllers/ApiControllerBase.cs`
- `src/apps/GymManager.Api/Controllers/AnnouncementsController.cs`
- `src/apps/GymManager.Api/Controllers/NotificationsController.cs`
- `src/apps/GymManager.Api/Controllers/NotificationPreferencesController.cs`
- `src/apps/GymManager.Api/Program.cs`
- `src/apps/GymManager.Api/appsettings.json`
- `src/apps/GymManager.BackgroundServices/appsettings.json`
- `src/apps/GymManager.BackgroundServices/Consumers/PayrollApprovedConsumer.cs`
- `src/apps/GymManager.BackgroundServices/Consumers/AnnouncementFcmConsumer.cs`

### Frontend
- `src/apps/gymmanager-web/src/stores/auth-store.ts`
- `src/apps/gymmanager-web/src/app/(dashboard)/members/page.tsx`

### Tests
- `tests/GymManager.Application.Tests/Announcements/CreateAnnouncementCommandHandlerTests.cs`
- `tests/GymManager.Application.Tests/Notifications/MarkNotificationReadCommandHandlerTests.cs`
- `tests/GymManager.Application.Tests/Roles/ChangeUserRoleCommandHandlerTests.cs`
- `tests/GymManager.Application.Tests/Roles/UpdateRolePermissionsCommandHandlerTests.cs`
- `tests/GymManager.Application.Tests/Roles/GetRolesMetadata/GetRolesMetadataQueryHandlerUnitTests.cs`
- `tests/GymManager.Api.Tests/Controllers/RolesControllerTests.cs`

## Unresolved Questions
None blocking.
