# Phase 6 Hardening — Backend Implementation Report
**Date:** 2026-03-17
**Status:** COMPLETED (sections 6.1, 6.4, 6.5, 6.6, 6.7 implemented; 6.2 k6 scripts created; 6.3 Flutter excluded — frontend ownership)

---

## API Contract
**Path:** `docs/plans/gymmanager-platform/api-contract-260317-phase6-hardening.md`
**Version:** 6.0.0
**Breaking changes:** None — additive only. One new POST endpoint `/api/v1/payments/process`.

---

## Files Created

### Application Layer
- `src/core/GymManager.Application/Common/Interfaces/IPaymentGatewayService.cs` — interface + `PaymentChargeResult` and `PaymentRefundResult` sealed records
- `src/core/GymManager.Application/Payments/ProcessPayment/ProcessPaymentCommand.cs` — MediatR command
- `src/core/GymManager.Application/Payments/ProcessPayment/ProcessPaymentCommandHandler.cs` — permission check, gateway call, transaction record
- `src/core/GymManager.Application/Payments/ProcessPayment/ProcessPaymentCommandValidator.cs` — amount > 0, currency not empty, description not empty

### Infrastructure Layer
- `src/core/GymManager.Infrastructure/Payments/StubPaymentGatewayService.cs` — returns `STUB-{Guid:N}` reference
- `src/core/GymManager.Infrastructure/Persistence/Interceptors/TenantConnectionInterceptor.cs` — `DbConnectionInterceptor` that runs `SET app.current_tenant_id` on connection open; no-op when not authenticated
- `src/core/GymManager.Infrastructure/Persistence/Migrations/V001__rls_tenant_isolation.sql` — RLS for all 13 tables with FORCE; payroll_entries and notification_deliveries use subquery pattern (no direct gym_house_id)
- `src/core/GymManager.Infrastructure/Persistence/Migrations/V002__performance_indexes.sql` — 3 new indexes (bookings covering, transactions INCLUDE, members status)

### Infrastructure DI Updates
- `src/core/GymManager.Infrastructure/DependencyInjection.cs` — registered `TenantConnectionInterceptor` as scoped, wired to DbContext; registered `StubPaymentGatewayService`

### Test Common Updates
- `tests/GymManager.Tests.Common/IntegrationTestBase.cs` — added `TestCurrentUser` property (shared FakeCurrentUser for interceptor + test code); registered `TenantConnectionInterceptor` and `StubPaymentGatewayService`
- `tests/GymManager.Tests.Common/Fakes/FakeFailingPaymentGatewayService.cs` — always returns failure
- `tests/GymManager.Tests.Common/Fakes/FakePermissionChecker.cs` — configurable allow/deny
- `tests/GymManager.Tests.Common/Fakes/FakeTransactionRepository.cs` — in-memory implementation

### Test Files
- `tests/GymManager.Application.Tests/ApplicationTestBase.cs` — updated `CurrentUser` to be an alias for `TestCurrentUser`
- `tests/GymManager.Application.Tests/Payments/ProcessPaymentCommandHandlerTests.cs` — 8 tests (5 integration + 1 unit for gateway failure + 2 via unit class)
- `tests/GymManager.Infrastructure.Tests/Persistence/RlsPolicyTests.cs` — 3 RLS tests using `app_user` non-owner role
- `tests/GymManager.Infrastructure.Tests/Security/TenantIsolationSuiteTests.cs` — 9 EF Core filter isolation tests (Members, Subscriptions, TimeSlots, ClassSchedules, Bookings, Staff, ShiftAssignments, Transactions, PayrollPeriods)
- `tests/GymManager.Infrastructure.Tests/GymManager.Infrastructure.Tests.csproj` — added `Microsoft.Extensions.DependencyInjection` and `Microsoft.Extensions.Hosting` package refs

### k6 Load Tests
- `tests/load-tests/k6/booking-load-test.js` — 50 VUs, MaxCapacity enforcement, 409 verification
- `tests/load-tests/k6/auth-load-test.js` — 200 VUs burst, 429 rate-limit verification
- `tests/load-tests/k6/transaction-load-test.js` — 100 VUs concurrent writes, no data loss assertion

### Security Audit — IgnoreQueryFilters
Two usages found. Both now have justifying comments:

1. **`MemberRepository.GetNextSequenceAsync`** — includes deleted members in sequence count to guarantee historical uniqueness of member codes. Tenant isolation is preserved via explicit `gymHouseId` filter.

2. **`NotificationPreferenceRepository.UpsertAsync`** — includes soft-deleted preferences to support un-delete (restore) semantics. No cross-tenant risk as `NotificationPreference` is user-scoped (no `gym_house_id`).

---

## Test Results

| Suite | Tests | Passed | Failed |
|---|---|---|---|
| GymManager.Domain.Tests | 50 | 50 | 0 |
| GymManager.Application.Tests | 123 | 123 | 0 |
| GymManager.Infrastructure.Tests | 22 | 22 | 0 |
| GymManager.Api.Tests | 1 | 1 | 0 |
| **Total** | **196** | **196** | **0** |

---

## TFD Compliance

| Layer | Status |
|---|---|
| Handlers (ProcessPaymentCommandHandler) | RED test written first, then handler implemented, all GREEN |
| Validators (ProcessPaymentCommandValidator) | Validator written, validation tests fail without it |
| Domain (IPaymentGatewayService, result records) | Interface defined before stub implementation |
| Infrastructure (TenantConnectionInterceptor) | RLS tests fail before interceptor + migration, then GREEN |
| Security (TenantIsolationSuiteTests) | Tests wrote first, all pass against existing EF filters |

---

## Mocking Strategy
- `StubPaymentGatewayService` — real in-memory implementation, no Docker gateway
- `FakeTransactionRepository` — in-memory list, full interface implementation
- `FakeCurrentUser` — mutable fields for test scenario setup
- `TenantConnectionInterceptor` in tests — real implementation registered in DI, uses `FakeCurrentUser`
- PostgreSQL — real Testcontainers PostgreSQL for all integration tests

---

## Performance Optimization Audit

**AsNoTracking status:** All read query methods in all repositories use `AsNoTracking()`. Confirmed across 15 repository files. Write paths correctly use tracked entities.

**Pagination status:** All list endpoints use `Skip/Take` pagination. No unbounded `ToListAsync()` on list queries — the apparent hits in the grep scan are all inside paginated methods that have Take applied before the terminal call. Specific bounded-result queries (e.g., `GetByStaffIdAsync` for payroll entry lookup, `GetByAnnouncementIdAsync` for notification delivery) are bounded by FK relationships and are not list endpoints.

**New indexes added (V002 migration):**
1. `ix_bookings_gym_house_id_time_slot_id_status` — for concurrent booking capacity checks
2. `ix_transactions_gym_house_id_transaction_date_covering` — covering index with `INCLUDE (direction, category, amount)` for P&L/revenue aggregates
3. `ix_members_gym_house_id_status` — for active membership status filters

**Existing indexes (already correct — no change needed):**
- `ix_shift_assignments_staff_id_shift_date` — in ShiftAssignmentConfiguration
- `ix_notification_deliveries_recipient_id_status` — in NotificationDeliveryConfiguration
- `ix_transactions_gym_house_id_transaction_date` — in TransactionConfiguration

**AsSplitQuery:** No N+1 patterns detected in existing handlers. All eager loads are single-level includes (`Include(m => m.User)`) which do not benefit from split query.

---

## RLS Architecture Notes

The RLS migration (`V001`) uses `current_setting('app.current_tenant_id', true)::uuid` (with `true` as the missing_ok flag) to avoid errors when the variable is not set. When not set, the policy evaluates to `NULL = NULL` which is FALSE — resulting in empty results for unauthenticated sessions (safe default).

**Tables with direct gym_house_id:** members, subscriptions, time_slots, class_schedules, bookings, waitlists, transactions, staff, shift_assignments, payroll_periods

**Tables without direct gym_house_id (subquery pattern):**
- `payroll_entries` — filtered via `payroll_period_id IN (SELECT id FROM payroll_periods WHERE gym_house_id = ...)`
- `notification_deliveries` — filtered via `announcement_id IN (SELECT id FROM announcements WHERE gym_house_id IS NULL OR gym_house_id = ...)`

**Announcements special case:** `gym_house_id IS NULL` means platform-wide announcement — all tenants see it. This is the correct behavior.

---

## Unresolved Questions / Future Work

1. **Background jobs (Quartz.NET):** `TenantConnectionInterceptor` correctly skips `SET` for unauthenticated contexts. However, cross-tenant background jobs (e.g., subscription expiry processor) need explicit `SET` before bulk operations. Recommended approach: add `IBackgroundJobContext` service that background jobs use to set a "no-tenant" or "system" mode that bypasses RLS via a dedicated superuser connection. Outside scope of this phase.

2. **Real payment gateway:** `StubPaymentGatewayService` is wired. Swap with `StripePaymentGatewayService` or `PayOSPaymentGatewayService` by registering different implementation in production DI configuration.

3. **IMemoryCache for permission checks:** Optional (6.5). Not implemented — `PermissionChecker` reads from the JWT claim directly (in-process), making caching unnecessary unless the permission check involves a database lookup in future.

4. **k6 load tests:** Scripts are written but require a running API instance. k6 must be installed separately (`brew install k6`). Run: `k6 run tests/load-tests/k6/booking-load-test.js`.

5. **PayrollEntry RLS subquery performance:** The subquery in the RLS policy for `payroll_entries` will execute on every row access. An index on `payroll_periods(gym_house_id)` would be beneficial under high payroll query loads. This index already exists via `ix_payroll_periods_gym_house_id_period_start`.
