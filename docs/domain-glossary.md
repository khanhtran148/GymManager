---
title: Domain Glossary
type: domain-glossary
updated: 2026-03-19
---

# Domain Glossary

Definitions for all domain entities, business terms, and enum values in GymManager. All entities inherit `AuditableEntity` (Id, CreatedAt, UpdatedAt, DeletedAt) unless noted otherwise.

---

## Domain Entities

### AuditableEntity

Abstract base class for all domain entities.

| Property | Type | Notes |
|----------|------|-------|
| `Id` | `Guid` | Primary key, `gen_random_uuid()` |
| `CreatedAt` | `DateTime` | UTC, set on insert |
| `UpdatedAt` | `DateTime` | UTC, updated on every save |
| `DeletedAt` | `DateTime?` | Null = not deleted; set on soft delete |
| `IsDeleted` | `bool` | Computed: `DeletedAt.HasValue` |

---

### User

The authentication identity. One User may have multiple roles across different GymHouses (as a Member at one and Staff at another), but holds a single `Role` in the JWT.

| Property | Type | Notes |
|----------|------|-------|
| `Email` | `string` | Unique across all users |
| `PasswordHash` | `string` | BCrypt hash |
| `FullName` | `string` | Display name |
| `Phone` | `string?` | Optional contact number |
| `Role` | `Role` | Owner / HouseManager / Trainer / Staff / Member |
| `Permissions` | `Permission` | `[Flags] long` bitmask |
| `RefreshToken` | `string?` | Opaque token for token rotation |
| `RefreshTokenExpiresAt` | `DateTime?` | Expiry for the refresh token |

Methods: `SetRefreshToken()`, `IsRefreshTokenValid()`.

---

### GymHouse

A physical gym location. Owned by one User with `Role = Owner`. All tenant-scoped data references a GymHouse.

| Property | Type | Notes |
|----------|------|-------|
| `Name` | `string` | Location display name |
| `Address` | `string` | Physical address |
| `Phone` | `string?` | Contact number |
| `OperatingHours` | `string?` | Free-form text (e.g., "06:00-22:00") |
| `HourlyCapacity` | `int` | Max concurrent drop-in bookings |
| `OwnerId` | `Guid` | FK → User |

Navigation: `Owner`.

---

### Member

A gym member profile linked to a User. Scoped to one GymHouse, so the same person can be a member at multiple locations with separate Member records.

| Property | Type | Notes |
|----------|------|-------|
| `UserId` | `Guid` | FK → User |
| `GymHouseId` | `Guid` | Tenant scope |
| `MemberCode` | `string` | Format: `{PREFIX}-{SEQUENCE:D5}` (e.g., `DWN-00001`) |
| `Status` | `MembershipStatus` | Active / Frozen / Expired / Cancelled |
| `JoinedAt` | `DateTime` | UTC |

Navigation: `User`, `GymHouse`, `Subscriptions[]`.
Static method: `GenerateMemberCode()`.

---

### Subscription

A paid access period for a Member at a GymHouse.

| Property | Type | Notes |
|----------|------|-------|
| `MemberId` | `Guid` | FK → Member |
| `GymHouseId` | `Guid` | Tenant scope |
| `Type` | `SubscriptionType` | Monthly / Quarterly / Annual / DayPass |
| `Status` | `SubscriptionStatus` | Active / Frozen / Expired / Cancelled |
| `Price` | `decimal` | Amount paid |
| `StartDate` | `DateTime` | UTC |
| `EndDate` | `DateTime` | UTC |
| `FrozenAt` | `DateTime?` | When the freeze began |
| `FrozenUntil` | `DateTime?` | Planned resume date |

Methods: `Freeze()`, `Cancel()`, `Expire()`, `Renew()` — all return `Result`.

Business rule: a member cannot hold two active subscriptions at the same GymHouse.

---

### TimeSlot

A bookable drop-in session window on a specific date at a GymHouse.

| Property | Type | Notes |
|----------|------|-------|
| `GymHouseId` | `Guid` | Tenant scope |
| `Date` | `DateOnly` | Calendar date |
| `StartTime` | `TimeOnly` | Start of the window |
| `EndTime` | `TimeOnly` | End of the window |
| `MaxCapacity` | `int` | Maximum bookings allowed |
| `CurrentBookings` | `int` | Confirmed bookings counter |

Navigation: `GymHouse`.

---

### ClassSchedule

A recurring or one-off instructor-led class at a GymHouse.

| Property | Type | Notes |
|----------|------|-------|
| `GymHouseId` | `Guid` | Tenant scope |
| `TrainerId` | `Guid` | FK → User (Trainer role) |
| `ClassName` | `string` | Display name (e.g., "Morning Yoga") |
| `DayOfWeek` | `DayOfWeek` | 0 = Sunday ... 6 = Saturday |
| `StartTime` | `TimeOnly` | |
| `EndTime` | `TimeOnly` | |
| `MaxCapacity` | `int` | |
| `CurrentEnrollment` | `int` | Confirmed bookings counter |
| `IsRecurring` | `bool` | Repeats weekly if true |

Navigation: `GymHouse`, `Trainer`.

---

### Booking

A member's reservation for either a TimeSlot or a ClassSchedule session.

| Property | Type | Notes |
|----------|------|-------|
| `MemberId` | `Guid` | FK → Member |
| `GymHouseId` | `Guid` | Tenant scope |
| `BookingType` | `BookingType` | TimeSlot / ClassSession |
| `TimeSlotId` | `Guid?` | Set when `BookingType = TimeSlot` |
| `ClassScheduleId` | `Guid?` | Set when `BookingType = ClassSession` |
| `Status` | `BookingStatus` | Confirmed / Cancelled / NoShow / Completed / WaitListed |
| `BookedAt` | `DateTime` | UTC |
| `CheckedInAt` | `DateTime?` | UTC; set on check-in |
| `CheckInSource` | `CheckInSource?` | QRScan / ManualByStaff / SelfKiosk |

Methods: `CheckIn()`, `Cancel()`, `MarkNoShow()`, `Complete()`.

---

### Waitlist

A queue entry created when a booking attempt fails due to capacity. Automatically promoted to a Booking when a cancellation frees a slot.

| Property | Type | Notes |
|----------|------|-------|
| `MemberId` | `Guid` | FK → Member |
| `GymHouseId` | `Guid` | Tenant scope |
| `BookingType` | `BookingType` | |
| `TimeSlotId` | `Guid?` | |
| `ClassScheduleId` | `Guid?` | |
| `Position` | `int` | Queue order (ascending) |
| `AddedAt` | `DateTime` | UTC |
| `PromotedAt` | `DateTime?` | Set when promoted to Booking |

---

### Transaction

An immutable financial record in the append-only ledger. Corrections are made by creating a reversal transaction, never by editing.

| Property | Type | Notes |
|----------|------|-------|
| `GymHouseId` | `Guid` | Tenant scope |
| `TransactionType` | `TransactionType` | MembershipFee / SalaryPayment / Rent / Utilities / Equipment / Wages / Expense / Refund / Other |
| `Direction` | `TransactionDirection` | Credit / Debit |
| `Amount` | `decimal` | |
| `Category` | `TransactionCategory` | Revenue / OperatingExpense / CapitalExpense / Payroll / Refund |
| `Description` | `string` | Free-form notes |
| `TransactionDate` | `DateTime` | UTC |
| `RelatedEntityId` | `Guid?` | Optional FK to a related entity (e.g., SubscriptionId) |
| `ReversesTransactionId` | `Guid?` | Points to the original transaction being reversed |
| `ReversedByTransactionId` | `Guid?` | Points to the reversal transaction |
| `ApprovedById` | `Guid?` | FK → User |
| `PaymentMethod` | `PaymentMethod?` | Cash / BankTransfer / Card / Online |
| `ExternalReference` | `string?` | Gateway reference number |

Static method: `CreateReversal(original, reason)` — creates a counterpart transaction with flipped direction.

---

### Staff

A staff profile linking a User to a GymHouse with employment details.

| Property | Type | Notes |
|----------|------|-------|
| `UserId` | `Guid` | FK → User |
| `GymHouseId` | `Guid` | Tenant scope |
| `StaffType` | `StaffType` | Trainer / SecurityGuard / CleaningStaff / Reception |
| `BaseSalary` | `decimal` | Monthly base salary |
| `PerClassBonus` | `decimal` | Bonus per class taught |
| `HiredAt` | `DateTime` | UTC, defaults to `UtcNow` |

Navigation: `User`, `GymHouse`, `ShiftAssignments[]`.

---

### ShiftAssignment

A scheduled work shift for one Staff member.

| Property | Type | Notes |
|----------|------|-------|
| `StaffId` | `Guid` | FK → Staff |
| `GymHouseId` | `Guid` | Tenant scope |
| `ShiftDate` | `DateOnly` | Calendar date |
| `StartTime` | `TimeOnly` | |
| `EndTime` | `TimeOnly` | |
| `ShiftType` | `ShiftType` | Morning / Afternoon / Evening / Night |
| `Status` | `ShiftStatus` | Scheduled / Completed / Absent |

---

### PayrollPeriod

A payroll cycle for a GymHouse. Contains PayrollEntry records for each staff member.

| Property | Type | Notes |
|----------|------|-------|
| `GymHouseId` | `Guid` | Tenant scope |
| `PeriodStart` | `DateOnly` | |
| `PeriodEnd` | `DateOnly` | |
| `Status` | `PayrollStatus` | Draft / PendingApproval / Approved / Paid |
| `ApprovedById` | `Guid?` | FK → User |
| `ApprovedAt` | `DateTime?` | UTC |

Navigation: `GymHouse`, `Entries[]`.

---

### PayrollEntry

The calculated pay for one Staff member within a PayrollPeriod.

| Property | Type | Notes |
|----------|------|-------|
| `PayrollPeriodId` | `Guid` | FK → PayrollPeriod |
| `StaffId` | `Guid` | FK → Staff |
| `BasePay` | `decimal` | |
| `ClassBonus` | `decimal` | PerClassBonus × ClassesTaught |
| `Deductions` | `decimal` | |
| `NetPay` | `decimal` | BasePay + ClassBonus − Deductions |
| `ClassesTaught` | `int` | Count of sessions delivered this period |

---

### Announcement

A message published to a target audience at a scheduled time.

| Property | Type | Notes |
|----------|------|-------|
| `GymHouseId` | `Guid?` | Null = chain-wide (Owner only) |
| `AuthorId` | `Guid` | FK → User; set from JWT in handler |
| `Title` | `string` | |
| `Content` | `string` | |
| `TargetAudience` | `TargetAudience` | AllMembers / ActiveMembers / Staff / Trainers / Everyone |
| `PublishAt` | `DateTime` | UTC; scheduled publish time |
| `IsPublished` | `bool` | Set by `AnnouncementPublisherJob` |

Method: `Publish()` — sets `IsPublished = true`.

---

### NotificationDelivery

A per-recipient delivery record created when an Announcement is published.

| Property | Type | Notes |
|----------|------|-------|
| `AnnouncementId` | `Guid` | FK → Announcement |
| `RecipientId` | `Guid` | FK → User |
| `GymHouseId` | `Guid` | Tenant scope |
| `Channel` | `NotificationChannel` | InApp / Push / Email |
| `Status` | `DeliveryStatus` | Pending → Sent → Delivered → Read |
| `ReadAt` | `DateTime?` | UTC; set when the recipient marks read |

Method: `MarkRead()` — sets `Status = Read`, `ReadAt = utcNow`.

---

### NotificationPreference

Stores a user's opt-in settings for each notification channel. Created with defaults on first access.

| Property | Type | Notes |
|----------|------|-------|
| `UserId` | `Guid` | FK → User; unique per user |
| `InAppEnabled` | `bool` | Default: true |
| `PushEnabled` | `bool` | Default: true |
| `EmailEnabled` | `bool` | Default: false |

---

### RolePermission

A per-tenant override of the default permission set for a role. Allows Owner to customize what HouseManagers, Trainers, and Staff can do within their gym.

| Property | Type | Notes |
|----------|------|-------|
| `TenantId` | `Guid` | The GymHouseId this applies to |
| `Role` | `Role` | The role being configured |
| `Permissions` | `Permission` | Bitmask of allowed permissions |

Does not inherit `AuditableEntity` (no soft delete, no timestamps). Seeded from `RoleSeedData` on tenant creation.

---

## Business Terms

| Term | Definition |
|------|-----------|
| **Tenant** | A GymHouse. All data queries are scoped to a single tenant via `GymHouseId`. |
| **GymHouse** | One physical gym location. An Owner may have 2–5 GymHouses. |
| **Check-in** | Recording a member's arrival against a confirmed Booking. Sets `CheckedInAt`, `CheckInSource`, and transitions `BookingStatus` to Completed. |
| **Waitlist** | A queue for a full TimeSlot or ClassSchedule. When a confirmed booking is cancelled, the first member in the queue is automatically promoted. |
| **Freeze** | Pausing an Active subscription for a period. Sets `FrozenAt` and `FrozenUntil`; the subscription resumes on `FrozenUntil`. |
| **Soft delete** | Setting `DeletedAt = UtcNow` instead of removing the row. EF Core global query filters exclude soft-deleted rows from all queries. |
| **Permission bitmask** | A `[Flags] long` value where each bit represents one permission. Stored on `User.Permissions` and in `RolePermission.Permissions`. |
| **Chain-wide announcement** | An Announcement with `GymHouseId = null`, visible to all GymHouses owned by the same Owner. Only the Owner role can create these. |
| **Reversal** | A new Transaction that cancels a prior Transaction by creating an entry with the opposite direction (`Credit` ↔ `Debit`) and a `ReversesTransactionId` reference. |
| **PayrollPeriod** | A date range for calculating staff compensation. Moves through Draft → PendingApproval → Approved → Paid. |

---

## Enum Reference

### Role

| Value | Description |
|-------|-------------|
| `Owner` | Gym owner; full access to all GymHouses they own |
| `HouseManager` | Manages day-to-day operations of one GymHouse |
| `Trainer` | Leads classes; limited booking and check-in access |
| `Staff` | Front-desk; handles bookings, check-ins, member lookup |
| `Member` | End user; self-service access to own data only |

---

### Permission (flags, stored as `long`)

| Permission | Bit | Default roles |
|------------|-----|--------------|
| `ViewMembers` | 0 | HouseManager, Trainer, Staff |
| `ManageMembers` | 1 | HouseManager, Staff |
| `ViewSubscriptions` | 2 | HouseManager, Staff |
| `ManageSubscriptions` | 3 | HouseManager |
| `ViewClasses` | 4 | All |
| `ManageClasses` | 5 | HouseManager, Trainer |
| `ViewTrainers` | 6 | HouseManager, Staff |
| `ManageTrainers` | 7 | HouseManager |
| `ViewPayments` | 8 | HouseManager |
| `ProcessPayments` | 9 | HouseManager, Staff |
| `ManageTenant` | 10 | Owner only |
| `ViewReports` | 11 | HouseManager |
| `ManageBookings` | 12 | HouseManager, Trainer, Staff |
| `ViewBookings` | 13 | HouseManager, Trainer, Staff |
| `ManageSchedule` | 14 | HouseManager, Trainer |
| `ViewSchedule` | 15 | All |
| `ManageFinance` | 16 | Owner, HouseManager |
| `ViewFinance` | 17 | HouseManager |
| `ManageStaff` | 18 | HouseManager |
| `ViewStaff` | 19 | HouseManager |
| `ManageAnnouncements` | 20 | HouseManager |
| `ViewAnnouncements` | 21 | All |
| `ApprovePayroll` | 22 | Owner, HouseManager |
| `ManageShifts` | 23 | HouseManager |
| `ViewShifts` | 24 | HouseManager, Staff |
| `ManageWaitlist` | 25 | HouseManager, Staff |
| `ManageRoles` | 26 | Owner only |
| `Admin` | ~0L | Owner (all bits set) |

---

### BookingStatus

| Value | Description |
|-------|-------------|
| `Confirmed` | Booking created and a slot is reserved |
| `WaitListed` | Slot was full; member placed in queue |
| `Cancelled` | Cancelled by member or staff |
| `NoShow` | Member did not appear; marked by staff |
| `Completed` | Member checked in |

---

### BookingType

| Value | Description |
|-------|-------------|
| `TimeSlot` | Drop-in booking for a specific time window |
| `ClassSession` | Booking for an instructor-led class |

---

### CheckInSource

| Value | Description |
|-------|-------------|
| `QRScan` | Member scanned a QR code |
| `ManualByStaff` | Staff manually confirmed check-in |
| `SelfKiosk` | Member checked in via a self-service kiosk |

---

### MembershipStatus / SubscriptionStatus

Both enums share the same values.

| Value | Description |
|-------|-------------|
| `Active` | Currently valid |
| `Frozen` | Temporarily paused |
| `Expired` | End date passed |
| `Cancelled` | Explicitly cancelled |

---

### SubscriptionType

| Value | Description |
|-------|-------------|
| `Monthly` | 1-month access |
| `Quarterly` | 3-month access |
| `Annual` | 12-month access |
| `DayPass` | Single-day access |

---

### TransactionType

`MembershipFee`, `SalaryPayment`, `Rent`, `Utilities`, `Equipment`, `Wages`, `Expense`, `Refund`, `Other`

---

### TransactionCategory

| Value | Description |
|-------|-------------|
| `Revenue` | Incoming money (e.g., MembershipFee) |
| `OperatingExpense` | Day-to-day expenses (Rent, Utilities) |
| `CapitalExpense` | Asset purchases (Equipment) |
| `Payroll` | Staff wages and salaries |
| `Refund` | Money returned to a member |

---

### TransactionDirection

| Value | Description |
|-------|-------------|
| `Credit` | Money received |
| `Debit` | Money paid out |

---

### PaymentMethod

`Cash`, `BankTransfer`, `Card`, `Online`

---

### StaffType

`Trainer`, `SecurityGuard`, `CleaningStaff`, `Reception`

---

### ShiftType / ShiftStatus

| ShiftType | ShiftStatus |
|-----------|-------------|
| `Morning` | `Scheduled` |
| `Afternoon` | `Completed` |
| `Evening` | `Absent` |
| `Night` | |

---

### PayrollStatus

| Value | Description |
|-------|-------------|
| `Draft` | Being assembled |
| `PendingApproval` | Submitted for approval |
| `Approved` | Approved, ready to pay |
| `Paid` | Payment disbursed |

---

### TargetAudience

| Value | Description |
|-------|-------------|
| `AllMembers` | All members regardless of subscription status |
| `ActiveMembers` | Members with an active subscription |
| `Staff` | All staff users |
| `Trainers` | Users with Trainer role |
| `Everyone` | All users in the tenant |

---

### NotificationChannel

`InApp`, `Push`, `Email`

---

### DeliveryStatus

| Value | Description |
|-------|-------------|
| `Pending` | Delivery queued |
| `Sent` | Dispatched to channel |
| `Delivered` | Confirmed delivery (Push/Email) |
| `Read` | Member marked as read |
| `Failed` | Delivery failed |

---

### DayOfWeekFlag

`[Flags]` bitmask for selecting multiple days (Monday through Sunday). Used for recurring schedule configuration.
