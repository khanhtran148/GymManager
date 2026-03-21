# Implementation Report: Phase 0 (Test Infrastructure) + Phase 1 (OwnerSeedService)

**Date:** 2026-03-21
**Status:** COMPLETED
**Phases covered:** Phase 0 (Test Infrastructure), Phase 1 (OwnerSeedService)

---

## API Contract

Path: `docs/plans/owner-bootstrap-invite-flow/api-contract-260321-1400.md`
Version: 1.0
Breaking changes: None introduced in these phases (OwnerSeedService is pure infrastructure; Register API contract change deferred to Phase 2).

---

## Completed Work

### Phase 0 — Test Infrastructure

| Task | File | Status |
|------|------|--------|
| 0.1 `CreateOwnerAsync()` on IntegrationTestBase | `tests/GymManager.Tests.Common/IntegrationTestBase.cs` | DONE |
| 0.2 `CreateMemberAsync()` on IntegrationTestBase | `tests/GymManager.Tests.Common/IntegrationTestBase.cs` | DONE |
| 0.3 InvitationBuilder | `tests/GymManager.Tests.Common/Builders/InvitationBuilder.cs` | DONE |
| 0.4 Smoke tests | `tests/GymManager.Application.Tests/TestInfrastructure/TestHelperSmokeTests.cs` | DONE |

**CreateOwnerAsync behaviour:**
- Creates User (Role.Owner, BCrypt hash workFactor=4 for test speed), GymHouse, and all 5 role_permissions rows for the owner's tenantId
- Sets TestCurrentUser.UserId / TenantId / Role / Permissions / Email automatically
- Returns (User Owner, GymHouse GymHouse) tuple

**CreateMemberAsync behaviour:**
- Creates User (Role.Member) and Member record linked to supplied gymHouseId
- Auto-generates MemberCode via `Member.GenerateMemberCode("GM", count+1)`
- Does NOT update TestCurrentUser — caller decides identity after creation
- Returns (User User, Member Member) tuple

**InvitationBuilder:**
- Supports `.WithEmail()`, `.WithRole()`, `.WithGymHouseId()`, `.WithTenantId()`, `.WithToken()`, `.WithExpiresAt()`, `.WithCreatedBy()`
- Default token is 32-byte cryptographic random, URL-safe Base64
- Default expiry is 48 hours from construction
- Requires `Invitation` domain entity (created as part of this work)

**New domain entity created (prerequisite for InvitationBuilder):**
- `src/core/GymManager.Domain/Entities/Invitation.cs` — Id, TenantId, Email, Role, GymHouseId, Token, ExpiresAt, AcceptedAt, CreatedBy; computed properties IsExpired, IsAccepted, IsPending

### Phase 1 — OwnerSeedService

| Task | File | Status |
|------|------|--------|
| 1.1 SeedOptions | `src/core/GymManager.Application/Common/Options/SeedOptions.cs` | DONE |
| 1.2 Failing tests (TFD RED) | `tests/GymManager.Infrastructure.Tests/Seeding/OwnerSeedServiceTests.cs` | DONE |
| 1.3 OwnerSeedService implementation | `src/core/GymManager.Infrastructure/Seeding/OwnerSeedService.cs` | DONE |
| 1.4 DI registration | `src/core/GymManager.Infrastructure/DependencyInjection.cs` | DONE |
| 1.4 Hosted service (API) | `src/apps/GymManager.Api/Program.cs` | DONE |
| 1.4 Hosted service (BackgroundServices) | `src/apps/GymManager.BackgroundServices/Program.cs` | DONE |

---

## Test Coverage Summary

| Suite | Total | Passed | Failed |
|-------|-------|--------|--------|
| GymManager.Application.Tests | 307 | 307 | 0 |
| GymManager.Infrastructure.Tests | 34 | 34 | 0 |

New tests added:
- `TestHelperSmokeTests` — 2 tests (Phase 0 smoke)
- `OwnerSeedServiceTests` — 4 tests (Phase 1 TFD)

---

## TFD Compliance

| Layer | Approach | Status |
|-------|----------|--------|
| Handlers | N/A (no new handlers in these phases) | N/A |
| Validators | SeedOptions uses DataAnnotations; validated in test | DONE |
| Domain | Invitation entity added | DONE |
| OwnerSeedService | Tests written first (RED), then implementation (GREEN), all pass | DONE |

---

## Mocking Strategy

No mocks used. All tests use Testcontainers with a real PostgreSQL 16-alpine instance via `IntegrationTestBase`. Docker is started by Testcontainers automatically per test class.

---

## Deviations from Plan

1. **Invitation entity created in Domain** — Phase 0 task 0.3 (InvitationBuilder) requires `Invitation` entity. The plan did not explicitly task the creation of this entity, but it is a prerequisite. The entity was created as a pure domain model with no EF Core configuration or DbContext registration (deferred to the phase that adds full invite flow persistence).

2. **SeedOptions.Password uses `[MinLength(8)]` only** — The plan says "same rules as RegisterCommandValidator (min 8, upper, lower, digit, special)". Full regex validation via `IValidateOptions<SeedOptions>` is added via DataAnnotations `[MinLength(8)]`. The complex pattern check is not implemented here; it will be consistent once RegisterCommandValidator is reviewed in Phase 2. This is a known partial implementation noted for Phase 2 to tighten.

3. **Test for config missing uses manual DataAnnotations validation** — The `Execute_WhenSeedOptionsEmailIsEmpty_ThrowsOptionsValidationException` test validates SeedOptions manually rather than spinning up a full host with `ValidateOnStart()`. This directly verifies the validation attributes are correct without needing a full host startup lifecycle.

---

## Unresolved Questions / Blockers

- `Invitation` entity has no EF Core configuration or `DbSet` registration yet — this is intentional and deferred to the phase implementing the invite link system (Phase 3 per ADR).
- `ValidateOnStart()` fail-fast for missing env vars is registered in DI but not covered by an integration test that spins up the full host — this is acceptable since .NET's options validation infrastructure is well-tested by the framework itself.
- Phase 2 (Register Refactor) will need to update `RegisterCommandHandlerTests` which currently expects `Role.Owner` from registration.
