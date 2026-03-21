"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import type {
  GymHouseDto,
  CreateGymHouseRequest,
  UpdateGymHouseRequest,
} from "@/types/gym-house";
import type { GymHousePublic } from "@/types/invitation";
import { getPublicGymHouses } from "@/lib/invitations";

const QUERY_KEYS = {
  all: ["gym-houses"] as const,
  public: ["gym-houses", "public"] as const,
  single: (id: string) => ["gym-houses", id] as const,
};

export function useGymHouses() {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: () => get<GymHouseDto[]>("/gym-houses"),
  });
}

export function usePublicGymHouses() {
  return useQuery<GymHousePublic[]>({
    queryKey: QUERY_KEYS.public,
    queryFn: getPublicGymHouses,
    staleTime: 5 * 60 * 1000, // 5 minutes — public data changes infrequently
  });
}

export function useGymHouse(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.single(id),
    queryFn: () => get<GymHouseDto>(`/gym-houses/${id}`),
    enabled: !!id,
  });
}

export function useCreateGymHouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGymHouseRequest) =>
      post<GymHouseDto>("/gym-houses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

export function useUpdateGymHouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGymHouseRequest }) =>
      put<GymHouseDto>(`/gym-houses/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.setQueryData(QUERY_KEYS.single(updated.id), updated);
    },
  });
}

export function useDeleteGymHouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/gym-houses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}
