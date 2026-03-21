# Phase 3: Invite Link System
<!-- PARALLEL: runs simultaneously with Phase 4 (Frontend) and Phase 5 (Mobile) after Phase 2 completes -->

## Purpose
Allow owners/managers to invite staff via cryptographic token links.

## FILE OWNERSHIP
Owns:
- `src/core/GymManager.Domain/Entities/Invitation.cs` (new)
- `src/core/GymManager.Application/Invitations/` (new slice directory)
- `src/core/GymManager.Infrastructure/Persistence/Configurations/InvitationConfiguration.cs` (new)
- `src/core/GymManager.Infrastructure/Persistence/Repositories/InvitationRepository.cs` (new)
- `src/core/GymManager.Application/Common/Interfaces/IInvitationRepository.cs` (new)
- `src/apps/GymManager.Api/Controllers/InvitationsController.cs` (new)
- `tests/GymManager.Application.Tests/Invitations/` (new)
- Migration file for Invitations table

Must not touch: frontend, mobile, existing auth files (Phase 2 owns those)

## Implementation Steps (TFD)

### 3.1 Create Invitation entity [S]
**File:** `src/core/GymManager.Domain/Entities/Invitation.cs`

```csharp
public sealed class Invitation : AuditableEntity
{
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public Role Role { get; set; }
    public Guid GymHouseId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public Guid CreatedBy { get; set; }

    public GymHouse GymHouse { get; set; } = null!;
    public User Creator { get; set; } = null!;

    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    public bool IsAccepted => AcceptedAt is not null;
    public bool IsValid => !IsExpired && !IsAccepted;
}
```

### 3.2 Create EF Configuration + Migration [S]
**File:** `src/core/GymManager.Infrastructure/Persistence/Configurations/InvitationConfiguration.cs`

- Map to `invitations` table
- Unique index on `(email, tenant_id)` where `accepted_at IS NULL` (partial unique index for pending invites)
- Index on `token` (unique)
- `deleted_at` for soft delete global filter

**File:** EF migration (auto-generated)

### 3.3 Create IInvitationRepository [S]
**File:** `src/core/GymManager.Application/Common/Interfaces/IInvitationRepository.cs`

```csharp
public interface IInvitationRepository
{
    Task<Invitation?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<bool> HasPendingInviteAsync(string email, Guid tenantId, CancellationToken ct = default);
    Task CreateAsync(Invitation invitation, CancellationToken ct = default);
    Task UpdateAsync(Invitation invitation, CancellationToken ct = default);
}
```

### 3.4 Implement InvitationRepository [S]
**File:** `src/core/GymManager.Infrastructure/Persistence/Repositories/InvitationRepository.cs`

Standard EF Core implementation. `GetByTokenAsync` ignores soft-deleted records.

### 3.5 Write failing tests for CreateInvitationCommand [M]
**File:** `tests/GymManager.Application.Tests/Invitations/CreateInvitationCommandHandlerTests.cs`

Tests (use CreateOwnerAsync):
- `Create_WithValidInput_ReturnsInvitationWithToken` -- 32-byte token, 48h expiry
- `Create_AsOwner_Succeeds` -- permission ManageStaff
- `Create_AsMember_ReturnsForbidden` -- no ManageStaff permission
- `Create_WithOwnerRole_ReturnsBadRequest` -- cannot invite as Owner
- `Create_DuplicatePendingInvite_ReturnsConflict`
- `Create_WithInvalidGymHouseId_ReturnsBadRequest`

### 3.6 Implement CreateInvitationCommand + Handler [M]
**File:** `src/core/GymManager.Application/Invitations/CreateInvitation/CreateInvitationCommand.cs`
**File:** `src/core/GymManager.Application/Invitations/CreateInvitation/CreateInvitationHandler.cs`
**File:** `src/core/GymManager.Application/Invitations/CreateInvitation/CreateInvitationValidator.cs`
**File:** `src/core/GymManager.Application/Invitations/Shared/InvitationDto.cs`

Handler:
1. Permission check: ManageStaff or ManageRoles
2. Validate role is not Owner
3. Validate gymHouseId exists
4. Check no pending invite for (email, tenantId)
5. Generate 32-byte cryptographic random token (URL-safe Base64)
6. Create Invitation with 48h expiry
7. Persist
8. Return InvitationDto with token and inviteUrl

### 3.7 Write failing tests for AcceptInvitationCommand [M]
**File:** `tests/GymManager.Application.Tests/Invitations/AcceptInvitationCommandHandlerTests.cs`

Tests:
- `Accept_ValidToken_NewUser_CreatesUserAndMember`
- `Accept_ValidToken_ExistingUser_LinksToGym`
- `Accept_ExpiredToken_ReturnsBadRequest`
- `Accept_AlreadyAcceptedToken_ReturnsBadRequest`
- `Accept_InvalidToken_ReturnsNotFound`
- `Accept_SetsAcceptedAt`
- `Accept_ReturnsJwtWithTenantId`

### 3.8 Implement AcceptInvitationCommand + Handler [L]
**File:** `src/core/GymManager.Application/Invitations/AcceptInvitation/AcceptInvitationCommand.cs`
**File:** `src/core/GymManager.Application/Invitations/AcceptInvitation/AcceptInvitationHandler.cs`
**File:** `src/core/GymManager.Application/Invitations/AcceptInvitation/AcceptInvitationValidator.cs`

Handler:
1. Look up invitation by token
2. Validate: not expired, not accepted
3. Check if user exists by email
   - **Exists:** Update user's role for this gym context, create Member/Staff record
   - **New:** Create User with invitation.Role, hash password, create Member/Staff record
4. Seed role_permissions if not existing for tenant
5. Mark invitation as accepted (set AcceptedAt)
6. Generate tokens (JWT with tenant_id)
7. Return AuthResponse

### 3.9 Create InvitationsController [S]
**File:** `src/apps/GymManager.Api/Controllers/InvitationsController.cs`

```csharp
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
public sealed class InvitationsController : ApiControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(InvitationDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(...)

    [HttpPost("{token}/accept")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Accept(...)
}
```

### 3.10 Register IInvitationRepository in DI [S]
**File:** `src/core/GymManager.Infrastructure/DependencyInjection.cs`
**File:** `tests/GymManager.Tests.Common/IntegrationTestBase.cs` (add repository registration)

## Dependencies
- Phase 0 (test helpers)
- Phase 2 (JWT tenant_id claim -- Accept handler needs it)

## Success Criteria
- [ ] Invitation entity with EF configuration and migration
- [ ] Create invitation with permission check, 32-byte token, 48h expiry
- [ ] Accept handles new user and existing user cases
- [ ] Unique constraint on pending (email, tenant_id)
- [ ] Rate limiting on accept endpoint
- [ ] All tests pass
