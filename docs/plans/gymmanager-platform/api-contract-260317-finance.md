# API Contract — GymManager Phase 3 Finance
**Version:** 1.1.0
**Date:** 2026-03-17
**Base URL:** `/api/v1`
**Auth:** Bearer JWT (access token, 15 min TTL).

---

## Shared Types

### TransactionDto
```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "transactionType": "MembershipFee|SalaryPayment|Rent|Utilities|Equipment|Wages|Expense|Refund|Other",
  "direction": "Credit|Debit",
  "amount": 0.00,
  "category": "Revenue|OperatingExpense|CapitalExpense|Payroll|Refund",
  "description": "string",
  "transactionDate": "ISO8601 UTC",
  "relatedEntityId": "uuid|null",
  "reversesTransactionId": "uuid|null",
  "reversedByTransactionId": "uuid|null",
  "approvedById": "uuid|null",
  "paymentMethod": "Cash|BankTransfer|Card|Online|null",
  "externalReference": "string|null",
  "createdAt": "ISO8601 UTC"
}
```

### PnLReportDto
```json
{
  "gymHouseId": "uuid|null",
  "from": "ISO8601 UTC",
  "to": "ISO8601 UTC",
  "incomeLines": [
    { "category": "Revenue|...", "totalAmount": 0.00 }
  ],
  "expenseLines": [
    { "category": "OperatingExpense|...", "totalAmount": 0.00 }
  ],
  "totalIncome": 0.00,
  "totalExpense": 0.00,
  "netProfit": 0.00
}
```

### RevenueMetricsDto
```json
{
  "gymHouseId": "uuid",
  "from": "ISO8601 UTC",
  "to": "ISO8601 UTC",
  "mrr": 0.00,
  "churnRate": 0.00,
  "avgRevenuePerMember": 0.00,
  "totalRevenue": 0.00,
  "activeMembers": 0,
  "cancelledSubscriptions": 0
}
```

---

## Transactions Endpoints

### POST /api/v1/gymhouses/{gymHouseId}/transactions
**Rate limit:** Default (100/min)
**Auth:** Bearer, Permission: ManageFinance

**Request:**
```json
{
  "transactionType": "MembershipFee|SalaryPayment|Rent|Utilities|Equipment|Wages|Expense|Refund|Other",
  "direction": "Credit|Debit",
  "amount": 0.00,
  "category": "Revenue|OperatingExpense|CapitalExpense|Payroll|Refund",
  "description": "string (required)",
  "transactionDate": "ISO8601 UTC (required)",
  "relatedEntityId": "uuid|null",
  "approvedById": "uuid|null",
  "paymentMethod": "Cash|BankTransfer|Card|Online|null",
  "externalReference": "string|null"
}
```

**Response 201:** `TransactionDto` with Location header

**Errors:**
- 400: Validation failure (amount <= 0, missing description/date)
- 403: Access denied (missing ManageFinance)

---

### GET /api/v1/gymhouses/{gymHouseId}/transactions
**Rate limit:** Default (100/min)
**Auth:** Bearer, Permission: ViewFinance

**Query params:** `page=1&pageSize=20&type=MembershipFee&direction=Credit&from=ISO8601&to=ISO8601`

**Response 200:** `PagedList<TransactionDto>`

**Errors:**
- 403: Access denied

---

### POST /api/v1/gymhouses/{gymHouseId}/transactions/{id}/reverse
**Rate limit:** Strict (5/min)
**Auth:** Bearer, Permission: ManageFinance

**Request:**
```json
{
  "reason": "string (required)"
}
```

**Response 201:** `TransactionDto` (the new reversing transaction)

**Errors:**
- 400: Validation failure (empty reason)
- 403: Access denied
- 404: Transaction not found
- 409: Transaction already reversed

---

## Reports Endpoints

### GET /api/v1/gymhouses/{gymHouseId}/reports/pnl
**Rate limit:** Default (100/min)
**Auth:** Bearer, Permission: ViewReports

**Query params:** `from=ISO8601&to=ISO8601`

**Response 200:** `PnLReportDto`

**Errors:**
- 400: Missing or invalid date range
- 403: Access denied

---

### GET /api/v1/gymhouses/{gymHouseId}/reports/revenue-metrics
**Rate limit:** Default (100/min)
**Auth:** Bearer, Permission: ViewReports

**Query params:** `from=ISO8601&to=ISO8601`

**Response 200:** `RevenueMetricsDto`

**Errors:**
- 400: Missing or invalid date range
- 403: Access denied

---

## Breaking Changes from Phase 1/2

None. All new endpoints added under existing gym house routing pattern.

## Pending / TBD

- Payment gateway integration (ExternalReference field reserved)
- Aggregated P&L across all houses (future multi-house report)
