"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/lib/api-client";
import type {
  SubscriptionDto,
  CreateSubscriptionRequest,
  RenewSubscriptionRequest,
  FreezeSubscriptionRequest,
} from "@/types/subscription";

const QUERY_KEYS = {
  byMember: (memberId: string) => ["subscriptions", "member", memberId] as const,
};

export function useSubscriptions(memberId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.byMember(memberId),
    queryFn: () =>
      get<SubscriptionDto[]>(`/members/${memberId}/subscriptions`),
    enabled: !!memberId,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string;
      data: CreateSubscriptionRequest;
    }) => post<SubscriptionDto>(`/members/${memberId}/subscriptions`, data),
    onSuccess: (_result, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byMember(memberId) });
    },
  });
}

export function useRenewSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      memberId,
      data,
    }: {
      subscriptionId: string;
      memberId: string;
      data: RenewSubscriptionRequest;
    }) =>
      patch<SubscriptionDto>(`/subscriptions/${subscriptionId}/renew`, data),
    onSuccess: (_result, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byMember(memberId) });
    },
  });
}

export function useFreezeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      memberId,
      data,
    }: {
      subscriptionId: string;
      memberId: string;
      data: FreezeSubscriptionRequest;
    }) =>
      patch<SubscriptionDto>(`/subscriptions/${subscriptionId}/freeze`, data),
    onSuccess: (_result, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byMember(memberId) });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      memberId,
    }: {
      subscriptionId: string;
      memberId: string;
    }) => patch<SubscriptionDto>(`/subscriptions/${subscriptionId}/cancel`),
    onSuccess: (_result, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byMember(memberId) });
    },
  });
}
