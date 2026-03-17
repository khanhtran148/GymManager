import { describe, it, expect } from "vitest";
import { canAccessRoute } from "@/lib/route-access";

describe("canAccessRoute", () => {
  it("allows Owner to access all routes", () => {
    expect(canAccessRoute("/", "Owner")).toBe(true);
    expect(canAccessRoute("/gym-houses", "Owner")).toBe(true);
    expect(canAccessRoute("/members", "Owner")).toBe(true);
    expect(canAccessRoute("/finance", "Owner")).toBe(true);
    expect(canAccessRoute("/finance/transactions", "Owner")).toBe(true);
    expect(canAccessRoute("/finance/pnl", "Owner")).toBe(true);
    expect(canAccessRoute("/staff", "Owner")).toBe(true);
    expect(canAccessRoute("/shifts", "Owner")).toBe(true);
    expect(canAccessRoute("/payroll", "Owner")).toBe(true);
    expect(canAccessRoute("/check-in", "Owner")).toBe(true);
    expect(canAccessRoute("/announcements", "Owner")).toBe(true);
  });

  it("blocks Member from finance, staff, shifts, payroll, check-in, gym-houses", () => {
    expect(canAccessRoute("/finance", "Member")).toBe(false);
    expect(canAccessRoute("/finance/transactions", "Member")).toBe(false);
    expect(canAccessRoute("/finance/pnl", "Member")).toBe(false);
    expect(canAccessRoute("/staff", "Member")).toBe(false);
    expect(canAccessRoute("/shifts", "Member")).toBe(false);
    expect(canAccessRoute("/payroll", "Member")).toBe(false);
    expect(canAccessRoute("/check-in", "Member")).toBe(false);
    expect(canAccessRoute("/gym-houses", "Member")).toBe(false);
  });

  it("allows Member to access dashboard, members, bookings, class-schedules, time-slots, announcements", () => {
    expect(canAccessRoute("/", "Member")).toBe(true);
    expect(canAccessRoute("/members", "Member")).toBe(true);
    expect(canAccessRoute("/bookings", "Member")).toBe(true);
    expect(canAccessRoute("/class-schedules", "Member")).toBe(true);
    expect(canAccessRoute("/time-slots", "Member")).toBe(true);
    expect(canAccessRoute("/announcements", "Member")).toBe(true);
  });

  it("blocks Trainer from finance, staff, shifts, payroll", () => {
    expect(canAccessRoute("/finance", "Trainer")).toBe(false);
    expect(canAccessRoute("/finance/transactions", "Trainer")).toBe(false);
    expect(canAccessRoute("/finance/pnl", "Trainer")).toBe(false);
    expect(canAccessRoute("/staff", "Trainer")).toBe(false);
    expect(canAccessRoute("/shifts", "Trainer")).toBe(false);
    expect(canAccessRoute("/payroll", "Trainer")).toBe(false);
  });

  it("allows Trainer to access gym-houses, check-in, members, bookings", () => {
    expect(canAccessRoute("/gym-houses", "Trainer")).toBe(true);
    expect(canAccessRoute("/check-in", "Trainer")).toBe(true);
    expect(canAccessRoute("/members", "Trainer")).toBe(true);
    expect(canAccessRoute("/bookings", "Trainer")).toBe(true);
  });

  it("allows Staff to access finance (but not pnl), check-in", () => {
    expect(canAccessRoute("/finance", "Staff")).toBe(true);
    expect(canAccessRoute("/finance/transactions", "Staff")).toBe(true);
    expect(canAccessRoute("/finance/pnl", "Staff")).toBe(false);
    expect(canAccessRoute("/check-in", "Staff")).toBe(true);
  });

  it("blocks Staff from staff-hr routes", () => {
    expect(canAccessRoute("/staff", "Staff")).toBe(false);
    expect(canAccessRoute("/shifts", "Staff")).toBe(false);
    expect(canAccessRoute("/payroll", "Staff")).toBe(false);
  });

  it("allows unknown routes by default (fail-open for UX, backend enforces)", () => {
    expect(canAccessRoute("/some-unknown-page", "Member")).toBe(true);
    expect(canAccessRoute("/settings/notifications", "Member")).toBe(true);
  });

  it("matches sub-routes correctly", () => {
    expect(canAccessRoute("/staff/new", "Owner")).toBe(true);
    expect(canAccessRoute("/staff/new", "Member")).toBe(false);
    expect(canAccessRoute("/payroll/some-id", "Member")).toBe(false);
    expect(canAccessRoute("/finance/transactions/new", "Staff")).toBe(true);
  });
});
