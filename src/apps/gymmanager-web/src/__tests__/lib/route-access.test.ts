import { describe, it, expect } from "vitest";
import { canAccessRoute } from "@/lib/route-access";
import type { RouteAccessRule } from "@/types/rbac";

// Mirror the original hardcoded route map so test coverage remains identical.
// In production this data is loaded from /roles/metadata via useRbacStore.
const testRouteMap: RouteAccessRule[] = [
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

describe("canAccessRoute", () => {
  it("allows Owner to access all routes", () => {
    expect(canAccessRoute("/", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/gym-houses", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/members", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/finance", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/finance/transactions", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/finance/pnl", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/staff", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/shifts", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/payroll", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/check-in", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/announcements", "Owner", testRouteMap)).toBe(true);
  });

  it("blocks Member from finance, staff, shifts, payroll, check-in, gym-houses", () => {
    expect(canAccessRoute("/finance", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/finance/transactions", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/finance/pnl", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/staff", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/shifts", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/payroll", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/check-in", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/gym-houses", "Member", testRouteMap)).toBe(false);
  });

  it("allows Member to access dashboard, members, bookings, class-schedules, time-slots, announcements", () => {
    expect(canAccessRoute("/", "Member", testRouteMap)).toBe(true);
    expect(canAccessRoute("/members", "Member", testRouteMap)).toBe(true);
    expect(canAccessRoute("/bookings", "Member", testRouteMap)).toBe(true);
    expect(canAccessRoute("/class-schedules", "Member", testRouteMap)).toBe(true);
    expect(canAccessRoute("/time-slots", "Member", testRouteMap)).toBe(true);
    expect(canAccessRoute("/announcements", "Member", testRouteMap)).toBe(true);
  });

  it("blocks Trainer from finance, staff, shifts, payroll", () => {
    expect(canAccessRoute("/finance", "Trainer", testRouteMap)).toBe(false);
    expect(canAccessRoute("/finance/transactions", "Trainer", testRouteMap)).toBe(false);
    expect(canAccessRoute("/finance/pnl", "Trainer", testRouteMap)).toBe(false);
    expect(canAccessRoute("/staff", "Trainer", testRouteMap)).toBe(false);
    expect(canAccessRoute("/shifts", "Trainer", testRouteMap)).toBe(false);
    expect(canAccessRoute("/payroll", "Trainer", testRouteMap)).toBe(false);
  });

  it("allows Trainer to access gym-houses, check-in, members, bookings", () => {
    expect(canAccessRoute("/gym-houses", "Trainer", testRouteMap)).toBe(true);
    expect(canAccessRoute("/check-in", "Trainer", testRouteMap)).toBe(true);
    expect(canAccessRoute("/members", "Trainer", testRouteMap)).toBe(true);
    expect(canAccessRoute("/bookings", "Trainer", testRouteMap)).toBe(true);
  });

  it("allows Staff to access finance (but not pnl), check-in", () => {
    expect(canAccessRoute("/finance", "Staff", testRouteMap)).toBe(true);
    expect(canAccessRoute("/finance/transactions", "Staff", testRouteMap)).toBe(true);
    expect(canAccessRoute("/finance/pnl", "Staff", testRouteMap)).toBe(false);
    expect(canAccessRoute("/check-in", "Staff", testRouteMap)).toBe(true);
  });

  it("blocks Staff from staff-hr routes", () => {
    expect(canAccessRoute("/staff", "Staff", testRouteMap)).toBe(false);
    expect(canAccessRoute("/shifts", "Staff", testRouteMap)).toBe(false);
    expect(canAccessRoute("/payroll", "Staff", testRouteMap)).toBe(false);
  });

  it("allows unknown routes by default (fail-open for UX, backend enforces)", () => {
    expect(canAccessRoute("/some-unknown-page", "Member", testRouteMap)).toBe(true);
    // /settings and sub-paths are Owner-only
    expect(canAccessRoute("/settings/notifications", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/settings/notifications", "Owner", testRouteMap)).toBe(true);
  });

  it("matches sub-routes correctly", () => {
    expect(canAccessRoute("/staff/new", "Owner", testRouteMap)).toBe(true);
    expect(canAccessRoute("/staff/new", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/payroll/some-id", "Member", testRouteMap)).toBe(false);
    expect(canAccessRoute("/finance/transactions/new", "Staff", testRouteMap)).toBe(true);
  });
});
