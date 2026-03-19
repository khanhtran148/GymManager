import { NextRequest, NextResponse } from "next/server";
import { canAccessRoute } from "@/lib/route-access";
import type { RouteAccessRule } from "@/types/rbac";

const PUBLIC_PATHS = ["/login", "/register", "/401", "/403", "/500"];

/**
 * Static fallback route map used by the Next.js middleware when the
 * `route_access` cookie has not yet been set (e.g. first login).
 *
 * The middleware runs at the edge and cannot call the RBAC metadata API, so we
 * keep a static copy here as a compile-time safety net.  This is intentionally
 * the same data that the backend serves via GET /roles/metadata.
 *
 * When the RbacProvider loads on the client it writes the live route access list
 * to the `route_access` cookie (base64-encoded JSON) which the middleware
 * prefers over this static fallback.
 *
 * TODO: This static fallback duplicates route access rules from GetRolesMetadataQueryHandler.cs.
 * Keep in sync until code generation is implemented.
 */
const STATIC_ROUTE_MAP: RouteAccessRule[] = [
  { path: "/settings/roles/users", allowedRoles: ["Owner"] },
  { path: "/settings/roles", allowedRoles: ["Owner"] },
  { path: "/settings", allowedRoles: ["Owner"] },
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
 * Module-level cache for the parsed `route_access` cookie.
 * Keyed by the raw cookie string value so we only run atob + JSON.parse
 * once per unique cookie value across all requests in the same module instance.
 */
let _routeAccessCacheKey: string | null = null;
let _routeAccessCacheValue: RouteAccessRule[] | null = null;

/**
 * Parse the `route_access` cookie written by RbacProvider.
 * Cookie value is base64url(JSON.stringify(RouteAccessRule[])).
 * Returns null if the cookie is absent or unparseable.
 *
 * Result is memoized at module scope keyed by the raw cookie string value
 * to avoid redundant atob + JSON.parse on every authenticated request.
 */
function parseRouteAccessCookie(cookieValue: string | undefined): RouteAccessRule[] | null {
  if (!cookieValue) return null;
  // Return cached result if the cookie value has not changed
  if (cookieValue === _routeAccessCacheKey) {
    return _routeAccessCacheValue;
  }
  try {
    const json = atob(cookieValue);
    const parsed: unknown = JSON.parse(json);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (r) =>
          r !== null &&
          typeof r === "object" &&
          typeof (r as Record<string, unknown>).path === "string" &&
          Array.isArray((r as Record<string, unknown>).allowedRoles)
      )
    ) {
      const result = parsed as RouteAccessRule[];
      _routeAccessCacheKey = cookieValue;
      _routeAccessCacheValue = result;
      return result;
    }
    _routeAccessCacheKey = cookieValue;
    _routeAccessCacheValue = null;
    return null;
  } catch {
    _routeAccessCacheKey = cookieValue;
    _routeAccessCacheValue = null;
    return null;
  }
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const isAuthenticated = request.cookies.get("is_authenticated")?.value === "1";

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isErrorPage = pathname === "/401" || pathname === "/403" || pathname === "/500";
  if (isAuthenticated && isPublic && !isErrorPage) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Role-based route guard (UX-only; backend enforces security)
  if (isAuthenticated && !isPublic) {
    const userRole = request.cookies.get("user_role")?.value;
    if (userRole) {
      // Prefer the live route map from the cookie; fall back to static map
      const routeAccessCookieValue = request.cookies.get("route_access")?.value;
      const routeMap = parseRouteAccessCookie(routeAccessCookieValue) ?? STATIC_ROUTE_MAP;

      if (!canAccessRoute(pathname, userRole, routeMap)) {
        const forbiddenUrl = new URL("/403", request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
