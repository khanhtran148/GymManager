"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type Toast } from "@/stores/toast-store";

interface ToastProps {
  toast: Toast;
}

const variantConfig = {
  error: {
    container: "bg-error-bg border border-error-border shadow-lg",
    icon: "text-error-text",
    text: "text-error-text",
    Icon: AlertCircle,
  },
  success: {
    container: "bg-success-bg border border-success-border shadow-lg",
    icon: "text-success-text",
    text: "text-success-text",
    Icon: CheckCircle,
  },
  info: {
    container: "bg-card border border-border-muted shadow-lg",
    icon: "text-primary-500",
    text: "text-text-primary",
    Icon: Info,
  },
} as const;

export function ToastItem({ toast }: ToastProps) {
  const removeToast = useToastStore((s) => s.removeToast);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    timerRef.current = setTimeout(() => {
      removeToast(toast.id);
    }, duration);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, toast.duration, removeToast]);

  const config = variantConfig[toast.variant];
  const { Icon } = config;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        "flex items-start gap-3 w-full max-w-sm rounded-xl px-4 py-3",
        "animate-in slide-in-from-right-5 fade-in duration-300",
        config.container
      )}
    >
      <Icon
        className={cn("w-5 h-5 shrink-0 mt-0.5", config.icon)}
        aria-hidden="true"
      />
      <p className={cn("flex-1 text-sm font-medium", config.text)}>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-text-muted hover:text-text-secondary transition-colors min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
