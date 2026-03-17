"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/member";
import type {
  PayrollPeriodDto,
  PayrollPeriodDetailDto,
  CreatePayrollPeriodRequest,
} from "@/types/staff";

const QUERY_KEYS = {
  all: (gymHouseId: string, page: number) =>
    ["payroll-periods", gymHouseId, page] as const,
  detail: (id: string) => ["payroll-periods", id] as const,
};

export function usePayrollPeriods(gymHouseId: string, page: number = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.all(gymHouseId, page),
    queryFn: () =>
      get<PaginatedResponse<PayrollPeriodDto>>(`/payroll-periods`, {
        params: { gymHouseId, page, pageSize: 20 },
      }),
    enabled: !!gymHouseId,
  });
}

export function usePayrollPeriodById(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => get<PayrollPeriodDetailDto>(`/payroll-periods/${id}`),
    enabled: !!id,
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePayrollPeriodRequest) =>
      post<PayrollPeriodDetailDto>(`/payroll-periods`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
    },
  });
}

export function useApprovePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      patch<PayrollPeriodDetailDto>(`/payroll-periods/${id}/approve`),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      queryClient.setQueryData(QUERY_KEYS.detail(updated.id), updated);
    },
  });
}
