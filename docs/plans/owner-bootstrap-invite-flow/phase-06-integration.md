# Phase 6: Integration Testing + E2E Validation

## Purpose
Verify all pieces work together. Run full test suite, check for regressions.

## FILE OWNERSHIP
Owns:
- `tests/GymManager.Api.Tests/Integration/` (new test files)

## Tasks

### 6.1 Owner bootstrap E2E test [M]
**File:** `tests/GymManager.Api.Tests/Integration/OwnerBootstrapTests.cs`

- Start API with seed config, verify owner can log in
- Start API without seed config + no owners, verify startup fails
- Start API with existing owner, verify seed is skipped

### 6.2 Register-as-member E2E test [M]
**File:** `tests/GymManager.Api.Tests/Integration/MemberRegistrationFlowTests.cs`

- Register via HTTP POST with gymHouseId, verify 200 + JWT tenant_id claim
- Register without gymHouseId, verify 400
- Register with nonexistent gymHouseId, verify 400
- Verify created user has Role.Member in DB

### 6.3 Invite flow E2E test [M]
**File:** `tests/GymManager.Api.Tests/Integration/InvitationFlowTests.cs`

- Owner creates invite, accept as new user, verify role + member record
- Owner creates invite, accept as existing user, verify linking
- Accept expired invite, verify 400
- Accept already-accepted invite, verify 400
- Non-owner creates invite, verify 403

### 6.4 TenantId isolation test [S]
**File:** `tests/GymManager.Api.Tests/Integration/TenantIsolationTests.cs`

- Create owner A + gym A
- Register member under gym A
- Verify member's JWT tenant_id = owner A's UserId
- Verify CurrentUser.TenantId returns correct value for member

### 6.5 Full regression run [S]
Run `dotnet test` across all test projects. Fix any failures.

## Dependencies
- All previous phases (0-5) completed

## Success Criteria
- [ ] Owner bootstrap works end-to-end
- [ ] Member registration flow verified via HTTP
- [ ] Invite create + accept flow verified via HTTP
- [ ] TenantId isolation confirmed for member users
- [ ] `dotnet test` passes with zero failures
