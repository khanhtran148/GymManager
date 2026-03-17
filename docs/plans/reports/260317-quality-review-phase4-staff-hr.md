# Code Review Report — Phase 4: Staff/HR

**Date:** 2026-03-17
**Reviewer:** Claude Code (parallel concern fan-out)
**Scope:** All Phase 4 uncommitted changes (78 files)
**Build:** 0 errors | **Tests:** 16/16 pass

---

## Fixed Issues (Critical/High)

| # | Severity | Category | Issue | Fix |
|---|----------|----------|-------|-----|
| 1 | Critical | Security/IDOR | `CreateShiftAssignmentCommandHandler` didn't validate StaffId belongs to GymHouseId — cross-tenant shift assignment | Added `staffRepository.GetByIdAsync(StaffId, GymHouseId)` check before creation |
| 2 | Critical | Performance/N+1 | `CreatePayrollPeriodCommandHandler` issued one COUNT query per trainer (N+1) | Added `CountCompletedByTrainersBatchAsync` — single GROUP BY query for all trainers |
| 3 | High | Performance | `CreatePayrollPeriodCommandHandler` re-fetched the just-created payroll period from DB | Removed redundant `GetByIdWithEntriesAsync`; build DTO from in-memory entity |
| 4 | High | Performance | `BookingRepository.CountCompletedByTrainerAsync` used unnecessary `.Include(ClassSchedule)` on COUNT | Removed Include — EF Core resolves navigation in predicates via implicit join |
| 5 | High | Quality | `ApprovePayrollCommandHandler` had redundant status checks and bare string error | Simplified to single `!= Draft` guard with proper `ConflictError` typed error |
| 6 | High | Security | `PayrollController.Create` used Default rate limit for expensive DB fan-out | Changed to `RateLimitPolicies.Strict` |
| 7 | High | Performance | `ShiftAssignmentRepository.GetByGymHouseAsync` was unbounded | Added `.Take(500)` row limit |
| 8 | High | Quality | `PayrollEntryDto` silently defaulted to `StaffType.Reception` when Staff was null | Changed to `default` (enum zero value) |
| 9 | Medium | Performance | Missing index on `shift_assignments.gym_house_id` | Added composite index `(gym_house_id, shift_date)` |
| 10 | Medium | Performance | Missing index on `staff.gym_house_id` alone | Added single-column index |

---

## Remaining Items (Deferred — not blocking)

| # | Severity | Category | Issue | Rationale for deferral |
|---|----------|----------|-------|----------------------|
| 1 | Medium | TFD | Tests written in same commit as implementation | Process recording issue, not code quality |
| 2 | Medium | Coverage | 8/11 handlers untested (ShiftAssignments, all queries) | Plan specified 4 test files; can add more in follow-up |
| 3 | Medium | Quality | `ViewStaff` permission used for payroll reads (no `ViewPayroll` exists) | Per plan spec; can add `ViewPayroll` permission later |
| 4 | Medium | Quality | `deductions = 0m` hardcoded in payroll calculation | Known stub per plan; deduction logic is out of scope for Phase 4 |
| 5 | Low | Quality | Request DTOs co-located in controller files | Consistent with existing pattern in TransactionsController |
| 6 | Low | Performance | `PayrollApprovedConsumer` creates transactions one-at-a-time | Low frequency operation (payroll approval); batch optimization is premature |
| 7 | Low | Quality | Type alias `StaffEntity` in `IStaffRepository` due to namespace collision | Works correctly; cosmetic concern |

---

## Verification

```
dotnet build → 0 errors, 0 warnings
dotnet test --filter "Staff|Payroll|ShiftAssignment" → 16/16 passed
```
