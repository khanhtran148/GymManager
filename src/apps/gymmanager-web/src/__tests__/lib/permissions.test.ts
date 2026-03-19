import { describe, it, expect } from "vitest";
import {
  buildPermissionFlag,
  hasPermission,
  hasAnyPermission,
} from "@/lib/permissions";

// Re-create the previously-hardcoded constants locally using buildPermissionFlag
// so that these tests exercise the helper function directly.
const ViewMembers = buildPermissionFlag(0);
const ManageMembers = buildPermissionFlag(1);
const ViewClasses = buildPermissionFlag(4);
const ManageStaff = buildPermissionFlag(18);
const ApprovePayroll = buildPermissionFlag(22);
const ManageWaitlist = buildPermissionFlag(25);
const None = 0n;
const Admin = ~0n;

describe("buildPermissionFlag", () => {
  it("returns 1n for bit position 0", () => {
    expect(buildPermissionFlag(0)).toBe(1n);
  });

  it("returns 2n for bit position 1", () => {
    expect(buildPermissionFlag(1)).toBe(2n);
  });

  it("returns correct value for bit position 25", () => {
    expect(buildPermissionFlag(25)).toBe(1n << 25n);
  });
});

describe("hasPermission", () => {
  it("returns true when the required bit is set", () => {
    const userPermissions = ViewMembers | ManageMembers;
    expect(hasPermission(userPermissions, ViewMembers)).toBe(true);
  });

  it("returns false when the required bit is missing", () => {
    const userPermissions = ViewMembers;
    expect(hasPermission(userPermissions, ManageMembers)).toBe(false);
  });

  it("returns true for compound permission check when all bits present", () => {
    const userPermissions = ViewMembers | ManageMembers | ViewClasses;
    const required = ViewMembers | ManageMembers;
    expect(hasPermission(userPermissions, required)).toBe(true);
  });

  it("returns false for compound permission check when only partial bits present", () => {
    const userPermissions = ViewMembers;
    const required = ViewMembers | ManageMembers;
    expect(hasPermission(userPermissions, required)).toBe(false);
  });

  it("Admin permission matches every individual permission", () => {
    expect(hasPermission(Admin, ViewMembers)).toBe(true);
    expect(hasPermission(Admin, ManageStaff)).toBe(true);
    expect(hasPermission(Admin, ApprovePayroll)).toBe(true);
  });

  it("returns true for None requirement", () => {
    expect(hasPermission(0n, None)).toBe(true);
  });
});

describe("hasAnyPermission", () => {
  it("returns true if any of the required permissions match", () => {
    const userPermissions = ViewMembers;
    expect(hasAnyPermission(userPermissions, ViewMembers, ManageMembers)).toBe(true);
  });

  it("returns false if none of the required permissions match", () => {
    const userPermissions = ViewClasses;
    expect(hasAnyPermission(userPermissions, ViewMembers, ManageMembers)).toBe(false);
  });

  it("returns false when called with no required permissions", () => {
    expect(hasAnyPermission(Admin)).toBe(false);
  });
});
