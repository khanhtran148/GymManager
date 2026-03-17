# API Contract — Phase 6: Hardening
**Version:** 6.0.0
**Date:** 2026-03-17
**Base URL:** `/api/v1`
**Auth:** Bearer JWT (all endpoints require Authorization header unless noted)

---

## New Endpoints

### POST /api/v1/payments/process
Process a payment via the payment gateway stub and record the resulting transaction.

**Auth:** Required — `ProcessPayments` permission

**Request Body:**
```json
{
  "gymHouseId": "uuid",
  "amount": 150.00,
  "currency": "VND",
  "description": "Monthly membership fee",
  "transactionType": "MembershipFee",
  "direction": "Credit",
  "category": "Revenue",
  "transactionDate": "2026-03-17T10:00:00Z",
  "relatedEntityId": "uuid | null",
  "approvedById": "uuid | null",
  "paymentMethod": "Card | Cash | BankTransfer | Online | null"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "transactionType": "MembershipFee",
  "direction": "Credit",
  "amount": 150.00,
  "category": "Revenue",
  "description": "Monthly membership fee",
  "transactionDate": "2026-03-17T10:00:00Z",
  "relatedEntityId": null,
  "reversesTransactionId": null,
  "reversedByTransactionId": null,
  "approvedById": null,
  "paymentMethod": "Card",
  "externalReference": "STUB-abc123def456...",
  "createdAt": "2026-03-17T10:00:00Z"
}
```

**Error Responses:**
- `400` — Validation failure (amount <= 0, empty description, missing gymHouseId)
- `403` — Missing `ProcessPayments` permission
- `422` — Payment gateway returned failure (externalReference not set)

---

## Infrastructure Changes (Non-HTTP)

### RLS Migration
A raw SQL migration enables Row-Level Security on 13 tenant-scoped tables and installs `tenant_isolation` policies keyed on `current_setting('app.current_tenant_id')::uuid`.

Tables covered:
- members, subscriptions, time_slots, class_schedules, bookings, waitlists
- transactions, staff, shift_assignments, payroll_periods, payroll_entries
- announcements, notification_deliveries

### TenantConnectionInterceptor
On each database connection open, the interceptor runs:
```sql
SET app.current_tenant_id = '<tenantId>';
```
If `ICurrentUser` is unavailable or not authenticated (e.g., during migrations or background jobs), the interceptor is a no-op.

---

## Shared Types

### PaymentChargeResult
```csharp
sealed record PaymentChargeResult(string ExternalReference, string Status)
```

### PaymentRefundResult
```csharp
sealed record PaymentRefundResult(string ExternalReference, string Status)
```

---

## Performance Indexes (new — SQL migration)
- `ix_bookings_gym_house_id_time_slot_id_status` — `bookings(gym_house_id, time_slot_id, status)`
- `ix_transactions_gym_house_id_transaction_date_covering` — `transactions(gym_house_id, transaction_date) INCLUDE (direction, category, amount)`
- `ix_members_gym_house_id_status` — `members(gym_house_id, status)`
- `ix_shift_assignments_staff_id_shift_date` (already exists — skip)
- `ix_notification_deliveries_recipient_id_status` (already exists as `recipient_id, status` — skip)

---

## TBD / Pending
- Stripe/PayOS real gateway: future phase, swap `StubPaymentGatewayService`
- RLS bypass token for background jobs: Quartz.NET scheduled jobs need a superuser connection or explicit `SET SESSION AUTHORIZATION` pattern
