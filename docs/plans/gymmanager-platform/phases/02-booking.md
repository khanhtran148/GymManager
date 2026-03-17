## Phase 2: Booking

### Objective

Deliver time-slot and class-session booking, waitlist with auto-promotion, check-in tracking, and the booking calendar UI. After this phase, members can book gym slots and class sessions, get waitlisted when full, and check in.

### Dependencies

Phase 1 complete (User, Member, GymHouse, Subscription).

### 2.1 Domain Layer

#### Enums to Add

- `src/core/GymManager.Domain/Enums/BookingType.cs` -- `TimeSlot, ClassSession`
- `src/core/GymManager.Domain/Enums/BookingStatus.cs` -- `Confirmed, Cancelled, NoShow, Completed, WaitListed`
- `src/core/GymManager.Domain/Enums/CheckInSource.cs` -- `QRScan, ManualByStaff, SelfKiosk`
- `src/core/GymManager.Domain/Enums/DayOfWeekFlag.cs` -- `[Flags]` for recurring class schedules

#### Entities to Create

**5. TimeSlot** -- `src/core/GymManager.Domain/Entities/TimeSlot.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid | FK, tenant-scoped |
| Date | DateOnly | |
| StartTime | TimeOnly | |
| EndTime | TimeOnly | |
| MaxCapacity | int | |
| CurrentBookings | int | concurrency counter |

**6. ClassSchedule** -- `src/core/GymManager.Domain/Entities/ClassSchedule.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid | FK, tenant-scoped |
| TrainerId | Guid | FK to User (trainer) |
| ClassName | string | |
| DayOfWeek | DayOfWeek | |
| StartTime | TimeOnly | |
| EndTime | TimeOnly | |
| MaxCapacity | int | |
| CurrentEnrollment | int | concurrency counter |
| IsRecurring | bool | |

**7. Booking** -- `src/core/GymManager.Domain/Entities/Booking.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| MemberId | Guid | FK to Member |
| GymHouseId | Guid | FK, tenant-scoped |
| BookingType | BookingType | discriminator |
| TimeSlotId | Guid? | FK, null for class bookings |
| ClassScheduleId | Guid? | FK, null for slot bookings |
| Status | BookingStatus | |
| BookedAt | DateTime | |
| CheckedInAt | DateTime? | |
| CheckInSource | CheckInSource? | |

**8. Waitlist** -- `src/core/GymManager.Domain/Entities/Waitlist.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| MemberId | Guid | FK |
| GymHouseId | Guid | FK, tenant-scoped |
| BookingType | BookingType | |
| TimeSlotId | Guid? | |
| ClassScheduleId | Guid? | |
| Position | int | queue order |
| AddedAt | DateTime | |
| PromotedAt | DateTime? | null until promoted |

#### Domain Events

- `BookingConfirmedEvent(Guid BookingId, Guid MemberId, Guid GymHouseId)`
- `BookingCancelledEvent(Guid BookingId, Guid MemberId, Guid GymHouseId, BookingType Type, Guid? TimeSlotId, Guid? ClassScheduleId)`
- `WaitlistPromotedEvent(Guid WaitlistId, Guid BookingId, Guid MemberId)`

### 2.2 Application Layer

#### Interfaces to Add

- `IBookingRepository.cs` -- `CreateAsync`, `GetByIdAsync`, `GetByMemberAsync(paged)`, `GetByGymHouseAsync(date range, paged)`
- `ITimeSlotRepository.cs` -- `CreateAsync`, `GetByDateRangeAsync`, `GetByIdForUpdateAsync` (pessimistic lock)
- `IClassScheduleRepository.cs` -- CRUD, `GetByIdForUpdateAsync`
- `IWaitlistRepository.cs` -- `AddAsync`, `GetNextInLineAsync`, `RemoveAsync`

#### Feature Slices

Folder: `src/core/GymManager.Application/Bookings/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateBooking/CreateBookingCommand.cs` | Command | ManageBookings (or self) |
| `CreateBooking/CreateBookingCommandHandler.cs` | Handler | SELECT...FOR UPDATE on capacity |
| `CancelBooking/CancelBookingCommand.cs` | Command | ManageBookings (or self) |
| `CancelBooking/CancelBookingCommandHandler.cs` | Handler | decrement counter, publish event |
| `CheckIn/CheckInCommand.cs` | Command | ManageBookings |
| `CheckIn/CheckInCommandHandler.cs` | Handler | |
| `MarkNoShow/MarkNoShowCommand.cs` | Command | ManageBookings |
| `MarkNoShow/MarkNoShowCommandHandler.cs` | Handler | |
| `GetBookings/GetBookingsQuery.cs` | Query (paged) | ViewBookings |
| `GetBookings/GetBookingsQueryHandler.cs` | Handler | |
| `GetBookingById/GetBookingByIdQuery.cs` | Query | ViewBookings |
| `Shared/BookingDto.cs` | DTO | |

Folder: `src/core/GymManager.Application/TimeSlots/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateTimeSlot/CreateTimeSlotCommand.cs` | Command | ManageSchedule |
| `CreateTimeSlot/CreateTimeSlotCommandHandler.cs` | Handler | |
| `GetTimeSlots/GetTimeSlotsQuery.cs` | Query | ViewBookings |
| `GetTimeSlots/GetTimeSlotsQueryHandler.cs` | Handler | |

Folder: `src/core/GymManager.Application/ClassSchedules/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateClassSchedule/CreateClassScheduleCommand.cs` | Command | ManageSchedule |
| `CreateClassSchedule/CreateClassScheduleCommandHandler.cs` | Handler | |
| `UpdateClassSchedule/UpdateClassScheduleCommand.cs` | Command | ManageSchedule |
| `GetClassSchedules/GetClassSchedulesQuery.cs` | Query | ViewSchedule |
| `GetClassScheduleById/GetClassScheduleByIdQuery.cs` | Query | ViewSchedule |

#### MassTransit Consumers

- `src/apps/GymManager.BackgroundServices/Consumers/WaitlistPromotionConsumer.cs` -- on `BookingCancelledEvent`: find next waitlisted, create booking, decrement waitlist position, publish `WaitlistPromotedEvent`

### 2.3 Infrastructure Layer

#### EF Configurations

- `TimeSlotConfiguration.cs` -- global query filter, composite index on (GymHouseId, Date, StartTime)
- `ClassScheduleConfiguration.cs` -- global query filter, index on (GymHouseId, DayOfWeek)
- `BookingConfiguration.cs` -- global query filter, index on (MemberId, Status), index on (GymHouseId, BookedAt)
- `WaitlistConfiguration.cs` -- global query filter, index on (TimeSlotId, Position), index on (ClassScheduleId, Position)

#### Repository Methods -- Pessimistic Locking

`TimeSlotRepository.GetByIdForUpdateAsync`:
```sql
SELECT * FROM time_slots WHERE id = @id FOR UPDATE
```

Execute via `DbContext.Database.SqlQueryRaw` or use `FromSqlInterpolated` with the FOR UPDATE hint.

#### Migration

- `dotnet ef migrations add AddBookingEntities`

### 2.4 API Layer

**BookingsController** -- `Controllers/BookingsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/bookings` | Default |
| GET | `/api/v1/bookings` | Default |
| GET | `/api/v1/bookings/{id}` | Default |
| DELETE | `/api/v1/bookings/{id}` | Default |
| PATCH | `/api/v1/bookings/{id}/check-in` | Default |
| PATCH | `/api/v1/bookings/{id}/no-show` | Default |

**TimeSlotsController** -- `Controllers/TimeSlotsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/time-slots` | Default |
| GET | `/api/v1/time-slots` | Default |

**ClassSchedulesController** -- `Controllers/ClassSchedulesController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/class-schedules` | Default |
| GET | `/api/v1/class-schedules` | Default |
| GET | `/api/v1/class-schedules/{id}` | Default |
| PUT | `/api/v1/class-schedules/{id}` | Default |

### 2.5 Web Frontend

#### Booking Calendar

- `src/app/(dashboard)/bookings/page.tsx` -- weekly calendar view (time-slot grid + class overlays), create booking modal
- `src/app/(dashboard)/bookings/[id]/page.tsx` -- booking detail, cancel button, check-in action
- `src/hooks/use-bookings.ts` -- `useBookings(dateRange)`, `useCreateBooking()`, `useCancelBooking()`, `useCheckIn()`

#### Class Schedule Management

- `src/app/(dashboard)/class-schedules/page.tsx` -- weekly grid of classes by day, trainer assignment
- `src/app/(dashboard)/class-schedules/new/page.tsx` -- create/edit class form
- `src/hooks/use-class-schedules.ts`

#### Time Slot Management

- `src/app/(dashboard)/time-slots/page.tsx` -- date picker + slot list, capacity indicators (green/yellow/red)
- `src/hooks/use-time-slots.ts`

#### Check-in Interface

- `src/app/(dashboard)/check-in/page.tsx` -- search member by code or name, show today's bookings, check-in button
- `src/components/check-in-card.tsx`

#### Sidebar Update

Add Bookings, Class Schedules, Check-in nav items.

### 2.6 Tests

#### Domain Tests

- `Entities/BookingTests.cs` -- creation with correct type, check-in sets timestamp and source, cancel changes status
- `Entities/TimeSlotTests.cs` -- capacity validation (CurrentBookings <= MaxCapacity)

#### Application Tests

- `Bookings/CreateBookingCommandHandlerTests.cs` -- success (time-slot), success (class), capacity full returns conflict, member not found, permission denied
- `Bookings/CancelBookingCommandHandlerTests.cs` -- success, already cancelled, decrements counter
- `Bookings/CheckInCommandHandlerTests.cs` -- success, already checked in, booking not confirmed
- `TimeSlots/CreateTimeSlotCommandHandlerTests.cs` -- success, overlapping slot in same house
- `ClassSchedules/CreateClassScheduleCommandHandlerTests.cs` -- success, trainer double-booked

#### Infrastructure Tests

- `Persistence/BookingConcurrencyTests.cs` -- two concurrent bookings on last-capacity slot: one succeeds, one gets conflict
- `Persistence/BookingTenantIsolationTests.cs` -- booking in house A not visible from house B

#### Test Builders

- `Builders/TimeSlotBuilder.cs`
- `Builders/ClassScheduleBuilder.cs`
- `Builders/BookingBuilder.cs`
- `Builders/WaitlistBuilder.cs`

### 2.7 Acceptance Criteria

- [ ] Member can book a time slot (capacity decremented)
- [ ] Member can book a class session (enrollment incremented)
- [ ] Fully booked slot returns 409 Conflict
- [ ] Cancellation decrements counter and triggers waitlist promotion
- [ ] Waitlisted member auto-promoted when slot opens (MassTransit consumer test)
- [ ] Check-in records timestamp and source
- [ ] No-show tracking works
- [ ] Concurrent booking test passes (pessimistic lock prevents double-booking)
- [ ] Web: booking calendar renders, create/cancel booking flow works, check-in page functional

