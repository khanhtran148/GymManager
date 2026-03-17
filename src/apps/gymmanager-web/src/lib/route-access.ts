import { Role, type RoleType } from "@/lib/roles";

interface RouteAccess {
  path: string;
  allowedRoles: RoleType[];
}

const VALID_ROLES = new Set<string>(Object.values(Role));

/**
 * Route-to-role access map. Single source of truth for frontend route guards.
 *
 * Routes are matched from most-specific to least-specific.
 * Unknown routes default to allowed (fail-open for UX; backend enforces security).
 */
const routeAccessMap: RouteAccess[] = [
  { path: "/finance/pnl", allowedRoles: ["Owner", "HouseManager"] },
  { path: "/finance/transactions", allowedRoles: ["Owner", "HouseManager", "Staff"] },
  { path: "/finance", allowedRoles: ["Owner", "HouseManager", "Staff"] },
  { path: "/staff", allowedRoles: ["Owner", "HouseManager"] },
  { path: "/shifts", allowedRoles: ["Owner", "HouseManager"] },
  { path: "/payroll", allowedRoles: ["Owner", "HouseManager"] },
  { path: "/check-in", allowedRoles: ["Owner", "HouseManager", "Trainer", "Staff"] },
  { path: "/gym-houses", allowedRoles: ["Owner", "HouseManager", "Trainer", "Staff"] },
  { path: "/members", allowedRoles: ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
  { path: "/bookings", allowedRoles: ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
  { path: "/class-schedules", allowedRoles: ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
  { path: "/time-slots", allowedRoles: ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
  { path: "/announcements", allowedRoles: ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
  { path: "/", allowedRoles: ["Owner", "HouseManager", "Trainer", "Staff", "Member"] },
];

/**
 * Check if a given pathname is accessible by the specified role.
 * Matches from most-specific to least-specific route prefix.
 * Returns true for unknown routes (fail-open for UX).
 */
export function canAccessRoute(pathname: string, role: string): boolean {
  // Reject unknown roles (fail-closed for invalid cookie values)
  if (!VALID_ROLES.has(role)) return false;

  for (const route of routeAccessMap) {
    if (route.path === "/") {
      if (pathname === "/") {
        return route.allowedRoles.includes(role as RoleType);
      }
      continue;
    }

    if (pathname === route.path || pathname.startsWith(route.path + "/")) {
      return route.allowedRoles.includes(role as RoleType);
    }
  }

  // Unknown route: fail-open (UX-only, backend enforces)
  return true;
}

/**
 * Get allowed roles for a specific route path.
 * Returns undefined for unknown routes (all roles allowed).
 */
export function getAllowedRolesForRoute(path: string): RoleType[] | undefined {
  const route = routeAccessMap.find((r) => r.path === path);
  return route?.allowedRoles;
}

export { routeAccessMap };
export type { RouteAccess };
