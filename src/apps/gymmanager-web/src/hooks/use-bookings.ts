"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, del, patch } from "@/lib/api-client";
import type {
  BookingDto,
  CreateBookingRequest,
  CheckInRequest,
} from "@/types/booking";
import type { PaginatedResponse } from "@/types/member";

const QUERY_KEYS = {
  all: (gymHouseId: string, page: number, from?: string, to?: string) =>
    ["bookings", gymHouseId, page, from, to] as const,
  single: (gymHouseId: string, id: string) =>
    ["bookings", gymHouseId, id] as const,
};

export function useBookings(
  gymHouseId: string,
  page: number = 1,
  from?: string,
  to?: string
) {
  return useQuery({
    queryKey: QUERY_KEYS.all(gymHouseId, page, from, to),
    queryFn: () =>
      get<PaginatedResponse<BookingDto>>(
        `/gymhouses/${gymHouseId}/bookings`,
        {
          params: {
            page,
            pageSize: 20,
            from: from || undefined,
            to: to || undefined,
          },
        }
      ),
    enabled: !!gymHouseId,
  });
}

export function useBooking(gymHouseId: string, id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.single(gymHouseId, id),
    queryFn: () =>
      get<BookingDto>(`/gymhouses/${gymHouseId}/bookings/${id}`),
    enabled: !!gymHouseId && !!id,
  });
}

export function useCreateBooking(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingRequest) =>
      post<BookingDto>(`/gymhouses/${gymHouseId}/bookings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", gymHouseId] });
    },
  });
}

export function useCancelBooking(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del(`/gymhouses/${gymHouseId}/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", gymHouseId] });
    },
  });
}

export function useCheckIn(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CheckInRequest }) =>
      patch<BookingDto>(
        `/gymhouses/${gymHouseId}/bookings/${id}/check-in`,
        data
      ),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", gymHouseId] });
      queryClient.setQueryData(
        QUERY_KEYS.single(gymHouseId, updated.id),
        updated
      );
    },
  });
}

export function useMarkNoShow(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      patch<void>(
        `/gymhouses/${gymHouseId}/bookings/${id}/no-show`,
        undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", gymHouseId] });
    },
  });
}
