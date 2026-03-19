---
type: architecture
updated: 2026-03-19
adr: docs/adrs/260317-gymmanager-platform-architecture.md
---

# Architecture

## System Context

GymManager serves gym owners who manage 2–5 physical locations. Each location is a `GymHouse`. Gym staff, trainers, and members access the platform through a web dashboard or mobile app. All clients call a single API.

```mermaid
C4Context
    Person(owner, "Gym Owner", "Manages locations, staff, finances")
    Person(staff, "Staff / Trainer", "Manages bookings, check-ins, schedules")
    Person(member, "Member", "Books classes and time slots")

    System(gymmanager, "GymManager Platform", "Web, mobile, and API for gym operations")

    Rel(owner, gymmanager, "Manages via web dashboard")
    Rel(staff, gymmanager, "Operates via web dashboard")
    Rel(member, gymmanager, "Books and checks in via mobile app")
```

---

## Container Diagram

```mermaid
C4Container
    Person(user, "User (Owner / Staff / Member)")

    Container(web, "gymmanager-web", "Next.js 15, App Router", "Management dashboard")
    Container(mobile, "gymmanager-mobile", "Flutter", "Member self-service iOS/Android app")
    Container(api, "GymManager.Api", ".NET 10, ASP.NET Core", "REST API + SignalR hub")
    Container(bg, "GymManager.BackgroundServices", ".NET 10 Hosted Services", "MassTransit consumers, Quartz jobs")
    ContainerDb(db, "PostgreSQL", "Primary data store — all entities")
    ContainerDb(rabbitmq, "RabbitMQ", "Domain event bus via MassTransit")

    Rel(user, web, "HTTPS")
    Rel(user, mobile, "HTTPS")
    Rel(web, api, "REST + WebSocket (SignalR)")
    Rel(mobile, api, "REST")
    Rel(api, db, "EF Core / Npgsql")
    Rel(api, rabbitmq, "Publish domain events")
    Rel(bg, rabbitmq, "Consume domain events")
    Rel(bg, db, "Read/write via repositories")
```

---

## Component Diagram — API and Core

```mermaid
flowchart TD
    subgraph API["GymManager.Api"]
        CTL[Controllers]
        MW[ExceptionHandlingMiddleware]
        HUB[NotificationHub]
    end

    subgraph APP["GymManager.Application"]
        MED[MediatR Pipeline]
        VB[ValidationBehavior]
        LB[LoggingBehavior]
        HDL[Feature Handlers]
        INT[Interfaces]
    end

    subgraph INF["GymManager.Infrastructure"]
        EF[EF Core + DbContext]
        REPO[Repositories]
        JWT[JwtTokenService]
        PERM[PermissionChecker]
        BUS[MassTransit Publisher]
    end

    subgraph DOM["GymManager.Domain"]
        ENT[Entities]
        EVT[Domain Events]
        ENUM[Enums]
    end

    CTL -->|Sender.Send| MED
    MED --> VB --> LB --> HDL
    HDL --> INT
    INT -.implemented by.-> REPO
    INT -.implemented by.-> JWT
    INT -.implemented by.-> PERM
    REPO --> EF
    HDL --> BUS
    EF --> DOM
    HDL --> DOM
```

---

## Multi-Tenancy

**Strategy:** Shared database, `GymHouseId` discriminator column on every tenant-scoped entity.

```
Owner (User)
 └── GymHouse [1]
     ├── Members
     ├── Subscriptions
     ├── TimeSlots
     ├── ClassSchedules
     ├── Bookings
     └── Waitlist entries
 └── GymHouse [2]
     └── (separate data — same DB)
```

**Enforcement mechanism:**

1. JWT contains `tenant_id` claim (the active `GymHouseId`).
2. `ICurrentUser.TenantId` extracts it from `HttpContext`.
3. EF Core global query filter on every scoped entity: `WHERE gym_house_id = @tenantId AND deleted_at IS NULL`.
4. Permission checker evaluates permissions within the tenant boundary.

**Cross-tenant access:** Owners can query any `GymHouse` they own. `IPermissionChecker.HasPermissionAsync()` validates this before any query executes.

**Risk:** Incorrect `IgnoreQueryFilters()` call leaks cross-tenant data. Mitigation: integration tests with two tenants, code review checklist item.

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: POST /auth/login {email, password}
    API->>DB: Load User by email
    DB-->>API: User record
    API->>API: BCrypt.Verify(password, hash)
    API->>API: Generate 15-min JWT access token
    API->>API: Generate opaque refresh token
    API->>DB: Store RefreshToken + RefreshTokenExpiresAt on User
    API-->>Client: { accessToken, refreshToken, expiresIn }

    Note over Client,API: Access token expires after 15 minutes

    Client->>API: POST /auth/refresh {refreshToken}
    API->>DB: Load User by refreshToken
    API->>API: Validate token not expired
    API->>API: Issue new access + refresh token pair
    API->>DB: Update RefreshToken on User
    API-->>Client: { accessToken, refreshToken, expiresIn }
```

**JWT claims:**

| Claim | Value |
|---|---|
| `sub` (NameIdentifier) | `user.Id` (UUID) |
| `email` | user email |
| `role` | `Role` enum name |
| `permissions` | `(long)user.Permissions` |
| `tenant_id` | active `GymHouseId` |

Access token TTL: **15 minutes**. Algorithm: HMAC-SHA256.

---

## Booking Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Handler
    participant DB
    participant Bus

    Client->>API: POST /gymhouses/{id}/bookings
    API->>Handler: CreateBookingCommand
    Handler->>Handler: Check Permission.ManageBookings
    Handler->>DB: Load TimeSlot / ClassSchedule
    Handler->>DB: SELECT FOR UPDATE (capacity check)
    alt Capacity available
        Handler->>DB: INSERT Booking (Confirmed)
        Handler->>DB: INCREMENT CurrentBookings
        Handler->>Bus: Publish BookingConfirmedEvent
        Handler-->>API: Result.Success(BookingDto)
        API-->>Client: 201 Created
    else Full
        Handler->>DB: INSERT Waitlist entry
        Handler-->>API: Result.Success(BookingDto{Status=WaitListed})
        API-->>Client: 201 Created
    end
```

---

## Waitlist Promotion Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Handler
    participant Bus
    participant Consumer
    participant DB

    Client->>API: DELETE /bookings/{id} (cancel)
    API->>Handler: CancelBookingCommand
    Handler->>DB: Set Booking.Status = Cancelled
    Handler->>DB: DECREMENT CurrentBookings
    Handler->>Bus: Publish BookingCancelledEvent
    Handler-->>Client: 204 No Content

    Bus->>Consumer: WaitlistPromotionConsumer
    Consumer->>DB: GetNextInLine(TimeSlotId / ClassScheduleId)
    alt Waitlist entry found
        Consumer->>DB: INSERT Booking (Confirmed) for waitlisted member
        Consumer->>DB: INCREMENT CurrentBookings
        Consumer->>DB: SET Waitlist.PromotedAt
        Consumer->>Bus: Publish WaitlistPromotedEvent
    end
```

---

## Check-In Flow

```mermaid
sequenceDiagram
    participant Staff
    participant API
    participant Handler
    participant DB

    Staff->>API: PATCH /bookings/{id}/check-in { source: QRScan }
    API->>Handler: CheckInCommand(bookingId, gymHouseId, source)
    Handler->>Handler: Check Permission.ManageBookings
    Handler->>DB: Load Booking
    Handler->>Handler: booking.CheckIn(source)
    Note right of Handler: Sets CheckedInAt, CheckInSource, Status=Completed
    Handler->>DB: UPDATE Booking
    Handler-->>API: Result.Success(BookingDto)
    API-->>Staff: 200 OK
```

---

## Soft Delete

No hard deletes in application code. All entities have `deleted_at TIMESTAMPTZ NULL`. EF Core global query filter: `WHERE deleted_at IS NULL`. Soft delete sets `DeletedAt = DateTime.UtcNow`.

---

## Permission System

`IPermissionChecker` is the single enforcement point for all permission decisions. Controllers never check permissions directly.

```
Handler
  └── IPermissionChecker.HasPermissionAsync(userId, tenantId, permission, ct)
        └── PermissionChecker (Infrastructure)
              ├── Loads RolePermission for (tenantId, user.Role)
              └── Returns (user.Permissions & required) != 0
```

**RBAC per tenant:** `RolePermission` stores a permission bitmask per `(TenantId, Role)`. Owners can customize which permissions each role holds within their GymHouse. Changes take effect immediately (no token refresh required for server-side enforcement).

**Default permissions** are seeded from `RoleSeedData` when a tenant is created. Owners can reset to defaults via `POST /roles/reset-defaults`.

---

## Error Handling

All handler errors flow through `ApiControllerBase.HandleResult()`. The method inspects the error string prefix to determine the HTTP status:

| Prefix | Status | ProblemDetails title |
|--------|--------|---------------------|
| `[NOT_FOUND]` | 404 | `Not Found` |
| `[FORBIDDEN]` | 403 | `Forbidden` |
| `[CONFLICT]` | 409 | `Conflict` |
| (none / other) | 400 | `Bad Request` |
| Thrown `ValidationException` | 422 | `Validation failed` |
| Unhandled exception | 500 | `Internal Server Error` |

All ProblemDetails responses include `status`, `title`, `detail`, and `instance` (request path).

---

## Security Headers

An inline middleware runs after `UseHttpsRedirection()` and sets:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

HSTS is enabled in non-development environments.

---

## JWT Startup Validation

`Program.cs` reads `Jwt:Secret` and fails fast at startup if:
- The value is absent or empty (`ArgumentException.ThrowIfNullOrWhiteSpace`)
- The value is shorter than 32 characters (`InvalidOperationException`)

This prevents silent misconfiguration in new deployments.

---

## Key Architectural Decisions

See [`docs/adrs/260317-gymmanager-platform-architecture.md`](adrs/260317-gymmanager-platform-architecture.md) for full rationale.

| Decision | Choice | Rationale |
|---|---|---|
| Multi-tenancy | Shared DB + `GymHouseId` | Simple for 2–5 locations; PostgreSQL RLS in Phase 6 |
| Financial ledger | Append-only Transaction table | P&L queries trivial; no double-entry overhead |
| Booking engine | Unified `Booking` entity + `BookingType` | Simple member API; branching confined to Create/Cancel |
| Aggregate roots | 6: GymHouse, Member, Booking, ClassSchedule, Staff, Transaction | Aligned with business operations |
| Notifications | SignalR (web) + FCM (mobile) | MassTransit fan-out; `NotificationDelivery` tracks per-recipient |
| Error handling | `Result<T>` over exceptions | Explicit failure paths; no exception-as-flow-control |

---

## Future Phases

| Phase | Key Components |
|---|---|
| Phase 3 — Finance | `Transaction` entity, P&L reports, revenue dashboards |
| Phase 4 — Staff/HR | `Staff`, `ShiftAssignment`, `PayrollPeriod`, `PayrollEntry` |
| Phase 5 — Communications | `Announcement`, `NotificationDelivery`, SignalR fan-out, FCM push |
| Phase 6 — Hardening | PostgreSQL RLS, load testing, offline mobile queue, payment gateway |
