"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/member";
import type {
  StaffDto,
  StaffType,
  CreateStaffRequest,
  UpdateStaffRequest,
} from "@/types/staff";

const QUERY_KEYS = {
  all: (gymHouseId: string, page: number, staffType?: StaffType) =>
    ["staff", gymHouseId, page, staffType] as const,
  detail: (id: string) => ["staff", id] as const,
};

export function useStaff(gymHouseId: string, page: number = 1, staffType?: StaffType) {
  return useQuery({
    queryKey: QUERY_KEYS.all(gymHouseId, page, staffType),
    queryFn: () =>
      get<PaginatedResponse<StaffDto>>(`/staff`, {
        params: {
          gymHouseId,
          page,
          pageSize: 20,
          staffType: staffType ?? undefined,
        },
      }),
    enabled: !!gymHouseId,
  });
}

export function useStaffById(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => get<StaffDto>(`/staff/${id}`),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffRequest) => post<StaffDto>(`/staff`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffRequest }) =>
      put<StaffDto>(`/staff/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.setQueryData(QUERY_KEYS.detail(updated.id), updated);
    },
  });
}
