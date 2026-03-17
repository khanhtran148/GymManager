import type { RoleType } from "@/lib/roles";

interface RouteAccess {
  path: string;
  allowedRoles: RoleType[];
}

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

export { routeAccessMap };
export type { RouteAccess };
