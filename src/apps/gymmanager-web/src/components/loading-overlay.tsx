"use client";

import { useLoadingStore } from "@/stores/loading-store";

export function LoadingOverlay() {
  const isLoading = useLoadingStore((s) => s.isLoading);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-page/50 backdrop-blur-[2px] cursor-wait"
      aria-busy="true"
      aria-label="Loading..."
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-surface-300 dark:border-surface-600 border-t-primary-500 animate-spin" />
        <span className="text-xs font-medium text-text-muted">Loading...</span>
      </div>
    </div>
  );
}
