# Frontend Implementation Report — Phase 2: Booking
Date: 2026-03-17
Status: COMPLETED

---

## Summary

Phase 2 Booking frontend implemented for Next.js App Router. All routes compile with zero TypeScript errors (`npm run build` passes, 18/18 routes).

---

## Completed Components

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

## API Contract Usage

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

## Deviations from Contract

1. **gymHouseId**: No gym house context/store exists yet. All pages use `const gymHouseId = "placeholder-gym-id"` with a `// TODO: Get from gym house selector/context` comment. This must be replaced when a gym house selector is added in a later phase.

2. **Check-in page member search**: The contract has no search-by-name endpoint for members. The check-in page loads today's bookings from the paged `/bookings` endpoint (page=1, pageSize=20, filtered to today) and filters client-side by member name/code. This means members appearing only on pages 2+ of today's bookings may not appear. A dedicated search endpoint or higher pageSize should be added in a future phase.

3. **bookingType select in /bookings/new**: `z.coerce.number()` caused a TS resolver type mismatch with the installed zod/react-hook-form versions. Used `z.number()` with a controlled `Select` + `setValue` pattern instead.

4. **Status badges**: The existing `Badge` component maps to phase-1 status tokens (Active, Cancelled, Frozen, Expired). Booking statuses are mapped to these tokens: Confirmed→Active, Cancelled→Cancelled, No Show→Expired, Completed→Active, Wait Listed→Frozen. No new CSS tokens were added per instructions.

5. **TBD contract items**: Pagination cursor support, bulk check-in, and waitlist position query are listed as TBD in the contract. Not implemented.

---

## Type Errors Fixed

- `z.coerce.number()` on `bookingType` field caused `Resolver<unknown>` vs `Resolver<number>` mismatch. Fixed by using `z.number()` with controlled component pattern.
- Same fix applied to `dayOfWeek` and `maxCapacity` in the class schedule form.

---

## Vitest TFD Status

N/A — No logic-bearing hooks or stores introduced beyond standard TanStack Query wrappers that delegate all logic to the API. The utility functions in `booking-utils.ts` are pure mapping functions with no branching complexity warranting unit tests beyond the build verification.

---

## Unresolved Questions for Implementer Orchestrator

1. **gymHouseId source**: Where should the active gym house ID come from? A Zustand store? A URL segment? Required to make all booking pages functional end-to-end.
2. **Check-in search scale**: The current client-side search only covers the first page (20 bookings) of today. Should the backend expose a member-search endpoint that returns bookings by member name/code?
3. **Badge token extension**: Booking statuses map awkwardly to Phase 1 badge tokens. Should Phase 2 introduce dedicated booking status badge CSS tokens?
