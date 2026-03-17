# API Contract: Role & Permission Management

**Date:** 2026-03-18
**Version:** 1.0

## Base URL

`/api/v1/roles`

## Endpoints

### 1. GET /api/v1/roles/permissions

List all roles with their current permission bitmasks for the caller's tenant.

**Auth:** Bearer JWT, Owner role required
**Rate Limit:** Default (100/min)

**Response 200:**
```json
{
  "items": [
    {
      "role": "Owner",
      "roleValue": 0,
      "permissions": "67108863",
      "permissionNames": ["ViewMembers", "ManageMembers", "ViewSubscriptions", ...]
    },
    {
      "role": "HouseManager",
      "roleValue": 1,
      "permissions": "33554431",
      "permissionNames": ["ViewMembers", "ManageMembers", ...]
    }
  ]
}
```

**Response 403:** ProblemDetails (not Owner)

### 2. PUT /api/v1/roles/{role}/permissions

Update permissions bitmask for a specific role within the caller's tenant.

**Auth:** Bearer JWT, Owner role required
**Rate Limit:** Strict (5/min)

**Path Params:**
- `role` (string): Role name (HouseManager, Trainer, Staff, Member). Owner cannot be modified.

**Request Body:**
```json
{
  "permissions": "33554431"
}
```

**Response 204:** No content (success)
**Response 400:** ProblemDetails (invalid role, invalid bitmask, attempt to modify Owner)
**Response 403:** ProblemDetails (not Owner)

**Side Effects:**
- Publishes `PermissionsChangedEvent` for each affected user (via MediatR)
- SignalR pushes `PermissionsChanged` to each affected user's group

### 3. POST /api/v1/roles/reset-defaults

Reset all role permissions to seed defaults for the caller's tenant.

**Auth:** Bearer JWT, Owner role required
**Rate Limit:** Strict (5/min)

**Response 204:** No content (success)
**Response 403:** ProblemDetails (not Owner)

**Side Effects:** Same as PUT (publishes events for all affected users)

### 4. GET /api/v1/roles/{role}/users

List users with a given role within the caller's tenant.

**Auth:** Bearer JWT, Owner role required
**Rate Limit:** Default (100/min)

**Path Params:**
- `role` (string): Role name

**Query Params:**
- `page` (int, default 1)
- `pageSize` (int, default 20)

**Response 200:**
```json
{
  "items": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "Trainer",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "totalCount": 5,
  "page": 1,
  "pageSize": 20
}
```

**Response 403:** ProblemDetails (not Owner)

### 5. PUT /api/v1/users/{userId}/role

Change a user's role.

**Auth:** Bearer JWT, Owner role required
**Rate Limit:** Strict (5/min)

**Path Params:**
- `userId` (Guid)

**Request Body:**
```json
{
  "role": "HouseManager"
}
```

**Response 204:** No content (success)
**Response 400:** ProblemDetails (cannot change Owner role, invalid role)
**Response 403:** ProblemDetails (not Owner)
**Response 404:** ProblemDetails (user not found)

**Side Effects:**
- Updates `users.role` column
- Publishes `PermissionsChangedEvent` for the affected user
- SignalR pushes `PermissionsChanged` to the affected user

---

## Shared DTOs

### RolePermissionDto
```csharp
public sealed record RolePermissionDto(
    string Role,
    int RoleValue,
    string Permissions,
    List<string> PermissionNames);
```

### RoleUserDto
```csharp
public sealed record RoleUserDto(
    Guid UserId,
    string Email,
    string FullName,
    string Role,
    DateTime CreatedAt);
```

## Frontend Types

```typescript
interface RolePermissionDto {
  role: string;
  roleValue: number;
  permissions: string; // BigInt as string
  permissionNames: string[];
}

interface RoleUserDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface UpdatePermissionsRequest {
  permissions: string; // BigInt as string
}

interface ChangeUserRoleRequest {
  role: string;
}
```
