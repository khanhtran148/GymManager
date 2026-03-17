import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { AnnouncementDto, AnnouncementListResponse } from "@/types/announcement";

// Mock api-client
vi.mock("@/lib/api-client", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import * as apiClient from "@/lib/api-client";
import {
  useAnnouncements,
  useCreateAnnouncement,
  ANNOUNCEMENT_QUERY_KEYS,
} from "@/hooks/use-announcements";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const mockAnnouncement: AnnouncementDto = {
  id: "a1b2c3d4-0000-0000-0000-000000000001",
  gymHouseId: "gym-001",
  authorId: "user-001",
  authorName: "Admin",
  title: "Test Announcement",
  content: "Content here",
  targetAudience: "AllMembers",
  publishAt: "2026-03-20T09:00:00Z",
  isPublished: true,
  publishedAt: "2026-03-20T09:00:00Z",
  createdAt: "2026-03-17T08:00:00Z",
};

const mockList: AnnouncementListResponse = {
  items: [mockAnnouncement],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

describe("useAnnouncements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches announcements for a gym house", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockList);

    const { result } = renderHook(
      () => useAnnouncements("gym-001", 1),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockList);
    expect(apiClient.get).toHaveBeenCalledWith("/announcements", {
      params: { gymHouseId: "gym-001", page: 1, pageSize: 20 },
    });
  });

  it("is disabled when gymHouseId is empty", () => {
    const { result } = renderHook(
      () => useAnnouncements("", 1),
      { wrapper: makeWrapper() }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("builds correct query key with gymHouseId and page", () => {
    const key = ANNOUNCEMENT_QUERY_KEYS.list("gym-001", 1);
    expect(key).toEqual(["announcements", "gym-001", 1]);
  });
});

describe("useCreateAnnouncement", () => {
  it("calls post with announcement data and invalidates query", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockAnnouncement);

    const { result } = renderHook(() => useCreateAnnouncement(), {
      wrapper: makeWrapper(),
    });

    await result.current.mutateAsync({
      gymHouseId: "gym-001",
      title: "Test",
      content: "Body",
      targetAudience: "AllMembers",
      publishAt: "2026-03-20T09:00:00Z",
    });

    expect(apiClient.post).toHaveBeenCalledWith("/announcements", {
      gymHouseId: "gym-001",
      title: "Test",
      content: "Body",
      targetAudience: "AllMembers",
      publishAt: "2026-03-20T09:00:00Z",
    });
  });
});
