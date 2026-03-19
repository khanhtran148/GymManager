"use client";

import { useAuthStore } from "@/stores/auth-store";
import { hasPermission } from "@/lib/permissions";
import type { RoleType } from "@/lib/roles";

/**
 * Returns the current user's permissions as a BigInt bitmask.
 */
export function usePermissions(): bigint {
  return useAuthStore((state) => state.permissions);
}

/**
 * Returns true if the current user has the specified permission.
 */
export function useCanDo(permission: bigint): boolean {
  const permissions = usePermissions();
  return hasPermission(permissions, permission);
}

/**
 * Returns the current user's role.
 */
export function useRole(): RoleType | null {
  return useAuthStore((state) => state.role);
}

/**
 * Returns true if the current user has one of the specified roles.
 */
export function useHasRole(...roles: RoleType[]): boolean {
  const role = useRole();
  if (role === null) return false;
  return roles.includes(role);
}
