# GymManager Platform -- Implementation Plan

**Date:** 2026-03-17
**Type:** Fullstack (Backend + Web Frontend)
**Phases:** 6 sequential phases
**TFD:** Mandatory on all backend work

---

## Existing Codebase Summary

The scaffold is in place. What exists:

- **Domain:** `AuditableEntity` base class (Id, CreatedAt, UpdatedAt, DeletedAt), `IDomainEvent`, three enums (`Permission` bits 0-11, `MembershipStatus`, `SubscriptionType`). No entities yet.
- **Application:** `ICurrentUser`, `IPermissionChecker`, error records (`NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError`), `ValidationBehavior`, `LoggingBehavior`, DI registration. No handlers yet.
- **Infrastructure:** `GymManagerDbContext` with `ApplyConfigurationsFromAssembly`. No DbSets, no configurations, no migrations. DI registers Npgsql only.
- **API:** `ApiControllerBase` with `HandleResult` overloads, `ExceptionHandlingMiddleware`, `NotificationHub` (groups by tenant_id), `Program.cs` with JWT auth, versioning, rate limiting, SignalR, CORS. No controllers beyond base.
- **Web:** Next.js shell with `QueryProvider`, `apiClient` (axios with interceptor), blank home page. No auth, no dashboard, no routes.
- **Mobile:** Flutter shell with Riverpod, GoRouter stub, Dio API client stub. No screens.
- **Tests:** `IntegrationTestBase` with Testcontainers PostgreSQL. Four test projects with placeholder tests only.

---

## Conventions Applied Throughout

- All new C# classes: `sealed` unless abstract base
- All handlers: primary constructors, return `Result<T>` or `Result`
- All commands: permission check first via `IPermissionChecker`
- All controllers: only call `Sender.Send()`, decorate with `[ProducesResponseType]`
- All entities: inherit `AuditableEntity`, carry `GymHouseId` if tenant-scoped
- All tests: TFD (write test first), real PostgreSQL via Testcontainers, no mocks
- All EF configs: separate `IEntityTypeConfiguration<T>` classes
- All web pages: App Router, server components by default, `"use client"` only when needed
- File paths use the established solution structure from CLAUDE.md

---

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

---

## Phase 2: Booking

### Objective

Deliver time-slot and class-session booking, waitlist with auto-promotion, check-in tracking, and the booking calendar UI. After this phase, members can book gym slots and class sessions, get waitlisted when full, and check in.

### Dependencies

Phase 1 complete (User, Member, GymHouse, Subscription).

### 2.1 Domain Layer

#### Enums to Add

- `src/core/GymManager.Domain/Enums/BookingType.cs` -- `TimeSlot, ClassSession`
- `src/core/GymManager.Domain/Enums/BookingStatus.cs` -- `Confirmed, Cancelled, NoShow, Completed, WaitListed`
- `src/core/GymManager.Domain/Enums/CheckInSource.cs` -- `QRScan, ManualByStaff, SelfKiosk`
- `src/core/GymManager.Domain/Enums/DayOfWeekFlag.cs` -- `[Flags]` for recurring class schedules

#### Entities to Create

**5. TimeSlot** -- `src/core/GymManager.Domain/Entities/TimeSlot.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid | FK, tenant-scoped |
| Date | DateOnly | |
| StartTime | TimeOnly | |
| EndTime | TimeOnly | |
| MaxCapacity | int | |
| CurrentBookings | int | concurrency counter |

**6. ClassSchedule** -- `src/core/GymManager.Domain/Entities/ClassSchedule.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid | FK, tenant-scoped |
| TrainerId | Guid | FK to User (trainer) |
| ClassName | string | |
| DayOfWeek | DayOfWeek | |
| StartTime | TimeOnly | |
| EndTime | TimeOnly | |
| MaxCapacity | int | |
| CurrentEnrollment | int | concurrency counter |
| IsRecurring | bool | |

**7. Booking** -- `src/core/GymManager.Domain/Entities/Booking.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| MemberId | Guid | FK to Member |
| GymHouseId | Guid | FK, tenant-scoped |
| BookingType | BookingType | discriminator |
| TimeSlotId | Guid? | FK, null for class bookings |
| ClassScheduleId | Guid? | FK, null for slot bookings |
| Status | BookingStatus | |
| BookedAt | DateTime | |
| CheckedInAt | DateTime? | |
| CheckInSource | CheckInSource? | |

**8. Waitlist** -- `src/core/GymManager.Domain/Entities/Waitlist.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| MemberId | Guid | FK |
| GymHouseId | Guid | FK, tenant-scoped |
| BookingType | BookingType | |
| TimeSlotId | Guid? | |
| ClassScheduleId | Guid? | |
| Position | int | queue order |
| AddedAt | DateTime | |
| PromotedAt | DateTime? | null until promoted |

#### Domain Events

- `BookingConfirmedEvent(Guid BookingId, Guid MemberId, Guid GymHouseId)`
- `BookingCancelledEvent(Guid BookingId, Guid MemberId, Guid GymHouseId, BookingType Type, Guid? TimeSlotId, Guid? ClassScheduleId)`
- `WaitlistPromotedEvent(Guid WaitlistId, Guid BookingId, Guid MemberId)`

### 2.2 Application Layer

#### Interfaces to Add

- `IBookingRepository.cs` -- `CreateAsync`, `GetByIdAsync`, `GetByMemberAsync(paged)`, `GetByGymHouseAsync(date range, paged)`
- `ITimeSlotRepository.cs` -- `CreateAsync`, `GetByDateRangeAsync`, `GetByIdForUpdateAsync` (pessimistic lock)
- `IClassScheduleRepository.cs` -- CRUD, `GetByIdForUpdateAsync`
- `IWaitlistRepository.cs` -- `AddAsync`, `GetNextInLineAsync`, `RemoveAsync`

#### Feature Slices

Folder: `src/core/GymManager.Application/Bookings/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateBooking/CreateBookingCommand.cs` | Command | ManageBookings (or self) |
| `CreateBooking/CreateBookingCommandHandler.cs` | Handler | SELECT...FOR UPDATE on capacity |
| `CancelBooking/CancelBookingCommand.cs` | Command | ManageBookings (or self) |
| `CancelBooking/CancelBookingCommandHandler.cs` | Handler | decrement counter, publish event |
| `CheckIn/CheckInCommand.cs` | Command | ManageBookings |
| `CheckIn/CheckInCommandHandler.cs` | Handler | |
| `MarkNoShow/MarkNoShowCommand.cs` | Command | ManageBookings |
| `MarkNoShow/MarkNoShowCommandHandler.cs` | Handler | |
| `GetBookings/GetBookingsQuery.cs` | Query (paged) | ViewBookings |
| `GetBookings/GetBookingsQueryHandler.cs` | Handler | |
| `GetBookingById/GetBookingByIdQuery.cs` | Query | ViewBookings |
| `Shared/BookingDto.cs` | DTO | |

Folder: `src/core/GymManager.Application/TimeSlots/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateTimeSlot/CreateTimeSlotCommand.cs` | Command | ManageSchedule |
| `CreateTimeSlot/CreateTimeSlotCommandHandler.cs` | Handler | |
| `GetTimeSlots/GetTimeSlotsQuery.cs` | Query | ViewBookings |
| `GetTimeSlots/GetTimeSlotsQueryHandler.cs` | Handler | |

Folder: `src/core/GymManager.Application/ClassSchedules/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateClassSchedule/CreateClassScheduleCommand.cs` | Command | ManageSchedule |
| `CreateClassSchedule/CreateClassScheduleCommandHandler.cs` | Handler | |
| `UpdateClassSchedule/UpdateClassScheduleCommand.cs` | Command | ManageSchedule |
| `GetClassSchedules/GetClassSchedulesQuery.cs` | Query | ViewSchedule |
| `GetClassScheduleById/GetClassScheduleByIdQuery.cs` | Query | ViewSchedule |

#### MassTransit Consumers

- `src/apps/GymManager.BackgroundServices/Consumers/WaitlistPromotionConsumer.cs` -- on `BookingCancelledEvent`: find next waitlisted, create booking, decrement waitlist position, publish `WaitlistPromotedEvent`

### 2.3 Infrastructure Layer

#### EF Configurations

- `TimeSlotConfiguration.cs` -- global query filter, composite index on (GymHouseId, Date, StartTime)
- `ClassScheduleConfiguration.cs` -- global query filter, index on (GymHouseId, DayOfWeek)
- `BookingConfiguration.cs` -- global query filter, index on (MemberId, Status), index on (GymHouseId, BookedAt)
- `WaitlistConfiguration.cs` -- global query filter, index on (TimeSlotId, Position), index on (ClassScheduleId, Position)

#### Repository Methods -- Pessimistic Locking

`TimeSlotRepository.GetByIdForUpdateAsync`:
```sql
SELECT * FROM time_slots WHERE id = @id FOR UPDATE
```

Execute via `DbContext.Database.SqlQueryRaw` or use `FromSqlInterpolated` with the FOR UPDATE hint.

#### Migration

- `dotnet ef migrations add AddBookingEntities`

### 2.4 API Layer

**BookingsController** -- `Controllers/BookingsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/bookings` | Default |
| GET | `/api/v1/bookings` | Default |
| GET | `/api/v1/bookings/{id}` | Default |
| DELETE | `/api/v1/bookings/{id}` | Default |
| PATCH | `/api/v1/bookings/{id}/check-in` | Default |
| PATCH | `/api/v1/bookings/{id}/no-show` | Default |

**TimeSlotsController** -- `Controllers/TimeSlotsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/time-slots` | Default |
| GET | `/api/v1/time-slots` | Default |

**ClassSchedulesController** -- `Controllers/ClassSchedulesController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/class-schedules` | Default |
| GET | `/api/v1/class-schedules` | Default |
| GET | `/api/v1/class-schedules/{id}` | Default |
| PUT | `/api/v1/class-schedules/{id}` | Default |

### 2.5 Web Frontend

#### Booking Calendar

- `src/app/(dashboard)/bookings/page.tsx` -- weekly calendar view (time-slot grid + class overlays), create booking modal
- `src/app/(dashboard)/bookings/[id]/page.tsx` -- booking detail, cancel button, check-in action
- `src/hooks/use-bookings.ts` -- `useBookings(dateRange)`, `useCreateBooking()`, `useCancelBooking()`, `useCheckIn()`

#### Class Schedule Management

- `src/app/(dashboard)/class-schedules/page.tsx` -- weekly grid of classes by day, trainer assignment
- `src/app/(dashboard)/class-schedules/new/page.tsx` -- create/edit class form
- `src/hooks/use-class-schedules.ts`

#### Time Slot Management

- `src/app/(dashboard)/time-slots/page.tsx` -- date picker + slot list, capacity indicators (green/yellow/red)
- `src/hooks/use-time-slots.ts`

#### Check-in Interface

- `src/app/(dashboard)/check-in/page.tsx` -- search member by code or name, show today's bookings, check-in button
- `src/components/check-in-card.tsx`

#### Sidebar Update

Add Bookings, Class Schedules, Check-in nav items.

### 2.6 Tests

#### Domain Tests

- `Entities/BookingTests.cs` -- creation with correct type, check-in sets timestamp and source, cancel changes status
- `Entities/TimeSlotTests.cs` -- capacity validation (CurrentBookings <= MaxCapacity)

#### Application Tests

- `Bookings/CreateBookingCommandHandlerTests.cs` -- success (time-slot), success (class), capacity full returns conflict, member not found, permission denied
- `Bookings/CancelBookingCommandHandlerTests.cs` -- success, already cancelled, decrements counter
- `Bookings/CheckInCommandHandlerTests.cs` -- success, already checked in, booking not confirmed
- `TimeSlots/CreateTimeSlotCommandHandlerTests.cs` -- success, overlapping slot in same house
- `ClassSchedules/CreateClassScheduleCommandHandlerTests.cs` -- success, trainer double-booked

#### Infrastructure Tests

- `Persistence/BookingConcurrencyTests.cs` -- two concurrent bookings on last-capacity slot: one succeeds, one gets conflict
- `Persistence/BookingTenantIsolationTests.cs` -- booking in house A not visible from house B

#### Test Builders

- `Builders/TimeSlotBuilder.cs`
- `Builders/ClassScheduleBuilder.cs`
- `Builders/BookingBuilder.cs`
- `Builders/WaitlistBuilder.cs`

### 2.7 Acceptance Criteria

- [ ] Member can book a time slot (capacity decremented)
- [ ] Member can book a class session (enrollment incremented)
- [ ] Fully booked slot returns 409 Conflict
- [ ] Cancellation decrements counter and triggers waitlist promotion
- [ ] Waitlisted member auto-promoted when slot opens (MassTransit consumer test)
- [ ] Check-in records timestamp and source
- [ ] No-show tracking works
- [ ] Concurrent booking test passes (pessimistic lock prevents double-booking)
- [ ] Web: booking calendar renders, create/cancel booking flow works, check-in page functional

---

## Phase 3: Finance

### Objective

Deliver the append-only transaction ledger, revenue dashboards (MRR, churn, avg revenue/member), P&L report per house and aggregated, expense tracking, and membership fee auto-creation on subscription events.

### Dependencies

Phase 1 (Member, Subscription) + Phase 2 (Booking -- for future class-based revenue).

### 3.1 Domain Layer

#### Enums to Add

- `TransactionType.cs` -- `MembershipFee, SalaryPayment, Rent, Utilities, Equipment, Wages, Expense, Refund, Other`
- `TransactionDirection.cs` -- `Credit, Debit`
- `TransactionCategory.cs` -- `Revenue, OperatingExpense, CapitalExpense, Payroll, Refund`

#### Entities to Create

**9. Transaction** -- `src/core/GymManager.Domain/Entities/Transaction.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid | FK, tenant-scoped |
| TransactionType | TransactionType | |
| Direction | TransactionDirection | Credit or Debit |
| Amount | decimal | always positive |
| Category | TransactionCategory | |
| Description | string | |
| TransactionDate | DateTime | |
| RelatedEntityId | Guid? | polymorphic FK |
| ReversesTransactionId | Guid? | FK to self, for corrections |
| ReversedByTransactionId | Guid? | back-pointer |
| ApprovedById | Guid? | FK to User |
| PaymentMethod | PaymentMethod? | enum: Cash, BankTransfer, Card, Online |
| ExternalReference | string? | for future payment gateway |

**CRITICAL:** Transaction does NOT use soft-delete. Override `AuditableEntity` behavior: EF configuration must NOT apply the `DeletedAt IS NULL` query filter. The `DeletedAt` property exists but is never set. No DELETE operation permitted in application code.

Domain method: `static Transaction CreateReversal(Transaction original, string reason)` -- creates a new transaction with opposite direction and `ReversesTransactionId` set.

#### Enums

- `PaymentMethod.cs` -- `Cash, BankTransfer, Card, Online`

#### Domain Events

- `TransactionRecordedEvent(Guid TransactionId, Guid GymHouseId, TransactionType Type, decimal Amount)`

### 3.2 Application Layer

#### Interfaces

- `ITransactionRepository.cs` -- `RecordAsync`, `GetByIdAsync`, `GetByGymHouseAsync(dateRange, paged)`, `GetByTypeAsync`, `GetRevenueAggregateAsync(houseId, dateRange)`, `GetExpenseAggregateAsync(houseId, dateRange)`

#### Feature Slices

Folder: `src/core/GymManager.Application/Transactions/`

| Slice | Type | Permission |
|-------|------|------------|
| `RecordTransaction/RecordTransactionCommand.cs` | Command | ManageFinance |
| `RecordTransaction/RecordTransactionCommandHandler.cs` | Handler | |
| `ReverseTransaction/ReverseTransactionCommand.cs` | Command | ManageFinance |
| `ReverseTransaction/ReverseTransactionCommandHandler.cs` | Handler | creates reversing entry |
| `GetTransactions/GetTransactionsQuery.cs` | Query (paged, filterable) | ViewFinance |
| `GetTransactions/GetTransactionsQueryHandler.cs` | Handler | |
| `Shared/TransactionDto.cs` | DTO | |

Folder: `src/core/GymManager.Application/Reports/`

| Slice | Type | Permission |
|-------|------|------------|
| `GetPnLReport/GetPnLReportQuery.cs` | Query | ViewReports |
| `GetPnLReport/GetPnLReportQueryHandler.cs` | Handler | GROUP BY category, direction |
| `GetRevenueMetrics/GetRevenueMetricsQuery.cs` | Query | ViewReports |
| `GetRevenueMetrics/GetRevenueMetricsQueryHandler.cs` | Handler | MRR, churn rate, avg rev/member |
| `GetPnLReport/PnLReportDto.cs` | DTO | income lines, expense lines, net |
| `GetRevenueMetrics/RevenueMetricsDto.cs` | DTO | mrr, churn, avgRevPerMember |

#### MassTransit Consumer

- `SubscriptionFeeConsumer.cs` -- on `SubscriptionCreatedEvent`: auto-record a MembershipFee transaction with Credit direction, amount from event

### 3.3 Infrastructure Layer

#### EF Configuration

- `TransactionConfiguration.cs`:
  - Do NOT apply `DeletedAt IS NULL` query filter (append-only)
  - DO apply `GymHouseId == tenantId` query filter
  - Index on (GymHouseId, TransactionDate)
  - Index on (GymHouseId, TransactionType)
  - Index on ReversesTransactionId
  - Amount as decimal(18,2)
  - Self-referencing FK for ReversesTransactionId

#### Migration

- `dotnet ef migrations add AddTransactionEntity`

### 3.4 API Layer

**TransactionsController** -- `Controllers/TransactionsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/transactions` | Default |
| GET | `/api/v1/transactions` | Default |
| POST | `/api/v1/transactions/{id}/reverse` | Strict |

**ReportsController** -- `Controllers/ReportsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| GET | `/api/v1/reports/pnl?houseId=&from=&to=` | Default |
| GET | `/api/v1/reports/revenue-metrics?houseId=&from=&to=` | Default |

### 3.5 Web Frontend

#### Financial Dashboard

- `src/app/(dashboard)/finance/page.tsx` -- stat cards (MRR, total revenue, total expenses, net), charts (revenue over time line chart, expense breakdown pie chart)
- `src/components/charts/revenue-line-chart.tsx` -- recharts line chart
- `src/components/charts/expense-pie-chart.tsx` -- recharts pie chart

#### Transaction List

- `src/app/(dashboard)/finance/transactions/page.tsx` -- paginated table, filters (type, direction, date range), search
- `src/app/(dashboard)/finance/transactions/new/page.tsx` -- record expense form (category, amount, description)

#### P&L Report

- `src/app/(dashboard)/finance/pnl/page.tsx` -- date range picker, house selector (or all), income section, expense section, net profit/loss
- `src/components/pnl-table.tsx`

#### Sidebar Update

Add Finance section with sub-items: Dashboard, Transactions, P&L Report.

### 3.6 Tests

#### Domain Tests

- `Entities/TransactionTests.cs` -- creation with valid fields, CreateReversal produces correct opposite direction, amount always positive validation

#### Application Tests

- `Transactions/RecordTransactionCommandHandlerTests.cs` -- success, permission denied
- `Transactions/ReverseTransactionCommandHandlerTests.cs` -- success, already reversed returns conflict, reversing a reversal returns conflict
- `Reports/GetPnLReportQueryHandlerTests.cs` -- correct grouping, date range filtering, per-house and aggregated
- `Reports/GetRevenueMetricsQueryHandlerTests.cs` -- MRR calculation, churn rate with expired subs

#### Infrastructure Tests

- `Persistence/TransactionImmutabilityTests.cs` -- verify no soft-delete filter applied (deleted transaction still visible in query)
- `Persistence/TransactionTenantIsolationTests.cs` -- house A transactions not visible from house B

#### MassTransit Consumer Tests

- `Consumers/SubscriptionFeeConsumerTests.cs` -- SubscriptionCreatedEvent produces correct Transaction record

#### Test Builders

- `Builders/TransactionBuilder.cs`

### 3.7 Acceptance Criteria

- [ ] Transactions are append-only (no update, no soft-delete filter)
- [ ] Reversing entry created correctly with opposite direction
- [ ] SubscriptionCreatedEvent auto-creates MembershipFee transaction
- [ ] P&L report returns correct income/expense/net grouped by category
- [ ] Revenue metrics: MRR, churn rate, avg revenue per member calculated correctly
- [ ] Transaction in house A not visible from house B
- [ ] Web: financial dashboard with charts, transaction CRUD, P&L report page

---

## Phase 4: Staff/HR

### Objective

Deliver staff management per gym house, shift scheduling for non-trainer staff, and payroll with approval workflow that auto-generates salary payment transactions.

### Dependencies

Phase 1 (User, GymHouse) + Phase 3 (Transaction -- for salary payment records).

### 4.1 Domain Layer

#### Enums to Add

- `StaffType.cs` -- `Trainer, SecurityGuard, CleaningStaff, Reception`
- `ShiftType.cs` -- `Morning, Afternoon, Evening, Night`
- `ShiftStatus.cs` -- `Scheduled, Completed, Absent`
- `PayrollStatus.cs` -- `Draft, PendingApproval, Approved, Paid`

#### Entities to Create

**10. Staff** -- `src/core/GymManager.Domain/Entities/Staff.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| UserId | Guid | FK to User |
| GymHouseId | Guid | FK, tenant-scoped |
| StaffType | StaffType | |
| BaseSalary | decimal | monthly base |
| PerClassBonus | decimal | per class taught (trainers) |
| HiredAt | DateTime | |
| User | User | navigation |
| ShiftAssignments | List\<ShiftAssignment\> | navigation |

One Staff record per GymHouse per User. A trainer at two houses = two Staff records.

**11. ShiftAssignment** -- `src/core/GymManager.Domain/Entities/ShiftAssignment.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| StaffId | Guid | FK to Staff |
| GymHouseId | Guid | FK, tenant-scoped |
| ShiftDate | DateOnly | |
| StartTime | TimeOnly | |
| EndTime | TimeOnly | |
| ShiftType | ShiftType | |
| Status | ShiftStatus | |

**12. PayrollPeriod** -- `src/core/GymManager.Domain/Entities/PayrollPeriod.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid | FK, tenant-scoped |
| PeriodStart | DateOnly | |
| PeriodEnd | DateOnly | |
| Status | PayrollStatus | |
| ApprovedById | Guid? | FK to User |
| ApprovedAt | DateTime? | |
| Entries | List\<PayrollEntry\> | navigation |

**13. PayrollEntry** -- `src/core/GymManager.Domain/Entities/PayrollEntry.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| PayrollPeriodId | Guid | FK |
| StaffId | Guid | FK to Staff |
| BasePay | decimal | |
| ClassBonus | decimal | PerClassBonus * ClassesTaught |
| Deductions | decimal | |
| NetPay | decimal | BasePay + ClassBonus - Deductions |
| ClassesTaught | int | count from Booking table for trainers |

#### Domain Events

- `PayrollApprovedEvent(Guid PayrollPeriodId, Guid GymHouseId)` -- triggers Transaction creation
- `StaffCreatedEvent(Guid StaffId, Guid UserId, Guid GymHouseId)`

### 4.2 Application Layer

#### Interfaces

- `IStaffRepository.cs` -- CRUD, `GetByGymHouseAsync(paged)`, `GetByUserIdAsync`
- `IShiftAssignmentRepository.cs` -- CRUD, `GetByStaffAsync(dateRange)`, `GetByHouseAsync(dateRange)`
- `IPayrollPeriodRepository.cs` -- CRUD, `GetByHouseAsync(paged)`
- `IPayrollEntryRepository.cs` -- `GetByPeriodAsync`

#### Feature Slices

Folder: `src/core/GymManager.Application/Staff/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateStaff/CreateStaffCommand.cs` | Command | ManageStaff |
| `UpdateStaff/UpdateStaffCommand.cs` | Command | ManageStaff |
| `GetStaff/GetStaffQuery.cs` | Query (paged) | ViewStaff |
| `GetStaffById/GetStaffByIdQuery.cs` | Query | ViewStaff |

Folder: `src/core/GymManager.Application/ShiftAssignments/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateShiftAssignment/CreateShiftAssignmentCommand.cs` | Command | ManageShifts |
| `UpdateShiftAssignment/UpdateShiftAssignmentCommand.cs` | Command | ManageShifts |
| `GetShiftAssignments/GetShiftAssignmentsQuery.cs` | Query | ViewShifts |

Folder: `src/core/GymManager.Application/Payroll/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreatePayrollPeriod/CreatePayrollPeriodCommand.cs` | Command | ApprovePayroll |
| `CreatePayrollPeriod/CreatePayrollPeriodCommandHandler.cs` | Handler | auto-generates entries |
| `ApprovePayroll/ApprovePayrollCommand.cs` | Command | ApprovePayroll |
| `ApprovePayroll/ApprovePayrollCommandHandler.cs` | Handler | sets status, publishes event |
| `GetPayrollPeriods/GetPayrollPeriodsQuery.cs` | Query | ViewStaff |
| `GetPayrollPeriodById/GetPayrollPeriodByIdQuery.cs` | Query | ViewStaff |

**CreatePayrollPeriodCommandHandler logic:**
1. Check permission (ApprovePayroll)
2. For each Staff in the GymHouse:
   - BasePay = Staff.BaseSalary
   - If Trainer: count classes taught in period (Bookings where ClassSchedule.TrainerId = staff.UserId, status = Completed, date in range)
   - ClassBonus = count * Staff.PerClassBonus
   - NetPay = BasePay + ClassBonus - Deductions
3. Create PayrollEntry for each staff member
4. Status = Draft

#### MassTransit Consumer

- `PayrollApprovedConsumer.cs` -- on `PayrollApprovedEvent`: for each PayrollEntry in the period, create a SalaryPayment Transaction (Debit direction, category Payroll)

### 4.3 Infrastructure Layer

#### EF Configurations

- `StaffConfiguration.cs` -- global query filter, composite unique on (UserId, GymHouseId), BaseSalary as decimal(18,2)
- `ShiftAssignmentConfiguration.cs` -- global query filter, index on (StaffId, ShiftDate)
- `PayrollPeriodConfiguration.cs` -- global query filter, index on (GymHouseId, PeriodStart)
- `PayrollEntryConfiguration.cs` -- index on PayrollPeriodId, all decimal columns as decimal(18,2)

#### Migration

- `dotnet ef migrations add AddStaffPayrollEntities`

### 4.4 API Layer

**StaffController** -- `Controllers/StaffController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/staff` | Default |
| GET | `/api/v1/staff` | Default |
| GET | `/api/v1/staff/{id}` | Default |
| PUT | `/api/v1/staff/{id}` | Default |

**ShiftAssignmentsController** -- `Controllers/ShiftAssignmentsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/shift-assignments` | Default |
| GET | `/api/v1/shift-assignments` | Default |
| PUT | `/api/v1/shift-assignments/{id}` | Default |

**PayrollController** -- `Controllers/PayrollController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/payroll-periods` | Default |
| GET | `/api/v1/payroll-periods` | Default |
| GET | `/api/v1/payroll-periods/{id}` | Default |
| PATCH | `/api/v1/payroll-periods/{id}/approve` | Strict |

### 4.5 Web Frontend

#### Staff Management

- `src/app/(dashboard)/staff/page.tsx` -- staff table grouped by type, hire/edit actions
- `src/app/(dashboard)/staff/[id]/page.tsx` -- staff detail, salary info, shift history
- `src/app/(dashboard)/staff/new/page.tsx` -- create staff form (select user, type, salary)
- `src/hooks/use-staff.ts`

#### Shift Calendar

- `src/app/(dashboard)/shifts/page.tsx` -- weekly calendar grid, staff rows vs time columns, drag-to-assign (stretch goal: simple create modal first)
- `src/hooks/use-shift-assignments.ts`

#### Payroll Dashboard

- `src/app/(dashboard)/payroll/page.tsx` -- list of payroll periods with status badges (Draft, Pending, Approved, Paid)
- `src/app/(dashboard)/payroll/[id]/page.tsx` -- payroll detail: table of entries (staff name, base pay, class bonus, deductions, net pay), approve button
- `src/app/(dashboard)/payroll/new/page.tsx` -- select date range, generate payroll
- `src/hooks/use-payroll.ts`

#### Sidebar Update

Add Staff, Shifts, Payroll nav items.

### 4.6 Tests

#### Domain Tests

- `Entities/StaffTests.cs` -- creation, PerClassBonus only applies to Trainers
- `Entities/PayrollPeriodTests.cs` -- status transitions (Draft -> PendingApproval -> Approved), cannot approve if already approved
- `Entities/PayrollEntryTests.cs` -- NetPay = BasePay + ClassBonus - Deductions

#### Application Tests

- `Staff/CreateStaffCommandHandlerTests.cs` -- success, duplicate (same user + same house) returns conflict, permission denied
- `Payroll/CreatePayrollPeriodCommandHandlerTests.cs` -- generates correct entries, trainer class count correct, overlapping period returns conflict
- `Payroll/ApprovePayrollCommandHandlerTests.cs` -- success (status changes), already approved returns conflict, publishes PayrollApprovedEvent

#### Infrastructure Tests

- `Persistence/StaffTenantIsolationTests.cs`

#### MassTransit Consumer Tests

- `Consumers/PayrollApprovedConsumerTests.cs` -- creates SalaryPayment transactions for each entry

#### Test Builders

- `Builders/StaffBuilder.cs`
- `Builders/ShiftAssignmentBuilder.cs`
- `Builders/PayrollPeriodBuilder.cs`
- `Builders/PayrollEntryBuilder.cs`

### 4.7 Acceptance Criteria

- [ ] Staff created per gym house; same user can be staff at multiple houses
- [ ] Shift assignments created and queried by date range
- [ ] Payroll period auto-generates entries with correct salary calculations
- [ ] Trainer class bonus = PerClassBonus * completed classes in period
- [ ] Payroll approval publishes event that creates SalaryPayment transactions
- [ ] Web: staff CRUD, shift calendar, payroll dashboard with approval flow

---

## Phase 5: Communications

### Objective

Deliver announcement creation with scheduled publishing, real-time notification delivery via SignalR, push notifications via FCM, per-user notification preferences, and read receipt tracking.

### Dependencies

Phase 1 (User, GymHouse, Member). SignalR hub already exists.

### 5.1 Domain Layer

#### Enums to Add

- `TargetAudience.cs` -- `AllMembers, ActiveMembers, Staff, Trainers, Everyone`
- `NotificationChannel.cs` -- `InApp, Push, Email`
- `DeliveryStatus.cs` -- `Pending, Sent, Delivered, Read, Failed`

#### Entities to Create

**14. Announcement** -- `src/core/GymManager.Domain/Entities/Announcement.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid? | null = chain-wide (Owner only) |
| AuthorId | Guid | FK to User |
| Title | string | |
| Content | string | |
| TargetAudience | TargetAudience | |
| PublishAt | DateTime | scheduled publish time |
| IsPublished | bool | set by Quartz job |
| PublishedAt | DateTime? | |

**15. NotificationDelivery** -- `src/core/GymManager.Domain/Entities/NotificationDelivery.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| AnnouncementId | Guid | FK |
| RecipientId | Guid | FK to User |
| Channel | NotificationChannel | |
| Status | DeliveryStatus | |
| SentAt | DateTime? | |
| ReadAt | DateTime? | |

**16. NotificationPreference** -- `src/core/GymManager.Domain/Entities/NotificationPreference.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| UserId | Guid | FK to User |
| Channel | NotificationChannel | |
| IsEnabled | bool | |

#### Domain Events

- `AnnouncementPublishedEvent(Guid AnnouncementId, Guid? GymHouseId, TargetAudience Audience)`

### 5.2 Application Layer

#### Interfaces

- `IAnnouncementRepository.cs` -- CRUD, `GetDueForPublishingAsync()`, `GetByHouseAsync(paged)`
- `INotificationDeliveryRepository.cs` -- `CreateBatchAsync`, `MarkReadAsync`, `GetByRecipientAsync(paged)`
- `INotificationPreferenceRepository.cs` -- `GetByUserIdAsync`, `UpsertAsync`
- `IFirebaseMessagingService.cs` -- `SendMulticastAsync(deviceTokens, title, body)`
- `INotificationHub.cs` -- `SendToGroupAsync(groupName, payload)` (abstraction over SignalR)

#### Feature Slices

Folder: `src/core/GymManager.Application/Announcements/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateAnnouncement/CreateAnnouncementCommand.cs` | Command | ManageAnnouncements |
| `CreateAnnouncement/CreateAnnouncementCommandHandler.cs` | Handler | validate chain-wide requires Owner |
| `GetAnnouncements/GetAnnouncementsQuery.cs` | Query (paged) | ViewAnnouncements |
| `GetAnnouncementById/GetAnnouncementByIdQuery.cs` | Query | ViewAnnouncements |

Folder: `src/core/GymManager.Application/Notifications/`

| Slice | Type | Permission |
|-------|------|------------|
| `GetNotifications/GetNotificationsQuery.cs` | Query | (self only) |
| `MarkNotificationRead/MarkNotificationReadCommand.cs` | Command | (self only) |
| `UpdatePreferences/UpdateNotificationPreferencesCommand.cs` | Command | (self only) |
| `GetPreferences/GetNotificationPreferencesQuery.cs` | Query | (self only) |

#### Quartz Job

- `src/apps/GymManager.BackgroundServices/Jobs/AnnouncementPublisherJob.cs`
  - Runs every 30 seconds
  - Queries `announcements WHERE publish_at <= now AND is_published = false`
  - Sets `IsPublished = true`, `PublishedAt = now`
  - Publishes `AnnouncementPublishedEvent` to MassTransit

#### MassTransit Consumers

- `AnnouncementSignalRConsumer.cs` -- on `AnnouncementPublishedEvent`: resolve recipients by audience + house, filter by preferences (InApp enabled), create NotificationDelivery rows, send via SignalR hub to tenant group
- `AnnouncementFcmConsumer.cs` -- on `AnnouncementPublishedEvent`: resolve recipients with Push preference enabled, get device tokens, send via FCM, create NotificationDelivery rows

### 5.3 Infrastructure Layer

#### EF Configurations

- `AnnouncementConfiguration.cs` -- query filter on GymHouseId (special: null GymHouseId = chain-wide, visible to all), index on (GymHouseId, PublishAt)
- `NotificationDeliveryConfiguration.cs` -- index on (RecipientId, Status), index on AnnouncementId
- `NotificationPreferenceConfiguration.cs` -- unique on (UserId, Channel)

#### Services

- `Notifications/FirebaseMessagingService.cs` -- wraps Firebase Admin SDK
- `Notifications/SignalRNotificationHub.cs` -- implements `INotificationHub`, wraps `IHubContext<NotificationHub>`

#### NotificationHub Update

Extend `NotificationHub` in API to support:
- `OnConnectedAsync` -- already joins tenant group (existing)
- Add user-specific group: `user:{userId}` for targeted notifications

#### Migration

- `dotnet ef migrations add AddCommunicationEntities`

### 5.4 API Layer

**AnnouncementsController** -- `Controllers/AnnouncementsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/announcements` | Default |
| GET | `/api/v1/announcements` | Default |
| GET | `/api/v1/announcements/{id}` | Default |

**NotificationsController** -- `Controllers/NotificationsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| GET | `/api/v1/notifications` | Default |
| PATCH | `/api/v1/notifications/{id}/read` | Default |
| GET | `/api/v1/notification-preferences` | Default |
| PUT | `/api/v1/notification-preferences` | Default |

### 5.5 Web Frontend

#### Announcement Composer

- `src/app/(dashboard)/announcements/page.tsx` -- list of announcements with status (Scheduled, Published), create button
- `src/app/(dashboard)/announcements/new/page.tsx` -- form: title, content (rich text), target audience dropdown, schedule date/time picker, house scope selector (chain-wide for owners)
- `src/hooks/use-announcements.ts`

#### Notification Feed

- `src/components/notification-bell.tsx` -- bell icon in top bar with unread count badge, dropdown showing recent notifications
- `src/components/notification-feed.tsx` -- full notification list with mark-as-read
- `src/hooks/use-notifications.ts` -- TanStack Query + SignalR subscription for real-time updates
- `src/lib/signalr.ts` -- SignalR connection setup, auto-reconnect

#### Notification Preferences

- `src/app/(dashboard)/settings/notifications/page.tsx` -- toggle InApp, Push, Email per notification type

#### Sidebar Update

Add Announcements nav item.

### 5.6 Tests

#### Domain Tests

- `Entities/AnnouncementTests.cs` -- chain-wide requires null GymHouseId, publish sets IsPublished

#### Application Tests

- `Announcements/CreateAnnouncementCommandHandlerTests.cs` -- success, chain-wide without Owner role returns forbidden, scheduled in past returns validation error
- `Notifications/MarkNotificationReadCommandHandlerTests.cs` -- sets ReadAt, not own notification returns forbidden

#### Infrastructure Tests

- `Persistence/AnnouncementVisibilityTests.cs` -- chain-wide announcement visible from any house context, house-scoped not visible from other house

#### Consumer Tests

- `Consumers/AnnouncementSignalRConsumerTests.cs` -- creates delivery records, respects user preferences
- `Consumers/AnnouncementFcmConsumerTests.cs` -- sends to correct device tokens

#### Quartz Job Tests

- `Jobs/AnnouncementPublisherJobTests.cs` -- publishes due announcements, skips already published, skips future

#### Test Builders

- `Builders/AnnouncementBuilder.cs`
- `Builders/NotificationDeliveryBuilder.cs`
- `Builders/NotificationPreferenceBuilder.cs`

### 5.7 Acceptance Criteria

- [ ] Announcement created with scheduled publish time
- [ ] Quartz job publishes due announcements every 30s
- [ ] SignalR pushes notification to connected web clients in tenant group
- [ ] FCM sends push to mobile devices of targeted recipients
- [ ] Per-user notification preferences respected (disabled channels skipped)
- [ ] Read receipts tracked (ReadAt set on mark-read)
- [ ] Chain-wide announcements require Owner permission
- [ ] Web: announcement composer, notification bell with real-time updates, preferences page

---

## Phase 6: Hardening

### Objective

Harden the platform for production: PostgreSQL Row-Level Security, load testing, Flutter offline booking queue, payment gateway stub, performance optimization, and security audit.

### Dependencies

All prior phases complete.

### 6.1 PostgreSQL Row-Level Security

**Files:** `src/core/GymManager.Infrastructure/Persistence/Migrations/` (raw SQL migration)

For every tenant-scoped table (Member, Subscription, TimeSlot, ClassSchedule, Booking, Waitlist, Transaction, Staff, ShiftAssignment, PayrollPeriod, PayrollEntry, Announcement, NotificationDelivery):

1. `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`
2. `CREATE POLICY tenant_isolation ON {table} USING (gym_house_id = current_setting('app.current_tenant_id')::uuid);`
3. Set `app.current_tenant_id` on each database connection via `DbContext` interceptor

**Infrastructure changes:**
- `Persistence/Interceptors/TenantConnectionInterceptor.cs` -- `DbConnectionInterceptor` that runs `SET app.current_tenant_id = '{tenantId}'` on connection open
- Register interceptor in `DependencyInjection.cs`
- Superuser bypass for migrations and admin operations

### 6.2 Load Testing

**Files:** `tests/load-tests/` (new directory)

- `k6/booking-load-test.js` -- 50 concurrent virtual users booking the same time slot, verify exactly MaxCapacity succeed and the rest get 409
- `k6/auth-load-test.js` -- 200 concurrent login attempts, verify rate limiting kicks in at 10/min
- `k6/transaction-load-test.js` -- 100 concurrent transaction recordings, verify all persisted correctly

Run with: `k6 run tests/load-tests/k6/booking-load-test.js`

### 6.3 Flutter Offline Booking Queue

**Files:** `src/apps/gymmanager-mobile/`

- `lib/core/database/local_db.dart` -- SQLite via sqflite, `offline_bookings` table
- `lib/features/booking/data/offline_booking_queue.dart` -- enqueue booking when offline, store as JSON
- `lib/features/booking/data/booking_sync_service.dart` -- on connectivity restored, dequeue and POST to API, handle conflicts (capacity full)
- `lib/core/network/connectivity_monitor.dart` -- stream connectivity status

### 6.4 Payment Gateway Stub

**Domain:**
- `PaymentMethod` enum already added in Phase 3 (Cash, BankTransfer, Card, Online)
- Add `ExternalReference` field to Transaction (already defined in Phase 3)

**Application:**
- `src/core/GymManager.Application/Common/Interfaces/IPaymentGatewayService.cs` -- `CreateChargeAsync(amount, currency, description)`, `RefundChargeAsync(externalRef)`
- `src/core/GymManager.Application/Payments/ProcessPayment/ProcessPaymentCommand.cs` -- calls gateway, records transaction

**Infrastructure:**
- `Payments/StubPaymentGatewayService.cs` -- returns success with fake reference for development
- Later: swap with Stripe/PayOS implementation behind the same interface

### 6.5 Performance Optimization

**Database Indexes:** Review and add where missing:
- Composite indexes on frequently joined columns
- Covering indexes for dashboard aggregate queries (revenue by month)
- `EXPLAIN ANALYZE` on P&L and revenue metrics queries

**Read Query Optimization:**
- Verify all query handlers use `AsNoTracking()`
- Verify all list endpoints use server-side pagination (no `ToListAsync()` without `Take`)
- Add `AsSplitQuery()` where N+1 detected

**Caching (optional):**
- `IMemoryCache` for permission checks (short TTL, 5min)
- Dashboard metrics can tolerate 1-minute staleness

### 6.6 Security Audit

**IgnoreQueryFilters Audit:**
- Grep all usages of `IgnoreQueryFilters()` in codebase
- Each must have: (1) a comment explaining why, (2) an explicit house filter if manager-level, (3) a corresponding tenant isolation test

**Tenant Isolation Integration Tests:**
- `tests/GymManager.Infrastructure.Tests/Security/TenantIsolationSuiteTests.cs`
- One test per tenant-scoped entity: insert in house A, query from house B context via both EF filter AND RLS, assert empty

**Auth Security:**
- Verify refresh token rotation (old token invalidated on use)
- Verify JWT expiry is short (15 min access, 7 day refresh)
- Rate limiting on auth endpoints verified via load test

### 6.7 Tests

#### RLS Tests

- `Persistence/RlsPolicyTests.cs` -- connect with tenant A context, insert row, connect with tenant B context, SELECT returns empty (tests the PostgreSQL policy, not EF filter)

#### Load Test Assertions

- Booking concurrency: exactly MaxCapacity bookings created, rest rejected
- No data corruption under concurrent writes

#### Offline Queue Tests (Flutter)

- `test/features/booking/offline_booking_queue_test.dart` -- enqueue, verify persisted in SQLite, dequeue after sync

### 6.8 Acceptance Criteria

- [ ] RLS policies active on all tenant-scoped tables
- [ ] RLS integration test: raw SQL query with wrong tenant returns zero rows
- [ ] k6 booking load test: 50 concurrent users, exactly MaxCapacity bookings, no double-booking
- [ ] Flutter offline queue: book while offline, sync when online, handle capacity conflict gracefully
- [ ] Payment gateway stub: ProcessPaymentCommand succeeds with stub, records transaction
- [ ] All read queries use AsNoTracking, all lists paginated
- [ ] Zero IgnoreQueryFilters calls without explicit justification comment
- [ ] All Phase 1-5 tests still pass (regression)

---

## Summary

| Phase | New Entities | New Handlers | New API Endpoints | New Web Pages |
|-------|-------------|-------------|-------------------|---------------|
| 1. Foundation | User, GymHouse, Member, Subscription | 16 | 14 | 12 |
| 2. Booking | TimeSlot, ClassSchedule, Booking, Waitlist | 14 | 11 | 5 |
| 3. Finance | Transaction | 6 | 5 | 4 |
| 4. Staff/HR | Staff, ShiftAssignment, PayrollPeriod, PayrollEntry | 11 | 9 | 5 |
| 5. Communications | Announcement, NotificationDelivery, NotificationPreference | 8 | 7 | 4 |
| 6. Hardening | -- | 1 | -- | -- |
| **Total** | **16 entities** | **56 handlers** | **46 endpoints** | **30 pages** |

Each phase is independently deployable. Run `dotnet test` after each phase to verify no regressions. The plan follows TFD throughout: every handler test is written before the handler implementation.
