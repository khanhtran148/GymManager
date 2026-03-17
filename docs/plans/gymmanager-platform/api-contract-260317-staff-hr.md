# API Contract — GymManager Phase 4: Staff/HR
**Version:** 1.0.0
**Date:** 2026-03-17
**Base URL:** `/api/v1`
**Auth:** Bearer JWT

---

## New Types

### StaffType
`Trainer | SecurityGuard | CleaningStaff | Reception`

### ShiftType
`Morning | Afternoon | Evening | Night`

### ShiftStatus
`Scheduled | Completed | Absent`

### PayrollStatus
`Draft | PendingApproval | Approved | Paid`

### StaffDto
```json
{
  "id": "uuid",
  "userId": "uuid",
  "gymHouseId": "uuid",
  "staffType": "StaffType",
  "baseSalary": 0.00,
  "perClassBonus": 0.00,
  "hiredAt": "ISO8601 UTC",
  "userName": "string",
  "userEmail": "string",
  "createdAt": "ISO8601 UTC"
}
```

### ShiftAssignmentDto
```json
{
  "id": "uuid",
  "staffId": "uuid",
  "gymHouseId": "uuid",
  "staffName": "string",
  "shiftDate": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "shiftType": "ShiftType",
  "status": "ShiftStatus",
  "createdAt": "ISO8601 UTC"
}
```

### PayrollPeriodDto
```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "status": "PayrollStatus",
  "approvedById": "uuid|null",
  "approvedAt": "ISO8601 UTC|null",
  "totalNetPay": 0.00,
  "entryCount": 0,
  "createdAt": "ISO8601 UTC"
}
```

### PayrollEntryDto
```json
{
  "id": "uuid",
  "payrollPeriodId": "uuid",
  "staffId": "uuid",
  "staffName": "string",
  "staffType": "StaffType",
  "basePay": 0.00,
  "classBonus": 0.00,
  "deductions": 0.00,
  "netPay": 0.00,
  "classesTaught": 0
}
```

### PayrollPeriodDetailDto
```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "status": "PayrollStatus",
  "approvedById": "uuid|null",
  "approvedAt": "ISO8601 UTC|null",
  "entries": "PayrollEntryDto[]",
  "totalNetPay": 0.00,
  "createdAt": "ISO8601 UTC"
}
```

---

## Staff Endpoints

### POST /api/v1/staff
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageStaff

**Request:**
```json
{
  "userId": "uuid (required)",
  "gymHouseId": "uuid (required)",
  "staffType": "StaffType (required)",
  "baseSalary": 0.00,
  "perClassBonus": 0.00
}
```

**Response 201:** `StaffDto`

**Errors:**
- 400: Validation failure
- 403: Forbidden
- 409: Staff already exists for this user at this gym house

---

### GET /api/v1/staff
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewStaff

**Query params:** `gymHouseId=uuid&page=1&pageSize=20&staffType=StaffType?`

**Response 200:** `PagedList<StaffDto>`

---

### GET /api/v1/staff/{id}
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewStaff

**Response 200:** `StaffDto`

**Errors:**
- 403: Forbidden
- 404: Not found

---

### PUT /api/v1/staff/{id}
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageStaff

**Request:**
```json
{
  "staffType": "StaffType",
  "baseSalary": 0.00,
  "perClassBonus": 0.00
}
```

**Response 200:** `StaffDto`

**Errors:**
- 400: Validation failure
- 403: Forbidden
- 404: Not found

---

## Shift Assignment Endpoints

### POST /api/v1/shift-assignments
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageShifts

**Request:**
```json
{
  "staffId": "uuid (required)",
  "gymHouseId": "uuid (required)",
  "shiftDate": "YYYY-MM-DD (required)",
  "startTime": "HH:mm (required)",
  "endTime": "HH:mm (required)",
  "shiftType": "ShiftType (required)"
}
```

**Response 201:** `ShiftAssignmentDto`

**Errors:**
- 400: Validation failure
- 403: Forbidden

---

### GET /api/v1/shift-assignments
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewShifts

**Query params:** `gymHouseId=uuid&from=YYYY-MM-DD&to=YYYY-MM-DD&staffId=uuid?`

**Response 200:** `List<ShiftAssignmentDto>`

---

### PUT /api/v1/shift-assignments/{id}
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageShifts

**Request:**
```json
{
  "shiftDate": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "shiftType": "ShiftType",
  "status": "ShiftStatus"
}
```

**Response 200:** `ShiftAssignmentDto`

**Errors:**
- 400: Validation failure
- 403: Forbidden
- 404: Not found

---

## Payroll Endpoints

### POST /api/v1/payroll-periods
**Rate limit:** Default
**Auth:** Bearer, Permission: ApprovePayroll

**Request:**
```json
{
  "gymHouseId": "uuid (required)",
  "periodStart": "YYYY-MM-DD (required)",
  "periodEnd": "YYYY-MM-DD (required)"
}
```

**Response 201:** `PayrollPeriodDetailDto`

**Errors:**
- 400: Validation failure
- 403: Forbidden
- 409: Overlapping payroll period exists

---

### GET /api/v1/payroll-periods
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewStaff

**Query params:** `gymHouseId=uuid&page=1&pageSize=20`

**Response 200:** `PagedList<PayrollPeriodDto>`

---

### GET /api/v1/payroll-periods/{id}
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewStaff

**Response 200:** `PayrollPeriodDetailDto`

**Errors:**
- 403: Forbidden
- 404: Not found

---

### PATCH /api/v1/payroll-periods/{id}/approve
**Rate limit:** Strict
**Auth:** Bearer, Permission: ApprovePayroll

**Response 200:** `PayrollPeriodDetailDto`

**Errors:**
- 400: Payroll not in PendingApproval status
- 403: Forbidden
- 404: Not found
- 409: Already approved

---

## Domain Events

### PayrollApprovedEvent
Published when payroll is approved. Consumed by `PayrollApprovedConsumer` to create SalaryPayment transactions.
```json
{
  "payrollPeriodId": "uuid",
  "gymHouseId": "uuid"
}
```

### StaffCreatedEvent
Published when new staff is created.
```json
{
  "staffId": "uuid",
  "userId": "uuid",
  "gymHouseId": "uuid"
}
```
