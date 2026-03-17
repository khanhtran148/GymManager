# ADR: GymManager Platform Architecture

**Date:** 2026-03-17
**Status:** Accepted
**Deciders:** Owner (sole stakeholder)

## Context

GymManager is a multi-tenant SaaS for managing 2-5 gym locations. The platform must handle: multi-location management, member subscriptions, time-slot and class bookings, financial tracking (income, expenses, salaries, rent), staff/HR management, and announcements with push notifications. Hierarchical access: owner sees all, house managers see their own location.

## Decisions

### 1. Multi-Tenancy: Shared DB + GymHouseId Discriminator

All tenant-scoped entities carry a `GymHouseId` FK. EF Core global query filter enforces isolation: `builder.HasQueryFilter(e => e.GymHouseId == _tenantId)`. `ICurrentUser.TenantId` flows from JWT claims.

**Rationale:** Simplest to implement and query at 2-5 locations. Schema-per-tenant is overkill. PostgreSQL RLS deferred to Phase 2 hardening.

**Risk:** Application bug with `IgnoreQueryFilters()` leaks cross-tenant data. Mitigate with integration tests and code review checklist.

### 2. Financial Ledger: Single Append-Only Transaction Table

One `Transaction` table with `TransactionType` enum (MembershipFee, SalaryPayment, Rent, Expense, Refund), `Amount` (decimal, always positive), `Direction` (Credit/Debit), and `Category`. No UPDATE or DELETE on this table. Corrections via reversing entries with `ReversesTransactionId` FK.

**Rationale:** A gym at this scale has thousands of transactions per month, not millions. A single table makes P&L queries trivial (GROUP BY type, category). Double-entry accounting adds complexity without business benefit.

### 3. Booking Engine: Unified Booking Entity

One `Booking` table with `BookingType` (TimeSlot, ClassSession). Both types share Member, GymHouse, StartTime, EndTime, Status. ClassSession bookings additionally reference ClassSchedule and Trainer. Concurrency control via `SELECT ... FOR UPDATE` on capacity counter.

**Rationale:** Keeps the member-facing API simple. BookingType-specific branching is confined to CreateBooking and CancelBooking handlers.

### 4. Six Aggregate Roots

`GymHouse`, `Member` (owns Subscription), `Booking`, `ClassSchedule`, `Staff` (owns ShiftAssignment), `Transaction`. PayrollPeriod/PayrollEntry for salary management. Announcement/NotificationDelivery for communications.

### 5. Notification Architecture

SignalR for real-time web, Firebase Cloud Messaging for mobile push. MassTransit consumers fan out announcement events to both channels. NotificationDelivery table tracks per-recipient status. Quartz job handles scheduled announcements.

## Implementation Phases

1. **Foundation:** GymHouse, User, Member, Subscription, Permission expansion
2. **Booking:** TimeSlot, ClassSchedule, Booking, Waitlist, check-in
3. **Finance:** Transaction, P&L reports, revenue dashboards
4. **Staff/HR:** Staff, ShiftAssignment, PayrollPeriod, PayrollEntry
5. **Communications:** Announcement, NotificationDelivery, SignalR, FCM
6. **Hardening:** PostgreSQL RLS, load testing, offline mobile queue, payment gateway

## Consequences

- Simple tenant isolation at launch, with clear upgrade path to RLS
- Single-table financial queries enable fast dashboard development
- Unified booking reduces API surface and member-facing complexity
- Multi-house trainers handled via one Staff record per GymHouse (same UserId)
- Transaction table immutability protects audit trail
