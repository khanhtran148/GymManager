# E2E Test Suite Implementation Plan

**Date:** 2026-03-18
**Scope:** Fullstack (API-direct + Browser + Journey specs)
**ADR:** `docs/adrs/260317-e2e-test-strategy-hybrid.md` (Accepted)
**Base directory:** `tests/GymManager.E2E/`

---

## Current State

The E2E project already has:
- 9 browser spec files in `specs/` (auth, gym-houses, members, subscriptions, bookings, finance, staff, announcements, navigation)
- 1 auth fixture (`fixtures/auth.fixture.ts`)
- 1 API client (`helpers/api-client.ts`) with typed wrappers for all create operations
- 1 test data factory (`helpers/test-data.ts`) with generators for all entities
- 5 page objects (login, register, dashboard, gym-houses, members)

What is missing:
- No `specs/api/` directory (API-direct specs)
- No `specs/journeys/` directory (role journey specs)
- api-client.ts lacks GET, PUT, DELETE, PATCH wrappers (only has POST/create)
- api-client.ts lacks subscription freeze/cancel/renew, booking cancel/check-in/no-show, transaction reverse, payroll, shift, notification, and report endpoints
- No fixtures for multi-role scenarios or gym-house seeding
- No CI configuration for tiered test runs

---

## Prerequisites

Before any spec writing begins:
1. API server running locally at `http://localhost:5000`
2. Next.js frontend running locally at `http://localhost:3000`
3. PostgreSQL + RabbitMQ running (via `docker compose up -d`)
4. Database migrated (`dotnet ef database update` or API auto-migration)

---

## Phase 1: Fixtures and Helpers (Foundation)

**Goal:** Extend the test infrastructure so all 8 clusters can be written without duplicating setup logic.

### Task 1.1: Extend api-client.ts with missing endpoints
**File:** `tests/GymManager.E2E/helpers/api-client.ts`
**Complexity:** L
**Dependencies:** None

Add the following function exports (all use the existing `apiRequest` internal helper):

**Auth:**
- `refreshToken(refreshToken: string): Promise<AuthResponse>` -- POST `/auth/refresh`

**Gym Houses:**
- `getGymHouses(token: string): Promise<GymHouseDto[]>` -- GET `/gym-houses`
- `getGymHouseById(id: string, token: string): Promise<GymHouseDto>` -- GET `/gym-houses/{id}`
- `updateGymHouse(id: string, payload: UpdateGymHouseRequest, token: string): Promise<GymHouseDto>` -- PUT `/gym-houses/{id}`
- `deleteGymHouse(id: string, token: string): Promise<void>` -- DELETE `/gym-houses/{id}`

**Members:**
- `getMembers(gymHouseId: string, token: string, params?: { page?: number; pageSize?: number; search?: string }): Promise<PagedList<MemberDto>>` -- GET `/gymhouses/{id}/members`
- `getMemberById(gymHouseId: string, id: string, token: string): Promise<MemberDto>` -- GET `/gymhouses/{id}/members/{id}`
- `updateMember(gymHouseId: string, id: string, payload: UpdateMemberRequest, token: string): Promise<MemberDto>` -- PUT `/gymhouses/{id}/members/{id}`

**Subscriptions:**
- `getSubscriptionsByMember(gymHouseId: string, memberId: string, token: string): Promise<SubscriptionDto[]>` -- GET `/gymhouses/{id}/members/{id}/subscriptions`
- `freezeSubscription(id: string, payload: FreezeSubscriptionRequest, token: string): Promise<SubscriptionDto>` -- POST `/subscriptions/{id}/freeze`
- `cancelSubscription(id: string, payload: CancelSubscriptionRequest, token: string): Promise<SubscriptionDto>` -- POST `/subscriptions/{id}/cancel`
- `renewSubscription(id: string, payload: RenewSubscriptionRequest, token: string): Promise<SubscriptionDto>` -- POST `/subscriptions/{id}/renew`

**Time Slots:**
- `getTimeSlots(gymHouseId: string, token: string, params?: { from?: string; to?: string }): Promise<TimeSlotDto[]>` -- GET `/gymhouses/{id}/time-slots`

**Class Schedules:**
- `getClassSchedules(gymHouseId: string, token: string, params?: { dayOfWeek?: number }): Promise<ClassScheduleDto[]>` -- GET `/gymhouses/{id}/class-schedules`
- `getClassScheduleById(gymHouseId: string, id: string, token: string): Promise<ClassScheduleDto>` -- GET `/gymhouses/{id}/class-schedules/{id}`
- `updateClassSchedule(gymHouseId: string, id: string, payload: UpdateClassScheduleRequest, token: string): Promise<ClassScheduleDto>` -- PUT `/gymhouses/{id}/class-schedules/{id}`

**Bookings:**
- `getBookings(gymHouseId: string, token: string, params?: { page?: number; pageSize?: number; from?: string; to?: string }): Promise<PagedList<BookingDto>>` -- GET `/gymhouses/{id}/bookings`
- `getBookingById(gymHouseId: string, id: string, token: string): Promise<BookingDto>` -- GET `/gymhouses/{id}/bookings/{id}`
- `cancelBooking(gymHouseId: string, id: string, token: string): Promise<void>` -- DELETE `/gymhouses/{id}/bookings/{id}`
- `checkInBooking(gymHouseId: string, id: string, source: number, token: string): Promise<BookingDto>` -- PATCH `/gymhouses/{id}/bookings/{id}/check-in`
- `markNoShow(gymHouseId: string, id: string, token: string): Promise<void>` -- PATCH `/gymhouses/{id}/bookings/{id}/no-show`

**Transactions:**
- `getTransactions(gymHouseId: string, token: string, params?: { page?: number; pageSize?: number; type?: number; direction?: number; from?: string; to?: string }): Promise<PagedList<TransactionDto>>` -- GET `/gymhouses/{id}/transactions`
- `reverseTransaction(gymHouseId: string, id: string, reason: string, token: string): Promise<TransactionDto>` -- POST `/gymhouses/{id}/transactions/{id}/reverse`

**Staff:**
- `getStaff(gymHouseId: string, token: string, params?: { page?: number; pageSize?: number; staffType?: number }): Promise<PagedList<StaffDto>>` -- GET `/staff`
- `getStaffById(id: string, gymHouseId: string, token: string): Promise<StaffDto>` -- GET `/staff/{id}`
- `updateStaff(id: string, gymHouseId: string, payload: UpdateStaffRequest, token: string): Promise<StaffDto>` -- PUT `/staff/{id}`

**Shift Assignments (new types + functions):**
- `createShiftAssignment(payload: CreateShiftAssignmentRequest, token: string): Promise<ShiftAssignmentDto>` -- POST `/shift-assignments`
- `getShiftAssignments(gymHouseId: string, token: string, params?: { from?: string; to?: string; staffId?: string }): Promise<ShiftAssignmentDto[]>` -- GET `/shift-assignments`
- `updateShiftAssignment(id: string, gymHouseId: string, payload: UpdateShiftAssignmentRequest, token: string): Promise<ShiftAssignmentDto>` -- PUT `/shift-assignments/{id}`

**Payroll (new types + functions):**
- `createPayrollPeriod(payload: CreatePayrollPeriodRequest, token: string): Promise<PayrollPeriodDetailDto>` -- POST `/payroll-periods`
- `getPayrollPeriods(gymHouseId: string, token: string, params?: { page?: number; pageSize?: number }): Promise<PagedList<PayrollPeriodDto>>` -- GET `/payroll-periods`
- `getPayrollPeriodById(id: string, gymHouseId: string, token: string): Promise<PayrollPeriodDetailDto>` -- GET `/payroll-periods/{id}`
- `approvePayroll(id: string, gymHouseId: string, token: string): Promise<PayrollPeriodDetailDto>` -- PATCH `/payroll-periods/{id}/approve`

**Announcements:**
- `getAnnouncements(gymHouseId: string, token: string, params?: { page?: number; pageSize?: number }): Promise<PagedList<AnnouncementDto>>` -- GET `/announcements`
- `getAnnouncementById(id: string, gymHouseId: string, token: string): Promise<AnnouncementDto>` -- GET `/announcements/{id}`

**Notifications (new types + functions):**
- `getNotifications(token: string, params?: { page?: number; pageSize?: number }): Promise<PagedList<NotificationDto>>` -- GET `/notifications`
- `markNotificationRead(id: string, token: string): Promise<void>` -- PATCH `/notifications/{id}/read`
- `getNotificationPreferences(token: string): Promise<NotificationPreferenceDto[]>` -- GET `/notification-preferences`
- `updateNotificationPreferences(payload: UpdateNotificationPreferencesRequest, token: string): Promise<void>` -- PUT `/notification-preferences`

**Reports (new types + functions):**
- `getPnLReport(gymHouseId: string, from: string, to: string, token: string): Promise<PnLReportDto>` -- GET `/gymhouses/{id}/reports/pnl`
- `getRevenueMetrics(gymHouseId: string, from: string, to: string, token: string): Promise<RevenueMetricsDto>` -- GET `/gymhouses/{id}/reports/revenue-metrics`

New TypeScript interfaces to add:
- `UpdateGymHouseRequest` (name, address, phone?, operatingHours?, hourlyCapacity)
- `UpdateMemberRequest` (fullName, phone?)
- `FreezeSubscriptionRequest` (gymHouseId, frozenUntil)
- `CancelSubscriptionRequest` (gymHouseId)
- `RenewSubscriptionRequest` (gymHouseId, startDate, endDate, price)
- `UpdateClassScheduleRequest` (className, dayOfWeek, startTime, endTime, maxCapacity, isRecurring)
- `UpdateStaffRequest` (staffType, baseSalary, perClassBonus)
- `CreateShiftAssignmentRequest` (staffId, gymHouseId, shiftDate, startTime, endTime, shiftType)
- `ShiftAssignmentDto` (id, staffId, gymHouseId, shiftDate, startTime, endTime, shiftType, status, staffName, createdAt)
- `UpdateShiftAssignmentRequest` (shiftDate, startTime, endTime, shiftType, status)
- `CreatePayrollPeriodRequest` (gymHouseId, periodStart, periodEnd)
- `PayrollPeriodDto` (id, gymHouseId, periodStart, periodEnd, status, totalAmount, createdAt)
- `PayrollPeriodDetailDto` (extends PayrollPeriodDto + entries array)
- `NotificationDto` (id, userId, title, body, isRead, createdAt)
- `NotificationPreferenceDto` (channel, isEnabled)
- `UpdateNotificationPreferencesRequest` (preferences: Array<{channel, isEnabled}>)
- `PnLReportDto` (gymHouseId, from, to, totalRevenue, totalExpenses, netIncome, breakdown)
- `RevenueMetricsDto` (gymHouseId, from, to, metrics)

Also add a `apiRequestRaw` variant that returns the raw `Response` object for status-code assertions in error-path tests.

### Task 1.2: Extend test-data.ts with missing generators
**File:** `tests/GymManager.E2E/helpers/test-data.ts`
**Complexity:** S
**Dependencies:** Task 1.1 (needs new request types)

Add generators:
- `generateShiftAssignment(overrides?)` -- morning shift tomorrow, ShiftType=0
- `generatePayrollPeriod(overrides?)` -- current month start to end
- `generateUpdateGymHouse(overrides?)` -- updated name + address
- `generateRenewSubscription(overrides?)` -- next month's dates + price

### Task 1.3: Create role fixture
**File:** `tests/GymManager.E2E/fixtures/role.fixture.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1

Provides pre-seeded multi-role test contexts. Exports an extended `test` that exposes:

```typescript
interface RoleFixtures {
  /** Owner: registered user with a gym house already created */
  owner: {
    auth: AuthResponse;
    token: string;
    gymHouse: GymHouseDto;
    api: ApiContext; // scoped to this owner's token
  };
  /** Trainer: registered user added as Staff(Trainer) to owner's gym house */
  trainer: {
    auth: AuthResponse;
    token: string;
    staff: StaffDto;
  };
  /** Member: a member record within the owner's gym house */
  member: {
    dto: MemberDto;
    subscription: SubscriptionDto;
  };
}
```

Implementation: `beforeAll` registers 2 users (owner, trainer-user), creates a gym house under the owner, creates a staff record linking the trainer-user, creates a member with an active subscription.

### Task 1.4: Create gym-house fixture
**File:** `tests/GymManager.E2E/fixtures/gym-house.fixture.ts` (NEW)
**Complexity:** S
**Dependencies:** Task 1.1

Lightweight fixture for tests that only need an authenticated owner + gym house, without the full role setup:

```typescript
interface GymHouseFixtures extends AuthFixtures {
  gymHouse: GymHouseDto;
}
```

### Task 1.5: Create directory structure
**Complexity:** S
**Dependencies:** None

Create the following empty directories:
```
tests/GymManager.E2E/specs/api/
tests/GymManager.E2E/specs/journeys/
```

### Task 1.6: Update playwright.config.ts with test projects for tiered runs
**File:** `tests/GymManager.E2E/playwright.config.ts`
**Complexity:** S
**Dependencies:** Task 1.5

Add named Playwright projects:
```typescript
projects: [
  {
    name: "api",
    testDir: "./specs/api",
    use: { /* no browser needed, but Playwright still needs a project */ },
  },
  {
    name: "ui",
    testDir: "./specs",
    testIgnore: ["**/api/**", "**/journeys/**"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "journeys",
    testDir: "./specs/journeys",
    use: { ...devices["Desktop Chrome"] },
  },
],
```

### Task 1.7: Update package.json with new scripts
**File:** `tests/GymManager.E2E/package.json`
**Complexity:** S
**Dependencies:** Task 1.6

Add scripts:
```json
"test:api": "npx playwright test --project=api",
"test:journeys": "npx playwright test --project=journeys",
"test:smoke": "npx playwright test --project=api --grep @smoke",
"test:full": "npx playwright test --project=api --project=ui",
"test:nightly": "npx playwright test"
```

---

## Phase 2: API-Direct Specs (Clusters A-H)

**Goal:** Cover all 8 clusters with fast, browserless API tests.
**Dependencies:** Phase 1 complete.
**Pattern:** Each spec imports from `helpers/api-client.ts` and `helpers/test-data.ts` directly. No Playwright browser context. Uses `@playwright/test`'s `test` and `expect` for assertion consistency.

### Task 2.1: Auth & Token Lifecycle (Cluster B)
**File:** `tests/GymManager.E2E/specs/api/auth-lifecycle.api.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1

```
describe("Auth & Token Lifecycle (API)")
  describe("Registration")
    it("registers a new user and returns accessToken + refreshToken")
    it("returns 409 when email already exists")
    it("returns 400 when password is too weak")
    it("returns 400 when email format is invalid")

  describe("Login")
    it("logs in with valid credentials and returns tokens")
    it("returns 401 when password is wrong")
    it("returns 401 when email does not exist")

  describe("Token refresh")
    it("exchanges a valid refresh token for a new access + refresh token pair")
    it("returns 401 when refresh token is invalid/expired")
    it("old refresh token is rejected after rotation (replay detection)")

  describe("Protected endpoints with expired/missing token")
    it("returns 401 when no Authorization header is sent")
    it("returns 401 when Authorization header contains an expired JWT")
    it("returns 401 when Authorization header contains a malformed JWT")
```

### Task 2.2: Gym House CRUD + Multi-Tenancy (Cluster E)
**File:** `tests/GymManager.E2E/specs/api/multi-tenancy.api.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1

```
describe("Multi-Tenancy & Isolation (API)")
  describe("Gym house CRUD")
    it("creates a gym house and returns it with the correct owner")
    it("lists only gym houses belonging to the authenticated owner")
    it("returns 404 for a non-existent gym house ID")
    it("updates a gym house name and returns the updated DTO")
    it("deletes a gym house (soft delete) and it disappears from GET list")

  describe("Cross-gym isolation")
    it("owner A cannot read owner B's gym house by ID (404)")
    it("owner A cannot list owner B's members")
    it("owner A cannot create a member in owner B's gym house (403 or 404)")
    it("owner A cannot create a booking in owner B's gym house")

  describe("Empty system")
    it("a freshly registered user with no gym houses gets an empty list")
    it("a gym house with no members returns an empty paged list")
    it("a gym house with no bookings returns an empty paged list")
    it("a gym house with no transactions returns an empty paged list")
```

### Task 2.3: Booking & Class Lifecycle (Cluster C)
**File:** `tests/GymManager.E2E/specs/api/booking-lifecycle.api.spec.ts` (NEW)
**Complexity:** L
**Dependencies:** Task 1.1

```
describe("Booking & Class Lifecycle (API)")
  describe("Time slot booking flow")
    it("creates a time slot, books a member into it, and availableSpots decreases by 1")
    it("checks in a booking and status becomes Completed/CheckedIn")
    it("cancels a booking and status becomes Cancelled, availableSpots increases")
    it("marks a booking as no-show")

  describe("Class schedule booking flow")
    it("creates a class schedule, books a member into it, currentEnrollment increases")
    it("cancels a class booking and currentEnrollment decreases")

  describe("Double booking prevention")
    it("booking the same member into the same time slot twice returns 400 or 409")
    it("booking the same member into the same class twice returns 400 or 409")

  describe("Capacity enforcement")
    it("booking into a full time slot (maxCapacity reached) returns 400")

  describe("Class schedule CRUD")
    it("creates a class schedule and returns it with correct fields")
    it("lists class schedules filtered by dayOfWeek")
    it("updates a class schedule name and maxCapacity")

  describe("Time slot listing")
    it("lists time slots filtered by date range")
    it("a freshly created time slot shows 0 currentBookings and full availableSpots")
```

### Task 2.4: Subscription & Payments (Cluster D)
**File:** `tests/GymManager.E2E/specs/api/subscription-payments.api.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1

```
describe("Subscription & Payments (API)")
  describe("Subscription lifecycle")
    it("creates a Monthly subscription with Active status")
    it("creates a Quarterly subscription with correct endDate")
    it("freezes an Active subscription and status becomes Frozen")
    it("cancels an Active subscription and status becomes Cancelled")
    it("renews an expired/cancelled subscription with new dates and Active status")
    it("cannot freeze an already Cancelled subscription (400)")
    it("cannot cancel an already Cancelled subscription (400)")

  describe("Subscription retrieval")
    it("lists all subscriptions for a member")
    it("a member with no subscriptions returns an empty list")

  describe("Transactions for subscriptions")
    it("recording a MembershipFee credit transaction succeeds")
    it("recording a Refund transaction succeeds")
    it("transaction list filtered by type returns only matching transactions")
    it("transaction list filtered by direction returns only matching transactions")
    it("transaction list filtered by date range returns correct subset")
```

### Task 2.5: Transaction Reversal & Data Integrity (Cluster H)
**File:** `tests/GymManager.E2E/specs/api/data-integrity.api.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1

```
describe("Data Integrity (API)")
  describe("Transaction reversal")
    it("reverses a transaction, creating a counter-entry with reversed direction")
    it("reversed transaction has reversesTransactionId set to original")
    it("original transaction has reversedByTransactionId set to reversal")
    it("cannot reverse an already-reversed transaction (409)")

  describe("Soft delete")
    it("deleting a gym house removes it from GET list but DB retains it")
    it("deleting a gym house does not affect other gym houses in the list")

  describe("Pagination")
    it("members list respects page and pageSize parameters")
    it("page 1 and page 2 return different members when enough data exists")
    it("requesting a page beyond totalCount returns an empty items array")
    it("bookings list respects page and pageSize parameters")
    it("transactions list respects page and pageSize parameters")

  describe("Search")
    it("member search by name returns only matching members")
    it("member search with no matches returns empty items array")
```

### Task 2.6: Staff & HR Operations (Cluster F)
**File:** `tests/GymManager.E2E/specs/api/staff-hr.api.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1, Task 1.2

```
describe("Staff & HR Operations (API)")
  describe("Staff CRUD")
    it("creates a Trainer staff record and returns correct fields")
    it("creates a Reception staff record with different staffType")
    it("returns 409 when creating duplicate staff for same user+gymHouse")
    it("lists staff filtered by gymHouseId")
    it("lists staff filtered by staffType")
    it("gets staff by ID with correct gymHouseId query param")
    it("updates staff baseSalary and perClassBonus")

  describe("Shift assignments")
    it("creates a shift assignment for a staff member")
    it("lists shift assignments filtered by date range")
    it("lists shift assignments filtered by staffId")
    it("updates a shift assignment date and times")

  describe("Payroll")
    it("creates a payroll period for a gym house")
    it("lists payroll periods for a gym house")
    it("gets payroll period detail by ID including entries")
    it("approves a payroll period and status changes to Approved")
    it("cannot approve an already-approved payroll period (409)")
```

### Task 2.7: Communication & Notifications (Cluster G)
**File:** `tests/GymManager.E2E/specs/api/notifications.api.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1

```
describe("Communication & Notifications (API)")
  describe("Announcements")
    it("creates an announcement targeted at AllMembers")
    it("creates an announcement targeted at Staff")
    it("lists announcements for a gym house")
    it("gets announcement detail by ID")
    it("chain-wide announcement (gymHouseId=null) is created successfully")

  describe("Notifications")
    it("gets notification list for authenticated user (may be empty initially)")
    it("marks a notification as read and returns 204")

  describe("Notification preferences")
    it("gets default notification preferences for a user")
    it("updates notification preferences (toggle a channel off)")
    it("updated preferences persist on re-fetch")
```

### Task 2.8: Reports (fills Cluster H gaps)
**File:** `tests/GymManager.E2E/specs/api/reports.api.spec.ts` (NEW)
**Complexity:** S
**Dependencies:** Task 1.1

```
describe("Reports (API)")
  describe("P&L Report")
    it("returns a P&L report with totalRevenue, totalExpenses, netIncome")
    it("returns zeros when no transactions exist in the date range")
    it("returns 400 when 'from' is after 'to'")

  describe("Revenue Metrics")
    it("returns revenue metrics for a date range with seeded transactions")
    it("returns zeros when no transactions exist")
```

### Task 2.9: Role Onboarding (Cluster A) -- API validation
**File:** `tests/GymManager.E2E/specs/api/role-onboarding.api.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1, Task 1.3

```
describe("Role Onboarding Journeys (API)")
  describe("Owner first-time flow")
    it("register -> create gym house -> create first member -> create subscription")
    it("registered user can immediately create a gym house (no extra setup)")
    it("owner can list their gym houses after creation")

  describe("Trainer onboarding")
    it("register trainer user -> owner creates staff(Trainer) -> trainer user exists in staff list")
    it("trainer's staff record has correct staffType=Trainer")

  describe("Member onboarding")
    it("owner creates member -> creates subscription -> member has Active status")
    it("member with no subscription still appears in member list")

  describe("Returning user flow")
    it("login with existing credentials returns valid tokens")
    it("after login, user can fetch their gym houses")
```

### Task 2.10: Waitlist & Edge Cases
**File:** `tests/GymManager.E2E/specs/api/waitlist-edge-cases.api.spec.ts` (NEW)
**Complexity:** S
**Dependencies:** Task 1.1

```
describe("Waitlist & Edge Cases (API)")
  describe("Full capacity booking")
    it("booking when time slot is full returns a WaitListed status or 400")

  describe("Invalid entity references")
    it("booking with non-existent memberId returns 404")
    it("booking with non-existent timeSlotId returns 404")
    it("creating subscription for non-existent memberId returns 404")
    it("creating staff with non-existent userId returns 404 or 400")

  describe("Boundary values")
    it("creating a time slot with maxCapacity=1 allows exactly 1 booking")
    it("creating a subscription with startDate after endDate returns 400")
    it("recording a transaction with amount=0 returns 400")
    it("creating a gym house with hourlyCapacity=0 returns 400")
```

---

## Phase 3: Journey Specs

**Goal:** 3 end-to-end role flows that chain multiple API calls in sequence, simulating real user sessions.
**Dependencies:** Phase 1 complete. Phase 2 is NOT a dependency (journeys use the same api-client).

### Task 3.1: Owner Onboarding Journey
**File:** `tests/GymManager.E2E/specs/journeys/owner-onboarding.journey.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1, Task 1.4

Uses the `authenticatedPage` fixture (browser-based).

```
describe("Owner Onboarding Journey")
  it("Step 1: Register as new owner via browser form")
  it("Step 2: Dashboard shows empty state (no gym houses)")
  it("Step 3: Create first gym house via browser form")
  it("Step 4: Navigate to gym house, see empty member list")
  it("Step 5: Add first member via API, verify appears in browser list")
  it("Step 6: Create subscription for member via API")
  it("Step 7: Navigate to member detail, see Active subscription")
  it("Step 8: Create a time slot and book the member via API")
  it("Step 9: Navigate to bookings list, see the booking")
  it("Step 10: Record a revenue transaction, verify in finance page")
```

Implementation note: Steps 1-4, 7, 9 use the browser. Steps 5, 6, 8, 10 use API calls for speed, then verify in browser.

### Task 3.2: Member Lifecycle Journey
**File:** `tests/GymManager.E2E/specs/journeys/member-lifecycle.journey.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1, Task 1.3

Uses the `role.fixture.ts` (pre-seeded owner + gym house + member).

```
describe("Member Lifecycle Journey")
  it("Step 1: Owner creates a member via API")
  it("Step 2: Owner creates Active subscription for member")
  it("Step 3: Member books a time slot")
  it("Step 4: Member checks in to booking")
  it("Step 5: Owner freezes the subscription")
  it("Step 6: Verify subscription status is Frozen")
  it("Step 7: Owner renews the subscription")
  it("Step 8: Verify subscription is Active again with new dates")
  it("Step 9: Owner cancels the subscription")
  it("Step 10: Verify member subscription is Cancelled")
```

### Task 3.3: Staff HR Journey
**File:** `tests/GymManager.E2E/specs/journeys/staff-hr.journey.spec.ts` (NEW)
**Complexity:** M
**Dependencies:** Task 1.1, Task 1.2, Task 1.3

Uses the `role.fixture.ts`.

```
describe("Staff HR Journey")
  it("Step 1: Owner registers a new user to be a trainer")
  it("Step 2: Owner creates Staff(Trainer) record linked to that user")
  it("Step 3: Owner assigns a morning shift to the trainer")
  it("Step 4: Owner assigns an afternoon shift to the trainer")
  it("Step 5: Verify shift list shows both shifts for the trainer")
  it("Step 6: Owner creates a payroll period for the current month")
  it("Step 7: Verify payroll period detail contains the trainer entry")
  it("Step 8: Owner approves the payroll period")
  it("Step 9: Verify payroll status is Approved")
  it("Step 10: Owner creates an announcement for Staff audience")
```

---

## Phase 4: Browser Gap Fills

**Goal:** Add page objects and UI specs for features not covered by the existing 9 browser specs.
**Dependencies:** Phase 1 complete.

### Task 4.1: Bookings page object
**File:** `tests/GymManager.E2E/pages/bookings.page.ts` (NEW)
**Complexity:** S
**Dependencies:** None

Page objects for:
- `BookingsPage` -- list at `/bookings` with date filter, table rows, create button
- `BookingDetailPage` -- detail at `/bookings/{id}` with cancel, check-in, no-show buttons

### Task 4.2: Staff page object
**File:** `tests/GymManager.E2E/pages/staff.page.ts` (NEW)
**Complexity:** S
**Dependencies:** None

Page objects for:
- `StaffPage` -- list at `/staff` with gym-house filter, staff-type filter
- `StaffFormPage` -- form at `/staff/new`

### Task 4.3: Finance page object
**File:** `tests/GymManager.E2E/pages/finance.page.ts` (NEW)
**Complexity:** S
**Dependencies:** None

Page objects for:
- `TransactionsPage` -- list at `/finance/transactions` with category filter
- `TransactionFormPage` -- form at `/finance/transactions/new`

### Task 4.4: Announcements page object
**File:** `tests/GymManager.E2E/pages/announcements.page.ts` (NEW)
**Complexity:** S
**Dependencies:** None

Page objects for:
- `AnnouncementsPage` -- list at `/announcements`
- `AnnouncementFormPage` -- form at `/announcements/new`

### Task 4.5: Move existing browser specs into specs/ui/
**File:** Move all 9 existing `specs/*.spec.ts` to `specs/ui/`
**Complexity:** S
**Dependencies:** Task 1.6 (config update references new testDir)

Files to move:
- `specs/auth.spec.ts` -> `specs/ui/auth.spec.ts`
- `specs/gym-houses.spec.ts` -> `specs/ui/gym-houses.spec.ts`
- `specs/members.spec.ts` -> `specs/ui/members.spec.ts`
- `specs/subscriptions.spec.ts` -> `specs/ui/subscriptions.spec.ts`
- `specs/bookings.spec.ts` -> `specs/ui/bookings.spec.ts`
- `specs/finance.spec.ts` -> `specs/ui/finance.spec.ts`
- `specs/staff.spec.ts` -> `specs/ui/staff.spec.ts`
- `specs/announcements.spec.ts` -> `specs/ui/announcements.spec.ts`
- `specs/navigation.spec.ts` -> `specs/ui/navigation.spec.ts`

Update all relative import paths in moved files (e.g., `../fixtures/` -> `../../fixtures/`).

Update `package.json` scripts to point to new paths.

---

## Phase 5: CI Configuration

**Goal:** Define tiered CI pipelines.
**Dependencies:** Phases 2, 3, 4 complete.

### Task 5.1: GitHub Actions workflow for E2E
**File:** `.github/workflows/e2e.yml` (NEW or extend existing)
**Complexity:** M
**Dependencies:** All previous phases

Three tiers:

**Smoke (on PR):**
```yaml
- name: E2E Smoke
  run: cd tests/GymManager.E2E && npx playwright test --project=api --grep @smoke
  # Expected: ~30s, runs only @smoke-tagged API specs
```

**Full (on merge to main):**
```yaml
- name: E2E Full
  run: cd tests/GymManager.E2E && npx playwright test --project=api --project=ui
  # Expected: ~5-8min, all API + browser specs
```

**Nightly (cron schedule):**
```yaml
- name: E2E Nightly
  run: cd tests/GymManager.E2E && npx playwright test
  # Expected: ~10-15min, everything including journeys
```

Services block: PostgreSQL container, API (dotnet run), frontend (npm run dev).

### Task 5.2: Add @smoke tags to critical API specs
**Complexity:** S
**Dependencies:** Phase 2

Tag these tests with `test.describe("...", { tag: "@smoke" })`:
- Auth: register + login happy path
- Gym house: create + list
- Member: create
- Booking: create + check-in
- Subscription: create
- Transaction: record

---

## File Ownership Summary

| File | Phase | Owner Phase |
|------|-------|-------------|
| `helpers/api-client.ts` | 1 | Phase 1 only |
| `helpers/test-data.ts` | 1 | Phase 1 only |
| `fixtures/role.fixture.ts` | 1 | Phase 1 only |
| `fixtures/gym-house.fixture.ts` | 1 | Phase 1 only |
| `playwright.config.ts` | 1 | Phase 1 only |
| `package.json` | 1, 4 | Phase 1 creates, Phase 4 updates |
| `specs/api/*.api.spec.ts` (10 files) | 2 | Phase 2 only |
| `specs/journeys/*.journey.spec.ts` (3 files) | 3 | Phase 3 only |
| `pages/bookings.page.ts` | 4 | Phase 4 only |
| `pages/staff.page.ts` | 4 | Phase 4 only |
| `pages/finance.page.ts` | 4 | Phase 4 only |
| `pages/announcements.page.ts` | 4 | Phase 4 only |
| `specs/ui/*.spec.ts` (moved) | 4 | Phase 4 only |
| `.github/workflows/e2e.yml` | 5 | Phase 5 only |

---

## Execution Order

```
Phase 1 (Foundation)          ~0.5 day
    |
    +---> Phase 2 (API specs)        ~2 days    \
    |                                             > PARALLEL
    +---> Phase 3 (Journey specs)    ~1 day     /
    |
    +---> Phase 4 (Browser gap fills) ~1 day
    |
Phase 5 (CI)                  ~0.5 day
```

Phases 2 and 3 can run in parallel since they write to different directories and both depend only on Phase 1.
Phase 4 can also run in parallel with 2/3 but depends on Phase 1 for the config changes.
Phase 5 runs last since it references all spec file paths.

---

## Risk Mitigations

1. **API DTO drift:** Every API spec asserts response shape (key presence) on at least one happy-path test. If the .NET API changes a field name, the spec fails immediately.
2. **Flaky journeys:** Each journey is capped at 10 steps. No browser waits inside journey specs -- use API calls for setup, browser only for verification.
3. **Missing permission enforcement:** Tests that depend on role-based access are tagged `@skip-until-rbac`. They use `test.fixme()` so they appear as known-incomplete in reports without failing CI.
4. **Rate limiting in tests:** The existing Playwright config uses `workers: 1` and sequential execution, which should stay under auth rate limits (10/min). If needed, add a small delay or increase the rate limit in test environment config.

---

## Total New Files

| Category | Count |
|----------|-------|
| Modified helpers | 2 (api-client.ts, test-data.ts) |
| New fixtures | 2 (role.fixture.ts, gym-house.fixture.ts) |
| New API spec files | 10 |
| New journey spec files | 3 |
| New page object files | 4 |
| Moved browser spec files | 9 (same files, new location) |
| New CI workflow | 1 |
| Modified config | 2 (playwright.config.ts, package.json) |
| **Total new test cases** | **~120 API + ~10 journey steps x 3 + existing UI** |
