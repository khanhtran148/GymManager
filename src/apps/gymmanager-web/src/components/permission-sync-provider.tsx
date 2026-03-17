"use client";

import { usePermissionSync } from "@/hooks/use-permission-sync";

interface PermissionSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Client wrapper that activates real-time permission sync via SignalR.
 * Add this inside the dashboard layout so it runs on all dashboard pages.
 */
export function PermissionSyncProvider({ children }: PermissionSyncProviderProps) {
  usePermissionSync();
  return <>{children}</>;
}
