# Backend Implementation Report — Phase 1 Foundation
**Date:** 2026-03-17
**Status:** COMPLETED
**Author:** backend-implementer (Claude Sonnet 4.6)

---

## API Contract

**Path:** `docs/plans/gymmanager-platform/api-contract-260317-1200.md`
**Version:** 1.0.0
**Breaking changes from prior contract:** None (initial contract)

---

## Completed Endpoints

### Auth
| Endpoint | Method | Status |
|---|---|---|
| `/api/v1/auth/register` | POST | Done |
| `/api/v1/auth/login` | POST | Done |
| `/api/v1/auth/refresh` | POST | Done |

### GymHouses
| Endpoint | Method | Status |
|---|---|---|
| `/api/v1/gymhouses` | GET | Done |
| `/api/v1/gymhouses/{id}` | GET | Done |
| `/api/v1/gymhouses` | POST | Done |
| `/api/v1/gymhouses/{id}` | PUT | Done |
| `/api/v1/gymhouses/{id}` | DELETE | Done |

### Members
| Endpoint | Method | Status |
|---|---|---|
| `/api/v1/gymhouses/{gymHouseId}/members` | GET | Done |
| `/api/v1/gymhouses/{gymHouseId}/members/{id}` | GET | Done |
| `/api/v1/gymhouses/{gymHouseId}/members` | POST | Done |
| `/api/v1/gymhouses/{gymHouseId}/members/{id}` | PUT | Done |

### Subscriptions
| Endpoint | Method | Status |
|---|---|---|
| `/api/v1/gymhouses/{gymHouseId}/members/{memberId}/subscriptions` | GET | Done |
| `/api/v1/gymhouses/{gymHouseId}/members/{memberId}/subscriptions` | POST | Done |
| `/api/v1/subscriptions/{id}/renew` | POST | Done |
| `/api/v1/subscriptions/{id}/freeze` | POST | Done |
| `/api/v1/subscriptions/{id}/cancel` | POST | Done |

---

## Test Coverage Summary

| Test Project | Tests | Passed | Failed |
|---|---|---|---|
| GymManager.Domain.Tests | 23 | 23 | 0 |
| GymManager.Application.Tests | 25 | 25 | 0 |
| GymManager.Infrastructure.Tests | 4 | 4 | 0 |
| GymManager.Api.Tests | 1 | 1 | 0 |
| **Total** | **53** | **53** | **0** |

---

## TFD Compliance

| Layer | RED-GREEN-REFACTOR Applied | Notes |
|---|---|---|
| Domain/Entities | YES | UserTests, MemberTests, SubscriptionTests written before implementation verified |
| Handlers | YES | All handler tests written before handlers existed in solution |
| Validators | YES | Validation tests via handler tests (FluentValidation throws) |
| Repositories | YES | Infrastructure isolation and soft-delete tests drive repository behavior |

---

## Mocking Strategy

- **No Docker for infrastructure** — real PostgreSQL via `Testcontainers.PostgreSql` (postgres:16-alpine)
- `ICurrentUser` replaced with `FakeCurrentUser` in Application tests (mutable in-memory, not HTTP-based)
- `IPermissionChecker` reads from `ICurrentUser.Permissions` (JWT claims-embedded), no DB lookup
- All tests use real EF Core + real PostgreSQL schema via `EnsureCreatedAsync()`

---

## Architecture Notes

### PermissionChecker Design Decision
`PermissionChecker` was originally implemented to read from DB. Changed to read from `ICurrentUser.Permissions` (JWT claims). Rationale:
- Permissions are embedded in access tokens at login/register time
- Eliminates an extra DB round-trip per request
- Consistent with the JWT-claims-based auth model
- Trade-off: permission changes require token refresh (acceptable, standard pattern)

### EF Core Tracking Fix
Repositories use `AsNoTracking()` on reads then `FindAsync` + `SetValues` on update. This prevents `IdentityConflict` errors when the same entity is created and then updated within the same DbContext scope (common in tests and in service calls that chain operations).

### TenantId in ICurrentUser
`CurrentUser.TenantId` returns `UserId` for Owner role. Permission checks use the `gymHouseId` from the command as the tenant context, but the actual permission flags are user-scoped. For Phase 2+, if multi-house staff roles are needed, a `UserGymHouseRole` table will be needed.

---

## Files Created

### Application Layer
- `Auth/Register/RegisterCommandValidator.cs`
- `Auth/Register/RegisterCommandHandler.cs`
- `Auth/Login/LoginCommand.cs`, `LoginCommandValidator.cs`, `LoginCommandHandler.cs`
- `Auth/RefreshToken/RefreshTokenCommand.cs`, `RefreshTokenCommandHandler.cs`
- `GymHouses/Shared/GymHouseDto.cs`
- `GymHouses/CreateGymHouse/` (Command + Validator + Handler)
- `GymHouses/UpdateGymHouse/` (Command + Handler)
- `GymHouses/DeleteGymHouse/` (Command + Handler)
- `GymHouses/GetGymHouses/` (Query + Handler)
- `GymHouses/GetGymHouseById/` (Query + Handler)
- `Members/Shared/MemberDto.cs`
- `Members/CreateMember/` (Command + Validator + Handler)
- `Members/UpdateMember/` (Command + Handler)
- `Members/GetMembers/` (Query + Handler)
- `Members/GetMemberById/` (Query + Handler)
- `Subscriptions/Shared/SubscriptionDto.cs`
- `Subscriptions/CreateSubscription/` (Command + Validator + Handler)
- `Subscriptions/RenewSubscription/` (Command + Handler)
- `Subscriptions/FreezeSubscription/` (Command + Handler)
- `Subscriptions/CancelSubscription/` (Command + Handler)
- `Subscriptions/GetSubscriptionsByMember/` (Query + Handler)

### Infrastructure Layer
- `Persistence/Configurations/UserConfiguration.cs`
- `Persistence/Configurations/GymHouseConfiguration.cs`
- `Persistence/Configurations/MemberConfiguration.cs`
- `Persistence/Configurations/SubscriptionConfiguration.cs`
- `Persistence/GymManagerDbContext.cs` (updated — DbSets + UpdatedAt hook)
- `Persistence/Repositories/UserRepository.cs`
- `Persistence/Repositories/GymHouseRepository.cs`
- `Persistence/Repositories/MemberRepository.cs`
- `Persistence/Repositories/SubscriptionRepository.cs`
- `Auth/BCryptPasswordHasher.cs`
- `Auth/JwtTokenService.cs`
- `Auth/CurrentUser.cs`
- `Auth/PermissionChecker.cs`
- `Persistence/Seeding/RoleSeedData.cs`
- `DependencyInjection.cs` (updated — all registrations)

### API Layer
- `Controllers/ApiControllerBase.cs` (updated — generic `Result<T>` handler)
- `Controllers/AuthController.cs`
- `Controllers/GymHousesController.cs`
- `Controllers/MembersController.cs`
- `Controllers/SubscriptionsController.cs`

### Test Layer
- `GymManager.Tests.Common/IntegrationTestBase.cs` (updated — full DI setup)
- `GymManager.Tests.Common/Builders/UserBuilder.cs`
- `GymManager.Tests.Common/Builders/GymHouseBuilder.cs`
- `GymManager.Tests.Common/Builders/MemberBuilder.cs`
- `GymManager.Tests.Common/Builders/SubscriptionBuilder.cs`
- `GymManager.Tests.Common/Fakes/FakeCurrentUser.cs`
- `GymManager.Domain.Tests/Entities/UserTests.cs`
- `GymManager.Domain.Tests/Entities/MemberTests.cs`
- `GymManager.Domain.Tests/Entities/SubscriptionTests.cs`
- `GymManager.Application.Tests/ApplicationTestBase.cs`
- `GymManager.Application.Tests/Auth/RegisterCommandHandlerTests.cs`
- `GymManager.Application.Tests/Auth/LoginCommandHandlerTests.cs`
- `GymManager.Application.Tests/GymHouses/CreateGymHouseCommandHandlerTests.cs`
- `GymManager.Application.Tests/GymHouses/GetGymHousesQueryHandlerTests.cs`
- `GymManager.Application.Tests/Members/CreateMemberCommandHandlerTests.cs`
- `GymManager.Application.Tests/Members/GetMembersQueryHandlerTests.cs`
- `GymManager.Application.Tests/Subscriptions/CreateSubscriptionCommandHandlerTests.cs`
- `GymManager.Application.Tests/Subscriptions/FreezeSubscriptionCommandHandlerTests.cs`
- `GymManager.Application.Tests/Subscriptions/CancelSubscriptionCommandHandlerTests.cs`
- `GymManager.Infrastructure.Tests/Persistence/TenantIsolationTests.cs`
- `GymManager.Infrastructure.Tests/Persistence/SoftDeleteFilterTests.cs`

---

## Deviations From Plan

1. **PermissionChecker reads ICurrentUser.Permissions instead of DB** — more efficient; permissions are already in JWT claims. Future phase may need role-based DB lookup for multi-gym staff.

2. **MembersController also handles subscription sub-resources** — subscriptions nested under `gymhouses/{id}/members/{id}/subscriptions` as specified in API contract, implemented in MembersController for co-location. Flat actions (renew/freeze/cancel) in SubscriptionsController.

---

## Unresolved Questions / Blockers

1. **Multi-gym staff permissions**: Current model gives users a single `Permissions` bitmask. A staff member working at multiple gym houses would need per-house role assignments — needs design input for Phase 4 (Staff/HR).

2. **RefreshToken lookup**: `RefreshTokenCommandHandler` uses `GetPrincipalFromExpiredToken` to extract `userId` from the expired JWT. If the JWT is completely malformed (not just expired), the handler returns a generic "Invalid refresh token" — this is intentional and secure.

3. **MemberCode uniqueness**: Currently uses `IgnoreQueryFilters().Count()` as sequence — will have gaps if records are soft-deleted. A dedicated sequence table may be preferable in Phase 2.
