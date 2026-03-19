"use client";

import { create } from "zustand";
import type { RoleDefinition, PermissionDefinition, RouteAccessRule, RolesMetadata } from "@/types/rbac";

interface PermissionCategory {
  category: string;
  permissions: PermissionDefinition[];
}

interface RbacState {
  // Raw data from API
  roles: RoleDefinition[];
  permissions: PermissionDefinition[];
  routeAccess: RouteAccessRule[];

  // Status
  isLoaded: boolean;

  // Derived: permission name → bigint flag (1n << BigInt(bitPosition))
  permissionMap: Record<string, bigint>;

  // Derived: only roles where isAssignable === true
  assignableRoles: RoleDefinition[];

  // Derived: permissions grouped by category
  permissionCategories: PermissionCategory[];

  // Actions
  setMetadata: (data: RolesMetadata) => void;
  reset: () => void;
}

function derivePermissionMap(permissions: PermissionDefinition[]): Record<string, bigint> {
  return permissions.reduce<Record<string, bigint>>((acc, p) => {
    acc[p.name] = 1n << BigInt(p.bitPosition);
    return acc;
  }, {});
}

function deriveAssignableRoles(roles: RoleDefinition[]): RoleDefinition[] {
  return roles.filter((r) => r.isAssignable);
}

function derivePermissionCategories(permissions: PermissionDefinition[]): PermissionCategory[] {
  const grouped = permissions.reduce<Record<string, PermissionDefinition[]>>((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = [];
    }
    acc[p.category].push(p);
    return acc;
  }, {});

  return Object.entries(grouped).map(([category, perms]) => ({
    category,
    permissions: perms,
  }));
}

export const useRbacStore = create<RbacState>()((set) => ({
  roles: [],
  permissions: [],
  routeAccess: [],
  isLoaded: false,
  permissionMap: {},
  assignableRoles: [],
  permissionCategories: [],

  setMetadata: (data: RolesMetadata) => {
    set({
      roles: data.roles,
      permissions: data.permissions,
      routeAccess: data.routeAccess,
      isLoaded: true,
      permissionMap: derivePermissionMap(data.permissions),
      assignableRoles: deriveAssignableRoles(data.roles),
      permissionCategories: derivePermissionCategories(data.permissions),
    });
  },

  reset: () => {
    set({
      roles: [],
      permissions: [],
      routeAccess: [],
      isLoaded: false,
      permissionMap: {},
      assignableRoles: [],
      permissionCategories: [],
    });
  },
}));
