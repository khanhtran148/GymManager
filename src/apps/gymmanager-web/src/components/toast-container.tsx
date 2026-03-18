"use client";

import { useToastStore } from "@/stores/toast-store";
import { ToastItem } from "@/components/ui/toast";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
