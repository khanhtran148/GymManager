# Phase 2: Register Refactor + JWT TenantId Fix

## Purpose
Fix registration to create Members (not Owners) and embed tenant_id in JWT claims.

## FILE OWNERSHIP
Owns:
- `src/core/GymManager.Application/Auth/Register/` (modify existing files)
- `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs` (add tenant_id claim)
- `src/core/GymManager.Infrastructure/Auth/CurrentUser.cs` (read tenant_id from JWT)
- `src/apps/GymManager.Api/Controllers/GymHousesController.cs` (add public endpoint)
- `tests/GymManager.Application.Tests/Auth/` (new test files only -- existing tests read-only for AI)

Must not touch: frontend, mobile, `tests/GymManager.Tests.Common/` (Phase 0 owns that)

## Implementation Steps (TFD)

### 2.1 Write failing tests for updated RegisterCommandHandler [M]
**File:** `tests/GymManager.Application.Tests/Auth/RegisterMemberCommandHandlerTests.cs` (new file)

Tests (use CreateOwnerAsync from Phase 0 to set up a gym house first):
- `Register_WithValidGymHouseId_CreatesMemberUser` -- role=Member, Member record created
- `Register_WithValidGymHouseId_SeedsRolePermissions` -- role_permissions exist for tenant
- `Register_WithInvalidGymHouseId_ReturnsBadRequest`
- `Register_ReturnsJwtWithTenantIdClaim` -- decode JWT, verify tenant_id = gymHouse.OwnerId
- `Register_WithDuplicateEmail_ReturnsConflict`

### 2.2 Update RegisterCommand [S]
**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommand.cs`

Add `Guid GymHouseId` parameter:
```csharp
public sealed record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string? Phone,
    Guid GymHouseId) : IRequest<Result<AuthResponse>>;
```

### 2.3 Update RegisterCommandValidator [S]
**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommandValidator.cs`

Add rule:
```csharp
RuleFor(x => x.GymHouseId)
    .NotEmpty().WithMessage("Gym house selection is required.");
```

### 2.4 Refactor RegisterCommandHandler [M]
**File:** `src/core/GymManager.Application/Auth/Register/RegisterCommandHandler.cs`

Updated handler:
1. Inject `IGymHouseRepository`, `IMemberRepository`, `IRolePermissionRepository`
2. Check email uniqueness (existing)
3. Validate GymHouseId exists via `IGymHouseRepository.GetByIdAsync`
4. Create User with `Role.Member` (not Owner)
5. Create Member record: UserId, GymHouseId, auto-generated MemberCode
6. Seed role_permissions via `IRolePermissionRepository.UpsertRangeAsync` if not existing for tenant
7. Generate tokens (tenant_id will come from updated JwtTokenService)
8. Persist user + member

### 2.5 Add tenant_id claim to JwtTokenService [M]
**File:** `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs`

In `GenerateAccessTokenAsync`:
1. Resolve tenant_id: if `user.Role == Role.Owner`, tenantId = user.Id. Otherwise use existing `ResolveTenantIdAsync`.
2. Add claim: `new Claim("tenant_id", tenantId.ToString())`

The existing `ResolveTenantIdAsync` method already resolves via Member/Staff -> GymHouse -> OwnerId. Keep it.

### 2.6 Fix CurrentUser.TenantId [S]
**File:** `src/core/GymManager.Infrastructure/Auth/CurrentUser.cs`

Replace:
```csharp
public Guid TenantId => UserId;
```
With:
```csharp
public Guid TenantId
{
    get
    {
        var raw = Principal?.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(raw, out var id) ? id : UserId;
    }
}
```

Fallback to UserId for backward compatibility with existing tokens (owners).

### 2.7 Write test for CurrentUser.TenantId fix [S]
**File:** `tests/GymManager.Infrastructure.Tests/Auth/CurrentUserTenantIdTests.cs` (new)

- `TenantId_WhenTenantIdClaimPresent_ReturnsTenantId`
- `TenantId_WhenNoTenantIdClaim_FallsBackToUserId`

### 2.8 Add GET /gym-houses/public endpoint [S]
**File:** `src/apps/GymManager.Api/Controllers/GymHousesController.cs` (modify existing or create)

Add an `[AllowAnonymous]` endpoint:
```csharp
[HttpGet("public")]
[AllowAnonymous]
```

Returns list of `{ id, name, address }` for all active gym houses. Query via `IGymHouseRepository` or a new read-only query.

**File:** `src/core/GymManager.Application/GymHouses/GetPublicGymHouses/` (new slice)
- `GetPublicGymHousesQuery` + `GetPublicGymHousesHandler`
- Returns `Result<List<GymHousePublicDto>>` where DTO = `{ Id, Name, Address }`

### 2.9 Update existing tests that use RegisterCommand [L]

**IMPORTANT:** Existing test files are read-only for AI per Test Immutability Rule. This task REQUIRES HUMAN CONFIRMATION before modifying any existing test file.

The `RegisterCommand` signature changes from 4 params to 5 (adding `GymHouseId`). Approximately 30+ test files use `new RegisterCommand(email, password, fullName, phone)`.

**Strategy:** After human approval, update each call site to use `CreateOwnerAsync()` instead of registering via command. Most tests use Register to get a userId/tenantId -- `CreateOwnerAsync()` provides the same thing without going through the register endpoint.

For tests that specifically test the register flow itself, provide the new `GymHouseId` parameter.

## Dependencies
- Phase 0 (CreateOwnerAsync, CreateMemberAsync)

## Risks
- Breaking change to RegisterCommand -- 30+ test files affected
- Requires human approval to modify existing tests

## Success Criteria
- [ ] RegisterCommand creates Member user (not Owner)
- [ ] Member record created with correct GymHouseId
- [ ] role_permissions seeded for tenant on registration
- [ ] JWT contains tenant_id claim
- [ ] CurrentUser.TenantId reads from JWT claim
- [ ] GET /gym-houses/public returns public gym list
- [ ] All existing tests updated and passing (after human approval)
