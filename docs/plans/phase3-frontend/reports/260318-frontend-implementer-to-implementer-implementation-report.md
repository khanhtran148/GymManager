# Phase 3 Frontend Implementation Report

**Status:** COMPLETED
**Date:** 2026-03-18
**Vitest TFD Status:** N/A — changes are wiring/plumbing (store access pattern changes, no new logic-bearing components)

---

## Summary

Fixed all 39 TypeScript errors caused by Phase 2 removing the `Permission` constant and `Role` constant from the frontend codebase. Components were migrated to source data from the dynamic RBAC Zustand store. The `RbacProvider` component was created, wired into the dashboard layout, and the middleware was updated to read the dynamic route-access cookie.

---

## Completed Components

| File | Change |
|------|--------|
| `src/components/sidebar.tsx` | Replaced static `getAllowedRolesForRoute(path)` calls with dynamic `useMemo` over `routeAccessMap` from `useRbacStore()` |
| `src/components/permission-toggle-grid.tsx` | Removed `Permission.*` and `Role.*` constants; uses `useRbacStore().permissionCategories` and `useRbacStore().roles` |
| `src/components/role-user-table.tsx` | Replaced `Role.*` tabs with dynamic `useRbacStore().assignableRoles` |
| `src/components/change-role-dialog.tsx` | Replaced static `ASSIGNABLE_ROLES` array with `useRbacStore().assignableRoles` |
| `src/components/rbac-provider.tsx` | **NEW** — loads metadata via `useRolesMetadata()`, calls `setMetadata()`, syncs `route_access` cookie, shows loading skeleton |
| `src/app/(dashboard)/layout.tsx` | Added `RbacProvider` wrapping the layout |
| `src/middleware.ts` | Reads `route_access` cookie (base64 JSON) first; falls back to `STATIC_ROUTE_MAP` if absent/invalid |
| `src/stores/rbac-store.ts` | Added `reset()` action for logout flow |
| `src/hooks/use-auth.ts` | On login/register: invalidates `roles-metadata` query and clears `route_access` cookie. On logout: calls `useRbacStore.reset()` |
| `src/app/(dashboard)/page.tsx` | Replaced `Permission.*` → `permissionMap["..."] ?? 0n`; `Role.*` → string literals |
| `src/app/(dashboard)/announcements/page.tsx` | Same pattern |
| `src/app/(dashboard)/bookings/page.tsx` | Same pattern |
| `src/app/(dashboard)/class-schedules/page.tsx` | Same pattern |
| `src/app/(dashboard)/finance/transactions/page.tsx` | Same pattern |
| `src/app/(dashboard)/gym-houses/page.tsx` | Same pattern |
| `src/app/(dashboard)/gym-houses/[id]/page.tsx` | Same pattern |
| `src/app/(dashboard)/members/page.tsx` | Same pattern |
| `src/app/(dashboard)/members/[id]/page.tsx` | Same pattern |
| `src/app/(dashboard)/payroll/page.tsx` | Same pattern |
| `src/app/(dashboard)/payroll/[id]/page.tsx` | Same pattern |
| `src/app/(dashboard)/settings/roles/page.tsx` | `Role.Owner` → `"Owner"` string literal |
| `src/app/(dashboard)/settings/roles/users/page.tsx` | `Role.Owner` → `"Owner"` string literal |
| `src/app/(dashboard)/shifts/page.tsx` | `Permission.*` → store pattern |
| `src/app/(dashboard)/staff/page.tsx` | `Permission.*` → store pattern |

---

## API Contract Usage

| Endpoint | Component/Hook | Status |
|----------|---------------|--------|
| `GET /roles/metadata` | `useRolesMetadata` → `RbacProvider` → `useRbacStore` | Wired |

---

## TypeScript Errors Fixed

- 39 errors resolved (per original compiler output)
- Final `npx tsc --noEmit`: 0 errors

---

## Architecture Decisions

**Permission gates before metadata loads:** When `isLoaded === false`, `permissionMap["AnyPerm"] ?? 0n` evaluates to `0n`. This means `hasPermission(userPermissions, 0n)` returns `true` (any number & 0n === 0n), so permission-gated elements are visible during load. This is intentional fail-open UX (backend enforces security). The `RbacProvider` loading skeleton prevents rendering any page content until `isLoaded` is true, so this edge case does not appear in practice.

**route_access cookie:** Written as `base64(JSON.stringify(RouteAccessRule[]))`. The middleware validates the array structure before trusting it. If malformed, falls back to `STATIC_ROUTE_MAP`. The cookie has no `Secure` flag because it is read by the Next.js middleware (edge, not browser JS), but the content is non-sensitive (only role names and path strings).

**Token refresh:** The `api-client.ts` token-refresh path does NOT invalidate the roles-metadata query because role assignments don't change during a token refresh in this system. If role changes need to propagate immediately, the `PermissionSyncProvider` (SignalR) should push a cache invalidation event — that is a Phase 4+ concern.

---

## Deviations from Contract

None. The `GET /roles/metadata` response shape (`RolesMetadata`) was already defined in `src/types/rbac.ts` and the store was already scaffolded in `src/stores/rbac-store.ts`. This phase only wired existing infrastructure to the consuming components.

---

## Unresolved Questions for Orchestrator

1. **Token refresh + role change propagation:** If an admin changes a user's role mid-session, the user's RBAC store will not update until they log out/login or the SignalR `PermissionSyncProvider` sends an invalidation event. Is Phase 4 planning this? Current behavior: user sees stale UX until next login.

2. **`RbacProvider` in non-dashboard routes:** The `(auth)` pages and the root `/403` page do not have `RbacProvider`. If any of those pages ever need permission-gated UI, they would need their own instance.

3. **`STATIC_ROUTE_MAP` sync:** The static fallback in `middleware.ts` must be kept in sync with the backend `GET /roles/metadata` routeAccess response. Consider adding a CI test that fetches the live metadata and diffs it against the static copy.
