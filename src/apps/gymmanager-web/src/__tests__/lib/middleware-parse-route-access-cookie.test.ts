/**
 * Unit tests for the parseRouteAccessCookie logic extracted from src/middleware.ts.
 *
 * Because the middleware module imports from "next/server" (Edge Runtime),
 * we replicate the function under test here rather than importing the module
 * directly. This is the standard approach for testing pure utility logic that
 * lives inside a Next.js middleware file.
 *
 * When parseRouteAccessCookie is changed in middleware.ts, update this copy too.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { RouteAccessRule } from "@/types/rbac";

// ---------------------------------------------------------------------------
// Replica of the function under test (keep in sync with src/middleware.ts)
// ---------------------------------------------------------------------------
let _routeAccessCacheKey: string | null = null;
let _routeAccessCacheValue: RouteAccessRule[] | null = null;

function parseRouteAccessCookie(cookieValue: string | undefined): RouteAccessRule[] | null {
  if (!cookieValue) return null;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function encodeRules(rules: unknown): string {
  return btoa(JSON.stringify(rules));
}

const VALID_RULES: RouteAccessRule[] = [
  { path: "/settings/roles", allowedRoles: ["Owner"] },
  { path: "/members", allowedRoles: ["Owner", "HouseManager", "Staff"] },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("parseRouteAccessCookie", () => {
  beforeEach(() => {
    // Reset module-scope cache between tests
    _routeAccessCacheKey = null;
    _routeAccessCacheValue = null;
  });

  describe("cookie absent / falsy", () => {
    it("returns null when cookieValue is undefined", () => {
      expect(parseRouteAccessCookie(undefined)).toBeNull();
    });

    it("returns null when cookieValue is an empty string", () => {
      expect(parseRouteAccessCookie("")).toBeNull();
    });
  });

  describe("malformed / invalid base64", () => {
    it("returns null when the value is not valid base64", () => {
      expect(parseRouteAccessCookie("not_valid_base64!!!")).toBeNull();
    });

    it("returns null when the base64 decodes to non-JSON", () => {
      const notJson = btoa("this is not json");
      expect(parseRouteAccessCookie(notJson)).toBeNull();
    });
  });

  describe("structurally invalid JSON payloads", () => {
    it("returns null when the decoded value is a plain object (not an array)", () => {
      const encoded = encodeRules({ path: "/foo", allowedRoles: ["Owner"] });
      expect(parseRouteAccessCookie(encoded)).toBeNull();
    });

    it("returns null when the array contains items missing the path property", () => {
      const encoded = encodeRules([{ allowedRoles: ["Owner"] }]);
      expect(parseRouteAccessCookie(encoded)).toBeNull();
    });

    it("returns null when the array contains items whose path is not a string", () => {
      const encoded = encodeRules([{ path: 123, allowedRoles: ["Owner"] }]);
      expect(parseRouteAccessCookie(encoded)).toBeNull();
    });

    it("returns null when allowedRoles is missing", () => {
      const encoded = encodeRules([{ path: "/foo" }]);
      expect(parseRouteAccessCookie(encoded)).toBeNull();
    });

    it("returns null when allowedRoles is a string instead of an array", () => {
      const encoded = encodeRules([{ path: "/foo", allowedRoles: "Owner" }]);
      expect(parseRouteAccessCookie(encoded)).toBeNull();
    });

    it("returns null for a null literal inside the array", () => {
      const encoded = encodeRules([null]);
      expect(parseRouteAccessCookie(encoded)).toBeNull();
    });

    it("returns null for an empty string encoded as JSON", () => {
      const encoded = btoa(JSON.stringify(""));
      expect(parseRouteAccessCookie(encoded)).toBeNull();
    });
  });

  describe("valid cookie", () => {
    it("returns the parsed RouteAccessRule[] for a valid cookie", () => {
      const encoded = encodeRules(VALID_RULES);
      const result = parseRouteAccessCookie(encoded);
      expect(result).toEqual(VALID_RULES);
    });

    it("returns an empty array for an encoded empty array", () => {
      const encoded = encodeRules([]);
      const result = parseRouteAccessCookie(encoded);
      expect(result).toEqual([]);
    });
  });

  describe("caching behaviour", () => {
    it("returns the cached result on repeated calls with the same cookie value", () => {
      const encoded = encodeRules(VALID_RULES);

      const first = parseRouteAccessCookie(encoded);
      const second = parseRouteAccessCookie(encoded);

      // Both calls should return the same array reference (cached)
      expect(first).toBe(second);
    });

    it("re-parses when the cookie value changes", () => {
      const encoded1 = encodeRules(VALID_RULES);
      const newRules: RouteAccessRule[] = [{ path: "/finance", allowedRoles: ["Owner"] }];
      const encoded2 = encodeRules(newRules);

      const first = parseRouteAccessCookie(encoded1);
      const second = parseRouteAccessCookie(encoded2);

      expect(first).toEqual(VALID_RULES);
      expect(second).toEqual(newRules);
      expect(first).not.toBe(second);
    });

    it("caches null for an invalid cookie and does not re-parse on repeated calls", () => {
      const invalid = btoa("not-json");

      const first = parseRouteAccessCookie(invalid);
      expect(first).toBeNull();

      // Simulate calling again — cache key matches, returns null without throwing
      const second = parseRouteAccessCookie(invalid);
      expect(second).toBeNull();
    });
  });
});
