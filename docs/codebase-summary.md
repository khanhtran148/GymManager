---
type: codebase-summary
updated: 2026-03-19
phases-complete: Phase 1 (Foundation), Phase 2 (Booking), Phase 3 (Finance), Phase 4 (Staff/HR), Phase 5 (Communications + RBAC)
---

# Codebase Summary

## Project Overview

GymManager is a multi-tenant SaaS platform for gym owners managing 2–5 locations. Gym owners get one account; each physical location is a `GymHouse`. All data scoped by `GymHouseId`. Phases 1–5 are complete.

## Tech Stack

| Layer | Technology |
|---|---|
| API | .NET 10, ASP.NET Core, Controller-based |
| ORM | EF Core + Npgsql (PostgreSQL) |
| CQRS | MediatR 13.1.0 |
| Validation | FluentValidation via MediatR pipeline |
| Messaging | MassTransit 8.5.8 + RabbitMQ |
| Realtime | SignalR (`NotificationHub`) |
| Auth | JWT (15-min access) + Refresh Token |
| Background Jobs | .NET Hosted Services + Quartz.NET |
| Frontend | Next.js 15, App Router, React 19 |
| Frontend State | TanStack Query 5, Zustand 5 |
| Frontend Forms | React Hook Form + Zod |
| Mobile | Flutter (Dart), Riverpod, go_router |
| Error handling | CSharpFunctionalExtensions `Result<T>` |

## Solution Structure

```
GymManager.slnx
├── src/
│   ├── core/
│   │   ├── GymManager.Domain/               # Entities, Value Objects, Enums, Domain Events
│   │   ├── GymManager.Application/          # CQRS handlers, validators, interfaces
│   │   └── GymManager.Infrastructure/       # EF Core, PostgreSQL, JWT, MassTransit
│   └── apps/
│       ├── GymManager.Api/                  # Controllers, Middleware, SignalR Hub
│       ├── GymManager.BackgroundServices/   # MassTransit consumers, Quartz jobs
│       ├── gymmanager-web/                  # Next.js 15 frontend
│       └── gymmanager-mobile/               # Flutter iOS + Android app
└── tests/
    ├── GymManager.Tests.Common/             # Shared builders, test base classes
    ├── GymManager.Domain.Tests/
    ├── GymManager.Application.Tests/
    ├── GymManager.Infrastructure.Tests/
    └── GymManager.Api.Tests/
```

## Layer Dependency Rules

```
Domain           → no external references (pure domain)
Application      → Domain
Infrastructure   → Application + Domain
Api              → Application + Infrastructure
BackgroundServices → Application + Infrastructure
```

## Key Patterns

### CQRS with MediatR

Each feature lives in its own slice folder under `GymManager.Application/{Feature}/{Slice}/`. No cross-slice imports at the handler level. Commands and queries are records.

```csharp
// Command
public sealed record CreateBookingCommand(
    Guid MemberId, Guid GymHouseId, BookingType Type,
    Guid? TimeSlotId, Guid? ClassScheduleId)
    : IRequest<Result<BookingDto>>;

// Handler returns Result<T>
public sealed class CreateBookingHandler(...)
    : IRequestHandler<CreateBookingCommand, Result<BookingDto>>
{
    public async Task<Result<BookingDto>> Handle(
        CreateBookingCommand request, CancellationToken ct)
    {
        // 1. Permission check — always first
        // 2. Business rules
        // 3. Persist
        // 4. Publish event
        // 5. Return Result.Success(dto)
    }
}
```

### Result<T> Error Handling

All handlers return `Result<T>` or `Result` from CSharpFunctionalExtensions. `ApiControllerBase.HandleResult()` maps errors to ProblemDetails (RFC 7807). Error types:

| Type | HTTP Status |
|---|---|
| `NotFoundError` | 404 |
| `ForbiddenError` | 403 |
| `ConflictError` | 409 |
| `ValidationError` (thrown) | 422 |
| Unhandled exception | 500 |

`HandleResult(Result<T> result)` uses prefix-based string dispatch. Error strings carry a `[NOT_FOUND]`, `[FORBIDDEN]`, or `[CONFLICT]` prefix that `MapErrorToResult` switches on:

```csharp
private IActionResult MapErrorToResult(string error) => error switch
{
    var e when e.StartsWith("[NOT_FOUND]")  => NotFound(ToProblem("Not Found", StripPrefix(e), 404)),
    var e when e.StartsWith("[FORBIDDEN]")  => StatusCode(403, ToProblem("Forbidden", StripPrefix(e), 403)),
    var e when e.StartsWith("[CONFLICT]")   => Conflict(ToProblem("Conflict", StripPrefix(e), 409)),
    var e                                   => BadRequest(ToProblem("Bad Request", e, 400))
};
```

All ProblemDetails responses include a `title` field (RFC 7807 compliant). `instance` is always set to `HttpContext.Request.Path`.

### Permission System

All mutations check `IPermissionChecker` as the first handler step. Never inline permission logic in controllers or repositories. Permissions are a `[Flags]` `long` enum stored on `User.Permissions`.

```csharp
var allowed = await permissions.HasPermissionAsync(
    currentUser.UserId, request.GymHouseId, Permission.ManageBookings, ct);
if (!allowed)
    return Result.Failure<BookingDto>(new ForbiddenError().ToString());
```

**RBAC (Phase 5):** Tenant-specific permission overrides are stored in `RolePermission` (one row per `TenantId + Role`). `PermissionChecker` reads `RolePermission` for the active tenant before falling back to the user's own `Permissions` bitmask. Controllers never inject `ICurrentUser` directly; the userId/tenantId are extracted inside handlers via `ICurrentUser`.

`ManageRoles` permission (bit 26) gates all `/roles/*` endpoints. Only Owner holds this by default.

### MediatR Pipeline Behaviors

1. `ValidationBehavior<TRequest, TResponse>` — runs FluentValidation, throws `ValidationException` on failure
2. `LoggingBehavior` — logs request/response with structured Serilog templates

### Multi-Tenancy

Tenant isolation via `GymHouseId` on every scoped entity. EF Core global query filters enforce this at the persistence layer. `ICurrentUser.TenantId` flows from JWT claims.

### RolePermission entity

`RolePermission` does not inherit `AuditableEntity`. It stores one row per `(TenantId, Role)` pair holding the permission bitmask for that role within the tenant. Seeded from `RoleSeedData` on tenant creation; modifiable at runtime via the `/roles/{role}/permissions` endpoint.

---

## Entity Inventory

All entities inherit `AuditableEntity`:

```csharp
public abstract class AuditableEntity
{
    public Guid Id { get; protected set; }     // gen_random_uuid()
    public DateTime CreatedAt { get; }         // TIMESTAMPTZ UTC
    public DateTime UpdatedAt { get; set; }    // TIMESTAMPTZ UTC
    public DateTime? DeletedAt { get; set; }   // soft delete
    public bool IsDeleted => DeletedAt.HasValue;
}
```

### User

| Property | Type | Notes |
|---|---|---|
| `Email` | string | unique |
| `PasswordHash` | string | BCrypt |
| `FullName` | string | |
| `Phone` | string? | |
| `Role` | `Role` enum | Owner / HouseManager / Trainer / Staff / Member |
| `Permissions` | `Permission` flags | long, bitfield |
| `RefreshToken` | string? | |
| `RefreshTokenExpiresAt` | DateTime? | |

Methods: `SetRefreshToken()`, `IsRefreshTokenValid()`.

### GymHouse

| Property | Type | Notes |
|---|---|---|
| `Name` | string | |
| `Address` | string | |
| `Phone` | string? | |
| `OperatingHours` | string? | free-form text |
| `HourlyCapacity` | int | max concurrent drop-in bookings |
| `OwnerId` | Guid | FK → User |

Navigation: `Owner`.

### Member

| Property | Type | Notes |
|---|---|---|
| `UserId` | Guid | FK → User |
| `GymHouseId` | Guid | tenant scope |
| `MemberCode` | string | `{PREFIX}-{SEQUENCE:D5}` |
| `Status` | `MembershipStatus` | Active / Frozen / Expired / Cancelled |
| `JoinedAt` | DateTime | |

Navigation: `User`, `GymHouse`, `Subscriptions[]`. Static method: `GenerateMemberCode()`.

### Subscription

| Property | Type | Notes |
|---|---|---|
| `MemberId` | Guid | FK → Member |
| `GymHouseId` | Guid | tenant scope |
| `Type` | `SubscriptionType` | Monthly / Quarterly / Annual / DayPass |
| `Status` | `SubscriptionStatus` | Active / Frozen / Expired / Cancelled |
| `Price` | decimal | |
| `StartDate` | DateTime | |
| `EndDate` | DateTime | |
| `FrozenAt` | DateTime? | |
| `FrozenUntil` | DateTime? | |

Methods: `Freeze()`, `Cancel()`, `Expire()`, `Renew()` — all return `Result`.

### TimeSlot

| Property | Type | Notes |
|---|---|---|
| `GymHouseId` | Guid | tenant scope |
| `Date` | DateOnly | |
| `StartTime` | TimeOnly | |
| `EndTime` | TimeOnly | |
| `MaxCapacity` | int | |
| `CurrentBookings` | int | incremented on confirmed booking |

Navigation: `GymHouse`.

### ClassSchedule

| Property | Type | Notes |
|---|---|---|
| `GymHouseId` | Guid | tenant scope |
| `TrainerId` | Guid | FK → User |
| `ClassName` | string | |
| `DayOfWeek` | DayOfWeek | |
| `StartTime` | TimeOnly | |
| `EndTime` | TimeOnly | |
| `MaxCapacity` | int | |
| `CurrentEnrollment` | int | |
| `IsRecurring` | bool | |

Navigation: `GymHouse`, `Trainer`.

### Booking

| Property | Type | Notes |
|---|---|---|
| `MemberId` | Guid | FK → Member |
| `GymHouseId` | Guid | tenant scope |
| `BookingType` | `BookingType` | TimeSlot / ClassSession |
| `TimeSlotId` | Guid? | set when Type = TimeSlot |
| `ClassScheduleId` | Guid? | set when Type = ClassSession |
| `Status` | `BookingStatus` | Confirmed / Cancelled / NoShow / Completed / WaitListed |
| `BookedAt` | DateTime | |
| `CheckedInAt` | DateTime? | |
| `CheckInSource` | `CheckInSource`? | QRScan / ManualByStaff / SelfKiosk |

Methods: `CheckIn()`, `Cancel()`, `MarkNoShow()`, `Complete()`.

### Waitlist

| Property | Type | Notes |
|---|---|---|
| `MemberId` | Guid | FK → Member |
| `GymHouseId` | Guid | tenant scope |
| `BookingType` | `BookingType` | |
| `TimeSlotId` | Guid? | |
| `ClassScheduleId` | Guid? | |
| `Position` | int | ordering in queue |
| `AddedAt` | DateTime | |
| `PromotedAt` | DateTime? | set when promoted to Booking |

---

## Enum Inventory

| Enum | Values |
|---|---|
| `Role` | Owner, HouseManager, Trainer, Staff, Member |
| `Permission` | 27 flags (ViewMembers, ManageMembers, ..., ManageRoles=1L<<26, Admin=~0L) |
| `BookingStatus` | Confirmed, Cancelled, NoShow, Completed, WaitListed |
| `BookingType` | TimeSlot, ClassSession |
| `CheckInSource` | QRScan, ManualByStaff, SelfKiosk |
| `MembershipStatus` | Active, Frozen, Expired, Cancelled |
| `SubscriptionStatus` | Active, Frozen, Expired, Cancelled |
| `SubscriptionType` | Monthly, Quarterly, Annual, DayPass |
| `DayOfWeekFlag` | [Flags] Monday–Sunday bitmask |
| `TargetAudience` | AllMembers, ActiveMembers, Staff, Trainers, Everyone |
| `NotificationChannel` | InApp, Push, Email |
| `DeliveryStatus` | Pending, Sent, Delivered, Read, Failed |

### Announcement

| Property | Type | Notes |
|---|---|---|
| `GymHouseId` | Guid? | null = chain-wide (Owner only) |
| `AuthorId` | Guid | FK → User |
| `Title` | string | |
| `Content` | string | |
| `TargetAudience` | `TargetAudience` | |
| `PublishAt` | DateTime | scheduled publish time (UTC) |
| `IsPublished` | bool | set by `AnnouncementPublisherJob` |

Methods: `Publish()` — sets `IsPublished = true`.

### NotificationDelivery

| Property | Type | Notes |
|---|---|---|
| `AnnouncementId` | Guid | FK → Announcement |
| `RecipientId` | Guid | FK → User |
| `GymHouseId` | Guid | tenant scope |
| `Channel` | `NotificationChannel` | InApp / Push / Email |
| `Status` | `DeliveryStatus` | Pending → Sent → Delivered → Read |
| `ReadAt` | DateTime? | set on mark-read |

Methods: `MarkRead()` — sets `Status = Read`, `ReadAt = utcNow`.

### RolePermission

| Property | Type | Notes |
|---|---|---|
| `TenantId` | Guid | FK → GymHouseId |
| `Role` | `Role` enum | Role being configured |
| `Permissions` | `Permission` flags | Bitmask for this role within the tenant |

Does not inherit `AuditableEntity`. Seeded by `RoleSeedData`.

### NotificationPreference

| Property | Type | Notes |
|---|---|---|
| `UserId` | Guid | FK → User, unique per user |
| `InAppEnabled` | bool | default true |
| `PushEnabled` | bool | default true |
| `EmailEnabled` | bool | default false |

---

## Domain Events

All implement `IDomainEvent`. Published via MassTransit to RabbitMQ. Once published, namespace and class names are immutable.

| Event | Payload |
|---|---|
| `BookingConfirmedEvent` | BookingId, MemberId, GymHouseId |
| `BookingCancelledEvent` | BookingId, MemberId, GymHouseId, Type, TimeSlotId?, ClassScheduleId? |
| `WaitlistPromotedEvent` | WaitlistId, BookingId, MemberId |
| `MemberCreatedEvent` | MemberId, GymHouseId |
| `SubscriptionCreatedEvent` | (see file) |
| `SubscriptionExpiredEvent` | SubscriptionId, MemberId |
| `AnnouncementPublishedEvent` | AnnouncementId, GymHouseId?, TargetAudience |

---

## Application Layer — Feature Slices

```
GymManager.Application/
├── Auth/
│   ├── Login/
│   ├── RefreshToken/
│   ├── Register/
│   └── Shared/               # AuthResponse DTO
├── Bookings/
│   ├── CancelBooking/
│   ├── CheckIn/
│   ├── CreateBooking/
│   ├── GetBookingById/
│   ├── GetBookings/
│   ├── MarkNoShow/
│   └── Shared/               # BookingDto
├── ClassSchedules/
│   ├── CreateClassSchedule/
│   ├── GetClassScheduleById/
│   ├── GetClassSchedules/
│   ├── UpdateClassSchedule/
│   └── Shared/               # ClassScheduleDto
├── GymHouses/
│   ├── CreateGymHouse/
│   ├── DeleteGymHouse/
│   ├── GetGymHouseById/
│   ├── GetGymHouses/
│   ├── UpdateGymHouse/
│   └── Shared/               # GymHouseDto
├── Members/
│   ├── CreateMember/
│   ├── GetMemberById/
│   ├── GetMembers/
│   ├── UpdateMember/
│   └── Shared/               # MemberDto
├── Subscriptions/
│   ├── CancelSubscription/
│   ├── CreateSubscription/
│   ├── FreezeSubscription/
│   ├── GetSubscriptionsByMember/
│   ├── RenewSubscription/
│   └── Shared/               # SubscriptionDto
├── TimeSlots/
│   ├── CreateTimeSlot/
│   ├── GetTimeSlots/
│   └── Shared/               # TimeSlotDto
├── Announcements/
│   ├── CreateAnnouncement/       # command, validator, handler
│   ├── GetAnnouncements/         # query, handler
│   ├── GetAnnouncementById/      # query, handler
│   └── Shared/                   # AnnouncementDto
├── Notifications/
│   ├── GetNotifications/         # query, handler
│   ├── MarkNotificationRead/     # command, handler
│   ├── UpdatePreferences/        # command, validator, handler
│   ├── GetPreferences/           # query, handler
│   └── Shared/                   # NotificationDto, NotificationPreferenceDto
├── Roles/
│   ├── ChangeUserRole/           # command, handler
│   ├── GetRolePermissions/       # query, handler
│   ├── GetRoleUsers/             # query, handler
│   ├── GetRolesMetadata/         # query, handler (static RBAC metadata)
│   ├── ResetDefaultPermissions/  # command, handler
│   ├── UpdateRolePermissions/    # command, handler
│   └── Shared/                   # RolePermissionDto, RoleUserDto, RolesMetadataDto
└── Common/
    ├── Behaviors/
    │   ├── ValidationBehavior.cs
    │   └── LoggingBehavior.cs
    ├── Interfaces/
    │   ├── IAnnouncementRepository.cs
    │   ├── INotificationDeliveryRepository.cs
    │   ├── INotificationPreferenceRepository.cs
    │   ├── IFirebaseMessagingService.cs
    │   ├── INotificationHub.cs
    │   ├── IBookingRepository.cs
    │   ├── IClassScheduleRepository.cs
    │   ├── ICurrentUser.cs
    │   ├── IGymHouseRepository.cs
    │   ├── IMemberRepository.cs
    │   ├── IPasswordHasher.cs
    │   ├── IPermissionChecker.cs
    │   ├── IRolePermissionRepository.cs
    │   ├── ISubscriptionRepository.cs
    │   ├── ITimeSlotRepository.cs
    │   ├── ITokenService.cs
    │   ├── IUserRepository.cs
    │   └── IWaitlistRepository.cs
    └── Models/
        ├── PagedList<T>.cs        # { Items, TotalCount, Page, PageSize }
        └── Errors.cs              # NotFoundError, ForbiddenError, ConflictError, ValidationError
```

---

## Infrastructure Layer

### EF Core Configurations (`Persistence/Configurations/`)

One `IEntityTypeConfiguration<T>` per entity: `AnnouncementConfiguration`, `BookingConfiguration`, `ClassScheduleConfiguration`, `GymHouseConfiguration`, `MemberConfiguration`, `NotificationDeliveryConfiguration`, `NotificationPreferenceConfiguration`, `SubscriptionConfiguration`, `TimeSlotConfiguration`, `UserConfiguration`, `WaitlistConfiguration`.

### Repositories (`Persistence/Repositories/`)

One repository per entity: `AnnouncementRepository`, `BookingRepository`, `ClassScheduleRepository`, `GymHouseRepository`, `MemberRepository`, `NotificationDeliveryRepository`, `NotificationPreferenceRepository`, `SubscriptionRepository`, `TimeSlotRepository`, `UserRepository`, `WaitlistRepository`. All implement corresponding interfaces from Application.

### Notification Services (`Notifications/`)

| Class | Interface | Notes |
|---|---|---|
| `FirebaseMessagingService` | `IFirebaseMessagingService` | No-op stub — FCM credentials not yet provisioned |
| `SignalRNotificationHub` | `INotificationHub` | Uses non-generic `IHubContext`; wired to `NotificationHub` at API registration |

`GymManagerDbContext` — EF Core DbContext with global soft-delete query filters.

### Auth Components

| File | Responsibility |
|---|---|
| `JwtTokenService` | Generates 15-min access tokens, opaque refresh tokens |
| `CurrentUser` | Reads `userId`, `tenantId`, `role`, `permissions` from JWT claims |
| `PermissionChecker` | Evaluates `Permission` flags for a user+tenant pair |
| `BCryptPasswordHasher` | Wraps BCrypt for `IPasswordHasher` |

JWT claims: `NameIdentifier` (userId), `email`, `role`, `permissions` (long bitfield), `tenant_id`.

### Seeding

`RoleSeedData` maps each `Role` to its default `Permission` set. Owner gets `Permission.Admin` (~0L). Member gets read-only access to their own data.

---

## API Layer

### Middleware Pipeline

```
ExceptionHandlingMiddleware → HTTPS (non-dev: HSTS) → SecurityHeaders → CORS → RateLimit → Auth → Authorization → Controllers
```

`ExceptionHandlingMiddleware` maps `ValidationException` → 422, `UnauthorizedAccessException` → 401, unhandled → 500, all as ProblemDetails JSON.

**Security headers** are set by an inline middleware after `UseHttpsRedirection()`:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

**JWT startup validation:** `Program.cs` reads `Jwt:Secret` at startup and throws `InvalidOperationException` if it is absent or shorter than 32 characters. The app will not start with a misconfigured JWT secret.

### SignalR

`NotificationHub` at `/hubs/notifications`. Requires `[Authorize]`. On connect, groups the client into both `tenant:{tenantId}` and `user:{userId}` based on JWT claims. Phase 5 added the `user:{userId}` group for targeted notification delivery.

### API Versioning

URL segment: `/api/v1/...`. Default version 1.0. Also supports `x-api-version` header.

---

## Background Services

### WaitlistPromotionConsumer

Consumes `BookingCancelledEvent` from RabbitMQ via MassTransit. When a booking is cancelled:
1. Finds the next member in the waitlist for that TimeSlot or ClassSchedule.
2. Creates a confirmed `Booking` for that member.
3. Increments `CurrentBookings` or `CurrentEnrollment` on the slot.
4. Marks the `Waitlist` entry with `PromotedAt`.
5. Publishes `WaitlistPromotedEvent`.

### AnnouncementSignalRConsumer

Consumes `AnnouncementPublishedEvent`. For each targeted recipient, creates a `NotificationDelivery` record (InApp channel) and calls `INotificationHub.SendToGroupAsync` to push to the `user:{userId}` SignalR group.

### AnnouncementFcmConsumer

Consumes `AnnouncementPublishedEvent`. Checks `NotificationPreference.PushEnabled` per recipient. Calls `IFirebaseMessagingService.SendMulticastAsync`. Currently a no-op until FCM credentials and device token storage are provisioned.

### AnnouncementPublisherJob (Quartz.NET)

Runs every 30 seconds. Queries all `Announcement` records where `IsPublished = false` AND `PublishAt <= utcNow`. Calls `announcement.Publish()` on each and persists. Publishes `AnnouncementPublishedEvent` via MassTransit.

---

## API Endpoint Inventory

Base path: `/api/v1/`

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, get JWT + refresh token |
| POST | `/auth/refresh` | Exchange refresh token |
| GET | `/gymhouses` | List gym houses for current user |
| GET | `/gymhouses/{id}` | Get gym house by ID |
| POST | `/gymhouses` | Create gym house |
| PUT | `/gymhouses/{id}` | Update gym house |
| DELETE | `/gymhouses/{id}` | Soft-delete gym house |
| GET | `/gymhouses/{gymHouseId}/members` | List members (paginated, searchable) |
| GET | `/gymhouses/{gymHouseId}/members/{id}` | Get member |
| POST | `/gymhouses/{gymHouseId}/members` | Create member |
| PUT | `/gymhouses/{gymHouseId}/members/{id}` | Update member |
| GET | `/gymhouses/{gymHouseId}/members/{memberId}/subscriptions` | List subscriptions |
| POST | `/gymhouses/{gymHouseId}/members/{memberId}/subscriptions` | Create subscription |
| POST | `/subscriptions/{id}/renew` | Renew subscription |
| POST | `/subscriptions/{id}/freeze` | Freeze subscription |
| POST | `/subscriptions/{id}/cancel` | Cancel subscription |
| GET | `/gymhouses/{gymHouseId}/bookings` | List bookings (paginated, date range) |
| GET | `/gymhouses/{gymHouseId}/bookings/{id}` | Get booking |
| POST | `/gymhouses/{gymHouseId}/bookings` | Create booking |
| DELETE | `/gymhouses/{gymHouseId}/bookings/{id}` | Cancel booking |
| PATCH | `/gymhouses/{gymHouseId}/bookings/{id}/check-in` | Check in member |
| PATCH | `/gymhouses/{gymHouseId}/bookings/{id}/no-show` | Mark no-show |
| GET | `/gymhouses/{gymHouseId}/time-slots` | List time slots (date range) |
| POST | `/gymhouses/{gymHouseId}/time-slots` | Create time slot |
| GET | `/gymhouses/{gymHouseId}/class-schedules` | List class schedules (optional day filter) |
| GET | `/gymhouses/{gymHouseId}/class-schedules/{id}` | Get class schedule |
| POST | `/gymhouses/{gymHouseId}/class-schedules` | Create class schedule |
| PUT | `/gymhouses/{gymHouseId}/class-schedules/{id}` | Update class schedule |
| POST | `/announcements` | Create announcement (scheduled publish; chain-wide requires Owner) |
| GET | `/announcements` | List announcements (paginated, gymHouseId filter optional) |
| GET | `/announcements/{id}` | Get announcement by ID |
| GET | `/notifications` | List notifications for current user (paginated) |
| PATCH | `/notifications/{id}/read` | Mark notification as read |
| GET | `/notification-preferences` | Get notification preferences for current user |
| PUT | `/notification-preferences` | Update notification preferences |
| GET | `/roles/permissions` | List all roles with their permission bitmasks for the caller's tenant |
| PUT | `/roles/{role}/permissions` | Update the permission bitmask for a role within the caller's tenant |
| POST | `/roles/reset-defaults` | Reset all role permissions to seed defaults |
| GET | `/roles/metadata` | Static RBAC metadata — role definitions, permission catalogue |
| GET | `/roles/{role}/users` | List users holding a given role (paginated) |
| PUT | `/users/{userId}/role` | Change a user's role |

---

## Frontend Route Inventory

Next.js App Router with two route groups:

### Auth group `(auth)/`

| Route | Page |
|---|---|
| `/login` | Login form |
| `/register` | Registration form |

### Dashboard group `(dashboard)/`

| Route | Page |
|---|---|
| `/` | Dashboard home |
| `/bookings` | Bookings list |
| `/bookings/new` | Create booking |
| `/bookings/[id]` | Booking detail |
| `/check-in` | Check-in station |
| `/class-schedules` | Class schedule list |
| `/class-schedules/new` | Create class schedule |
| `/gym-houses` | Gym house list |
| `/gym-houses/new` | Create gym house |
| `/gym-houses/[id]` | Gym house detail |
| `/members` | Member list |
| `/members/new` | Create member |
| `/members/[id]` | Member detail |
| `/members/[id]/subscriptions/new` | Create subscription |
| `/time-slots` | Time slot list |
| `/announcements` | Announcement list (filterable by gym house) |
| `/announcements/new` | Create announcement form (Zod validation, scheduled publish) |
| `/notifications` | Full-page notification inbox |
| `/settings/notifications` | Notification channel preference toggles |

### Frontend Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # Shared UI components (+ notification-bell.tsx, notification-feed.tsx)
├── hooks/         # TanStack Query hooks (+ use-announcements.ts, use-notifications.ts)
├── lib/           # api-client, auth helpers, booking-utils, utils, signalr.ts
├── providers/     # React context providers
├── stores/        # Zustand stores (auth-store, theme-store, notification-store.ts)
└── types/         # TypeScript types (+ announcement.ts, notification.ts)
```

---

## Mobile App (Flutter)

| Technology | Library |
|---|---|
| State management | flutter_riverpod 2.6.1 |
| Navigation | go_router 14.6.2 |
| HTTP | Dio 5.7.0 |
| Secure storage | flutter_secure_storage |
| Code gen | freezed, riverpod_annotation |

Structure:
```
lib/
├── core/          # Shared infrastructure (API client, auth, config)
└── features/      # Feature modules (auth, router, ...)
```

---

## Test Projects

| Project | Coverage Target |
|---|---|
| `GymManager.Domain.Tests` | Domain entities and value objects |
| `GymManager.Application.Tests` | Handlers — ≥70% coverage, xUnit + FluentAssertions |
| `GymManager.Infrastructure.Tests` | EF Core configs, Testcontainers |
| `GymManager.Api.Tests` | Controller integration tests |
| `GymManager.Tests.Common` | Shared builders, `ApplicationTestBase` |

Testing rules: no "Arrange/Act/Assert" comments, use `[Theory]` for parameterized cases, use builders from `Tests.Common`.

---

## Current State

| Phase | Status | Scope |
|---|---|---|
| Phase 1 — Foundation | Complete | User, GymHouse, Member, Subscription, Auth, Permissions |
| Phase 2 — Booking | Complete | TimeSlot, ClassSchedule, Booking, Waitlist, Check-In, WaitlistPromotion |
| Phase 3 — Finance | Complete | Transaction, P&L reports |
| Phase 4 — Staff/HR | Complete | Staff, ShiftAssignment, Payroll |
| Phase 5 — Communications | Complete | Announcements, FCM push (stub), SignalR fan-out |
| Phase 6 — Hardening | Pending | PostgreSQL RLS, load testing, offline mobile |
