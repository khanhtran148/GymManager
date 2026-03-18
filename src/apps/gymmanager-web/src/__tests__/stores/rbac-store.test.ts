import { describe, it, expect, beforeEach } from "vitest";
import { useRbacStore } from "@/stores/rbac-store";
import { testRolesMetadata } from "@/__tests__/fixtures/rbac-metadata";

describe("rbac-store", () => {
  beforeEach(() => {
    useRbacStore.getState().reset();
  });

  describe("initial state", () => {
    it("starts with empty collections and isLoaded false", () => {
      const state = useRbacStore.getState();
      expect(state.roles).toEqual([]);
      expect(state.permissions).toEqual([]);
      expect(state.routeAccess).toEqual([]);
      expect(state.isLoaded).toBe(false);
      expect(state.permissionMap).toEqual({});
      expect(state.assignableRoles).toEqual([]);
      expect(state.permissionCategories).toEqual([]);
    });
  });

  describe("setMetadata", () => {
    it("sets isLoaded to true after metadata load", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      expect(useRbacStore.getState().isLoaded).toBe(true);
    });

    it("stores roles, permissions, and routeAccess verbatim", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      const state = useRbacStore.getState();
      expect(state.roles).toEqual(testRolesMetadata.roles);
      expect(state.permissions).toEqual(testRolesMetadata.permissions);
      expect(state.routeAccess).toEqual(testRolesMetadata.routeAccess);
    });

    it("does not expose routeAccessMap (removed as redundant alias)", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      // routeAccessMap was removed; only routeAccess should exist
      const state = useRbacStore.getState() as unknown as Record<string, unknown>;
      expect("routeAccessMap" in state).toBe(false);
    });
  });

  describe("derived value: permissionMap", () => {
    it("maps each permission name to its bigint flag (1n << bitPosition)", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      const { permissionMap } = useRbacStore.getState();

      expect(permissionMap["ViewMembers"]).toBe(1n << 0n);   // bitPosition 0
      expect(permissionMap["ManageMembers"]).toBe(1n << 1n); // bitPosition 1
      expect(permissionMap["ViewSubscriptions"]).toBe(1n << 2n);
      expect(permissionMap["ManageWaitlist"]).toBe(1n << 25n);
    });

    it("has an entry for every permission in the metadata", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      const { permissionMap } = useRbacStore.getState();
      for (const perm of testRolesMetadata.permissions) {
        expect(permissionMap[perm.name]).toBeDefined();
      }
    });
  });

  describe("derived value: assignableRoles", () => {
    it("includes only roles where isAssignable is true", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      const { assignableRoles } = useRbacStore.getState();
      const names = assignableRoles.map((r) => r.name);
      expect(names).toContain("HouseManager");
      expect(names).toContain("Trainer");
      expect(names).toContain("Staff");
      expect(names).toContain("Member");
    });

    it("excludes Owner (isAssignable: false)", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      const { assignableRoles } = useRbacStore.getState();
      expect(assignableRoles.map((r) => r.name)).not.toContain("Owner");
    });
  });

  describe("derived value: permissionCategories", () => {
    it("groups permissions by category", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      const { permissionCategories } = useRbacStore.getState();
      const categories = permissionCategories.map((c) => c.category);
      expect(categories).toContain("Members");
      expect(categories).toContain("Subscriptions");
      expect(categories).toContain("Finance");
    });

    it("puts ViewMembers and ManageMembers in the Members category", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      const { permissionCategories } = useRbacStore.getState();
      const membersCategory = permissionCategories.find((c) => c.category === "Members");
      expect(membersCategory).toBeDefined();
      const names = membersCategory!.permissions.map((p) => p.name);
      expect(names).toContain("ViewMembers");
      expect(names).toContain("ManageMembers");
    });

    it("has at least as many categories as distinct category values in raw data", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      const { permissionCategories } = useRbacStore.getState();
      const distinctCategories = new Set(testRolesMetadata.permissions.map((p) => p.category));
      expect(permissionCategories.length).toBe(distinctCategories.size);
    });
  });

  describe("reset", () => {
    it("clears all state and sets isLoaded back to false", () => {
      useRbacStore.getState().setMetadata(testRolesMetadata);
      expect(useRbacStore.getState().isLoaded).toBe(true);

      useRbacStore.getState().reset();

      const state = useRbacStore.getState();
      expect(state.roles).toEqual([]);
      expect(state.permissions).toEqual([]);
      expect(state.routeAccess).toEqual([]);
      expect(state.isLoaded).toBe(false);
      expect(state.permissionMap).toEqual({});
      expect(state.assignableRoles).toEqual([]);
      expect(state.permissionCategories).toEqual([]);
    });
  });
});
