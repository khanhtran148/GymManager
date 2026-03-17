"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, patch, put } from "@/lib/api-client";
import {
  getNotificationConnection,
  startNotificationConnection,
} from "@/lib/signalr";
import { useNotificationStore } from "@/stores/notification-store";
import type {
  NotificationListResponse,
  NotificationPreferenceDto,
  UpdateNotificationPreferencesRequest,
  NotificationPushPayload,
} from "@/types/notification";

export const NOTIFICATION_QUERY_KEYS = {
  list: (page: number) => ["notifications", page] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
  preferences: () => ["notification-preferences"] as const,
};

export function useNotifications(page: number = 1) {
  const { setUnreadCount, addRealtimeNotification } = useNotificationStore();
  const queryClient = useQueryClient();

  // Wire SignalR real-time subscription
  useEffect(() => {
    const conn = getNotificationConnection();

    const handler = (payload: NotificationPushPayload) => {
      addRealtimeNotification(payload);
      // Invalidate so notification list re-fetches
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    conn.on("ReceiveNotification", handler);
    startNotificationConnection();

    return () => {
      conn.off("ReceiveNotification", handler);
    };
  }, [addRealtimeNotification, queryClient]);

  const query = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(page),
    queryFn: async () => {
      const result = await get<NotificationListResponse>("/notifications", {
        params: { page, pageSize: 20 },
      });
      // Sync unread count from server on first page
      if (page === 1) {
        const unread = result.items.filter(
          (n) => n.status !== "Read"
        ).length;
        setUnreadCount(unread);
      }
      return result;
    },
  });

  return query;
}

export function useMarkNotificationRead() {
  const { markLocalRead } = useNotificationStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patch(`/notifications/${id}/read`),
    onSuccess: (_data, id) => {
      markLocalRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.preferences(),
    queryFn: () =>
      get<NotificationPreferenceDto[]>("/notification-preferences"),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateNotificationPreferencesRequest) =>
      put("/notification-preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.preferences(),
      });
    },
  });
}
