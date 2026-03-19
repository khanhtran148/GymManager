# API Contract: Role & Permission Management (v1.1 — adds GET /roles/metadata)

**Date:** 2026-03-18
**Version:** 1.1
**Breaking Changes:** None — new endpoint only.

## Base URL

`/api/v1/roles`

---

## Endpoints

### 1. GET /api/v1/roles/permissions _(unchanged)_

### 2. PUT /api/v1/roles/{role}/permissions _(unchanged)_

### 3. POST /api/v1/roles/reset-defaults _(unchanged)_

### 4. GET /api/v1/roles/{role}/users _(unchanged)_

### 5. PUT /api/v1/users/{userId}/role _(unchanged)_

---

### 6. GET /api/v1/roles/metadata _(NEW)_

Returns static RBAC metadata: role definitions, permission catalogue with categories,
and route-level access rules. Intended for frontend consumption so it can stop
hard-coding roles and routes client-side.

**Auth:** Bearer JWT — any authenticated user (no permission check needed)
**Rate Limit:** Default (100/min)

**Response 200:**
```json
{
  "roles": [
    { "name": "Owner",        "value": 0, "isAssignable": false },
    { "name": "HouseManager", "value": 1, "isAssignable": true },
    { "name": "Trainer",      "value": 2, "isAssignable": true },
    { "name": "Staff",        "value": 3, "isAssignable": true },
    { "name": "Member",       "value": 4, "isAssignable": true }
  ],
  "permissions": [
    { "name": "ViewMembers",         "bitPosition": 0,  "category": "Members" },
    { "name": "ManageMembers",       "bitPosition": 1,  "category": "Members" },
    { "name": "ViewSubscriptions",   "bitPosition": 2,  "category": "Subscriptions" },
    { "name": "ManageSubscriptions", "bitPosition": 3,  "category": "Subscriptions" },
    { "name": "ViewClasses",         "bitPosition": 4,  "category": "Classes" },
    { "name": "ManageClasses",       "bitPosition": 5,  "category": "Classes" },
    { "name": "ViewTrainers",        "bitPosition": 6,  "category": "Trainers" },
    { "name": "ManageTrainers",      "bitPosition": 7,  "category": "Trainers" },
    { "name": "ViewPayments",        "bitPosition": 8,  "category": "Payments" },
    { "name": "ProcessPayments",     "bitPosition": 9,  "category": "Payments" },
    { "name": "ManageTenant",        "bitPosition": 10, "category": "Settings" },
    { "name": "ViewReports",         "bitPosition": 11, "category": "Reports" },
    { "name": "ManageBookings",      "bitPosition": 12, "category": "Bookings" },
    { "name": "ViewBookings",        "bitPosition": 13, "category": "Bookings" },
    { "name": "ManageSchedule",      "bitPosition": 14, "category": "Schedule" },
    { "name": "ViewSchedule",        "bitPosition": 15, "category": "Schedule" },
    { "name": "ManageFinance",       "bitPosition": 16, "category": "Finance" },
    { "name": "ViewFinance",         "bitPosition": 17, "category": "Finance" },
    { "name": "ManageStaff",         "bitPosition": 18, "category": "Staff" },
    { "name": "ViewStaff",           "bitPosition": 19, "category": "Staff" },
    { "name": "ManageAnnouncements", "bitPosition": 20, "category": "Announcements" },
    { "name": "ViewAnnouncements",   "bitPosition": 21, "category": "Announcements" },
    { "name": "ApprovePayroll",      "bitPosition": 22, "category": "Payroll" },
    { "name": "ManageShifts",        "bitPosition": 23, "category": "Shifts" },
    { "name": "ViewShifts",          "bitPosition": 24, "category": "Shifts" },
    { "name": "ManageWaitlist",      "bitPosition": 25, "category": "Waitlist" }
  ],
  "routeAccess": [
    { "path": "/settings/roles/users",  "allowedRoles": ["Owner"] },
    { "path": "/settings/roles",        "allowedRoles": ["Owner"] },
    { "path": "/settings",              "allowedRoles": ["Owner"] },
    { "path": "/finance/pnl",           "allowedRoles": ["Owner", "HouseManager"] },
    { "path": "/finance/transactions",  "allowedRoles": ["Owner", "HouseManager", "Staff"] },
    { "path": "/finance",               "allowedRoles": ["Owner", "HouseManager", "Staff"] },
    { "path": "/staff",                 "allowedRoles": ["Owner", "HouseManager"] },
    { "path": "/shifts",                "allowedRoles": ["Owner", "HouseManager"] },
    { "path": "/payroll",               "allowedRoles": ["Owner", "HouseManager"] },
    { "path": "/check-in",              "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff"] },
    { "path": "/gym-houses",            "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff"] },
    { "path": "/members",               "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/bookings",              "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/class-schedules",       "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/time-slots",            "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/announcements",         "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/",                      "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] }
  ]
}
```

**Response 401:** ProblemDetails (unauthenticated)

---

## Shared DTOs

### RolesMetadataDto (NEW)
```csharp
public sealed record RolesMetadataDto(
    List<RoleDefinitionDto> Roles,
    List<PermissionDefinitionDto> Permissions,
    List<RouteAccessDto> RouteAccess);

public sealed record RoleDefinitionDto(string Name, int Value, bool IsAssignable);
public sealed record PermissionDefinitionDto(string Name, int BitPosition, string Category);
public sealed record RouteAccessDto(string Path, List<string> AllowedRoles);
```

---

## Category Derivation Rules

Categories are derived from the permission enum name at runtime (no separate enum):

| Enum name                        | Category       |
|----------------------------------|----------------|
| ManageTenant                     | Settings       |
| ViewReports                      | Reports        |
| ApprovePayroll                   | Payroll        |
| ManageWaitlist                   | Waitlist       |
| ProcessPayments                  | Payments       |
| *View{X}* / *Manage{X}*          | {X}            |

---

## TBD / Pending

- Route access rules are hardcoded in the handler (no DB table required for Phase 1).
  A future phase may introduce a `route_access_rules` DB table for runtime configuration.
