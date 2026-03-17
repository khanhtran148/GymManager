# API Contract — GymManager Phase 1 Foundation
**Version:** 1.0.0
**Date:** 2026-03-17 12:00
**Base URL:** `/api/v1`
**Auth:** Bearer JWT (access token, 15 min TTL). Refresh token in body.

---

## Shared Types

### AuthResponse
```json
{
  "userId": "uuid",
  "accessToken": "string",
  "refreshToken": "string",
  "expiresAt": "ISO8601 UTC"
}
```

### ProblemDetails (RFC 7807 — all errors)
```json
{
  "status": 400,
  "detail": "string",
  "instance": "/api/v1/..."
}
```

### PagedList<T>
```json
{
  "items": [],
  "totalCount": 0,
  "page": 1,
  "pageSize": 20
}
```

### GymHouseDto
```json
{
  "id": "uuid",
  "name": "string",
  "address": "string",
  "phone": "string|null",
  "operatingHours": "string|null",
  "hourlyCapacity": 0,
  "ownerId": "uuid",
  "createdAt": "ISO8601 UTC"
}
```

### MemberDto
```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "userId": "uuid",
  "memberCode": "string",
  "fullName": "string",
  "email": "string",
  "phone": "string|null",
  "status": "Active|Frozen|Expired|Cancelled",
  "joinedAt": "ISO8601 UTC"
}
```

### SubscriptionDto
```json
{
  "id": "uuid",
  "memberId": "uuid",
  "gymHouseId": "uuid",
  "type": "Monthly|Quarterly|Annual|DayPass",
  "status": "Active|Frozen|Expired|Cancelled",
  "price": 0.00,
  "startDate": "ISO8601 UTC",
  "endDate": "ISO8601 UTC",
  "frozenAt": "ISO8601 UTC|null",
  "frozenUntil": "ISO8601 UTC|null",
  "createdAt": "ISO8601 UTC"
}
```

---

## Auth Endpoints

### POST /api/v1/auth/register
**Rate limit:** Auth (10/min)
**Auth:** None

**Request:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)",
  "fullName": "string (required)",
  "phone": "string|null"
}
```

**Response 200:** `AuthResponse`

**Errors:**
- 400: Validation failure (invalid email, short password)
- 409: Email already registered

---

### POST /api/v1/auth/login
**Rate limit:** Auth (10/min)
**Auth:** None

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:** `AuthResponse`

**Errors:**
- 400: Validation failure
- 401: Invalid credentials

---

### POST /api/v1/auth/refresh
**Rate limit:** Auth (10/min)
**Auth:** None

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response 200:** `AuthResponse`

**Errors:**
- 401: Invalid or expired refresh token

---

## GymHouses Endpoints

### GET /api/v1/gymhouses
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewMembers

**Response 200:** `List<GymHouseDto>` (owner's houses)

---

### GET /api/v1/gymhouses/{id}
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewMembers

**Response 200:** `GymHouseDto`

**Errors:**
- 403: Forbidden
- 404: Not found

---

### POST /api/v1/gymhouses
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageTenant

**Request:**
```json
{
  "name": "string (required)",
  "address": "string (required)",
  "phone": "string|null",
  "operatingHours": "string|null",
  "hourlyCapacity": 0
}
```

**Response 201:** `GymHouseDto` with Location header

**Errors:**
- 400: Validation failure
- 403: Forbidden

---

### PUT /api/v1/gymhouses/{id}
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageTenant

**Request:**
```json
{
  "name": "string",
  "address": "string",
  "phone": "string|null",
  "operatingHours": "string|null",
  "hourlyCapacity": 0
}
```

**Response 200:** `GymHouseDto`

**Errors:**
- 403: Forbidden
- 404: Not found

---

### DELETE /api/v1/gymhouses/{id}
**Rate limit:** Strict
**Auth:** Bearer, Permission: ManageTenant

**Response 204:** No content

**Errors:**
- 403: Forbidden
- 404: Not found

---

## Members Endpoints

### GET /api/v1/gymhouses/{gymHouseId}/members
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewMembers

**Query params:** `page=1&pageSize=20&search=string`

**Response 200:** `PagedList<MemberDto>`

---

### GET /api/v1/gymhouses/{gymHouseId}/members/{id}
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewMembers

**Response 200:** `MemberDto`

**Errors:**
- 403: Forbidden
- 404: Not found

---

### POST /api/v1/gymhouses/{gymHouseId}/members
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageMembers

**Request:**
```json
{
  "email": "string (required)",
  "fullName": "string (required)",
  "phone": "string|null"
}
```

**Response 201:** `MemberDto` with Location header

**Errors:**
- 400: Validation failure
- 403: Forbidden
- 409: Member already exists in this gym house

---

### PUT /api/v1/gymhouses/{gymHouseId}/members/{id}
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageMembers

**Request:**
```json
{
  "fullName": "string",
  "phone": "string|null"
}
```

**Response 200:** `MemberDto`

**Errors:**
- 403: Forbidden
- 404: Not found

---

## Subscriptions Endpoints

### GET /api/v1/gymhouses/{gymHouseId}/members/{memberId}/subscriptions
**Rate limit:** Default
**Auth:** Bearer, Permission: ViewSubscriptions

**Response 200:** `List<SubscriptionDto>`

---

### POST /api/v1/gymhouses/{gymHouseId}/members/{memberId}/subscriptions
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageSubscriptions

**Request:**
```json
{
  "type": "Monthly|Quarterly|Annual|DayPass",
  "price": 0.00,
  "startDate": "ISO8601",
  "endDate": "ISO8601"
}
```

**Response 201:** `SubscriptionDto` with Location header

**Errors:**
- 400: Validation failure
- 403: Forbidden
- 404: Member not found
- 409: Member already has an active subscription

---

### POST /api/v1/subscriptions/{id}/renew
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageSubscriptions

**Request:**
```json
{
  "startDate": "ISO8601",
  "endDate": "ISO8601",
  "price": 0.00
}
```

**Response 200:** `SubscriptionDto`

**Errors:**
- 403: Forbidden
- 404: Not found

---

### POST /api/v1/subscriptions/{id}/freeze
**Rate limit:** Default
**Auth:** Bearer, Permission: ManageSubscriptions

**Request:**
```json
{
  "frozenUntil": "ISO8601"
}
```

**Response 200:** `SubscriptionDto`

**Errors:**
- 400: Not freezable (already frozen/cancelled/expired)
- 403: Forbidden
- 404: Not found

---

### POST /api/v1/subscriptions/{id}/cancel
**Rate limit:** Strict
**Auth:** Bearer, Permission: ManageSubscriptions

**Response 200:** `SubscriptionDto`

**Errors:**
- 400: Already cancelled
- 403: Forbidden
- 404: Not found

---

## Pending / TBD

- Trainer endpoints (Phase 2+)
- Class / booking endpoints (Phase 2)
- Payment endpoints (Phase 3)
- Staff / HR endpoints (Phase 4)
