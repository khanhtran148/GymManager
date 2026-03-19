# API Contract: Roles Metadata Endpoint

**Date:** 2026-03-18
**Version:** 1.0
**Status:** Draft

---

## `GET /api/v1/roles/metadata`

Returns structural RBAC metadata: role definitions, permission definitions with categories, and route-access rules. This data is application-wide (not tenant-specific) and changes only when the application is updated.

### Authorization

Any authenticated user. No specific permission required.

Rationale: This is UI structural metadata (what roles exist, what permissions exist, which routes map to which roles). It does not reveal what permissions a specific role currently has for a specific tenant -- that remains behind the Owner-only `GET /roles/permissions` endpoint.

### Request

No query parameters. No request body.

### Response `200 OK`

```json
{
  "roles": [
    { "name": "Owner", "value": 0, "isAssignable": false },
    { "name": "HouseManager", "value": 1, "isAssignable": true },
    { "name": "Trainer", "value": 2, "isAssignable": true },
    { "name": "Staff", "value": 3, "isAssignable": true },
    { "name": "Member", "value": 4, "isAssignable": true }
  ],
  "permissions": [
    { "name": "ViewMembers", "bitPosition": 0, "category": "Members" },
    { "name": "ManageMembers", "bitPosition": 1, "category": "Members" },
    { "name": "ViewSubscriptions", "bitPosition": 2, "category": "Subscriptions" },
    { "name": "ManageSubscriptions", "bitPosition": 3, "category": "Subscriptions" },
    { "name": "ViewClasses", "bitPosition": 4, "category": "Classes" },
    { "name": "ManageClasses", "bitPosition": 5, "category": "Classes" },
    { "name": "ViewTrainers", "bitPosition": 6, "category": "Trainers" },
    { "name": "ManageTrainers", "bitPosition": 7, "category": "Trainers" },
    { "name": "ViewPayments", "bitPosition": 8, "category": "Payments" },
    { "name": "ProcessPayments", "bitPosition": 9, "category": "Payments" },
    { "name": "ManageTenant", "bitPosition": 10, "category": "Settings" },
    { "name": "ViewReports", "bitPosition": 11, "category": "Reports" },
    { "name": "ManageBookings", "bitPosition": 12, "category": "Bookings" },
    { "name": "ViewBookings", "bitPosition": 13, "category": "Bookings" },
    { "name": "ManageSchedule", "bitPosition": 14, "category": "Schedule" },
    { "name": "ViewSchedule", "bitPosition": 15, "category": "Schedule" },
    { "name": "ManageFinance", "bitPosition": 16, "category": "Finance" },
    { "name": "ViewFinance", "bitPosition": 17, "category": "Finance" },
    { "name": "ManageStaff", "bitPosition": 18, "category": "Staff" },
    { "name": "ViewStaff", "bitPosition": 19, "category": "Staff" },
    { "name": "ManageAnnouncements", "bitPosition": 20, "category": "Announcements" },
    { "name": "ViewAnnouncements", "bitPosition": 21, "category": "Announcements" },
    { "name": "ApprovePayroll", "bitPosition": 22, "category": "Payroll" },
    { "name": "ManageShifts", "bitPosition": 23, "category": "Shifts" },
    { "name": "ViewShifts", "bitPosition": 24, "category": "Shifts" },
    { "name": "ManageWaitlist", "bitPosition": 25, "category": "Waitlist" }
  ],
  "routeAccess": [
    { "path": "/settings/roles/users", "allowedRoles": ["Owner"] },
    { "path": "/settings/roles", "allowedRoles": ["Owner"] },
    { "path": "/settings", "allowedRoles": ["Owner"] },
    { "path": "/finance/pnl", "allowedRoles": ["Owner", "HouseManager"] },
    { "path": "/finance/transactions", "allowedRoles": ["Owner", "HouseManager", "Staff"] },
    { "path": "/finance", "allowedRoles": ["Owner", "HouseManager", "Staff"] },
    { "path": "/staff", "allowedRoles": ["Owner", "HouseManager"] },
    { "path": "/shifts", "allowedRoles": ["Owner", "HouseManager"] },
    { "path": "/payroll", "allowedRoles": ["Owner", "HouseManager"] },
    { "path": "/check-in", "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff"] },
    { "path": "/gym-houses", "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff"] },
    { "path": "/members", "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/bookings", "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/class-schedules", "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/time-slots", "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/announcements", "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
    { "path": "/", "allowedRoles": ["Owner", "HouseManager", "Trainer", "Staff", "Member"] }
  ]
}
```

### Response DTOs (C#)

```csharp
public sealed record RolesMetadataDto(
    List<RoleDefinitionDto> Roles,
    List<PermissionDefinitionDto> Permissions,
    List<RouteAccessDto> RouteAccess);

public sealed record RoleDefinitionDto(
    string Name,
    int Value,
    bool IsAssignable);

public sealed record PermissionDefinitionDto(
    string Name,
    int BitPosition,
    string Category);

public sealed record RouteAccessDto(
    string Path,
    List<string> AllowedRoles);
```

### Error Responses

| Status | When |
|---|---|
| 401 Unauthorized | No valid JWT |

No 403 -- all authenticated users can access this endpoint.

### Caching

Backend: Consider `Cache-Control: public, max-age=3600` since this data changes only on deployment.
Frontend: `staleTime: Infinity` in TanStack Query. Invalidated on role/permission mutations.

### Notes

- `None` and `Admin` are excluded from the permissions list. They are synthetic values (0 and ~0L) not meaningful as individual toggleable permissions.
- `isAssignable: false` for Owner means the UI should not offer Owner as a target in role-change dialogs. Owner status is assigned through a different mechanism.
- Route access rules are ordered most-specific first. The frontend matching algorithm walks the array top-to-bottom and returns on first prefix match.
