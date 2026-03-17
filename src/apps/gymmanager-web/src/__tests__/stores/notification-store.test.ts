import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "@/stores/notification-store";
import type { NotificationPushPayload } from "@/types/notification";

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({
      unreadCount: 0,
      realtimeItems: [],
    });
  });

  it("initialises with zero unread count and empty items", () => {
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.realtimeItems).toHaveLength(0);
  });

  it("setUnreadCount updates count correctly", () => {
    useNotificationStore.getState().setUnreadCount(5);
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it("incrementUnread increments by one", () => {
    useNotificationStore.setState({ unreadCount: 3 });
    useNotificationStore.getState().incrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(4);
  });

  it("addRealtimeNotification prepends item and increments unread", () => {
    const payload: NotificationPushPayload = {
      notificationId: "n-001",
      announcementId: "a-001",
      title: "Hello",
      content: "World",
      channel: "InApp",
    };

    useNotificationStore.getState().addRealtimeNotification(payload);

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.realtimeItems).toHaveLength(1);
    expect(state.realtimeItems[0].id).toBe("n-001");
    expect(state.realtimeItems[0].announcementTitle).toBe("Hello");
    expect(state.realtimeItems[0].readAt).toBeNull();
  });

  it("markLocalRead sets readAt and decrements unread", () => {
    const payload: NotificationPushPayload = {
      notificationId: "n-002",
      announcementId: "a-002",
      title: "Second",
      content: "Content",
      channel: "InApp",
    };
    useNotificationStore.setState({ unreadCount: 2 });
    useNotificationStore.getState().addRealtimeNotification(payload);

    useNotificationStore.getState().markLocalRead("n-002");

    const state = useNotificationStore.getState();
    const item = state.realtimeItems.find((n) => n.id === "n-002");
    expect(item?.readAt).not.toBeNull();
    expect(item?.status).toBe("Read");
    expect(state.unreadCount).toBe(2); // was 2 before add (+1=3), then -1=2
  });

  it("markLocalRead does not decrement below zero", () => {
    useNotificationStore.setState({ unreadCount: 0, realtimeItems: [] });
    useNotificationStore.getState().markLocalRead("nonexistent");
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("clearRealtime empties realtimeItems", () => {
    useNotificationStore.setState({
      realtimeItems: [
        {
          id: "x",
          announcementId: "a",
          announcementTitle: "T",
          announcementContent: "C",
          channel: "InApp",
          status: "Delivered",
          sentAt: null,
          readAt: null,
        },
      ],
    });
    useNotificationStore.getState().clearRealtime();
    expect(useNotificationStore.getState().realtimeItems).toHaveLength(0);
  });
});
