"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { parseApiError } from "@/lib/error-utils";
import { useToastStore } from "@/stores/toast-store";

function isAxiosLikeError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "isAxiosError" in error &&
    (error as Record<string, unknown>).isAxiosError === true
  );
}

function getHttpStatus(error: unknown): number | undefined {
  if (!isAxiosLikeError(error)) return undefined;
  const status = (error as Record<string, unknown> & { response?: { status?: unknown } })
    .response?.status;
  return typeof status === "number" ? status : undefined;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
          mutations: {
            onError: (error) => {
              const status = getHttpStatus(error);
              // 401, 403, 500+ are handled by the Axios interceptor — skip to avoid double-toast.
              // Toast for 400 validation errors (and other unhandled statuses) here.
              if (status === undefined || status === 400 || (status > 400 && status < 500 && status !== 403)) {
                const message = parseApiError(error);
                useToastStore.getState().addToast({ variant: "error", message });
              }
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
