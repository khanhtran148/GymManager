"use client";

import { useMounted } from "@/hooks/use-mounted";
import { PermissionGate } from "@/components/permission-gate";

interface PermissionSkeletonProps {
  permission: bigint;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shows skeleton placeholder during SSR/hydration, then delegates to PermissionGate after mount.
 * Prevents hydration flash of restricted content.
 *
 * This is a UX-only gate. The backend IPermissionChecker enforces security.
 */
export function PermissionSkeleton({
  permission,
  skeleton = null,
  children,
}: PermissionSkeletonProps) {
  const mounted = useMounted();

  if (!mounted) {
    return <>{skeleton}</>;
  }

  return (
    <PermissionGate permission={permission}>{children}</PermissionGate>
  );
}
