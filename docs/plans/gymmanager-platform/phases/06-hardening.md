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

