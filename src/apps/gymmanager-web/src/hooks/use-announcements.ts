"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";
import type {
  AnnouncementDto,
  AnnouncementListResponse,
  CreateAnnouncementRequest,
} from "@/types/announcement";

export const ANNOUNCEMENT_QUERY_KEYS = {
  list: (gymHouseId: string, page: number) =>
    ["announcements", gymHouseId, page] as const,
  single: (id: string) => ["announcements", id] as const,
};

export function useAnnouncements(gymHouseId: string, page: number = 1) {
  return useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEYS.list(gymHouseId, page),
    queryFn: () =>
      get<AnnouncementListResponse>("/announcements", {
        params: { gymHouseId, page, pageSize: 20 },
      }),
    enabled: !!gymHouseId,
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEYS.single(id),
    queryFn: () => get<AnnouncementDto>(`/announcements/${id}`),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnouncementRequest) =>
      post<AnnouncementDto>("/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}
