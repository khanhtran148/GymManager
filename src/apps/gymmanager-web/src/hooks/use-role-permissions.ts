"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "@/lib/api-client";

export interface RolePermissionDto {
  role: string;
  roleValue: number;
  permissions: string; // BigInt as string
  permissionNames: string[];
}

export interface RolePermissionsResponse {
  items: RolePermissionDto[];
}

export interface UpdatePermissionsRequest {
  permissions: string; // BigInt as string
}

export const ROLE_PERMISSION_QUERY_KEYS = {
  all: ["role-permissions"] as const,
  list: () => ["role-permissions", "list"] as const,
};

export function useRolePermissions() {
  return useQuery({
    queryKey: ROLE_PERMISSION_QUERY_KEYS.list(),
    queryFn: () => get<RolePermissionsResponse>("/roles/permissions"),
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string }) =>
      put<void>(`/roles/${role}/permissions`, { permissions } satisfies UpdatePermissionsRequest),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROLE_PERMISSION_QUERY_KEYS.all });
    },
  });
}

export function useResetDefaultPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<void>("/roles/reset-defaults"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROLE_PERMISSION_QUERY_KEYS.all });
    },
  });
}
