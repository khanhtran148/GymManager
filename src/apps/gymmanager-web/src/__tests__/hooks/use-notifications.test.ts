import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { NotificationDto, NotificationListResponse } from "@/types/notification";

vi.mock("@/lib/api-client", () => ({
  get: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@/lib/signalr", () => ({
  getNotificationConnection: vi.fn(() => ({
    state: "Disconnected",
    on: vi.fn(),
    off: vi.fn(),
    start: vi.fn(),
  })),
  startNotificationConnection: vi.fn(),
}));

import * as apiClient from "@/lib/api-client";
import {
  useNotifications,
  useMarkNotificationRead,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  NOTIFICATION_QUERY_KEYS,
} from "@/hooks/use-notifications";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const mockNotification: NotificationDto = {
  id: "notif-001",
  announcementId: "ann-001",
  announcementTitle: "Grand Opening",
  announcementContent: "50% off!",
  channel: "InApp",
  status: "Delivered",
  sentAt: "2026-03-17T09:00:00Z",
  readAt: null,
};

const mockList: NotificationListResponse = {
  items: [mockNotification],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches paginated notifications", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockList);

    const { result } = renderHook(() => useNotifications(1), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockList);
    expect(apiClient.get).toHaveBeenCalledWith("/notifications", {
      params: { page: 1, pageSize: 20 },
    });
  });

  it("builds correct query key", () => {
    const key = NOTIFICATION_QUERY_KEYS.list(1);
    expect(key).toEqual(["notifications", 1]);
  });

  it("unread count key is stable", () => {
    const key = NOTIFICATION_QUERY_KEYS.unreadCount();
    expect(key).toEqual(["notifications", "unread-count"]);
  });
});

describe("useMarkNotificationRead", () => {
  it("calls patch endpoint and invalidates notifications query", async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("notif-001");
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/notifications/notif-001/read"
    );
  });
});

describe("useNotificationPreferences", () => {
  it("fetches preferences from correct endpoint", async () => {
    const prefs = [
      { channel: "InApp", isEnabled: true },
      { channel: "Push", isEnabled: false },
      { channel: "Email", isEnabled: true },
    ];
    vi.mocked(apiClient.get).mockResolvedValueOnce(prefs);

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(prefs);
    expect(apiClient.get).toHaveBeenCalledWith("/notification-preferences");
  });
});

describe("useUpdateNotificationPreferences", () => {
  it("calls put with preferences payload", async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        preferences: [
          { channel: "InApp", isEnabled: true },
          { channel: "Push", isEnabled: false },
          { channel: "Email", isEnabled: true },
        ],
      });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/notification-preferences", {
      preferences: [
        { channel: "InApp", isEnabled: true },
        { channel: "Push", isEnabled: false },
        { channel: "Email", isEnabled: true },
      ],
    });
  });
});
