"use client";

import { useEffect, useCallback } from "react";
import {
  getNotificationConnection,
  startNotificationConnection,
} from "@/lib/signalr";
import { useAuthStore } from "@/stores/auth-store";
import { post } from "@/lib/api-client";
import type { AuthResponse } from "@/types/auth";

interface PermissionsChangedPayload {
  userId: string;
  newRole: string;
  newPermissions: string;
}

/**
 * Listens for SignalR "PermissionsChanged" events and triggers token refresh
 * to update the user's role and permissions in the auth store.
 *
 * Fallback: permissions also update on the regular 15-minute token refresh cycle.
 */
export function usePermissionSync(): void {
  const handlePermissionsChanged = useCallback(
    async (payload: PermissionsChangedPayload) => {
      try {
        // Validate event is for the current user (guard against cross-user group bugs)
        const currentUserId = useAuthStore.getState().user?.userId;
        if (payload.userId && currentUserId && payload.userId !== currentUserId) return;

        const accessToken =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refresh_token")
            : null;

        if (!accessToken || !refreshToken) return;

        const response = await post<AuthResponse>("/auth/refresh", {
          accessToken,
          refreshToken,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", response.accessToken);
          localStorage.setItem("refresh_token", response.refreshToken);
        }

        useAuthStore.getState().updateFromToken(response.accessToken);
      } catch (error) {
        // Log for debugging; permissions will update on next regular token refresh (~15 min)
        if (process.env.NODE_ENV !== "production") {
          console.warn("[PermissionSync] Token refresh failed after role change:", error);
        }
      }
    },
    []
  );

  useEffect(() => {
    const conn = getNotificationConnection();

    conn.on("PermissionsChanged", handlePermissionsChanged);
    startNotificationConnection();

    return () => {
      conn.off("PermissionsChanged", handlePermissionsChanged);
    };
  }, [handlePermissionsChanged]);
}
