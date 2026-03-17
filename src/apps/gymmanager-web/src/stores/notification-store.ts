"use client";

import { create } from "zustand";
import type { NotificationDto, NotificationPushPayload } from "@/types/notification";

interface NotificationState {
  unreadCount: number;
  realtimeItems: NotificationDto[];
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  addRealtimeNotification: (payload: NotificationPushPayload) => void;
  markLocalRead: (id: string) => void;
  clearRealtime: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  realtimeItems: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  addRealtimeNotification: (payload) =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
      realtimeItems: [
        {
          id: payload.notificationId,
          announcementId: payload.announcementId,
          announcementTitle: payload.title,
          announcementContent: payload.content,
          channel: payload.channel,
          status: "Delivered",
          sentAt: new Date().toISOString(),
          readAt: null,
        },
        ...state.realtimeItems,
      ],
    })),

  markLocalRead: (id) =>
    set((state) => ({
      realtimeItems: state.realtimeItems.map((n) =>
        n.id === id
          ? { ...n, status: "Read" as const, readAt: new Date().toISOString() }
          : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  clearRealtime: () => set({ realtimeItems: [] }),
}));
