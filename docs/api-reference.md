---
type: api-reference
updated: 2026-03-17
version: v1
phases-covered: Phase 1 (Foundation), Phase 2 (Booking)
---

# API Reference

## Common Patterns

### Base URL

```
/api/v1/
```

API version can be supplied via URL segment (default) or `x-api-version` header.

### Authentication

All endpoints except `/auth/*` require a Bearer token.

```
Authorization: Bearer <access_token>
```

Access tokens expire in 15 minutes. Use `/auth/refresh` to obtain a new pair.

### Error Format

All errors use [RFC 7807 ProblemDetails](https://www.rfc-editor.org/rfc/rfc7807):

```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "Member with id 'abc-123' was not found.",
  "instance": "/api/v1/gymhouses/xyz/members/abc-123"
}
```

Validation errors (422) include an `errors` extension:

```json
{
  "status": 422,
  "title": "Validation failed",
  "detail": "Name is required; Email is invalid",
  "instance": "/api/v1/gymhouses/xyz/members",
  "errors": {
    "Name": ["Name is required."],
    "Email": ["Email must be a valid email address."]
  }
}
```

### Pagination

List endpoints that accept `page` and `pageSize` return:

```json
{
  "items": [...],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20
}
```

Default: `page=1`, `pageSize=20`.

### Rate Limiting

| Policy | Limit | Applies to |
|---|---|---|
| `default` | 100 req/min | Most endpoints |
| `auth` | 10 req/min | `/auth/*` |
| `strict` | 5 req/min | DELETE gym house, cancel subscription |

Exceeded limits return `429 Too Many Requests`.

### Date and ID Formats

- Dates: ISO 8601 UTC (`2026-03-17T10:30:00Z`)
- IDs: UUID v4 (`550e8400-e29b-41d4-a716-446655440000`)

---

## Auth

**Rate limit:** `auth` (10/min). No `Authorization` header required.

### POST /auth/register

Register a new user account.

**Request body:**

```json
{
  "email": "owner@gymco.com",
  "password": "SecurePass@123",
  "fullName": "Jane Smith",
  "phone": "+84901234567",
  "role": "Owner"
}
```

**Responses:**

| Status | Description |
|---|---|
| 200 | Success — returns `AuthResponse` |
| 400 | Validation error |
| 409 | Email already registered |

**AuthResponse:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "opaque-token",
  "expiresIn": 900
}
```

---

### POST /auth/login

Authenticate and receive tokens.

**Request body:**

```json
{
  "email": "owner@gymco.com",
  "password": "SecurePass@123"
}
```

**Responses:**

| Status | Description |
|---|---|
| 200 | Success — returns `AuthResponse` |
| 400 | Validation error |
| 401 | Invalid credentials |

---

### POST /auth/refresh

Exchange a refresh token for a new token pair.

**Request body:**

```json
{
  "refreshToken": "opaque-token"
}
```

**Responses:**

| Status | Description |
|---|---|
| 200 | Success — returns `AuthResponse` |
| 401 | Refresh token invalid or expired |

---

## Gym Houses

**Rate limit:** `default`. **Auth:** required.

### GET /api/v1/gymhouses

List all gym houses accessible to the current user.

**Responses:**

| Status | Description |
|---|---|
| 200 | `GymHouseDto[]` |
| 403 | Forbidden |

**GymHouseDto:**

```json
{
  "id": "uuid",
  "name": "Downtown Gym",
  "address": "123 Main St",
  "phone": "+84901234567",
  "operatingHours": "06:00-22:00",
  "hourlyCapacity": 30,
  "ownerId": "uuid"
}
```

---

### GET /api/v1/gymhouses/{id}

**Path params:** `id` — UUID

**Responses:** 200 `GymHouseDto`, 403, 404

---

### POST /api/v1/gymhouses

Create a new gym house.

**Request body:**

```json
{
  "name": "Downtown Gym",
  "address": "123 Main St",
  "phone": "+84901234567",
  "operatingHours": "06:00-22:00",
  "hourlyCapacity": 30
}
```

**Responses:** 201 `GymHouseDto`, 400, 403

---

### PUT /api/v1/gymhouses/{id}

Update gym house details.

**Request body:** Same shape as POST, all fields required.

**Responses:** 200 `GymHouseDto`, 400, 403, 404

---

### DELETE /api/v1/gymhouses/{id}

**Rate limit:** `strict` (5/min). Soft-deletes the gym house.

**Responses:** 204, 403, 404

---

## Members

**Route prefix:** `/api/v1/gymhouses/{gymHouseId}/members`
**Rate limit:** `default`. **Auth:** required.

### GET /members

List members. Paginated and searchable.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `pageSize` | int | 20 | Items per page |
| `search` | string | — | Filter by name or email |

**Responses:** 200 `PagedList<MemberDto>`, 403

**MemberDto:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "gymHouseId": "uuid",
  "memberCode": "DWN-00001",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+84901234567",
  "status": "Active",
  "joinedAt": "2026-03-01T08:00:00Z"
}
```

`status`: `Active` | `Frozen` | `Expired` | `Cancelled`

---

### GET /members/{id}

**Responses:** 200 `MemberDto`, 403, 404

---

### POST /members

Create a new member. Creates a linked `User` account if one does not exist for the email.

**Request body:**

```json
{
  "email": "john@example.com",
  "fullName": "John Doe",
  "phone": "+84901234567"
}
```

**Responses:** 201 `MemberDto`, 400, 403, 409 (email already member of this gym)

---

### PUT /members/{id}

Update member contact details.

**Request body:**

```json
{
  "fullName": "John Doe",
  "phone": "+84901234568"
}
```

**Responses:** 200 `MemberDto`, 400, 403, 404

---

### GET /members/{memberId}/subscriptions

List all subscriptions for a member.

**Responses:** 200 `SubscriptionDto[]`, 403

**SubscriptionDto:**

```json
{
  "id": "uuid",
  "memberId": "uuid",
  "gymHouseId": "uuid",
  "type": "Monthly",
  "status": "Active",
  "price": 500000.00,
  "startDate": "2026-03-01T00:00:00Z",
  "endDate": "2026-04-01T00:00:00Z",
  "frozenAt": null,
  "frozenUntil": null
}
```

`type`: `Monthly` | `Quarterly` | `Annual` | `DayPass`
`status`: `Active` | `Frozen` | `Expired` | `Cancelled`

---

### POST /members/{memberId}/subscriptions

Create a subscription for a member.

**Request body:**

```json
{
  "type": "Monthly",
  "price": 500000.00,
  "startDate": "2026-03-01T00:00:00Z",
  "endDate": "2026-04-01T00:00:00Z"
}
```

**Responses:** 201 `SubscriptionDto`, 400, 403, 404, 409 (active subscription exists)

---

## Subscriptions

**Route prefix:** `/api/v1/subscriptions`
**Rate limit:** `default` (cancel uses `strict`). **Auth:** required.

### POST /subscriptions/{id}/renew

Renew a subscription (reactivates if expired, sets new dates).

**Request body:**

```json
{
  "gymHouseId": "uuid",
  "startDate": "2026-04-01T00:00:00Z",
  "endDate": "2026-05-01T00:00:00Z",
  "price": 500000.00
}
```

**Responses:** 200 `SubscriptionDto`, 400, 403, 404

---

### POST /subscriptions/{id}/freeze

Freeze a subscription. Only `Active` subscriptions can be frozen.

**Request body:**

```json
{
  "gymHouseId": "uuid",
  "frozenUntil": "2026-04-15T00:00:00Z"
}
```

**Responses:** 200 `SubscriptionDto`, 400, 403, 404

---

### POST /subscriptions/{id}/cancel

**Rate limit:** `strict` (5/min).

**Request body:**

```json
{
  "gymHouseId": "uuid"
}
```

**Responses:** 200 `SubscriptionDto`, 400, 403, 404

---

## Bookings

**Route prefix:** `/api/v1/gymhouses/{gymHouseId}/bookings`
**Rate limit:** `default`. **Auth:** required.

### GET /bookings

List bookings. Paginated, filterable by date range.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | |
| `pageSize` | int | 20 | |
| `from` | DateTime | — | ISO 8601 UTC |
| `to` | DateTime | — | ISO 8601 UTC |

**Responses:** 200 `PagedList<BookingDto>`, 403

**BookingDto:**

```json
{
  "id": "uuid",
  "memberId": "uuid",
  "gymHouseId": "uuid",
  "bookingType": "TimeSlot",
  "timeSlotId": "uuid",
  "classScheduleId": null,
  "status": "Confirmed",
  "bookedAt": "2026-03-17T09:00:00Z",
  "checkedInAt": null,
  "checkInSource": null
}
```

`bookingType`: `TimeSlot` | `ClassSession`
`status`: `Confirmed` | `Cancelled` | `NoShow` | `Completed` | `WaitListed`
`checkInSource`: `QRScan` | `ManualByStaff` | `SelfKiosk` | `null`

---

### GET /bookings/{id}

**Responses:** 200 `BookingDto`, 403, 404

---

### POST /bookings

Create a booking. If the slot is full, places the member on the waitlist (`status: WaitListed`).

**Request body:**

```json
{
  "memberId": "uuid",
  "type": "TimeSlot",
  "timeSlotId": "uuid",
  "classScheduleId": null
}
```

Provide `timeSlotId` when `type = "TimeSlot"`. Provide `classScheduleId` when `type = "ClassSession"`.

**Responses:** 201 `BookingDto`, 400, 403, 404

---

### DELETE /bookings/{id}

Cancel a booking. Triggers waitlist promotion if a next-in-line member exists.

**Responses:** 204, 400 (already cancelled), 403, 404

---

### PATCH /bookings/{id}/check-in

Check in a member for a confirmed booking.

**Request body:**

```json
{
  "source": "QRScan"
}
```

`source`: `QRScan` | `ManualByStaff` | `SelfKiosk`

**Responses:** 200 `BookingDto`, 400 (not confirmed), 403, 404

---

### PATCH /bookings/{id}/no-show

Mark a confirmed booking as no-show.

**Responses:** 204, 400 (not confirmed), 403, 404

---

## Time Slots

**Route prefix:** `/api/v1/gymhouses/{gymHouseId}/time-slots`
**Rate limit:** `default`. **Auth:** required.

### GET /time-slots

List time slots. Optionally filter by date range.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `from` | DateOnly | `YYYY-MM-DD` |
| `to` | DateOnly | `YYYY-MM-DD` |

**Responses:** 200 `TimeSlotDto[]`, 403

**TimeSlotDto:**

```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "date": "2026-03-18",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "maxCapacity": 20,
  "currentBookings": 12
}
```

---

### POST /time-slots

Create a time slot for a specific date.

**Request body:**

```json
{
  "date": "2026-03-18",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "maxCapacity": 20
}
```

**Responses:** 201 `TimeSlotDto`, 400, 403, 409 (overlapping slot)

---

## Class Schedules

**Route prefix:** `/api/v1/gymhouses/{gymHouseId}/class-schedules`
**Rate limit:** `default`. **Auth:** required.

### GET /class-schedules

List class schedules. Optionally filter by day of week.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `dayOfWeek` | int | 0 = Sunday, 1 = Monday, ..., 6 = Saturday |

**Responses:** 200 `ClassScheduleDto[]`, 403

**ClassScheduleDto:**

```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "trainerId": "uuid",
  "trainerName": "Nguyen Van A",
  "className": "Morning Yoga",
  "dayOfWeek": 1,
  "startTime": "07:00:00",
  "endTime": "08:00:00",
  "maxCapacity": 15,
  "currentEnrollment": 8,
  "isRecurring": true
}
```

---

### GET /class-schedules/{id}

**Responses:** 200 `ClassScheduleDto`, 403, 404

---

### POST /class-schedules

Create a class schedule.

**Request body:**

```json
{
  "trainerId": "uuid",
  "className": "Morning Yoga",
  "dayOfWeek": 1,
  "startTime": "07:00:00",
  "endTime": "08:00:00",
  "maxCapacity": 15,
  "isRecurring": true
}
```

**Responses:** 201 `ClassScheduleDto`, 400, 403, 404 (trainer not found), 409 (trainer has overlapping schedule)

---

### PUT /class-schedules/{id}

Update a class schedule. `trainerId` cannot be changed via this endpoint.

**Request body:**

```json
{
  "className": "Evening Yoga",
  "dayOfWeek": 2,
  "startTime": "18:00:00",
  "endTime": "19:00:00",
  "maxCapacity": 20,
  "isRecurring": true
}
```

**Responses:** 200 `ClassScheduleDto`, 400, 403, 404, 409

---

## SignalR

**Endpoint:** `wss://{host}/hubs/notifications`
**Auth:** Bearer token required (sent during WebSocket handshake).

On connect, the client is added to the group `tenant:{gymHouseId}`. Messages published to that group reach all connected clients for the same gym house.

Used in Phase 5 (Communications) for real-time announcement delivery. REST endpoints provide full fallback — SignalR is a UX enhancement only.
