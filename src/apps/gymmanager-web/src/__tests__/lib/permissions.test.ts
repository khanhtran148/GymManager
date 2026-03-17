import { describe, it, expect } from "vitest";
import {
  Permission,
  hasPermission,
  hasAnyPermission,
} from "@/lib/permissions";

describe("Permission constants", () => {
  it("defines ViewMembers at bit 0", () => {
    expect(Permission.ViewMembers).toBe(1n);
  });

  it("defines ManageMembers at bit 1", () => {
    expect(Permission.ManageMembers).toBe(2n);
  });

  it("defines ManageWaitlist at bit 25", () => {
    expect(Permission.ManageWaitlist).toBe(1n << 25n);
  });

  it("defines Admin as all bits set (masked to 64-bit signed)", () => {
    expect(Permission.Admin).toBe(-1n);
  });

  it("has exactly 28 permission entries (None + 26 flags + Admin)", () => {
    expect(Object.keys(Permission)).toHaveLength(28);
  });
});

describe("hasPermission", () => {
  it("returns true when the required bit is set", () => {
    const userPermissions = Permission.ViewMembers | Permission.ManageMembers;
    expect(hasPermission(userPermissions, Permission.ViewMembers)).toBe(true);
  });

  it("returns false when the required bit is missing", () => {
    const userPermissions = Permission.ViewMembers;
    expect(hasPermission(userPermissions, Permission.ManageMembers)).toBe(false);
  });

  it("returns true for compound permission check when all bits present", () => {
    const userPermissions = Permission.ViewMembers | Permission.ManageMembers | Permission.ViewClasses;
    const required = Permission.ViewMembers | Permission.ManageMembers;
    expect(hasPermission(userPermissions, required)).toBe(true);
  });

  it("returns false for compound permission check when only partial bits present", () => {
    const userPermissions = Permission.ViewMembers;
    const required = Permission.ViewMembers | Permission.ManageMembers;
    expect(hasPermission(userPermissions, required)).toBe(false);
  });

  it("Admin permission matches every individual permission", () => {
    expect(hasPermission(Permission.Admin, Permission.ViewMembers)).toBe(true);
    expect(hasPermission(Permission.Admin, Permission.ManageStaff)).toBe(true);
    expect(hasPermission(Permission.Admin, Permission.ApprovePayroll)).toBe(true);
  });

  it("returns true for None requirement", () => {
    expect(hasPermission(0n, Permission.None)).toBe(true);
  });
});

describe("hasAnyPermission", () => {
  it("returns true if any of the required permissions match", () => {
    const userPermissions = Permission.ViewMembers;
    expect(
      hasAnyPermission(userPermissions, Permission.ViewMembers, Permission.ManageMembers)
    ).toBe(true);
  });

  it("returns false if none of the required permissions match", () => {
    const userPermissions = Permission.ViewClasses;
    expect(
      hasAnyPermission(userPermissions, Permission.ViewMembers, Permission.ManageMembers)
    ).toBe(false);
  });

  it("returns false when called with no required permissions", () => {
    expect(hasAnyPermission(Permission.Admin)).toBe(false);
  });
});
