"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import type { RolesMetadata } from "@/types/rbac";

export const ROLES_METADATA_QUERY_KEY = ["roles-metadata"] as const;

export function useRolesMetadata() {
  return useQuery({
    queryKey: ROLES_METADATA_QUERY_KEY,
    queryFn: () => get<RolesMetadata>("/roles/metadata"),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
  });
}
