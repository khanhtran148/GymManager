"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "@/lib/api-client";
import type {
  ClassScheduleDto,
  CreateClassScheduleRequest,
  UpdateClassScheduleRequest,
} from "@/types/booking";

const QUERY_KEYS = {
  all: (gymHouseId: string, dayOfWeek?: number) =>
    ["class-schedules", gymHouseId, dayOfWeek] as const,
  single: (gymHouseId: string, id: string) =>
    ["class-schedules", gymHouseId, id] as const,
};

export function useClassSchedules(gymHouseId: string, dayOfWeek?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.all(gymHouseId, dayOfWeek),
    queryFn: () =>
      get<ClassScheduleDto[]>(
        `/gymhouses/${gymHouseId}/class-schedules`,
        {
          params: {
            dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : undefined,
          },
        }
      ),
    enabled: !!gymHouseId,
  });
}

export function useClassSchedule(gymHouseId: string, id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.single(gymHouseId, id),
    queryFn: () =>
      get<ClassScheduleDto>(
        `/gymhouses/${gymHouseId}/class-schedules/${id}`
      ),
    enabled: !!gymHouseId && !!id,
  });
}

export function useCreateClassSchedule(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassScheduleRequest) =>
      post<ClassScheduleDto>(
        `/gymhouses/${gymHouseId}/class-schedules`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["class-schedules", gymHouseId],
      });
    },
  });
}

export function useUpdateClassSchedule(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateClassScheduleRequest;
    }) =>
      put<ClassScheduleDto>(
        `/gymhouses/${gymHouseId}/class-schedules/${id}`,
        data
      ),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: ["class-schedules", gymHouseId],
      });
      queryClient.setQueryData(
        QUERY_KEYS.single(gymHouseId, updated.id),
        updated
      );
    },
  });
}
