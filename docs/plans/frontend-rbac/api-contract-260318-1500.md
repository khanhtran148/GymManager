# API Contract: Frontend RBAC Permission System

**Date**: 2026-03-18
**Status**: Proposed

---

## 1. JWT Claims (existing, no changes needed)

The backend `JwtTokenService` already emits these claims:

```json
{
  "sub": "a1b2c3d4-...",
  "email": "user@example.com",
  "role": "Owner",
  "permissions": "67108863",
  "nbf": 1742284800,
  "exp": 1742285700,
  "iss": "GymManager",
  "aud": "GymManager"
}
```

| Claim | Type | Description |
|---|---|---|
| `role` | string | One of: Owner, HouseManager, Trainer, Staff, Member |
| `permissions` | string | `long` value as string. Bitwise OR of Permission flags. |

The frontend decodes these using `jose.decodeJwt()` (no signature verification -- UX-only).

---

## 2. AuthResponse (no changes)

```csharp
// Backend
public sealed record AuthResponse(
    Guid UserId, string Email, string FullName,
    string AccessToken, string RefreshToken, DateTime ExpiresAt);
```

```typescript
// Frontend
export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
```

Role and permissions are decoded from `accessToken` JWT, not from response body fields.

---

## 3. SignalR Event: PermissionsChanged (new)

**Hub**: `/hubs/notifications` (existing NotificationHub)
**Method name**: `PermissionsChanged`
**Target group**: `user:{userId}`
**Direction**: Server -> Client

### Payload

```typescript
interface PermissionsChangedPayload {
  userId: string;
  newRole: string;       // e.g., "HouseManager"
  newPermissions: string; // long as string, e.g., "16777215"
}
```

```csharp
// Backend sends:
await notificationHub.SendToGroupAsync(
    $"user:{userId}",
    "PermissionsChanged",
    new { UserId = userId, NewRole = newRole, NewPermissions = newPermissions.ToString() });
```

### Trigger

Sent when:
- An admin changes a user's role
- A user's custom permissions are modified

### Client Behavior

1. Receive event
2. Call `POST /api/v1/auth/refresh` to get fresh JWT with updated claims
3. Re-decode JWT, update Zustand store and `user_role` cookie
4. Show toast notification: "Your permissions have been updated"

---

## 4. Cookies (new)

### user_role

| Property | Value |
|---|---|
| Name | `user_role` |
| Value | Role string (e.g., "Owner") |
| Path | `/` |
| Max-Age | 604800 (7 days, matches refresh token) |
| SameSite | Lax |
| HttpOnly | No (set by client JS, read by Next.js middleware) |
| Secure | No (development); Yes (production) |

Set by frontend on login and token refresh. Read by Next.js middleware for route-level access checks. Cleared on logout.

This cookie is unsigned. A user could forge it to see admin UI, but all API calls enforce permissions server-side via `IPermissionChecker`.

---

## 5. Permission Bit Map

Frontend TypeScript constants must mirror backend exactly:

| Permission | Bit | Value |
|---|---|---|
| ViewMembers | 0 | 1n |
| ManageMembers | 1 | 2n |
| ViewSubscriptions | 2 | 4n |
| ManageSubscriptions | 3 | 8n |
| ViewClasses | 4 | 16n |
| ManageClasses | 5 | 32n |
| ViewTrainers | 6 | 64n |
| ManageTrainers | 7 | 128n |
| ViewPayments | 8 | 256n |
| ProcessPayments | 9 | 512n |
| ManageTenant | 10 | 1024n |
| ViewReports | 11 | 2048n |
| ManageBookings | 12 | 4096n |
| ViewBookings | 13 | 8192n |
| ManageSchedule | 14 | 16384n |
| ViewSchedule | 15 | 32768n |
| ManageFinance | 16 | 65536n |
| ViewFinance | 17 | 131072n |
| ManageStaff | 18 | 262144n |
| ViewStaff | 19 | 524288n |
| ManageAnnouncements | 20 | 1048576n |
| ViewAnnouncements | 21 | 2097152n |
| ApprovePayroll | 22 | 4194304n |
| ManageShifts | 23 | 8388608n |
| ViewShifts | 24 | 16777216n |
| ManageWaitlist | 25 | 33554432n |
| Admin | all | ~0n (masked to 64-bit) |
