"use client";

import { memo } from "react";
import { useCanDo } from "@/hooks/use-permissions";

interface PermissionGateProps {
  permission: bigint;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders children only if the current user has the required permission.
 * Renders fallback (or nothing) if the permission is absent.
 *
 * This is a UX-only gate. The backend IPermissionChecker enforces security.
 */
export const PermissionGate = memo(function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const canDo = useCanDo(permission);
  return canDo ? <>{children}</> : <>{fallback}</>;
});
