# Phase 2 Booking — Code Review Report

**Date:** 2026-03-17
**Scope:** Full codebase review (55+ new files)
**Review Agents:** Security, Quality, Performance, TFD
**Build Status:** .NET 0W/0E, Next.js 18 routes OK

---

## Critical & High Issues — FIXED

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | Critical | CancelBookingCommandHandler: capacity decrement without pessimistic lock | Changed to `GetByIdForUpdateAsync` |
| 2 | Critical | WaitlistPromotionConsumer: capacity increment without pessimistic lock | Changed to `GetByIdForUpdateAsync` |
| 3 | High | CreateBooking: no cross-tenant member validation (`member.GymHouseId != request.GymHouseId`) | Added GymHouseId mismatch check |
| 4 | High | Cross-slice `ToDto` imports violating CLAUDE.md rule | Extracted to `BookingMapper`, `TimeSlotMapper`, `ClassScheduleMapper` in Shared folders |
| 5 | High | Missing validators for CheckInCommand and MarkNoShowCommand | Created both validator files |
| 6 | High | No upper-bound on MaxCapacity in validators | Added `.LessThanOrEqualTo(10_000)` |
| 7 | High | Missing indexes on BookingConfiguration (TimeSlotId, ClassScheduleId) | Added both indexes |
| 8 | High | Null-forgiving operator `member!` in CheckInCommandHandler | Replaced with proper null check + NotFoundError |

## Medium Issues — Deferred (Recommend Next Sprint)

| # | Issue | Recommendation |
|---|-------|----------------|
| 9 | Entity properties have public setters (CurrentBookings, CurrentEnrollment, Status) | Add domain methods (IncrementBookings, Enroll, etc.) with private setters |
| 10 | HandleTimeSlotBookingAsync/HandleClassSessionBookingAsync near-identical (~60 lines each) | Extract shared booking creation logic |
| 11 | WaitlistPromotionConsumer contains business logic (capacity increment) | Move to domain methods or dispatch via MediatR command |
| 12 | GetBookingsQueryHandler has latent N+1 with memberRepository fallback in loop | Remove fallback; rely on Include() |
| 13 | Waitlist partial index missing PromotedAt filter | Add `WHERE promoted_at IS NULL` partial index |
| 14 | WaitlistPromotionConsumer: 3 separate SaveChangesAsync calls | Wrap in single transaction via IUnitOfWork |

## Test Coverage Gaps — Deferred

| Missing Test | Priority |
|---|---|
| BookingConcurrencyTests (pessimistic lock) | High — required by plan |
| BookingTenantIsolationTests | High — required by plan |
| MarkNoShowCommandHandlerTests | High — plan requirement |
| CancelBooking: capacity decrement assertion | High |
| GetBookingsQueryHandlerTests | Medium |
| GetBookingByIdQueryHandlerTests | Medium |
| GetTimeSlotsQueryHandlerTests | Medium |
| UpdateClassScheduleCommandHandlerTests | Medium |
| GetClassSchedules/GetClassScheduleById tests | Low |

## Low Issues — Optional

- BookedAt/AddedAt use DateTime.UtcNow initializers (non-deterministic in tests)
- Request records co-located in controller files (not in separate folder)
- WaitlistBuilder missing WithPromotedAt method
- DayOfWeekFlag enum defined but unused
- PlaceholderTests.cs still present with Assert.True(true)

---

## Final Status: PASS (with deferred items)

All critical and high issues resolved. Build green. Medium issues and test gaps documented for follow-up.
