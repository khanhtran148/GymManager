# API Contract — Phase 2: Booking
Version: 1.0
Date: 2026-03-17
Base URL: /api/v1

## Authentication
All endpoints require Bearer JWT token in Authorization header.

## Shared Types

### BookingType
```
TimeSlot = 0
ClassSession = 1
```

### BookingStatus
```
Confirmed = 0
Cancelled = 1
NoShow = 2
Completed = 3
WaitListed = 4
```

### CheckInSource
```
QRScan = 0
ManualByStaff = 1
SelfKiosk = 2
```

### BookingDto
```json
{
  "id": "uuid",
  "memberId": "uuid",
  "gymHouseId": "uuid",
  "bookingType": 0,
  "timeSlotId": "uuid | null",
  "classScheduleId": "uuid | null",
  "status": 0,
  "bookedAt": "2026-03-17T10:00:00Z",
  "checkedInAt": "2026-03-17T10:05:00Z | null",
  "checkInSource": 0,
  "memberName": "string",
  "memberCode": "string"
}
```

### TimeSlotDto
```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "date": "2026-03-17",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "maxCapacity": 20,
  "currentBookings": 5,
  "availableSpots": 15
}
```

### ClassScheduleDto
```json
{
  "id": "uuid",
  "gymHouseId": "uuid",
  "trainerId": "uuid",
  "trainerName": "string",
  "className": "string",
  "dayOfWeek": 1,
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "maxCapacity": 20,
  "currentEnrollment": 5,
  "availableSpots": 15,
  "isRecurring": true
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

---

## Bookings

### POST /api/v1/gymhouses/{gymHouseId}/bookings
Create a booking. If capacity is full, creates a waitlist entry and returns status WaitListed.

**Permission:** ManageBookings

**Request Body:**
```json
{
  "memberId": "uuid",
  "bookingType": 0,
  "timeSlotId": "uuid | null",
  "classScheduleId": "uuid | null"
}
```

**Responses:**
- `201 Created` → BookingDto (status: Confirmed)
- `201 Created` → BookingDto (status: WaitListed, when capacity full)
- `400 Bad Request` → ProblemDetails (validation failure)
- `403 Forbidden` → ProblemDetails
- `404 Not Found` → ProblemDetails (member/slot/schedule not found)

---

### GET /api/v1/gymhouses/{gymHouseId}/bookings
Get paged bookings for a gym house, optionally filtered by date range.

**Permission:** ViewBookings

**Query Params:**
- `page` (int, default 1)
- `pageSize` (int, default 20)
- `from` (datetime ISO 8601, optional)
- `to` (datetime ISO 8601, optional)

**Responses:**
- `200 OK` → PagedList<BookingDto>
- `403 Forbidden` → ProblemDetails

---

### GET /api/v1/gymhouses/{gymHouseId}/bookings/{id}
Get a single booking by ID.

**Permission:** ViewBookings

**Responses:**
- `200 OK` → BookingDto
- `403 Forbidden` → ProblemDetails
- `404 Not Found` → ProblemDetails

---

### DELETE /api/v1/gymhouses/{gymHouseId}/bookings/{id}
Cancel a booking. Decrements capacity counter and triggers waitlist promotion.

**Permission:** ManageBookings

**Responses:**
- `204 No Content`
- `400 Bad Request` → ProblemDetails (e.g., already cancelled)
- `403 Forbidden` → ProblemDetails
- `404 Not Found` → ProblemDetails

---

### PATCH /api/v1/gymhouses/{gymHouseId}/bookings/{id}/check-in
Record member check-in.

**Permission:** ManageBookings

**Request Body:**
```json
{
  "source": 0
}
```

**Responses:**
- `200 OK` → BookingDto
- `400 Bad Request` → ProblemDetails (not confirmed or already checked in)
- `403 Forbidden` → ProblemDetails
- `404 Not Found` → ProblemDetails

---

### PATCH /api/v1/gymhouses/{gymHouseId}/bookings/{id}/no-show
Mark booking as no-show.

**Permission:** ManageBookings

**Responses:**
- `204 No Content`
- `400 Bad Request` → ProblemDetails (not in Confirmed status)
- `403 Forbidden` → ProblemDetails
- `404 Not Found` → ProblemDetails

---

## Time Slots

### POST /api/v1/gymhouses/{gymHouseId}/time-slots
Create a time slot.

**Permission:** ManageSchedule

**Request Body:**
```json
{
  "date": "2026-03-17",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "maxCapacity": 20
}
```

**Responses:**
- `201 Created` → TimeSlotDto
- `400 Bad Request` → ProblemDetails (validation, overlapping slot)
- `403 Forbidden` → ProblemDetails

---

### GET /api/v1/gymhouses/{gymHouseId}/time-slots
Get time slots, optionally filtered by date range.

**Permission:** ViewBookings

**Query Params:**
- `from` (DateOnly, optional, e.g., 2026-03-17)
- `to` (DateOnly, optional)

**Responses:**
- `200 OK` → List<TimeSlotDto>
- `403 Forbidden` → ProblemDetails

---

## Class Schedules

### POST /api/v1/gymhouses/{gymHouseId}/class-schedules
Create a class schedule.

**Permission:** ManageSchedule

**Request Body:**
```json
{
  "trainerId": "uuid",
  "className": "string",
  "dayOfWeek": 1,
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "maxCapacity": 20,
  "isRecurring": true
}
```

**Responses:**
- `201 Created` → ClassScheduleDto
- `400 Bad Request` → ProblemDetails (validation, trainer double-booked)
- `403 Forbidden` → ProblemDetails
- `404 Not Found` → ProblemDetails (trainer not found)

---

### GET /api/v1/gymhouses/{gymHouseId}/class-schedules
Get class schedules, optionally filtered by day of week.

**Permission:** ViewSchedule

**Query Params:**
- `dayOfWeek` (int 0-6, optional)

**Responses:**
- `200 OK` → List<ClassScheduleDto>
- `403 Forbidden` → ProblemDetails

---

### GET /api/v1/gymhouses/{gymHouseId}/class-schedules/{id}
Get a single class schedule.

**Permission:** ViewSchedule

**Responses:**
- `200 OK` → ClassScheduleDto
- `403 Forbidden` → ProblemDetails
- `404 Not Found` → ProblemDetails

---

### PUT /api/v1/gymhouses/{gymHouseId}/class-schedules/{id}
Update a class schedule.

**Permission:** ManageSchedule

**Request Body:**
```json
{
  "className": "string",
  "dayOfWeek": 1,
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "maxCapacity": 20,
  "isRecurring": true
}
```

**Responses:**
- `200 OK` → ClassScheduleDto
- `400 Bad Request` → ProblemDetails
- `403 Forbidden` → ProblemDetails
- `404 Not Found` → ProblemDetails

---

## Error Format (ProblemDetails RFC 7807)
```json
{
  "status": 400,
  "detail": "Human-readable error message",
  "instance": "/api/v1/gymhouses/{id}/bookings"
}
```

## Rate Limiting
All endpoints: RateLimitPolicies.Default (100 req/min)

## TBD / Pending
- Pagination cursor support for large booking datasets
- Bulk check-in endpoint
- Waitlist position query endpoint
