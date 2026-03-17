"use client";

import { memo } from "react";
import { useHasRole } from "@/hooks/use-permissions";
import type { RoleType } from "@/lib/roles";

interface RoleGateProps {
  roles: RoleType[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders children only if the current user has one of the allowed roles.
 * Renders fallback (or nothing) if the role is not allowed.
 *
 * This is a UX-only gate. The backend IPermissionChecker enforces security.
 */
export const RoleGate = memo(function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const hasRole = useHasRole(...roles);
  return hasRole ? <>{children}</> : <>{fallback}</>;
});
