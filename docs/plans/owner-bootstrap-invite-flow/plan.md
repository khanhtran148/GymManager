# Plan: Owner Bootstrap & Invite Flow

## Overview
Implement the four work items from ADR 260321: OwnerSeedService for first-time deployment, register refactor to create members instead of owners, invite link system for staff onboarding, and supporting test infrastructure. Fixes the critical `CurrentUser.TenantId` data isolation bug.

## Feature Scope
Scope: fullstack (Backend .NET + Frontend Next.js + Mobile Flutter)

## ADR Reference
`docs/adrs/260321-owner-bootstrap-and-invite-flow.md`

## API Contract
`docs/plans/owner-bootstrap-invite-flow/api-contract-260321-1400.md`

## Phases

| Phase | Name | Status | Parallelizable | Complexity | File |
|-------|------|--------|----------------|------------|------|
| 0 | Test Infrastructure | pending | no | S | [phase-00-test-infrastructure.md](phase-00-test-infrastructure.md) |
| 1 | OwnerSeedService | pending | no | M | [phase-01-owner-seed-service.md](phase-01-owner-seed-service.md) |
| 2 | Register Refactor + JWT Fix | pending | no | L | [phase-02-register-refactor.md](phase-02-register-refactor.md) |
| 3 | Invite Link System | pending | yes (with 4, 5) | L | [phase-03-invite-system.md](phase-03-invite-system.md) |
| 4 | Frontend (Next.js) | pending | yes (with 3, 5) | M | [phase-04-frontend.md](phase-04-frontend.md) |
| 5 | Mobile (Flutter) | pending | yes (with 3, 4) | M | [phase-05-mobile.md](phase-05-mobile.md) |
| 6 | Integration + E2E | pending | no | M | [phase-06-integration.md](phase-06-integration.md) |

## Dependency Graph

```
Phase 0 (Test Infra)
  |
  v
Phase 1 (OwnerSeedService)
  |
  v
Phase 2 (Register Refactor + JWT Fix) -- requires human approval for existing test modifications
  |
  +---> Phase 3 (Invite System)  --|
  +---> Phase 4 (Frontend)       --|-- parallel
  +---> Phase 5 (Mobile)         --|
  |
  v
Phase 6 (Integration + E2E)
```

## Key Decisions (from ADR -- do not contradict)

1. OwnerSeedService is an IHostedService with env-var config and `ValidateOnStart()`
2. Register creates `Role.Member` + `Member` record, requires `GymHouseId`
3. JWT embeds `tenant_id` claim; `CurrentUser.TenantId` reads it
4. Invitation tokens are 32-byte cryptographic random, URL-safe Base64, 48h expiry
5. Accept invite checks for existing user by email (link if found, create if not)
6. No email delivery in V1

## Breaking Changes

- `RegisterCommand` adds required `GymHouseId` parameter -- all callers must update
- `RegisterRequest` (frontend/mobile) adds `gymHouseId` field
- ~30 existing test files use `RegisterCommand` with old 4-param signature

## Human Approvals Required

1. **Phase 2, Task 2.9:** Modifying existing test files requires human confirmation per Test Immutability Rule. ~30 files need `RegisterCommand` call site updates.

## Estimated New/Changed Files

| Layer | New Files | Modified Files |
|-------|-----------|----------------|
| Domain | 1 (Invitation.cs) | 0 |
| Application | ~10 (commands, handlers, validators, DTOs, interfaces) | 3 (RegisterCommand/Handler/Validator) |
| Infrastructure | 4 (OwnerSeedService, InvitationRepo, InvitationConfig, CurrentUser) | 2 (JwtTokenService, DependencyInjection) |
| API | 2 (InvitationsController, Program.cs registration) | 1 (AuthController or GymHousesController) |
| Tests | ~10 new test files | ~30 existing test call site updates (human approval) |
| Frontend | ~6 new/modified files | 2 (register page, auth types) |
| Mobile | ~6 new files | 1 (api_client.dart) |

## Success Criteria

- [ ] OwnerSeedService creates owner on empty DB, skips if owner exists, fails fast on missing config
- [ ] `/api/v1/auth/register` creates Member user with correct GymHouseId
- [ ] JWT contains `tenant_id` claim; `CurrentUser.TenantId` reads it (bug fixed)
- [ ] `POST /api/v1/invitations` creates invite with 32-byte token, 48h expiry
- [ ] `POST /api/v1/invitations/{token}/accept` handles new and existing users
- [ ] Frontend register page includes gym selector
- [ ] Frontend invite accept page at `/invite/{token}`
- [ ] Mobile register screen includes gym selector
- [ ] Mobile invite accept screen via deep link
- [ ] `dotnet test` passes with zero failures
- [ ] All 4 ADR work items implemented

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| ~30 existing tests break from RegisterCommand change | CreateOwnerAsync() helper replaces most register calls; batch update after human approval |
| CurrentUser.TenantId fallback to UserId masks bugs | Explicit integration test asserting tenant_id for Member user |
| Invite token brute-force | 256-bit token + Auth rate limit (10/min) |
| Concurrent OwnerSeedService on multiple pods | Catch unique constraint violation, log and continue |
| Frontend/mobile deploy out of sync with backend | GymHouseId validated server-side; old clients get 400 with clear error |
