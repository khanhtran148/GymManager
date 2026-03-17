# GymManager Platform — Plan Overview

**Date:** 2026-03-17
**Type:** Fullstack (Backend + Web Frontend)
**Phases:** 6 sequential phases
**TFD:** Mandatory on all backend work

## Existing Codebase Summary

The scaffold is in place. What exists:

- **Domain:** `AuditableEntity` base class (Id, CreatedAt, UpdatedAt, DeletedAt), `IDomainEvent`, three enums (`Permission` bits 0-11, `MembershipStatus`, `SubscriptionType`). No entities yet.
- **Application:** `ICurrentUser`, `IPermissionChecker`, error records (`NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError`), `ValidationBehavior`, `LoggingBehavior`, DI registration. No handlers yet.
- **Infrastructure:** `GymManagerDbContext` with `ApplyConfigurationsFromAssembly`. No DbSets, no configurations, no migrations. DI registers Npgsql only.
- **API:** `ApiControllerBase` with `HandleResult` overloads, `ExceptionHandlingMiddleware`, `NotificationHub` (groups by tenant_id), `Program.cs` with JWT auth, versioning, rate limiting, SignalR, CORS. No controllers beyond base.
- **Web:** Next.js shell with `QueryProvider`, `apiClient` (axios with interceptor), blank home page. No auth, no dashboard, no routes.
- **Mobile:** Flutter shell with Riverpod, GoRouter stub, Dio API client stub. No screens.
- **Tests:** `IntegrationTestBase` with Testcontainers PostgreSQL. Four test projects with placeholder tests only.

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

## Phase Summary

| Phase | New Entities | New Handlers | New API Endpoints | New Web Pages |
|-------|-------------|-------------|-------------------|---------------|
| 1. Foundation | User, GymHouse, Member, Subscription | 16 | 14 | 12 |
| 2. Booking | TimeSlot, ClassSchedule, Booking, Waitlist | 14 | 11 | 5 |
| 3. Finance | Transaction | 6 | 5 | 4 |
| 4. Staff/HR | Staff, ShiftAssignment, PayrollPeriod, PayrollEntry | 11 | 9 | 5 |
| 5. Communications | Announcement, NotificationDelivery, NotificationPreference | 8 | 7 | 4 |
| 6. Hardening | -- | 1 | -- | -- |
| **Total** | **16 entities** | **56 handlers** | **46 endpoints** | **30 pages** |

Each phase is independently deployable. Run `dotnet test` after each phase to verify no regressions.
