"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/member";
import type {
  TransactionDto,
  PnLReportDto,
  RevenueMetricsDto,
  RecordTransactionRequest,
  ReverseTransactionRequest,
  TransactionFilters,
} from "@/types/transaction";

const QUERY_KEYS = {
  all: (gymHouseId: string, page: number, filters: TransactionFilters) =>
    ["transactions", gymHouseId, page, filters] as const,
  pnl: (gymHouseId: string, from: string, to: string) =>
    ["pnl-report", gymHouseId, from, to] as const,
  metrics: (gymHouseId: string, from: string, to: string) =>
    ["revenue-metrics", gymHouseId, from, to] as const,
};

export function useTransactions(
  gymHouseId: string,
  page: number = 1,
  filters: TransactionFilters = {}
) {
  return useQuery({
    queryKey: QUERY_KEYS.all(gymHouseId, page, filters),
    queryFn: () =>
      get<PaginatedResponse<TransactionDto>>(
        `/gymhouses/${gymHouseId}/transactions`,
        {
          params: {
            page,
            pageSize: 20,
            type: filters.type ?? undefined,
            direction: filters.direction ?? undefined,
            from: filters.from ?? undefined,
            to: filters.to ?? undefined,
          },
        }
      ),
    enabled: !!gymHouseId,
  });
}

export function useRecordTransaction(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordTransactionRequest) =>
      post<TransactionDto>(`/gymhouses/${gymHouseId}/transactions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", gymHouseId] });
      queryClient.invalidateQueries({ queryKey: ["pnl-report", gymHouseId] });
      queryClient.invalidateQueries({ queryKey: ["revenue-metrics", gymHouseId] });
    },
  });
}

export function useReverseTransaction(gymHouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReverseTransactionRequest }) =>
      post<TransactionDto>(
        `/gymhouses/${gymHouseId}/transactions/${id}/reverse`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", gymHouseId] });
      queryClient.invalidateQueries({ queryKey: ["pnl-report", gymHouseId] });
      queryClient.invalidateQueries({ queryKey: ["revenue-metrics", gymHouseId] });
    },
  });
}

export function usePnLReport(gymHouseId: string, from: string, to: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pnl(gymHouseId, from, to),
    queryFn: () =>
      get<PnLReportDto>(`/gymhouses/${gymHouseId}/reports/pnl`, {
        params: { from, to },
      }),
    enabled: !!gymHouseId && !!from && !!to,
  });
}

export function useRevenueMetrics(gymHouseId: string, from: string, to: string) {
  return useQuery({
    queryKey: QUERY_KEYS.metrics(gymHouseId, from, to),
    queryFn: () =>
      get<RevenueMetricsDto>(
        `/gymhouses/${gymHouseId}/reports/revenue-metrics`,
        { params: { from, to } }
      ),
    enabled: !!gymHouseId && !!from && !!to,
  });
}
