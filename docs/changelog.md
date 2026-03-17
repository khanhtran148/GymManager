# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.2.0] — 2026-03-17 — Phase 2: Booking

### Added

**Domain**
- `TimeSlot` entity: date, start/end time, max capacity, current booking counter
- `ClassSchedule` entity: recurring or one-off classes with trainer assignment, capacity counter
- `Booking` entity: supports both time-slot and class-session bookings, check-in tracking
- `Waitlist` entity: ordered queue with position and promotion timestamp
- Enums: `BookingType`, `BookingStatus`, `CheckInSource`, `DayOfWeekFlag`
- Domain events: `BookingConfirmedEvent`, `BookingCancelledEvent`, `WaitlistPromotedEvent`

**Application**
- `CreateBookingCommandHandler` with pessimistic locking (`SELECT ... FOR UPDATE`) to prevent double-booking
- `CancelBookingCommandHandler`: decrements capacity counter and publishes `BookingCancelledEvent`
- `CheckInCommandHandler`: records timestamp and source (QR scan, manual, kiosk)
- `MarkNoShowCommandHandler`
- `GetBookings` / `GetBookingById` query handlers
- `CreateTimeSlotCommandHandler`, `GetTimeSlotsQueryHandler`
- `CreateClassScheduleCommandHandler`, `UpdateClassScheduleCommandHandler`, `GetClassSchedulesQueryHandler`, `GetClassScheduleByIdQueryHandler`
- Interfaces: `IBookingRepository`, `ITimeSlotRepository`, `IClassScheduleRepository`, `IWaitlistRepository`

**Infrastructure**
- `TimeSlotConfiguration`: composite index on `(GymHouseId, Date, StartTime)`
- `ClassScheduleConfiguration`: index on `(GymHouseId, DayOfWeek)`
- `BookingConfiguration`: indexes on `(MemberId, Status)` and `(GymHouseId, BookedAt)`
- `WaitlistConfiguration`: indexes on `(TimeSlotId, Position)` and `(ClassScheduleId, Position)`
- Repository implementations: `TimeSlotRepository`, `ClassScheduleRepository`, `BookingRepository`, `WaitlistRepository`
- EF migration: `AddBookingEntities`

**API**
- `BookingsController`: POST/GET bookings, DELETE (cancel), PATCH check-in, PATCH no-show
- `TimeSlotsController`: POST, GET
- `ClassSchedulesController`: POST, GET (list + by id), PUT

**Messaging**
- `WaitlistPromotionConsumer`: on `BookingCancelledEvent`, promotes next waitlisted member to a confirmed booking

**Web Dashboard**
- Booking calendar page: weekly time-slot grid with class overlays, create-booking modal
- Booking detail page: cancel and check-in actions
- Class schedules page: weekly grid by day with trainer assignment
- Time slots page: date picker with slot list and capacity indicators (green/yellow/red)
- Check-in interface: search member by code or name, display today's bookings

**Tests**
- `BookingTests`, `TimeSlotTests` domain tests
- `CreateBookingCommandHandlerTests`, `CancelBookingCommandHandlerTests`, `CheckInCommandHandlerTests` application tests
- `CreateTimeSlotCommandHandlerTests`, `CreateClassScheduleCommandHandlerTests`
- `BookingConcurrencyTests`: two concurrent bookings on last-capacity slot — one succeeds, one returns 409
- `BookingTenantIsolationTests`
- Test builders: `TimeSlotBuilder`, `ClassScheduleBuilder`, `BookingBuilder`, `WaitlistBuilder`

---

## [0.1.0] — 2026-03-17 — Phase 1: Foundation

### Added

**Domain**
- `User` entity: email, password hash, role, permission flags, refresh token
- `GymHouse` entity: name, address, operating hours (jsonb), hourly capacity
- `Member` entity: user + gym house link, auto-generated member code, status
- `Subscription` entity: type, status, date range, freeze window
- Enums: `Role`, `SubscriptionStatus`, `SubscriptionType`, `MembershipStatus`, `Permission` (26 bits, bits 0-25)
- Domain events: `MemberCreatedEvent`, `SubscriptionCreatedEvent`, `SubscriptionExpiredEvent`

**Application**
- CQRS handlers for Auth: `RegisterCommandHandler`, `LoginCommandHandler`, `RefreshTokenCommandHandler`
- CQRS handlers for GymHouses: create, update, delete, get list, get by id
- CQRS handlers for Members: create, update, get list (paged), get by id
- CQRS handlers for Subscriptions: create, renew, freeze, cancel, get by member
- `ValidationBehavior` and `LoggingBehavior` MediatR pipeline behaviors
- Interfaces: `ITokenService`, `IPasswordHasher`, `IGymHouseRepository`, `IMemberRepository`, `ISubscriptionRepository`, `IUserRepository`
- `PagedList<T>` model

**Infrastructure**
- EF Core configurations for all four entities with global query filters (tenant + soft-delete)
- `GymManagerDbContext` with `ICurrentUser` injection for tenant scoping
- `SaveChangesAsync` override to stamp `UpdatedAt` automatically
- Repositories: `UserRepository`, `GymHouseRepository`, `MemberRepository`, `SubscriptionRepository`
- `JwtTokenService`, `BCryptPasswordHasher`, `CurrentUser`, `PermissionChecker`
- Role-based seed data with default permission sets (Owner, HouseManager, Trainer, Staff, Member)
- EF migration: `InitialFoundation`

**API**
- `AuthController`: POST register, POST login, POST refresh — all rate-limited at Auth policy (10/min)
- `GymHousesController`: full CRUD
- `MembersController`: create, list, get by id, update
- `SubscriptionsController`: create, list, renew, freeze, cancel
- `ApiControllerBase.HandleResult()` maps `Result<T>` errors to ProblemDetails (RFC 7807)
- `ExceptionHandlingMiddleware`, `NotificationHub` (groups by tenant id)
- API versioning, rate limiting (Default 100/min, Auth 10/min, Strict 5/min), CORS

**Web Dashboard**
- Auth flow: login page, register page, Next.js middleware redirect for unauthenticated users
- Zustand auth store with token storage
- Dark mode sidebar layout with top bar and gym house selector dropdown
- Dashboard home: stat cards (total members, active subscriptions, houses), recent activity
- Gym houses CRUD: list table, detail/edit form, create form
- Members CRUD: paginated table with search and status badges, detail view with subscription history, create form
- Subscription management: create form, status card with renew/freeze/cancel actions
- Shared components: `DataTable`, `StatCard`, `FormField`, `Badge`, `ConfirmDialog`
- TanStack Query hooks for all entities

**Tests**
- `UserTests`, `MemberTests`, `SubscriptionTests` domain tests
- Integration tests with Testcontainers PostgreSQL: auth handlers, gym house handlers, member handlers, subscription handlers
- `TenantIsolationTests`: member in house A is not visible from house B context
- `SoftDeleteFilterTests`: soft-deleted members excluded from default queries
- Test builders: `UserBuilder`, `GymHouseBuilder`, `MemberBuilder`, `SubscriptionBuilder`

**Project Scaffold**
- Solution structure: Domain, Application, Infrastructure, Api, BackgroundServices, Web, Mobile
- Four test projects with `IntegrationTestBase` using Testcontainers
- CLAUDE.md with architecture rules, naming conventions, and development standards
- Pinned versions: MediatR 13.1.0, MassTransit 8.5.8
