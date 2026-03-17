"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/lib/api-client";

export interface RoleUserDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface RoleUsersResponse {
  items: RoleUserDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ChangeUserRoleRequest {
  role: string;
}

export const ROLE_USERS_QUERY_KEYS = {
  all: ["role-users"] as const,
  list: (role: string, page: number, pageSize: number) =>
    ["role-users", role, page, pageSize] as const,
};

export function useRoleUsers(role: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ROLE_USERS_QUERY_KEYS.list(role, page, pageSize),
    queryFn: () =>
      get<RoleUsersResponse>(`/roles/${role}/users`, {
        params: { page, pageSize },
      }),
    enabled: !!role,
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      put<void>(`/users/${userId}/role`, { role } satisfies ChangeUserRoleRequest),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROLE_USERS_QUERY_KEYS.all });
    },
  });
}
