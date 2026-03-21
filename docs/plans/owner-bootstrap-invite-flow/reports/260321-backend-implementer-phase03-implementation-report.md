# Phase 3 Backend Implementation Report

**Date:** 2026-03-21
**Phase:** Phase 3 — Invite Link System
**Status:** COMPLETED

---

## API Contract

**Path:** `docs/plans/owner-bootstrap-invite-flow/api-contract-260321-1400.md`
**Version:** 1.0
**Breaking changes:** None. New endpoints added only.

---

## Completed Endpoints

| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `POST /api/v1/invitations` | Create invitation | Bearer (ManageStaff or ManageRoles) | Implemented |
| `POST /api/v1/invitations/{token}/accept` | Accept invitation | Anonymous | Implemented |

---

## Files Created / Modified

### New Files

- `src/core/GymManager.Application/Common/Interfaces/IInvitationRepository.cs`
- `src/core/GymManager.Application/Common/Options/InviteOptions.cs`
- `src/core/GymManager.Application/Invitations/Shared/InvitationDto.cs`
- `src/core/GymManager.Application/Invitations/CreateInvitation/CreateInvitationCommand.cs`
- `src/core/GymManager.Application/Invitations/CreateInvitation/CreateInvitationHandler.cs`
- `src/core/GymManager.Application/Invitations/CreateInvitation/CreateInvitationValidator.cs`
- `src/core/GymManager.Application/Invitations/AcceptInvitation/AcceptInvitationCommand.cs`
- `src/core/GymManager.Application/Invitations/AcceptInvitation/AcceptInvitationHandler.cs`
- `src/core/GymManager.Application/Invitations/AcceptInvitation/AcceptInvitationValidator.cs`
- `src/core/GymManager.Infrastructure/Persistence/Configurations/InvitationConfiguration.cs`
- `src/core/GymManager.Infrastructure/Persistence/Repositories/InvitationRepository.cs`
- `src/core/GymManager.Infrastructure/Persistence/Migrations/20260321164608_AddInvitationsTable.cs`
- `src/core/GymManager.Infrastructure/Persistence/Migrations/20260321164608_AddInvitationsTable.Designer.cs`
- `src/apps/GymManager.Api/Controllers/InvitationsController.cs`
- `tests/GymManager.Application.Tests/Invitations/CreateInvitationCommandHandlerTests.cs`
- `tests/GymManager.Application.Tests/Invitations/AcceptInvitationCommandHandlerTests.cs`
- `tests/GymManager.Tests.Common/Fakes/FakeInvitationRepository.cs`

### Modified Files

- `src/core/GymManager.Infrastructure/Persistence/GymManagerDbContext.cs` — added `Invitations` DbSet
- `src/core/GymManager.Infrastructure/DependencyInjection.cs` — registered `IInvitationRepository` + `InviteOptions`
- `tests/GymManager.Tests.Common/IntegrationTestBase.cs` — registered `IInvitationRepository` + `InviteOptions`
- `src/core/GymManager.Application/GymManager.Application.csproj` — added `Microsoft.Extensions.Options` package

---

## Coverage Summary

- **Total tests passing:** 435 (0 failures)
  - Application.Tests: 326 (13 new invitation tests)
  - Infrastructure.Tests: 38
  - Api.Tests: 21
  - Domain.Tests: 50

### Invitation test coverage

**CreateInvitationCommandHandlerTests (6 tests):**
- `Create_WithValidInput_ReturnsInvitationWithToken` — 32-byte URL-safe Base64 token (43 chars), 48h expiry
- `Create_AsOwner_Succeeds` — ManageStaff permission grants access
- `Create_AsMember_ReturnsForbidden` — Permission.None returns FORBIDDEN
- `Create_WithOwnerRole_ReturnsBadRequest` — FluentValidation rejects Owner role
- `Create_DuplicatePendingInvite_ReturnsConflict` — CONFLICT error on duplicate
- `Create_WithInvalidGymHouseId_ReturnsBadRequest` — NOT_FOUND for unknown gym house

**AcceptInvitationCommandHandlerTests (7 tests):**
- `Accept_ValidToken_NewUser_CreatesUserAndMember` — creates User + Member records
- `Accept_ValidToken_ExistingUser_LinksToGym` — links existing user, preserves UserId
- `Accept_ExpiredToken_ReturnsBadRequest` — expired token returns failure
- `Accept_AlreadyAcceptedToken_ReturnsBadRequest` — already-accepted token returns failure
- `Accept_InvalidToken_ReturnsNotFound` — NOT_FOUND for unknown token
- `Accept_SetsAcceptedAt` — AcceptedAt is set on invitation after acceptance
- `Accept_ReturnsJwtWithTenantId` — JWT contains valid `tenant_id` claim (GUID)

---

## TFD Compliance

| Layer | RED (test first) | GREEN (implement) | REFACTOR |
|---|---|---|---|
| CreateInvitationCommandHandler | Tests written before handler | All 6 tests pass | Done |
| AcceptInvitationCommandHandler | Tests written before handler | All 7 tests pass | Done |
| CreateInvitationValidator | Covered by validation exception tests | Pass | Done |
| AcceptInvitationValidator | Password rules validated when present | Pass | Done |

---

## Mocking Strategy

- Integration tests use Testcontainers (real PostgreSQL per test class)
- `FakeInvitationRepository` created for unit-test use cases
- No Docker for runtime — Testcontainers manages the test lifecycle only

---

## Database Changes

Migration `20260321164608_AddInvitationsTable`:
- Table: `invitations` with full audit columns (created_at, updated_at, deleted_at)
- Unique index on `token`
- Partial unique index on `(email, tenant_id)` where `accepted_at IS NULL AND deleted_at IS NULL` (prevents duplicate pending invites)
- Global query filter: `deleted_at IS NULL`

---

## Architecture Notes

### InviteOptions
Added `InviteOptions` class to `Application.Common.Options` with `App:InviteBaseUrl` configuration key (defaults to `http://localhost:3000/invite`). Added `Microsoft.Extensions.Options` package to Application layer to support `IOptions<InviteOptions>`.

### AcceptInvitation Role Handling
- `Role.Member` invitations create a `Member` record
- All other roles (HouseManager, Trainer, Staff) create a `Staff` record with `StaffType.Trainer` for Trainer role, `StaffType.Reception` for others
- Existing users are linked without creating a new User entity
- role_permissions are seeded for the tenant on first acceptance if not already present

### Controller
`InvitationsController` follows the existing controller pattern:
- `POST /api/v1/invitations` — `[Authorize]`, returns 201 Created
- `POST /api/v1/invitations/{token}/accept` — `[AllowAnonymous]`, `[EnableRateLimiting(Auth)]`, returns 200 OK

---

## Deviations from Plan

1. **IsPending vs IsValid naming**: The Invitation entity (created in Phase 0) uses `IsPending` (not `IsValid` as shown in phase doc). The handler uses `IsExpired` and `IsAccepted` directly for explicit, readable error messages.

2. **Microsoft.Extensions.Options package**: Added to Application layer to support `IOptions<InviteOptions>`. This is a minimal, non-breaking addition.

3. **AcceptInvitation body**: Moved token to route parameter (matching the API contract `/invitations/{token}/accept`) and created a separate `AcceptInvitationBody` record for the request body. The command is composed in the controller action.

---

## Unresolved Questions / Blockers

None.
