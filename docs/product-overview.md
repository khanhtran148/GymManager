---
title: Product Overview
type: product-overview
updated: 2026-03-19
---

# Product Overview

## Vision

GymManager gives independent gym owners a single platform to run all aspects of their business — members, bookings, classes, staff, payroll, and communications — without stitching together separate tools.

The platform targets gym owners managing 2–5 physical locations who need consistent operations across all sites from one account.

---

## Target Users

| User | Primary Goal |
|------|-------------|
| Gym Owner | Oversee all locations, manage staff roles, view financial reports |
| House Manager | Operate a single GymHouse — members, schedules, bookings |
| Trainer | View assigned class schedules and check in members |
| Staff | Handle front-desk tasks — check-ins, bookings, member lookup |
| Member | Book time slots or classes, view their subscription status |

---

## Multi-Tenant Model

One owner account contains one or more `GymHouse` records. Each GymHouse is a physical location with independent members, staff, schedules, and bookings.

```
Owner (User)
 └── GymHouse "Downtown"
 │    ├── Members + Subscriptions
 │    ├── TimeSlots + Bookings
 │    ├── ClassSchedules + Bookings
 │    ├── Staff + Shifts
 │    └── Transactions
 └── GymHouse "North Branch"
      └── (separate data, same database)
```

Data isolation is enforced at the EF Core query filter level via `GymHouseId`. Cross-tenant access requires an explicit `IPermissionChecker` call.

---

## Core Features

### Members and Subscriptions

- Register members with auto-generated member codes (`{PREFIX}-{SEQUENCE:D5}`)
- Subscription types: Monthly, Quarterly, Annual, DayPass
- Subscription lifecycle: create, renew, freeze (with resume date), cancel
- Membership statuses: Active, Frozen, Expired, Cancelled

### Bookings and Classes

- Two booking types: drop-in **TimeSlot** and **ClassSession**
- Real-time capacity tracking with pessimistic locking to prevent overbooking
- Automatic waitlist promotion when a confirmed booking is cancelled
- Check-in via QR scan, manual staff entry, or self-service kiosk
- No-show recording

### Staff and Payroll

- Staff roles: Trainer, SecurityGuard, CleaningStaff, Reception
- Shift assignment with date, time, and shift type (Morning / Afternoon / Evening / Night)
- Payroll periods with draft → PendingApproval → Approved → Paid workflow
- PayrollEntry per staff member: base pay, class bonus, deductions, net pay

### Finance

- Append-only Transaction ledger (no edits, only reversals)
- Transaction categories: Revenue, OperatingExpense, CapitalExpense, Payroll, Refund
- Payment methods: Cash, BankTransfer, Card, Online
- P&L reports via the `/reports` endpoint

### Communications

- Announcements with scheduled publish time and target audience filter (AllMembers, ActiveMembers, Staff, Trainers, Everyone)
- Chain-wide announcements (no GymHouseId) are restricted to Owner role
- Real-time delivery via SignalR to web clients
- Push notification delivery via FCM (stub — credentials not yet provisioned)
- Per-user notification channel preferences (InApp, Push, Email)
- Notification inbox with mark-read support

### RBAC

- 27 permission flags stored as a `long` bitmask on each user
- Per-tenant `RolePermission` table lets owners customize which permissions each role holds
- Default permissions seeded per role on tenant creation
- Owner can reset to defaults, change individual users' roles, or update a role's permission set

---

## User Roles

| Role | Default Access |
|------|---------------|
| Owner | `Permission.Admin` (~0L) — all permissions |
| HouseManager | Full operational access within one GymHouse |
| Trainer | View schedules, manage bookings, check in members |
| Staff | Manage bookings and check-ins, view members |
| Member | View own bookings and subscription |

Role permissions are tenant-configurable. See [`docs/domain-glossary.md`](domain-glossary.md) for the full permission list.

---

## Key Business Rules

- A member cannot hold two active subscriptions at the same GymHouse simultaneously.
- A booking that is already cancelled cannot be cancelled again.
- Only `Active` subscriptions can be frozen.
- Capacity checks use `SELECT FOR UPDATE` to prevent race conditions.
- All deletes are soft deletes — `deleted_at` is set, no rows are removed.
- Announcement publishing is asynchronous: the `AnnouncementPublisherJob` runs every 30 seconds and promotes scheduled announcements past their `publishAt` time.
- Financial transactions are immutable after creation; corrections require a reversal transaction.

---

## Phase Status

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 — Foundation | Auth, GymHouse, Member, Subscription, Permissions | Complete |
| Phase 2 — Booking | TimeSlot, ClassSchedule, Booking, Waitlist, Check-In | Complete |
| Phase 3 — Finance | Transaction, P&L reports | Complete |
| Phase 4 — Staff/HR | Staff, ShiftAssignment, PayrollPeriod, PayrollEntry | Complete |
| Phase 5 — Communications | Announcements, SignalR, FCM push, RBAC | Complete |
| Phase 6 — Hardening | PostgreSQL RLS, load testing, offline mobile | Pending |
