/**
 * Permission utility functions for frontend UX-only permission checks.
 *
 * All frontend permission checks are UX-only.
 * The backend IPermissionChecker remains the security boundary.
 *
 * The hardcoded Permission constant has been removed in favour of the dynamic
 * permissionMap derived from the RBAC metadata API (/roles/metadata).
 * Use `useRbacStore().permissionMap` to look up permission flags by name.
 */

/**
 * Build a permission flag from a bit position.
 * Mirrors the backend: flag = 1L << bitPosition
 */
export function buildPermissionFlag(bitPosition: number): bigint {
  return 1n << BigInt(bitPosition);
}

/**
 * Check if a user has ALL of the required permission bits set.
 */
export function hasPermission(userPermissions: bigint, required: bigint): boolean {
  return (userPermissions & required) === required;
}

/**
 * Check if a user has ANY of the required permissions.
 */
export function hasAnyPermission(userPermissions: bigint, ...required: bigint[]): boolean {
  return required.some((p) => (userPermissions & p) === p);
}
