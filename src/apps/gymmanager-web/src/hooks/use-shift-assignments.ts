"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "@/lib/api-client";
import type {
  ShiftAssignmentDto,
  CreateShiftAssignmentRequest,
  UpdateShiftAssignmentRequest,
} from "@/types/staff";

const QUERY_KEYS = {
  all: (gymHouseId: string, from: string, to: string, staffId?: string) =>
    ["shift-assignments", gymHouseId, from, to, staffId] as const,
};

export function useShiftAssignments(
  gymHouseId: string,
  from: string,
  to: string,
  staffId?: string
) {
  return useQuery({
    queryKey: QUERY_KEYS.all(gymHouseId, from, to, staffId),
    queryFn: () =>
      get<ShiftAssignmentDto[]>(`/shift-assignments`, {
        params: {
          gymHouseId,
          from,
          to,
          staffId: staffId ?? undefined,
        },
      }),
    enabled: !!gymHouseId && !!from && !!to,
  });
}

export function useCreateShiftAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShiftAssignmentRequest) =>
      post<ShiftAssignmentDto>(`/shift-assignments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
    },
  });
}

export function useUpdateShiftAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShiftAssignmentRequest }) =>
      put<ShiftAssignmentDto>(`/shift-assignments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
    },
  });
}
