# Frontend Implementation Report — Phase 2: Booking + Phase 3: Finance
Date: 2026-03-17
Status: COMPLETED

---

## Phase 2 Summary

Phase 2 Booking frontend implemented for Next.js App Router. All routes compile with zero TypeScript errors (`npm run build` passes, 18/18 routes).

---

## Phase 2 Completed Components

### Types
- `/src/types/booking.ts` — BookingDto, TimeSlotDto, ClassScheduleDto, all request types, string union types

### Utilities
- `/src/lib/booking-utils.ts` — bookingTypeLabel, bookingStatusLabel, checkInSourceLabel, dayOfWeekLabel

### Hooks
- `/src/hooks/use-bookings.ts` — useBookings, useBooking, useCreateBooking, useCancelBooking, useCheckIn, useMarkNoShow
- `/src/hooks/use-time-slots.ts` — useTimeSlots, useCreateTimeSlot
- `/src/hooks/use-class-schedules.ts` — useClassSchedules, useClassSchedule, useCreateClassSchedule, useUpdateClassSchedule

### Pages
- `/src/app/(dashboard)/bookings/page.tsx` — Bookings list with date range filter, pagination, cancel action
- `/src/app/(dashboard)/bookings/new/page.tsx` — New booking form (React Hook Form + Zod)
- `/src/app/(dashboard)/bookings/[id]/page.tsx` — Booking detail with check-in, cancel, mark no-show
- `/src/app/(dashboard)/class-schedules/page.tsx` — Class schedules list with day filter, capacity bar
- `/src/app/(dashboard)/class-schedules/new/page.tsx` — Create class form (React Hook Form + Zod)
- `/src/app/(dashboard)/time-slots/page.tsx` — Time slots by date range, card grid, inline create form
- `/src/app/(dashboard)/check-in/page.tsx` — Member search, today's bookings, per-booking check-in

### Components
- `/src/components/check-in-card.tsx` — Check-in card showing booking info, source selector, already-checked-in state

### Updated Files
- `/src/components/sidebar.tsx` — Added Bookings, Class Schedules, Time Slots, Check-in nav items; updated footer to "Phase 2 — Booking v2.0"
- `/src/components/top-bar.tsx` — Added getPageTitle and getPageDescription entries for all 4 new routes

---

## Phase 2 API Contract Usage

| Endpoint | Component / Hook | Status |
|---|---|---|
| POST /gymhouses/{id}/bookings | useCreateBooking, /bookings/new | Implemented |
| GET /gymhouses/{id}/bookings | useBookings, /bookings | Implemented |
| GET /gymhouses/{id}/bookings/{id} | useBooking, /bookings/[id] | Implemented |
| DELETE /gymhouses/{id}/bookings/{id} | useCancelBooking, /bookings, /bookings/[id] | Implemented |
| PATCH /gymhouses/{id}/bookings/{id}/check-in | useCheckIn, /bookings/[id], check-in-card | Implemented |
| PATCH /gymhouses/{id}/bookings/{id}/no-show | useMarkNoShow, /bookings/[id] | Implemented |
| POST /gymhouses/{id}/time-slots | useCreateTimeSlot, /time-slots | Implemented |
| GET /gymhouses/{id}/time-slots | useTimeSlots, /time-slots | Implemented |
| POST /gymhouses/{id}/class-schedules | useCreateClassSchedule, /class-schedules/new | Implemented |
| GET /gymhouses/{id}/class-schedules | useClassSchedules, /class-schedules | Implemented |
| GET /gymhouses/{id}/class-schedules/{id} | useClassSchedule (hook only) | Implemented |
| PUT /gymhouses/{id}/class-schedules/{id} | useUpdateClassSchedule (hook only) | Implemented |

---

## Phase 2 Deviations from Contract

1. **gymHouseId**: No gym house context/store exists yet. All pages use `const gymHouseId = "placeholder-gym-id"` with a `// TODO: Get from gym house selector/context` comment. This must be replaced when a gym house selector is added in a later phase.

2. **Check-in page member search**: The contract has no search-by-name endpoint for members. The check-in page loads today's bookings from the paged `/bookings` endpoint (page=1, pageSize=20, filtered to today) and filters client-side by member name/code. This means members appearing only on pages 2+ of today's bookings may not appear. A dedicated search endpoint or higher pageSize should be added in a future phase.

3. **bookingType select in /bookings/new**: `z.coerce.number()` caused a TS resolver type mismatch with the installed zod/react-hook-form versions. Used `z.number()` with a controlled `Select` + `setValue` pattern instead.

4. **Status badges**: The existing `Badge` component maps to phase-1 status tokens (Active, Cancelled, Frozen, Expired). Booking statuses are mapped to these tokens: Confirmed→Active, Cancelled→Cancelled, No Show→Expired, Completed→Active, Wait Listed→Frozen. No new CSS tokens were added per instructions.

5. **TBD contract items**: Pagination cursor support, bulk check-in, and waitlist position query are listed as TBD in the contract. Not implemented.

---

---

## Phase 3 Finance Summary

Phase 3 Finance frontend implemented. Build passes with 0 errors, 4 new routes generated.

---

## Phase 3 Completed Components

| File | Description |
|------|-------------|
| `src/types/transaction.ts` | TransactionDto, PnLReportDto, RevenueMetricsDto, RecordTransactionRequest, ReverseTransactionRequest, TransactionFilters — all types matching API contract exactly |
| `src/hooks/use-transactions.ts` | useTransactions, useRecordTransaction, useReverseTransaction, usePnLReport, useRevenueMetrics |
| `src/components/charts/revenue-line-chart.tsx` | Recharts LineChart, dynamic import (SSR disabled), orange primary color, CSS variable tooltips for dark mode |
| `src/components/charts/expense-pie-chart.tsx` | Recharts donut PieChart, category color palette, dynamic import (SSR disabled) |
| `src/components/pnl-table.tsx` | Reusable income/expense table with footer totals row, color-coded variant |
| `src/app/(dashboard)/finance/page.tsx` | Financial Dashboard: 4 StatCards (MRR, Total Revenue, Total Expenses, Net Profit), RevenueLineChart, ExpensePieChart, metrics detail panel, Quick Actions |
| `src/app/(dashboard)/finance/transactions/page.tsx` | Transaction List with DataTable, type/direction/date range filters, pagination, gym house selector |
| `src/app/(dashboard)/finance/transactions/new/page.tsx` | Record Transaction: React Hook Form + Zod, all required fields + optional payment method/external reference |
| `src/app/(dashboard)/finance/pnl/page.tsx` | P&L Report: date range picker with Apply, income table, expense table, net profit/loss summary card (green/red) |
| `src/components/sidebar.tsx` | Added Finance collapsible nav group (Wallet icon) with Dashboard, Transactions, P&L sub-items; updated footer to "Phase 3 — Finance v3.0" |

---

## Phase 3 API Contract Usage

| Endpoint | Component | Status |
|----------|-----------|--------|
| `GET /gymhouses/{id}/transactions` | useTransactions, TransactionsPage | Implemented |
| `POST /gymhouses/{id}/transactions` | useRecordTransaction, NewTransactionPage | Implemented |
| `POST /gymhouses/{id}/transactions/{id}/reverse` | useReverseTransaction hook | Hook ready, no UI trigger per spec |
| `GET /gymhouses/{id}/reports/pnl` | usePnLReport, PnLPage, FinanceDashboard | Implemented |
| `GET /gymhouses/{id}/reports/revenue-metrics` | useRevenueMetrics, FinanceDashboard | Implemented |

---

## Phase 3 Type Errors Fixed

1. **zodResolver + zod v4 + amount field**: `z.coerce.number()` caused a resolver type incompatibility between react-hook-form v7, @hookform/resolvers v5, and zod v4. Fixed by using `z.string()` with `.refine()` validation and `parseFloat()` conversion on submit.

2. **recharts Tooltip formatter**: `ValueType` can be `undefined`; fixed by casting formatter via `TooltipProps<ValueType, NameType>["formatter"]` type assertion.

3. **Alert variant="info"**: Alert component only has "error" | "success" variants. Replaced all `variant="info"` with `variant="error"` for no-gym-house warnings.

---

## Phase 3 Deviations / Notes

- **Revenue time-series chart**: The API does not expose a time-series endpoint. The chart derives weekly cumulative data points from `PnLReport.totalIncome`. A dedicated time-series endpoint would improve accuracy.
- **Reverse transaction UI**: The hook is implemented. A per-row Reverse button in the transaction list was not requested in the spec and was deferred.
- **Gym house selector**: Using `useGymHouses()` on all finance pages; defaults to first house when only one exists.

---

## Vitest TFD Status

N/A — No logic-bearing hooks or stores added beyond standard TanStack Query wrappers that delegate all logic to the API. Chart components have no testable business logic.

---

## Unresolved Questions for Implementer Orchestrator

### Phase 2
1. **gymHouseId source** (Phase 2 pages): Where should the active gym house ID come from for booking pages? A Zustand store? A URL segment?
2. **Check-in search scale**: Current client-side search only covers first page (20 bookings) of today.
3. **Badge token extension**: Booking statuses map awkwardly to Phase 1 badge tokens.

### Phase 3
1. Should the Transaction List page have a per-row "Reverse" action button? Hook is ready.
2. Do the P&L and revenue-metrics APIs accept `YYYY-MM-DD` date strings or full ISO 8601 UTC timestamps in query params?
3. A dedicated revenue time-series endpoint would improve the finance dashboard chart accuracy.
