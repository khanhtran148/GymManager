import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { usePermissions, useCanDo, useRole, useHasRole } from "@/hooks/use-permissions";
import { Permission } from "@/lib/permissions";

describe("usePermissions hooks", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: { userId: "u1", email: "test@test.com", fullName: "Test" },
      token: "fake-token",
      isAuthenticated: true,
      role: "Owner",
      permissions: Permission.ViewMembers | Permission.ManageMembers | Permission.ViewClasses,
    });
  });

  describe("usePermissions", () => {
    it("returns the current permissions bigint", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current).toBe(Permission.ViewMembers | Permission.ManageMembers | Permission.ViewClasses);
    });
  });

  describe("useCanDo", () => {
    it("returns true when user has the permission", () => {
      const { result } = renderHook(() => useCanDo(Permission.ViewMembers));
      expect(result.current).toBe(true);
    });

    it("returns false when user lacks the permission", () => {
      const { result } = renderHook(() => useCanDo(Permission.ManageStaff));
      expect(result.current).toBe(false);
    });
  });

  describe("useRole", () => {
    it("returns the current role", () => {
      const { result } = renderHook(() => useRole());
      expect(result.current).toBe("Owner");
    });

    it("returns null when not authenticated", () => {
      useAuthStore.setState({ role: null });
      const { result } = renderHook(() => useRole());
      expect(result.current).toBeNull();
    });
  });

  describe("useHasRole", () => {
    it("returns true when user has one of the specified roles", () => {
      const { result } = renderHook(() => useHasRole("Owner", "HouseManager"));
      expect(result.current).toBe(true);
    });

    it("returns false when user role is not in the list", () => {
      useAuthStore.setState({ role: "Member" });
      const { result } = renderHook(() => useHasRole("Owner", "HouseManager"));
      expect(result.current).toBe(false);
    });

    it("returns false when role is null", () => {
      useAuthStore.setState({ role: null });
      const { result } = renderHook(() => useHasRole("Owner"));
      expect(result.current).toBe(false);
    });
  });
});
