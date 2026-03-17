# Discovery Context: Frontend RBAC Permission System

## Current State

### Backend (complete)
- `Permission : long` enum with 26 bitwise flags (bits 0-25) + `Admin = ~0L`
- 5 roles: Owner, HouseManager, Trainer, Staff, Member
- `RoleSeedData.GetDefaultPermissions()` maps each role to its permission bitmask
- `JwtTokenService` already emits `role` (string) and `permissions` (long as string) JWT claims
- `IPermissionChecker` enforces permissions in every command handler
- `NotificationHub` (SignalR) exists with tenant and user group support
- `INotificationHub.SendToGroupAsync(groupName, method, payload)` ready for new events

### Frontend (gaps)
- `AuthResponse` type has no role or permissions fields
- `auth-store.ts` stores user/token/isAuthenticated but no role or permissions
- `middleware.ts` checks only `is_authenticated` cookie -- no role-based routing
- `sidebar.tsx` renders all 12 nav entries unconditionally
- All 31 dashboard pages visible to all authenticated users
- No 403 page exists
- No `<PermissionGate>` or `<RoleGate>` components
- `jose` library not installed (needed for JWT decode in Edge Runtime)
- Frontend tests use vitest + testing-library + msw

### Backend AuthResponse (C#)
```csharp
public sealed record AuthResponse(
    Guid UserId, string Email, string FullName,
    string AccessToken, string RefreshToken, DateTime ExpiresAt);
```
Does NOT return `role` or `permissions` explicitly. These are embedded in JWT claims:
- `role` claim: e.g., "Owner"
- `permissions` claim: e.g., "67108863" (long as string)

### JWT Structure
- Issued by `JwtTokenService.GenerateAccessToken(User user)`
- Claims: `sub` (userId), `email`, `role` (string), `permissions` (long string)
- Expiry: 15 minutes
- Signed with HMAC-SHA256

### SignalR Infrastructure
- Hub: `NotificationHub` at `/hubs/notifications`
- Groups: `tenant:{tenantId}` and `user:{userId}`
- Frontend client: `@microsoft/signalr` already installed
- Connection setup: `src/lib/signalr.ts` with auto-reconnect
- Event subscription pattern: `use-notifications.ts` hooks into `ReceiveNotification`

### Frontend Test Setup
- vitest + jsdom + @testing-library/react + msw
- Tests in `src/__tests__/` directory
- Pattern: vi.mock api-client, renderHook with QueryClientProvider wrapper

## Key Files

### Backend
- `src/core/GymManager.Domain/Enums/Permission.cs` -- 26 permissions
- `src/core/GymManager.Domain/Enums/Role.cs` -- 5 roles
- `src/core/GymManager.Infrastructure/Persistence/Seeding/RoleSeedData.cs` -- role-permission map
- `src/core/GymManager.Infrastructure/Auth/JwtTokenService.cs` -- JWT generation
- `src/core/GymManager.Application/Auth/Shared/AuthResponse.cs` -- API response DTO
- `src/core/GymManager.Application/Common/Interfaces/INotificationHub.cs` -- hub interface
- `src/apps/GymManager.Api/Hubs/NotificationHub.cs` -- SignalR hub

### Frontend
- `src/apps/gymmanager-web/src/types/auth.ts` -- AuthResponse TS type
- `src/apps/gymmanager-web/src/stores/auth-store.ts` -- Zustand auth store
- `src/apps/gymmanager-web/src/middleware.ts` -- Next.js middleware
- `src/apps/gymmanager-web/src/components/sidebar.tsx` -- sidebar nav
- `src/apps/gymmanager-web/src/lib/signalr.ts` -- SignalR client
- `src/apps/gymmanager-web/src/lib/api-client.ts` -- Axios with token refresh
- `src/apps/gymmanager-web/src/hooks/use-auth.ts` -- auth hook
- `src/apps/gymmanager-web/src/app/(dashboard)/layout.tsx` -- dashboard layout
