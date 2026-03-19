# GymManager — Product Roadmap

**Last updated:** 2026-03-19
**Current version:** 0.5.0

---

## Overview

Six sequential phases, each independently deployable. Run `dotnet test` after each phase to verify no regressions.

| Phase | Focus | Status | Entities | Handlers | API Endpoints | Web Pages |
|-------|-------|--------|----------|----------|---------------|-----------|
| 1 | Foundation | COMPLETE | User, GymHouse, Member, Subscription | 16 | 14 | 12 |
| 2 | Booking | COMPLETE | TimeSlot, ClassSchedule, Booking, Waitlist | 14 | 11 | 5 |
| 3 | Finance | COMPLETE | Transaction | 6 | 5 | 4 |
| 4 | Staff/HR | COMPLETE | Staff, ShiftAssignment, PayrollPeriod, PayrollEntry | 11 | 9 | 5 |
| 5 | Communications | COMPLETE | Announcement, NotificationDelivery, NotificationPreference | 8 | 7 | 4 |
| 6 | Hardening | IN PROGRESS | — | 1 | — | — |
| **Total** | | | **16 entities** | **56 handlers** | **46 endpoints** | **30 pages** |

---

## Phase 1: Foundation — COMPLETE

**Delivered:** 2026-03-17

An owner can log in, create gym houses, register members, and manage subscriptions.

### Delivered

- User authentication: register, login, JWT + refresh token
- GymHouse CRUD with owner scoping
- Member registration with auto-generated member codes
- Subscription lifecycle: create, renew, freeze, cancel
- 26 fine-grained permissions via `IPermissionChecker`
- Multi-tenant data isolation (EF Core global query filters)
- Web dashboard: auth flow, gym house CRUD, member CRUD, subscription management
- Integration tests with Testcontainers PostgreSQL; tenant isolation test proven

---

## Phase 2: Booking — COMPLETE

**Delivered:** 2026-03-17

Members can book gym slots and class sessions, get waitlisted when full, and check in.

### Delivered

- Time slot management with configurable capacity
- Class schedule management with trainer assignment (recurring and one-off)
- Booking creation for both time slots and class sessions
- Pessimistic locking (`SELECT ... FOR UPDATE`) to prevent double-booking under concurrency
- Waitlist with ordered queue and automatic promotion on cancellation via MassTransit consumer
- Check-in with source tracking (QR scan, manual by staff, self-kiosk)
- No-show recording
- Web: booking calendar (weekly grid), class schedule grid, time slot capacity indicators, check-in interface
- Concurrency integration test: two simultaneous bookings on last slot — exactly one succeeds

---

## Phase 3: Finance — COMPLETE

**Delivered:** 2026-03-17

Delivered the transaction ledger, revenue dashboards, P&L reports, and automatic fee recording on subscription events.

### Scope

- Append-only `Transaction` entity (no soft delete, no updates — only reversals)
- Transaction types: membership fees, expenses, refunds, salary payments
- `CreateReversal` domain method for corrections
- P&L report grouped by category and direction, filterable by house and date range
- Revenue metrics: MRR, churn rate, average revenue per member
- `SubscriptionFeeConsumer`: auto-records a `MembershipFee` transaction on `SubscriptionCreatedEvent`
- Web: financial dashboard with line and pie charts, transaction list, P&L report page
- API: `TransactionsController`, `ReportsController`

### Key Constraints

- Transaction table has no `DeletedAt IS NULL` query filter — records are permanent
- GymHouseId tenant filter still applies
- Decimal precision: `decimal(18,2)` for all monetary columns

---

## Phase 4: Staff/HR — COMPLETE

**Delivered:** 2026-03-17
**Depends on:** Phase 1, Phase 3

Delivered staff management per gym house, shift scheduling, and payroll with approval workflow.

### Scope

- `Staff` entity: one record per user per gym house, supports Trainer/Reception/Cleaning/Security types
- `ShiftAssignment` entity: date, time window, shift type (Morning/Afternoon/Evening/Night), status
- `PayrollPeriod` entity: date range, status lifecycle (Draft → PendingApproval → Approved → Paid)
- `PayrollEntry` entity: base pay, class bonus (trainers only), deductions, net pay per staff member
- `CreatePayrollPeriodCommandHandler`: auto-generates entries counting trainer classes taught in period
- `ApprovePayrollCommandHandler`: publishes `PayrollApprovedEvent`
- `PayrollApprovedConsumer`: creates `SalaryPayment` transactions (Debit, Payroll category) per entry
- Web: staff CRUD, shift calendar (weekly grid), payroll dashboard with approval flow
- API: `StaffController`, `ShiftAssignmentsController`, `PayrollController`

---

## Phase 5: Communications — COMPLETE

**Delivered:** 2026-03-17
**Depends on:** Phase 1

Delivered scheduled announcements, real-time SignalR notifications, Firebase push, and per-user notification preferences.

### Delivered

- `Announcement`, `NotificationDelivery`, `NotificationPreference` entities with EF configurations
- 3 new enums: `TargetAudience`, `NotificationChannel`, `DeliveryStatus`
- `AnnouncementPublishedEvent` domain event (immutable contract)
- 7 CQRS handlers: CreateAnnouncement, GetAnnouncements, GetAnnouncementById, GetNotifications, MarkNotificationRead, UpdateNotificationPreferences, GetNotificationPreferences
- Quartz job `AnnouncementPublisherJob` (30-second polling interval)
- MassTransit consumers: `AnnouncementSignalRConsumer`, `AnnouncementFcmConsumer`
- 7 API endpoints across `AnnouncementsController`, `NotificationsController`, `NotificationPreferencesController`
- Web pages: `/announcements`, `/announcements/new`, `/notifications`, `/settings/notifications`
- `NotificationBell` component with real-time Zustand store and SignalR subscription
- `NotificationFeed` component with read receipts
- SignalR connection factory with exponential backoff reconnect
- 176 .NET tests passing, 17 Vitest tests passing

### Known Deferred Tasks

- `dotnet ef migrations add AddCommunicationEntities` — requires running PostgreSQL at deploy time
- Firebase Admin SDK credentials — `FirebaseMessagingService` is a no-op stub until credentials are provisioned
- FCM device token storage — `DeviceToken` entity not yet created; `AnnouncementFcmConsumer.GetDeviceToken()` returns null

---

## Phase 6: Hardening — IN PROGRESS

**Target:** TBD
**Depends on:** All prior phases

Harden for production: PostgreSQL RLS, load testing, Flutter offline queue, payment gateway stub.

### Completed — 2026-03-19

**Security Hardening (22 of 26 findings resolved)**
- Cross-tenant IDOR closed in all three subscription handlers
- JWT issuer/audience and secret-length validation enforced at startup
- Password policy strengthened (uppercase + lowercase + digit + special character)
- Secrets removed from `appsettings.json`; local override file pattern established
- HTTP security headers middleware added
- `AllowedHosts` restricted from wildcard to `localhost`
- `PermissionChecker` defensive check on `userId` mismatch

**Quality Hardening**
- `ApiControllerBase` error dispatch replaced with prefix-based routing; RFC 7807 `Title` added
- `ICurrentUser` removed from 3 controllers (architecture rule compliance)
- All 5 RBAC handlers routed through `IPermissionChecker` with `Permission.ManageRoles`
- `TokenDefaults` constants extracted

**Performance**
- N+1 eliminated in `GetBookingsQueryHandler`
- Batch insert in `PayrollApprovedConsumer`
- Batch preference fetch in `AnnouncementFcmConsumer`

**Frontend**
- `useDebounce` hook fixed in members page
- `COOKIE_MAX_AGE_SECONDS` constant extracted in `auth-store.ts`

### Deferred (separate PRs / efforts)

- **S3 — HttpOnly refresh token cookie**: requires coordinated backend API change; separate PR
- **Q7 — Booking creation dedup**: refactor of `CreateBookingCommandHandler` logic; separate PR
- **T1 — Validator test coverage**: 29 validators without unit tests
- **T2 — Handler test coverage**: 28 handlers without unit tests

### Remaining Scope

**PostgreSQL Row-Level Security**
- RLS policies on all 13 tenant-scoped tables
- `TenantConnectionInterceptor`: sets `app.current_tenant_id` on every connection open
- RLS integration test: raw SQL query with wrong tenant context returns zero rows

**Load Testing (k6)**
- Booking concurrency: 50 virtual users → exactly `MaxCapacity` succeed, rest return 409
- Auth rate limiting: 200 concurrent logins → limit enforced at 10/min
- Transaction throughput: 100 concurrent recordings → all persisted, no data loss

**Flutter Offline Booking Queue**
- SQLite local store (`offline_bookings` table via sqflite)
- Offline booking enqueued as JSON; synced to API when connectivity restored
- Conflict handling: capacity-full response surfaces gracefully to user

**Payment Gateway**
- `IPaymentGatewayService` interface: `CreateChargeAsync`, `RefundChargeAsync`
- `StubPaymentGatewayService`: returns success with fake reference for development
- Swap with Stripe or PayOS behind the same interface later

**Performance**
- Verify all query handlers use `AsNoTracking()`
- Verify all list queries paginated server-side
- Covering indexes for dashboard aggregate queries
- Optional: `IMemoryCache` for permission checks (5-minute TTL)

**Security Audit (remaining)**
- Audit every `IgnoreQueryFilters()` call — each must have a justification comment
- Tenant isolation suite: one test per scoped entity, tested via both EF filter and RLS
- Verify JWT rotation, short access token expiry (15 min), 7-day refresh window

---

## Backlog / Future Considerations

- Payment gateway production integration (Stripe, PayOS)
- Email channel for announcements (Phase 5 stubs the interface)
- Mobile Flutter screens for booking, member portal, check-in via QR
- Reporting exports (PDF, CSV)
- Multi-currency support
