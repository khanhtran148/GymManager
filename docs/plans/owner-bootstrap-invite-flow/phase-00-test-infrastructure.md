# Phase 0: Test Infrastructure

## Purpose
Build test helpers that all subsequent phases depend on. Must be done first.

## FILE OWNERSHIP
Owns: `tests/GymManager.Tests.Common/`
Must not touch: any `src/` files

## Tasks

### 0.1 Add `CreateOwnerAsync()` to IntegrationTestBase [S]
**File:** `tests/GymManager.Tests.Common/IntegrationTestBase.cs`

Add a protected helper method that:
1. Creates a User with `Role.Owner` via UserBuilder + BCrypt hash for "Test@1234"
2. Creates a GymHouse linked to that user
3. Seeds role_permissions for the tenant (owner's UserId) via `RolePermissionDefaults.GetDefaultRolePermissions()`
4. Persists all to DB via `DbContext`
5. Sets `TestCurrentUser.UserId`, `TestCurrentUser.TenantId`, `TestCurrentUser.Role = Role.Owner`
6. Returns `(User, GymHouse)` tuple

```csharp
protected async Task<(User Owner, GymHouse GymHouse)> CreateOwnerAsync(
    string email = "owner@test.com",
    string gymName = "Test Gym")
```

### 0.2 Add `CreateMemberAsync()` to IntegrationTestBase [S]
**File:** `tests/GymManager.Tests.Common/IntegrationTestBase.cs`

Helper that:
1. Creates a User with `Role.Member`
2. Creates a Member record linked to the given gymHouseId
3. Generates member code via `Member.GenerateMemberCode()`
4. Persists via `DbContext`
5. Returns `(User, Member)` tuple

```csharp
protected async Task<(User User, Member Member)> CreateMemberAsync(
    Guid gymHouseId,
    string email = "member@test.com")
```

### 0.3 Add InvitationBuilder [S]
**File:** `tests/GymManager.Tests.Common/Builders/InvitationBuilder.cs`

Standard builder pattern matching existing builders (UserBuilder, MemberBuilder, etc.):
- `WithEmail(string)`, `WithRole(Role)`, `WithGymHouseId(Guid)`, `WithTenantId(Guid)`
- `WithToken(string)`, `WithExpiresAt(DateTime)`, `WithCreatedBy(Guid)`
- `Build()` returns `Invitation` entity

### 0.4 Verify helpers work [S]
Write a quick smoke test in a new file:
**File:** `tests/GymManager.Application.Tests/TestInfrastructure/TestHelperSmokeTests.cs`

Two tests:
- `CreateOwnerAsync_CreatesOwnerWithGymHouseAndRolePermissions`
- `CreateMemberAsync_CreatesMemberLinkedToGymHouse`

## Dependencies
None (first phase).

## Success Criteria
- [ ] `CreateOwnerAsync()` seeds User + GymHouse + role_permissions
- [ ] `CreateMemberAsync()` seeds User + Member with correct GymHouseId
- [ ] InvitationBuilder builds valid Invitation entities
- [ ] Smoke tests pass
