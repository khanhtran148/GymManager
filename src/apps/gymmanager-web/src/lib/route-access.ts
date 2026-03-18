import type { RoleType } from "@/lib/roles";
import type { RouteAccessRule } from "@/types/rbac";

/**
 * Check if a given pathname is accessible by the specified role.
 * Matches from most-specific to least-specific route prefix.
 * Returns true for unknown routes (fail-open for UX; backend enforces security).
 *
 * The routeMap parameter must be provided by the caller — typically sourced from
 * `useRbacStore().routeAccess` which is loaded from the RBAC metadata API.
 */
export function canAccessRoute(
  pathname: string,
  role: string,
  routeMap: RouteAccessRule[]
): boolean {
  for (const route of routeMap) {
    if (route.path === "/") {
      if (pathname === "/") {
        return route.allowedRoles.includes(role);
      }
      continue;
    }

    if (pathname === route.path || pathname.startsWith(route.path + "/")) {
      return route.allowedRoles.includes(role);
    }
  }

  // Unknown route: fail-open (UX-only, backend enforces)
  return true;
}

/**
 * Get allowed roles for a specific route path.
 * Returns undefined for unknown routes (all roles allowed).
 *
 * The routeMap parameter must be provided by the caller — typically sourced from
 * `useRbacStore().routeAccess` which is loaded from the RBAC metadata API.
 */
export function getAllowedRolesForRoute(
  path: string,
  routeMap: RouteAccessRule[]
): RoleType[] | undefined {
  const route = routeMap.find((r) => r.path === path);
  return route?.allowedRoles;
}

export type { RouteAccessRule };
