## Phase 4: Staff/HR

### Objective

Deliver staff management per gym house, shift scheduling for non-trainer staff, and payroll with approval workflow that auto-generates salary payment transactions.

### Dependencies

Phase 1 (User, GymHouse) + Phase 3 (Transaction -- for salary payment records).

### 4.1 Domain Layer

#### Enums to Add

- `StaffType.cs` -- `Trainer, SecurityGuard, CleaningStaff, Reception`
- `ShiftType.cs` -- `Morning, Afternoon, Evening, Night`
- `ShiftStatus.cs` -- `Scheduled, Completed, Absent`
- `PayrollStatus.cs` -- `Draft, PendingApproval, Approved, Paid`

#### Entities to Create

**10. Staff** -- `src/core/GymManager.Domain/Entities/Staff.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| UserId | Guid | FK to User |
| GymHouseId | Guid | FK, tenant-scoped |
| StaffType | StaffType | |
| BaseSalary | decimal | monthly base |
| PerClassBonus | decimal | per class taught (trainers) |
| HiredAt | DateTime | |
| User | User | navigation |
| ShiftAssignments | List\<ShiftAssignment\> | navigation |

One Staff record per GymHouse per User. A trainer at two houses = two Staff records.

**11. ShiftAssignment** -- `src/core/GymManager.Domain/Entities/ShiftAssignment.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| StaffId | Guid | FK to Staff |
| GymHouseId | Guid | FK, tenant-scoped |
| ShiftDate | DateOnly | |
| StartTime | TimeOnly | |
| EndTime | TimeOnly | |
| ShiftType | ShiftType | |
| Status | ShiftStatus | |

**12. PayrollPeriod** -- `src/core/GymManager.Domain/Entities/PayrollPeriod.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid | FK, tenant-scoped |
| PeriodStart | DateOnly | |
| PeriodEnd | DateOnly | |
| Status | PayrollStatus | |
| ApprovedById | Guid? | FK to User |
| ApprovedAt | DateTime? | |
| Entries | List\<PayrollEntry\> | navigation |

**13. PayrollEntry** -- `src/core/GymManager.Domain/Entities/PayrollEntry.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| PayrollPeriodId | Guid | FK |
| StaffId | Guid | FK to Staff |
| BasePay | decimal | |
| ClassBonus | decimal | PerClassBonus * ClassesTaught |
| Deductions | decimal | |
| NetPay | decimal | BasePay + ClassBonus - Deductions |
| ClassesTaught | int | count from Booking table for trainers |

#### Domain Events

- `PayrollApprovedEvent(Guid PayrollPeriodId, Guid GymHouseId)` -- triggers Transaction creation
- `StaffCreatedEvent(Guid StaffId, Guid UserId, Guid GymHouseId)`

### 4.2 Application Layer

#### Interfaces

- `IStaffRepository.cs` -- CRUD, `GetByGymHouseAsync(paged)`, `GetByUserIdAsync`
- `IShiftAssignmentRepository.cs` -- CRUD, `GetByStaffAsync(dateRange)`, `GetByHouseAsync(dateRange)`
- `IPayrollPeriodRepository.cs` -- CRUD, `GetByHouseAsync(paged)`
- `IPayrollEntryRepository.cs` -- `GetByPeriodAsync`

#### Feature Slices

Folder: `src/core/GymManager.Application/Staff/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateStaff/CreateStaffCommand.cs` | Command | ManageStaff |
| `UpdateStaff/UpdateStaffCommand.cs` | Command | ManageStaff |
| `GetStaff/GetStaffQuery.cs` | Query (paged) | ViewStaff |
| `GetStaffById/GetStaffByIdQuery.cs` | Query | ViewStaff |

Folder: `src/core/GymManager.Application/ShiftAssignments/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateShiftAssignment/CreateShiftAssignmentCommand.cs` | Command | ManageShifts |
| `UpdateShiftAssignment/UpdateShiftAssignmentCommand.cs` | Command | ManageShifts |
| `GetShiftAssignments/GetShiftAssignmentsQuery.cs` | Query | ViewShifts |

Folder: `src/core/GymManager.Application/Payroll/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreatePayrollPeriod/CreatePayrollPeriodCommand.cs` | Command | ApprovePayroll |
| `CreatePayrollPeriod/CreatePayrollPeriodCommandHandler.cs` | Handler | auto-generates entries |
| `ApprovePayroll/ApprovePayrollCommand.cs` | Command | ApprovePayroll |
| `ApprovePayroll/ApprovePayrollCommandHandler.cs` | Handler | sets status, publishes event |
| `GetPayrollPeriods/GetPayrollPeriodsQuery.cs` | Query | ViewStaff |
| `GetPayrollPeriodById/GetPayrollPeriodByIdQuery.cs` | Query | ViewStaff |

**CreatePayrollPeriodCommandHandler logic:**
1. Check permission (ApprovePayroll)
2. For each Staff in the GymHouse:
   - BasePay = Staff.BaseSalary
   - If Trainer: count classes taught in period (Bookings where ClassSchedule.TrainerId = staff.UserId, status = Completed, date in range)
   - ClassBonus = count * Staff.PerClassBonus
   - NetPay = BasePay + ClassBonus - Deductions
3. Create PayrollEntry for each staff member
4. Status = Draft

#### MassTransit Consumer

- `PayrollApprovedConsumer.cs` -- on `PayrollApprovedEvent`: for each PayrollEntry in the period, create a SalaryPayment Transaction (Debit direction, category Payroll)

### 4.3 Infrastructure Layer

#### EF Configurations

- `StaffConfiguration.cs` -- global query filter, composite unique on (UserId, GymHouseId), BaseSalary as decimal(18,2)
- `ShiftAssignmentConfiguration.cs` -- global query filter, index on (StaffId, ShiftDate)
- `PayrollPeriodConfiguration.cs` -- global query filter, index on (GymHouseId, PeriodStart)
- `PayrollEntryConfiguration.cs` -- index on PayrollPeriodId, all decimal columns as decimal(18,2)

#### Migration

- `dotnet ef migrations add AddStaffPayrollEntities`

### 4.4 API Layer

**StaffController** -- `Controllers/StaffController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/staff` | Default |
| GET | `/api/v1/staff` | Default |
| GET | `/api/v1/staff/{id}` | Default |
| PUT | `/api/v1/staff/{id}` | Default |

**ShiftAssignmentsController** -- `Controllers/ShiftAssignmentsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/shift-assignments` | Default |
| GET | `/api/v1/shift-assignments` | Default |
| PUT | `/api/v1/shift-assignments/{id}` | Default |

**PayrollController** -- `Controllers/PayrollController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/payroll-periods` | Default |
| GET | `/api/v1/payroll-periods` | Default |
| GET | `/api/v1/payroll-periods/{id}` | Default |
| PATCH | `/api/v1/payroll-periods/{id}/approve` | Strict |

### 4.5 Web Frontend

#### Staff Management

- `src/app/(dashboard)/staff/page.tsx` -- staff table grouped by type, hire/edit actions
- `src/app/(dashboard)/staff/[id]/page.tsx` -- staff detail, salary info, shift history
- `src/app/(dashboard)/staff/new/page.tsx` -- create staff form (select user, type, salary)
- `src/hooks/use-staff.ts`

#### Shift Calendar

- `src/app/(dashboard)/shifts/page.tsx` -- weekly calendar grid, staff rows vs time columns, drag-to-assign (stretch goal: simple create modal first)
- `src/hooks/use-shift-assignments.ts`

#### Payroll Dashboard

- `src/app/(dashboard)/payroll/page.tsx` -- list of payroll periods with status badges (Draft, Pending, Approved, Paid)
- `src/app/(dashboard)/payroll/[id]/page.tsx` -- payroll detail: table of entries (staff name, base pay, class bonus, deductions, net pay), approve button
- `src/app/(dashboard)/payroll/new/page.tsx` -- select date range, generate payroll
- `src/hooks/use-payroll.ts`

#### Sidebar Update

Add Staff, Shifts, Payroll nav items.

### 4.6 Tests

#### Domain Tests

- `Entities/StaffTests.cs` -- creation, PerClassBonus only applies to Trainers
- `Entities/PayrollPeriodTests.cs` -- status transitions (Draft -> PendingApproval -> Approved), cannot approve if already approved
- `Entities/PayrollEntryTests.cs` -- NetPay = BasePay + ClassBonus - Deductions

#### Application Tests

- `Staff/CreateStaffCommandHandlerTests.cs` -- success, duplicate (same user + same house) returns conflict, permission denied
- `Payroll/CreatePayrollPeriodCommandHandlerTests.cs` -- generates correct entries, trainer class count correct, overlapping period returns conflict
- `Payroll/ApprovePayrollCommandHandlerTests.cs` -- success (status changes), already approved returns conflict, publishes PayrollApprovedEvent

#### Infrastructure Tests

- `Persistence/StaffTenantIsolationTests.cs`

#### MassTransit Consumer Tests

- `Consumers/PayrollApprovedConsumerTests.cs` -- creates SalaryPayment transactions for each entry

#### Test Builders

- `Builders/StaffBuilder.cs`
- `Builders/ShiftAssignmentBuilder.cs`
- `Builders/PayrollPeriodBuilder.cs`
- `Builders/PayrollEntryBuilder.cs`

### 4.7 Acceptance Criteria

- [ ] Staff created per gym house; same user can be staff at multiple houses
- [ ] Shift assignments created and queried by date range
- [ ] Payroll period auto-generates entries with correct salary calculations
- [ ] Trainer class bonus = PerClassBonus * completed classes in period
- [ ] Payroll approval publishes event that creates SalaryPayment transactions
- [ ] Web: staff CRUD, shift calendar, payroll dashboard with approval flow

