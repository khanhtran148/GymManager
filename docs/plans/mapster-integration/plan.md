# Mapster Integration Plan

**Date:** 2026-03-17
**Scope:** Backend-only (Application + Infrastructure layers)
**Success Criteria:** Zero `FromEntity`/`ToDto` static methods remain, all read queries use `ProjectToType<T>()`, all 87 tests pass

---

## Current State

### Manual Mapping Inventory

**Pattern A: `FromEntity()` static methods on DTOs (4 DTOs, 5 methods)**

| DTO | File | Complexity |
|-----|------|-----------|
| `TransactionDto.FromEntity` | `Transactions/Shared/TransactionDto.cs` | Simple 1:1 |
| `StaffDto.FromEntity` | `Staff/Shared/StaffDto.cs` | Navigation flattening: `s.User?.FullName`, `s.User?.Email` |
| `ShiftAssignmentDto.FromEntity` | `ShiftAssignments/Shared/ShiftAssignmentDto.cs` | Navigation flattening: `s.Staff?.User?.FullName` |
| `PayrollEntryDto.FromEntity` | `Payroll/Shared/PayrollPeriodDto.cs` | Navigation flattening: `e.Staff?.User?.FullName`, `e.Staff?.StaffType` |
| `PayrollPeriodDto.FromEntity` | `Payroll/Shared/PayrollPeriodDto.cs` | Computed: `Entries.Sum(e => e.NetPay)`, `Entries.Count` |
| `PayrollPeriodDetailDto.FromEntity` | `Payroll/Shared/PayrollPeriodDto.cs` | Nested collection mapping + computed sum |

**Pattern B: `ToDto()` on handler classes (3 handlers)**

| Handler | File | Complexity |
|---------|------|-----------|
| `CreateMemberCommandHandler.ToDto` | `Members/CreateMember/CreateMemberCommandHandler.cs` | Navigation: `m.User.FullName`, `m.User.Email`, `m.User.Phone` |
| `CreateGymHouseCommandHandler.ToDto` | `GymHouses/CreateGymHouse/CreateGymHouseCommandHandler.cs` | Simple 1:1 |
| `CreateSubscriptionCommandHandler.ToDto` | `Subscriptions/CreateSubscription/CreateSubscriptionCommandHandler.cs` | Simple 1:1 |

**Pattern C: Standalone mapper classes (3 files)**

| Mapper | File | Complexity |
|--------|------|-----------|
| `BookingMapper.ToDto` | `Bookings/Shared/BookingMapper.cs` | Two-source: takes `Booking` + `Member` separately |
| `ClassScheduleMapper.ToDto` | `ClassSchedules/Shared/ClassScheduleMapper.cs` | Navigation: `cs.Trainer?.FullName`; Computed: `MaxCapacity - CurrentEnrollment` |
| `TimeSlotMapper.ToDto` | `TimeSlots/Shared/TimeSlotMapper.cs` | Computed: `MaxCapacity - CurrentBookings` |

**Pattern D: Inline `new PnLLineDto(...)` in report handlers**

| File | Notes |
|------|-------|
| `Reports/GetPnLReport/GetPnLReportQueryHandler.cs` | Constructs DTOs from aggregated tuples, not from entities. Leave as-is. |
| `Reports/GetRevenueMetrics/GetRevenueMetricsQueryHandler.cs` | Constructs DTO from multiple scalar queries. Leave as-is. |

### Callers of Manual Mapping (handlers that need updating)

**Using `FromEntity`:**
- `Transactions/RecordTransaction/RecordTransactionCommandHandler.cs`
- `Transactions/ReverseTransaction/ReverseTransactionCommandHandler.cs`
- `Transactions/GetTransactions/GetTransactionsQueryHandler.cs`
- `Staff/CreateStaff/CreateStaffCommandHandler.cs`
- `Staff/GetStaffById/GetStaffByIdQueryHandler.cs`
- `Staff/GetStaff/GetStaffQueryHandler.cs`
- `Staff/UpdateStaff/UpdateStaffCommandHandler.cs`
- `ShiftAssignments/CreateShiftAssignment/CreateShiftAssignmentCommandHandler.cs`
- `ShiftAssignments/UpdateShiftAssignment/UpdateShiftAssignmentCommandHandler.cs`
- `ShiftAssignments/GetShiftAssignments/GetShiftAssignmentsQueryHandler.cs`
- `Payroll/CreatePayrollPeriod/CreatePayrollPeriodCommandHandler.cs`
- `Payroll/ApprovePayroll/ApprovePayrollCommandHandler.cs`
- `Payroll/GetPayrollPeriodById/GetPayrollPeriodByIdQueryHandler.cs`
- `Payroll/GetPayrollPeriods/GetPayrollPeriodsQueryHandler.cs`

**Using handler-level `ToDto`:**
- `Members/CreateMember/CreateMemberCommandHandler.cs`
- `Members/UpdateMember/UpdateMemberCommandHandler.cs`
- `Members/GetMemberById/GetMemberByIdQueryHandler.cs`
- `Members/GetMembers/GetMembersQueryHandler.cs`
- `GymHouses/CreateGymHouse/CreateGymHouseCommandHandler.cs`
- `GymHouses/UpdateGymHouse/UpdateGymHouseCommandHandler.cs`
- `GymHouses/GetGymHouseById/GetGymHouseByIdQueryHandler.cs`
- `GymHouses/GetGymHouses/GetGymHousesQueryHandler.cs`
- `Subscriptions/CreateSubscription/CreateSubscriptionCommandHandler.cs`
- `Subscriptions/CancelSubscription/CancelSubscriptionCommandHandler.cs`
- `Subscriptions/FreezeSubscription/FreezeSubscriptionCommandHandler.cs`
- `Subscriptions/RenewSubscription/RenewSubscriptionCommandHandler.cs`
- `Subscriptions/GetSubscriptionsByMember/GetSubscriptionsByMemberQueryHandler.cs`

**Using mapper classes:**
- `ClassSchedules/CreateClassSchedule/CreateClassScheduleCommandHandler.cs`
- `ClassSchedules/UpdateClassSchedule/UpdateClassScheduleCommandHandler.cs`
- `ClassSchedules/GetClassScheduleById/GetClassScheduleByIdQueryHandler.cs`
- `ClassSchedules/GetClassSchedules/GetClassSchedulesQueryHandler.cs`
- `TimeSlots/CreateTimeSlot/CreateTimeSlotCommandHandler.cs`
- `TimeSlots/GetTimeSlots/GetTimeSlotsQueryHandler.cs`
- `Bookings/CreateBooking/CreateBookingCommandHandler.cs`
- `Bookings/GetBookingById/GetBookingByIdQueryHandler.cs`
- `Bookings/GetBookings/GetBookingsQueryHandler.cs`
- `Bookings/CheckIn/CheckInCommandHandler.cs`

---

## Architecture Decision: ProjectToType Scope

**`ProjectToType<T>()` requires `IQueryable`.** The current repository pattern returns materialized entities (`Task<List<T>>`, `Task<PagedList<T>>`). Handlers receive already-loaded entities, not queryables.

To use `ProjectToType<T>()`, we would need to either:
1. Expose `IQueryable` from repositories (leaks EF Core into Application layer), or
2. Move projection into repository methods that return DTOs directly (violates Clean Architecture -- repositories should return domain entities)

**Decision: Do NOT use `ProjectToType<T>()` in this plan.** The repository abstraction does not expose `IQueryable`, and changing that would violate the project's Clean Architecture boundaries. Instead, use `entity.Adapt<TDto>()` for in-memory mapping. This still eliminates all manual mapping code, which is the primary goal.

If ProjectToType becomes a priority later, a separate plan can introduce `IReadRepository<TDto>` interfaces with projection methods. That is a larger architectural change outside this scope.

---

## Phase 1: NuGet Setup + Mapping Configuration

**Goal:** Add Mapster packages and create the centralized mapping config.

### 1.1 Add NuGet Packages

**File: `Directory.Packages.props`**
- Add under a new `Mapping` item group:
  - `Mapster` with exact pinned version (e.g., `[4.2.0]`)
  - `Mapster.Core` with exact pinned version (e.g., `[2.0.1]`)
- Note: `Mapster.EFCore` is NOT needed since we are not using `ProjectToType`.

**File: `src/core/GymManager.Application/GymManager.Application.csproj`**
- Add `<PackageReference Include="Mapster" />`

### 1.2 Create Mapping Configuration

**New file: `src/core/GymManager.Application/Common/Mapping/MappingConfig.cs`**

This sealed static class registers all custom mappings using `TypeAdapterConfig.GlobalSettings`. It must handle:

**Simple 1:1 mappings (no config needed, Mapster handles by convention):**
- `Transaction` -> `TransactionDto`
- `GymHouse` -> `GymHouseDto`
- `Subscription` -> `SubscriptionDto`

**Navigation flattening:**
- `Staff` -> `StaffDto`: Map `s.User.FullName` -> `UserName`, `s.User.Email` -> `UserEmail`
- `ShiftAssignment` -> `ShiftAssignmentDto`: Map `s.Staff.User.FullName` -> `StaffName`
- `PayrollEntry` -> `PayrollEntryDto`: Map `e.Staff.User.FullName` -> `StaffName`, `e.Staff.StaffType` -> `StaffType`
- `Member` -> `MemberDto`: Map `m.User.FullName` -> `FullName`, `m.User.Email` -> `Email`, `m.User.Phone` -> `Phone`
- `ClassSchedule` -> `ClassScheduleDto`: Map `cs.Trainer.FullName` -> `TrainerName`

**Computed properties:**
- `ClassSchedule` -> `ClassScheduleDto`: `AvailableSpots` = `MaxCapacity - CurrentEnrollment`
- `TimeSlot` -> `TimeSlotDto`: `AvailableSpots` = `MaxCapacity - CurrentBookings`
- `PayrollPeriod` -> `PayrollPeriodDto`: `TotalNetPay` = `Entries.Sum(e => e.NetPay)`, `EntryCount` = `Entries.Count`
- `PayrollPeriod` -> `PayrollPeriodDetailDto`: `Entries` = adapted list, `TotalNetPay` = sum of adapted entries

**Two-source mapping (BookingMapper takes Booking + Member):**
- This cannot be a single `Adapt<T>()` call. Create a custom `MapBookingToDto(Booking b, Member m)` extension method that uses Mapster's `BuildAdapter()` with `Map` to inject the extra source values (`MemberName`, `MemberCode`).

### 1.3 Register in DI

**File: `src/core/GymManager.Application/DependencyInjection.cs`**
- Call `MappingConfig.Configure()` inside `AddApplication()`.

### Files Owned by Phase 1
- `Directory.Packages.props` (modify)
- `src/core/GymManager.Application/GymManager.Application.csproj` (modify)
- `src/core/GymManager.Application/Common/Mapping/MappingConfig.cs` (create)
- `src/core/GymManager.Application/DependencyInjection.cs` (modify)

### Risks
- **Mapster version compatibility with net10.0**: Mapster 4.x targets netstandard2.0, compatible with .NET 10. Verify by building.
- **Null navigation properties**: Mapster returns default values for unmapped nulls. The current code uses `?.` with `?? string.Empty` fallbacks. Configure `PreserveReference(true)` and use `.Map` with null checks where needed.

---

## Phase 2: Replace Manual Mappings with Adapt

**Goal:** Replace all `FromEntity()`, `ToDto()`, and mapper class calls with `entity.Adapt<TDto>()`.

### TFD: Write Tests First

Before changing handlers, write a focused test class to verify Mapster configuration produces correct DTOs:

**New file: `tests/GymManager.Application.Tests/Mapping/MappingConfigTests.cs`**

Tests to write:
1. `TransactionDto_MapsAllProperties` -- simple 1:1
2. `StaffDto_FlattensUserNavigation` -- verifies `UserName` and `UserEmail` from `Staff.User`
3. `ShiftAssignmentDto_FlattensNestedNavigation` -- verifies `StaffName` from `Staff.User.FullName`
4. `PayrollEntryDto_FlattensStaffNavigation` -- verifies `StaffName` from `Staff.User.FullName`
5. `MemberDto_FlattensUserNavigation` -- verifies `FullName`, `Email`, `Phone` from `Member.User`
6. `ClassScheduleDto_ComputesAvailableSpots` -- verifies `MaxCapacity - CurrentEnrollment`
7. `TimeSlotDto_ComputesAvailableSpots` -- verifies `MaxCapacity - CurrentBookings`
8. `PayrollPeriodDto_ComputesAggregates` -- verifies `TotalNetPay` and `EntryCount`
9. `PayrollPeriodDetailDto_MapsEntriesAndAggregates`
10. `GymHouseDto_MapsAllProperties`
11. `SubscriptionDto_MapsAllProperties`
12. `BookingDto_MapsFromBookingAndMember` -- verifies the two-source mapping helper
13. `NullNavigation_ReturnsDefaults` -- verifies `Staff.User` being null produces `string.Empty`

These tests use in-memory entity construction (no DB needed), call `Adapt<T>()`, and assert output properties.

### 2.1 Replace FromEntity in DTOs

For each DTO file, remove the `FromEntity` static method body. The DTO record definition stays unchanged.

| File | Action |
|------|--------|
| `Transactions/Shared/TransactionDto.cs` | Remove `FromEntity` method, remove `using GymManager.Domain.Entities` |
| `Staff/Shared/StaffDto.cs` | Remove `FromEntity` method, remove entity using |
| `ShiftAssignments/Shared/ShiftAssignmentDto.cs` | Remove `FromEntity` method, remove entity using |
| `Payroll/Shared/PayrollPeriodDto.cs` | Remove all three `FromEntity` methods from `PayrollEntryDto`, `PayrollPeriodDto`, `PayrollPeriodDetailDto` |

### 2.2 Replace ToDto in Handlers

For each handler with an `internal static ToDto` method, remove the method and replace calls with `.Adapt<TDto>()`.

| File | Action |
|------|--------|
| `Members/CreateMember/CreateMemberCommandHandler.cs` | Remove `ToDto`, replace `ToDto(member)` with `member.Adapt<MemberDto>()` |
| `GymHouses/CreateGymHouse/CreateGymHouseCommandHandler.cs` | Remove `ToDto`, replace with `.Adapt<GymHouseDto>()` |
| `Subscriptions/CreateSubscription/CreateSubscriptionCommandHandler.cs` | Remove `ToDto`, replace with `.Adapt<SubscriptionDto>()` |

### 2.3 Replace Mapper Classes

| File | Action |
|------|--------|
| `ClassSchedules/Shared/ClassScheduleMapper.cs` | Delete file |
| `TimeSlots/Shared/TimeSlotMapper.cs` | Delete file |
| `Bookings/Shared/BookingMapper.cs` | Replace with a Mapster-based helper (two-source mapping cannot use plain `Adapt<T>()`) |

For `BookingMapper`, the replacement maps most properties via Mapster from `Booking`, then manually sets `MemberName` and `MemberCode` from the `Member` parameter. This is the one mapping that stays as a helper method because it takes two unrelated source objects.

### 2.4 Update All Handler Call Sites

Every handler that calls `FromEntity`, `ToDto`, or `ClassScheduleMapper.ToDto`/`TimeSlotMapper.ToDto`/`BookingMapper.ToDto` must be updated to use `.Adapt<TDto>()` (or the booking helper for two-source).

Add `using Mapster;` to each modified handler.

**Full list of handlers to modify:** (see Callers section above -- 37 handler files total)

For list-mapping in query handlers, replace:
- `paged.Items.Select(TransactionDto.FromEntity).ToList()` -> `paged.Items.Select(t => t.Adapt<TransactionDto>()).ToList()` (or `paged.Items.Adapt<List<TransactionDto>>()`)
- `CreateMemberCommandHandler.ToDto` references in other handlers -> `member.Adapt<MemberDto>()`
- `CreateGymHouseCommandHandler.ToDto` references -> `gymHouse.Adapt<GymHouseDto>()`
- `CreateSubscriptionCommandHandler.ToDto` references -> `subscription.Adapt<SubscriptionDto>()`

### Files Owned by Phase 2
- `tests/GymManager.Application.Tests/Mapping/MappingConfigTests.cs` (create)
- All 4 DTO files with `FromEntity` (modify)
- All 3 handler files with `ToDto` (modify)
- `ClassSchedules/Shared/ClassScheduleMapper.cs` (delete)
- `TimeSlots/Shared/TimeSlotMapper.cs` (delete)
- `Bookings/Shared/BookingMapper.cs` (modify -- keep as two-source helper)
- All 37 handler files listed above (modify)

### Risks
- **Cross-handler `ToDto` references**: `FreezeSubscriptionCommandHandler`, `CancelSubscriptionCommandHandler`, `RenewSubscriptionCommandHandler` all reference `CreateSubscriptionCommandHandler.ToDto`. After removing it, these must switch to `.Adapt<SubscriptionDto>()`. Similarly for `GetSubscriptionsByMember`, `GetGymHouseById`, `UpdateGymHouse`, `GetGymHouses`, `UpdateMember`, `GetMemberById`, `GetMembers`.
- **`using static` import in `CreateBookingCommandHandler`**: Line `using static GymManager.Application.Bookings.Shared.BookingMapper;` must be updated to match the new booking mapping approach.
- **Test assertions on DTO values**: Existing tests assert on `.Value.Email`, `.Value.FullName`, etc. As long as Mapster config maps these correctly, tests pass without change.

---

## Phase 3: Verification

**Goal:** Confirm all tests pass, no manual mappings remain, solution builds clean.

### 3.1 Build Verification
```bash
dotnet build
```

### 3.2 Run All Tests
```bash
dotnet test
```
All 87 tests must pass.

### 3.3 Grep for Residual Manual Mapping
```bash
grep -r "FromEntity" src/core/GymManager.Application/
grep -r "\.ToDto(" src/core/GymManager.Application/
```
Both must return zero results (except the `BookingMapper` two-source helper if retained).

### 3.4 Verify No Unused Imports
Build with warnings-as-errors to catch unused `using` statements from removed mapper references.

---

## Summary of All File Changes

### New Files (2)
1. `src/core/GymManager.Application/Common/Mapping/MappingConfig.cs`
2. `tests/GymManager.Application.Tests/Mapping/MappingConfigTests.cs`

### Deleted Files (2)
1. `src/core/GymManager.Application/ClassSchedules/Shared/ClassScheduleMapper.cs`
2. `src/core/GymManager.Application/TimeSlots/Shared/TimeSlotMapper.cs`

### Modified Files (~45)
- `Directory.Packages.props` -- add Mapster version
- `src/core/GymManager.Application/GymManager.Application.csproj` -- add Mapster reference
- `src/core/GymManager.Application/DependencyInjection.cs` -- register mapping config
- 4 DTO files -- remove `FromEntity` methods
- 3 handler files -- remove `ToDto` methods
- 1 mapper file (`BookingMapper.cs`) -- rewrite as two-source Mapster helper
- ~37 handler files -- replace mapping calls with `.Adapt<T>()`

### Unchanged
- All domain entities (no modification)
- All repository interfaces and implementations (no modification)
- All infrastructure code (no modification)
- Report DTOs (`PnLReportDto`, `RevenueMetricsDto`) -- constructed from aggregates, not entity mapping
- Report handlers -- not using `FromEntity`/`ToDto` pattern

---

## Estimated Effort

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: NuGet + Config | 30 min |
| Phase 2: TFD + Replace Mappings | 2 hours |
| Phase 3: Verification | 15 min |
| **Total** | **~2.75 hours** |
