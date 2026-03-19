"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "@/lib/api-client";
import type {
  MemberDto,
  CreateMemberRequest,
  UpdateMemberRequest,
  PaginatedResponse,
} from "@/types/member";

const QUERY_KEYS = {
  all: (gymHouseId: string, page: number, search: string) =>
    ["members", gymHouseId, page, search] as const,
  single: (gymHouseId: string, id: string) => ["members", gymHouseId, id] as const,
};

export function useMembers(gymHouseId: string | null, page: number = 1, search: string = "") {
  return useQuery({
    queryKey: QUERY_KEYS.all(gymHouseId ?? "", page, search),
    queryFn: () =>
      get<PaginatedResponse<MemberDto>>(`/gymhouses/${gymHouseId}/members`, {
        params: { page, pageSize: 20, search: search || undefined },
      }),
    enabled: !!gymHouseId,
  });
}

export function useMember(gymHouseId: string | null, id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.single(gymHouseId ?? "", id),
    queryFn: () => get<MemberDto>(`/gymhouses/${gymHouseId}/members/${id}`),
    enabled: !!gymHouseId && !!id,
  });
}

export function useCreateMember(gymHouseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberRequest) =>
      post<MemberDto>(`/gymhouses/${gymHouseId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useUpdateMember(gymHouseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberRequest }) =>
      put<MemberDto>(`/gymhouses/${gymHouseId}/members/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.setQueryData(QUERY_KEYS.single(gymHouseId ?? "", updated.id), updated);
    },
  });
}
