"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";
import type { TimeSlotDto, CreateTimeSlotRequest } from "@/types/booking";

const QUERY_KEYS = {
  all: (gymHouseId: string, from?: string, to?: string) =>
    ["time-slots", gymHouseId, from, to] as const,
};

export function useTimeSlots(gymHouseId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.all(gymHouseId, from, to),
    queryFn: () =>
      get<TimeSlotDto[]>(`/gymhouses/${gymHouseId}/time-slots`, {
        params: {
          from: from || undefined,
          to: to || undefined,
        },
      }),
    enabled: !!gymHouseId,
  });
}

export function useCreateTimeSlot(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeSlotRequest) =>
      post<TimeSlotDto>(`/gymhouses/${gymHouseId}/time-slots`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-slots", gymHouseId] });
    },
  });
}
