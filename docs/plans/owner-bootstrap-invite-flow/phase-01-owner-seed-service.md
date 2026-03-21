# Phase 1: OwnerSeedService

## Purpose
Bootstrap the first owner account on fresh deployment via environment variables.

## FILE OWNERSHIP
Owns:
- `src/core/GymManager.Infrastructure/Seeding/` (new directory)
- `src/core/GymManager.Application/Common/Options/SeedOptions.cs` (new)
- Registration in `src/core/GymManager.Infrastructure/DependencyInjection.cs` (add seed service)
- Registration in `src/apps/GymManager.Api/Program.cs` (add hosted service)
- `tests/GymManager.Infrastructure.Tests/Seeding/` (new directory)

Must not touch: `tests/GymManager.Application.Tests/`, frontend, mobile

## Implementation Steps (TFD)

### 1.1 Create SeedOptions [S]
**File:** `src/core/GymManager.Application/Common/Options/SeedOptions.cs`

```csharp
public sealed class SeedOptions
{
    public const string SectionName = "Seed:Owner";
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string GymName { get; init; } = string.Empty;
}
```

### 1.2 Write failing tests for OwnerSeedService [M]
**File:** `tests/GymManager.Infrastructure.Tests/Seeding/OwnerSeedServiceTests.cs`

Tests (use InMemory DB or Testcontainers):
- `Execute_WhenNoOwnersExist_CreatesOwnerAndGymHouse` -- verifies User, GymHouse, role_permissions
- `Execute_WhenOwnerAlreadyExists_SkipsCreation` -- idempotent
- `Execute_WhenConfigMissing_ThrowsOnStartup` -- fail-fast (tested via options validation)
- `Execute_ConcurrentStarts_HandlesUniqueConstraint` -- catches DbUpdateException

### 1.3 Implement OwnerSeedService [M]
**File:** `src/core/GymManager.Infrastructure/Seeding/OwnerSeedService.cs`

Sealed class implementing `IHostedService`:
1. Inject `IServiceScopeFactory`, `IOptions<SeedOptions>`, `ILogger<OwnerSeedService>`
2. In `StartAsync`: create scope, get DbContext
3. Check if any user with `Role.Owner` exists (not by email -- by role)
4. If no owners: create User (Owner, hashed password), GymHouse, role_permissions via `RolePermissionDefaults.GetDefaultRolePermissions(userId)`
5. Save with try/catch for `DbUpdateException` (unique constraint = another pod won)
6. Log result

### 1.4 Register in DI [S]
**File:** `src/core/GymManager.Infrastructure/DependencyInjection.cs`

Add:
```csharp
services.AddOptions<SeedOptions>()
    .BindConfiguration(SeedOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

**File:** `src/apps/GymManager.Api/Program.cs`

Add before `var app = builder.Build();`:
```csharp
builder.Services.AddHostedService<OwnerSeedService>();
```

Also register in `src/apps/GymManager.BackgroundServices/Program.cs`.

### 1.5 SeedOptions validation [S]
Add `[Required]` attributes to SeedOptions properties. `ValidateOnStart()` handles fail-fast. Password must match the same rules as RegisterCommandValidator (min 8, upper, lower, digit, special). Implement a custom `IValidateOptions<SeedOptions>` or use data annotations.

## Dependencies
- Phase 0 (for CreateOwnerAsync helper pattern -- but tests here use their own setup)

## Success Criteria
- [ ] OwnerSeedService creates Owner + GymHouse + role_permissions on empty DB
- [ ] Idempotent when owner already exists
- [ ] Fails fast when env vars missing
- [ ] Handles concurrent pod starts
- [ ] All tests pass
