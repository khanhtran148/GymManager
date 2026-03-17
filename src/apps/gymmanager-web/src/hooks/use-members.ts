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
  all: (page: number, search: string) => ["members", page, search] as const,
  single: (id: string) => ["members", id] as const,
};

export function useMembers(page: number = 1, search: string = "") {
  return useQuery({
    queryKey: QUERY_KEYS.all(page, search),
    queryFn: () =>
      get<PaginatedResponse<MemberDto>>("/members", {
        params: { page, pageSize: 20, search: search || undefined },
      }),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.single(id),
    queryFn: () => get<MemberDto>(`/members/${id}`),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberRequest) => post<MemberDto>("/members", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberRequest }) =>
      put<MemberDto>(`/members/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.setQueryData(QUERY_KEYS.single(updated.id), updated);
    },
  });
}
