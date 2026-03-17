## Phase 1: Foundation

### Objective

Deliver user authentication, gym house management, member registration, subscription lifecycle, multi-tenancy enforcement, and the web dashboard shell. After this phase, an owner can log in, create gym houses, register members, and manage subscriptions.

### Dependencies

None. This is the base phase.

### 1.1 Domain Layer

**File ownership:** `src/core/GymManager.Domain/`

#### Enums to Add

**File:** `src/core/GymManager.Domain/Enums/Permission.cs` -- extend existing

```csharp
// Add after ViewReports (bit 11):
ManageBookings      = 1L << 12,
ViewBookings        = 1L << 13,
ManageSchedule      = 1L << 14,
ViewSchedule        = 1L << 15,
ManageFinance       = 1L << 16,
ViewFinance         = 1L << 17,
ManageStaff         = 1L << 18,
ViewStaff           = 1L << 19,
ManageAnnouncements = 1L << 20,
ViewAnnouncements   = 1L << 21,
ApprovePayroll      = 1L << 22,
ManageShifts        = 1L << 23,
ViewShifts          = 1L << 24,
ManageWaitlist      = 1L << 25,
```

**File:** `src/core/GymManager.Domain/Enums/Role.cs` -- NEW

```csharp
public enum Role { Owner, HouseManager, Trainer, Staff, Member }
```

**File:** `src/core/GymManager.Domain/Enums/SubscriptionStatus.cs` -- NEW

```csharp
public enum SubscriptionStatus { Active, Frozen, Expired, Cancelled }
```

#### Entities to Create

**1. User** -- `src/core/GymManager.Domain/Entities/User.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK, from AuditableEntity |
| Email | string | unique |
| PasswordHash | string | |
| FullName | string | |
| Phone | string? | |
| Role | Role | enum |
| Permissions | Permission | flags enum (long) |
| RefreshToken | string? | |
| RefreshTokenExpiresAt | DateTime? | |

Not tenant-scoped. Owner/admin-level entity.

**2. GymHouse** -- `src/core/GymManager.Domain/Entities/GymHouse.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| Name | string | |
| Address | string | |
| Phone | string? | |
| OperatingHours | JsonDocument | jsonb, keyed by DayOfWeek |
| HourlyCapacity | int | |
| OwnerId | Guid | FK to User |
| Owner | User | navigation |

Not tenant-scoped (it IS the tenant).

**3. Member** -- `src/core/GymManager.Domain/Entities/Member.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| UserId | Guid | FK to User |
| GymHouseId | Guid | FK, tenant discriminator |
| MemberCode | string | auto-generated, unique per house |
| Status | MembershipStatus | enum |
| JoinedAt | DateTime | |
| User | User | navigation |
| GymHouse | GymHouse | navigation |
| Subscriptions | List\<Subscription\> | navigation |

**4. Subscription** -- `src/core/GymManager.Domain/Entities/Subscription.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| MemberId | Guid | FK to Member |
| GymHouseId | Guid | FK, tenant discriminator |
| Type | SubscriptionType | enum |
| Status | SubscriptionStatus | enum |
| Price | decimal | |
| StartDate | DateTime | |
| EndDate | DateTime | |
| FrozenAt | DateTime? | |
| FrozenUntil | DateTime? | |
| Member | Member | navigation |

#### Domain Events

- `src/core/GymManager.Domain/Events/MemberCreatedEvent.cs` -- `sealed record MemberCreatedEvent(Guid MemberId, Guid GymHouseId) : IDomainEvent`
- `src/core/GymManager.Domain/Events/SubscriptionCreatedEvent.cs` -- `sealed record SubscriptionCreatedEvent(Guid SubscriptionId, Guid MemberId, Guid GymHouseId, decimal Price) : IDomainEvent`
- `src/core/GymManager.Domain/Events/SubscriptionExpiredEvent.cs` -- `sealed record SubscriptionExpiredEvent(Guid SubscriptionId, Guid MemberId) : IDomainEvent`

### 1.2 Application Layer

**File ownership:** `src/core/GymManager.Application/`

#### Interfaces to Add

- `Common/Interfaces/ITokenService.cs` -- `GenerateAccessToken(User)`, `GenerateRefreshToken()`, `GetPrincipalFromExpiredToken(string)`
- `Common/Interfaces/IPasswordHasher.cs` -- `Hash(string)`, `Verify(string, string)`
- `Common/Interfaces/IGymHouseRepository.cs` -- standard CRUD + `GetByOwnerIdAsync`
- `Common/Interfaces/IMemberRepository.cs` -- standard CRUD + `GetByGymHouseIdAsync`, `ExistsByEmailAndHouseAsync`
- `Common/Interfaces/ISubscriptionRepository.cs` -- standard CRUD + `GetActivByMemberIdAsync`
- `Common/Interfaces/IUserRepository.cs` -- `GetByEmailAsync`, `GetByIdAsync`, `CreateAsync`, `UpdateAsync`
- `Common/Models/PagedList.cs` -- `sealed record PagedList<T>(List<T> Items, int TotalCount, int Page, int PageSize)`

#### Feature Slices -- Auth

Each slice lives in its own folder under `src/core/GymManager.Application/Auth/`.

| Slice | Type | Request | Response | Permission |
|-------|------|---------|----------|------------|
| `Register/RegisterCommand.cs` | Command | `{Email, Password, FullName, Phone}` | `Result<AuthResponse>` | [AllowAnonymous] |
| `Register/RegisterCommandValidator.cs` | Validator | | | |
| `Register/RegisterCommandHandler.cs` | Handler | | | |
| `Login/LoginCommand.cs` | Command | `{Email, Password}` | `Result<AuthResponse>` | [AllowAnonymous] |
| `Login/LoginCommandHandler.cs` | Handler | | | |
| `RefreshToken/RefreshTokenCommand.cs` | Command | `{AccessToken, RefreshToken}` | `Result<AuthResponse>` | [AllowAnonymous] |
| `RefreshToken/RefreshTokenCommandHandler.cs` | Handler | | | |

`AuthResponse`: `sealed record AuthResponse(Guid UserId, string AccessToken, string RefreshToken, DateTime ExpiresAt)`

#### Feature Slices -- GymHouses

Folder: `src/core/GymManager.Application/GymHouses/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateGymHouse/CreateGymHouseCommand.cs` | Command | ManageTenant |
| `CreateGymHouse/CreateGymHouseCommandValidator.cs` | Validator | |
| `CreateGymHouse/CreateGymHouseCommandHandler.cs` | Handler | |
| `UpdateGymHouse/UpdateGymHouseCommand.cs` | Command | ManageTenant |
| `UpdateGymHouse/UpdateGymHouseCommandHandler.cs` | Handler | |
| `DeleteGymHouse/DeleteGymHouseCommand.cs` | Command | ManageTenant |
| `DeleteGymHouse/DeleteGymHouseCommandHandler.cs` | Handler | |
| `GetGymHouses/GetGymHousesQuery.cs` | Query | ViewMembers |
| `GetGymHouses/GetGymHousesQueryHandler.cs` | Handler | |
| `GetGymHouseById/GetGymHouseByIdQuery.cs` | Query | ViewMembers |
| `GetGymHouseById/GetGymHouseByIdQueryHandler.cs` | Handler | |
| `Shared/GymHouseDto.cs` | DTO | |

#### Feature Slices -- Members

Folder: `src/core/GymManager.Application/Members/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateMember/CreateMemberCommand.cs` | Command | ManageMembers |
| `CreateMember/CreateMemberCommandValidator.cs` | Validator | |
| `CreateMember/CreateMemberCommandHandler.cs` | Handler | |
| `UpdateMember/UpdateMemberCommand.cs` | Command | ManageMembers |
| `UpdateMember/UpdateMemberCommandHandler.cs` | Handler | |
| `GetMembers/GetMembersQuery.cs` | Query (paged) | ViewMembers |
| `GetMembers/GetMembersQueryHandler.cs` | Handler | |
| `GetMemberById/GetMemberByIdQuery.cs` | Query | ViewMembers |
| `GetMemberById/GetMemberByIdQueryHandler.cs` | Handler | |
| `Shared/MemberDto.cs` | DTO | |

#### Feature Slices -- Subscriptions

Folder: `src/core/GymManager.Application/Subscriptions/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateSubscription/CreateSubscriptionCommand.cs` | Command | ManageSubscriptions |
| `CreateSubscription/CreateSubscriptionCommandHandler.cs` | Handler | |
| `RenewSubscription/RenewSubscriptionCommand.cs` | Command | ManageSubscriptions |
| `RenewSubscription/RenewSubscriptionCommandHandler.cs` | Handler | |
| `FreezeSubscription/FreezeSubscriptionCommand.cs` | Command | ManageSubscriptions |
| `FreezeSubscription/FreezeSubscriptionCommandHandler.cs` | Handler | |
| `CancelSubscription/CancelSubscriptionCommand.cs` | Command | ManageSubscriptions |
| `CancelSubscription/CancelSubscriptionCommandHandler.cs` | Handler | |
| `GetSubscriptionsByMember/GetSubscriptionsByMemberQuery.cs` | Query | ViewSubscriptions |
| `GetSubscriptionsByMember/GetSubscriptionsByMemberQueryHandler.cs` | Handler | |
| `Shared/SubscriptionDto.cs` | DTO | |

### 1.3 Infrastructure Layer

**File ownership:** `src/core/GymManager.Infrastructure/`

#### EF Configurations

- `Persistence/Configurations/UserConfiguration.cs` -- unique index on Email, Permission stored as long
- `Persistence/Configurations/GymHouseConfiguration.cs` -- OperatingHours as jsonb, index on OwnerId
- `Persistence/Configurations/MemberConfiguration.cs` -- global query filter `e.GymHouseId == tenantId AND e.DeletedAt == null`, composite unique on (GymHouseId, MemberCode), index on UserId
- `Persistence/Configurations/SubscriptionConfiguration.cs` -- global query filter on GymHouseId + DeletedAt, index on (MemberId, Status), Price as decimal(18,2)

#### DbContext Changes

Add to `GymManagerDbContext`:
- `DbSet<User> Users`
- `DbSet<GymHouse> GymHouses`
- `DbSet<Member> Members`
- `DbSet<Subscription> Subscriptions`
- Inject `ICurrentUser` for tenant filtering
- Override `SaveChangesAsync` to set `UpdatedAt` automatically

#### Repository Implementations

- `Persistence/Repositories/UserRepository.cs`
- `Persistence/Repositories/GymHouseRepository.cs`
- `Persistence/Repositories/MemberRepository.cs`
- `Persistence/Repositories/SubscriptionRepository.cs`

#### Auth Services

- `Auth/JwtTokenService.cs` -- implements `ITokenService`
- `Auth/BCryptPasswordHasher.cs` -- implements `IPasswordHasher`
- `Auth/CurrentUser.cs` -- implements `ICurrentUser`, reads from HttpContext claims
- `Auth/PermissionChecker.cs` -- implements `IPermissionChecker`

#### Seed Data

- `Persistence/Seeding/RoleSeedData.cs` -- default permission sets for Owner (Admin), HouseManager, Trainer, Staff, Member roles

#### Migration

- `dotnet ef migrations add InitialFoundation` -- User, GymHouse, Member, Subscription tables

### 1.4 API Layer

**File ownership:** `src/apps/GymManager.Api/`

#### Controllers

**AuthController** -- `Controllers/AuthController.cs`

| Method | Route | Rate Limit | Auth |
|--------|-------|------------|------|
| POST | `/api/v1/auth/register` | Auth | [AllowAnonymous] |
| POST | `/api/v1/auth/login` | Auth | [AllowAnonymous] |
| POST | `/api/v1/auth/refresh` | Auth | [AllowAnonymous] |

**GymHousesController** -- `Controllers/GymHousesController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/gym-houses` | Default |
| GET | `/api/v1/gym-houses` | Default |
| GET | `/api/v1/gym-houses/{id}` | Default |
| PUT | `/api/v1/gym-houses/{id}` | Default |
| DELETE | `/api/v1/gym-houses/{id}` | Strict |

**MembersController** -- `Controllers/MembersController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/members` | Default |
| GET | `/api/v1/members` | Default |
| GET | `/api/v1/members/{id}` | Default |
| PUT | `/api/v1/members/{id}` | Default |

**SubscriptionsController** -- `Controllers/SubscriptionsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/members/{memberId}/subscriptions` | Default |
| GET | `/api/v1/members/{memberId}/subscriptions` | Default |
| PATCH | `/api/v1/subscriptions/{id}/renew` | Default |
| PATCH | `/api/v1/subscriptions/{id}/freeze` | Default |
| PATCH | `/api/v1/subscriptions/{id}/cancel` | Strict |

#### ApiControllerBase Update

Add a generic `HandleResult<T>(Result<T> result)` overload that pattern-matches on error type (NotFoundError, ForbiddenError, ConflictError, ValidationError) to simplify controller code.

### 1.5 Web Frontend

**File ownership:** `src/apps/gymmanager-web/`

#### Auth Infrastructure

- `src/lib/auth.ts` -- `login()`, `register()`, `refreshToken()`, `logout()`, token storage
- `src/stores/auth-store.ts` -- Zustand store: `{user, token, isAuthenticated, login, logout}`
- `src/middleware.ts` -- Next.js middleware: redirect unauthenticated to `/login`
- `src/hooks/use-auth.ts` -- hook wrapping auth store

#### Layout & Navigation

- `src/app/(auth)/login/page.tsx` -- login form
- `src/app/(auth)/register/page.tsx` -- registration form
- `src/app/(auth)/layout.tsx` -- centered card layout, no sidebar
- `src/app/(dashboard)/layout.tsx` -- dark sidebar + top bar + content area (FitNexus style)
- `src/components/sidebar.tsx` -- navigation: Dashboard, Gym Houses, Members, Subscriptions
- `src/components/top-bar.tsx` -- user avatar, house selector dropdown, logout

#### Dashboard

- `src/app/(dashboard)/page.tsx` -- stat cards (total members, active subscriptions, houses), recent activity

#### Gym Houses CRUD

- `src/app/(dashboard)/gym-houses/page.tsx` -- list with table, create button
- `src/app/(dashboard)/gym-houses/[id]/page.tsx` -- detail/edit form
- `src/app/(dashboard)/gym-houses/new/page.tsx` -- create form
- `src/hooks/use-gym-houses.ts` -- TanStack Query hooks: `useGymHouses()`, `useGymHouse(id)`, `useCreateGymHouse()`, `useUpdateGymHouse()`, `useDeleteGymHouse()`

#### Members CRUD

- `src/app/(dashboard)/members/page.tsx` -- paginated table with search/filter, status badges
- `src/app/(dashboard)/members/[id]/page.tsx` -- detail view with subscription history
- `src/app/(dashboard)/members/new/page.tsx` -- create form
- `src/hooks/use-members.ts` -- TanStack Query hooks

#### Subscriptions

- `src/app/(dashboard)/members/[id]/subscriptions/new/page.tsx` -- create subscription form
- `src/components/subscription-card.tsx` -- status badge, renew/freeze/cancel actions
- `src/hooks/use-subscriptions.ts` -- TanStack Query hooks

#### Shared Components

- `src/components/ui/data-table.tsx` -- reusable table with pagination
- `src/components/ui/stat-card.tsx` -- number + label + trend indicator
- `src/components/ui/form-field.tsx` -- label + input + error message
- `src/components/ui/badge.tsx` -- colored status badge
- `src/components/ui/confirm-dialog.tsx` -- modal for destructive actions

### 1.6 Tests

**TFD order: write each test class BEFORE implementing the corresponding handler/entity.**

#### Domain Tests -- `tests/GymManager.Domain.Tests/`

- `Entities/UserTests.cs` -- user creation, refresh token assignment
- `Entities/MemberTests.cs` -- member code generation, status transitions
- `Entities/SubscriptionTests.cs` -- freeze/cancel/expire logic, date validation (EndDate > StartDate)

#### Application Tests -- `tests/GymManager.Application.Tests/`

- `Auth/RegisterCommandHandlerTests.cs` -- success, duplicate email returns conflict, validation failures
- `Auth/LoginCommandHandlerTests.cs` -- success, wrong password, non-existent user
- `GymHouses/CreateGymHouseCommandHandlerTests.cs` -- success, permission denied
- `GymHouses/GetGymHousesQueryHandlerTests.cs` -- returns houses for owner
- `Members/CreateMemberCommandHandlerTests.cs` -- success, duplicate in same house, permission denied
- `Members/GetMembersQueryHandlerTests.cs` -- pagination, tenant isolation (member in house A not visible from house B)
- `Subscriptions/CreateSubscriptionCommandHandlerTests.cs` -- success, member already has active subscription
- `Subscriptions/FreezeSubscriptionCommandHandlerTests.cs` -- success, already frozen, expired subscription cannot freeze
- `Subscriptions/CancelSubscriptionCommandHandlerTests.cs` -- success, already cancelled

#### Infrastructure Tests -- `tests/GymManager.Infrastructure.Tests/`

- `Persistence/TenantIsolationTests.cs` -- insert member in house A, query with house B tenant context, assert empty result
- `Persistence/SoftDeleteFilterTests.cs` -- soft-delete member, query returns empty, IgnoreQueryFilters returns deleted

#### Test Builders -- `tests/GymManager.Tests.Common/`

- `Builders/UserBuilder.cs`
- `Builders/GymHouseBuilder.cs`
- `Builders/MemberBuilder.cs`
- `Builders/SubscriptionBuilder.cs`

### 1.7 Acceptance Criteria

- [ ] `dotnet build` passes with zero warnings
- [ ] `dotnet test` -- all Phase 1 tests green against Testcontainers PostgreSQL
- [ ] User can register, login, receive JWT + refresh token
- [ ] Owner can CRUD gym houses
- [ ] House manager can create members scoped to their house
- [ ] Subscriptions can be created, renewed, frozen, cancelled
- [ ] Tenant isolation: house B query never returns house A data (integration test proves this)
- [ ] Web: login/register flow works, dashboard shows stat cards, gym house and member CRUD functional
- [ ] EF migration `InitialFoundation` applies cleanly to empty database

