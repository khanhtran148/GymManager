"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApiErrorStore } from "@/stores/api-error-store";
import { ShieldX, ServerCrash } from "lucide-react";

const errorConfig = {
  403: {
    code: "403",
    title: "Access Denied",
    description:
      "You do not have permission to view this page. If you believe this is an error, please contact your administrator.",
    Icon: ShieldX,
    iconColor: "text-primary-500",
    iconBg: "bg-primary-500/10",
  },
  500: {
    code: "500",
    title: "Something Went Wrong",
    description:
      "An unexpected error occurred. Please try again later.",
    Icon: ServerCrash,
    iconColor: "text-error-text",
    iconBg: "bg-error-bg",
  },
} as const;

export function ApiErrorGuard({ children }: { children: React.ReactNode }) {
  const errorCode = useApiErrorStore((s) => s.errorCode);
  const clearError = useApiErrorStore((s) => s.clearError);
  const pathname = usePathname();

  // Clear error when user navigates to a different page
  useEffect(() => {
    clearError();
  }, [pathname, clearError]);

  if (!errorCode) return <>{children}</>;

  return <InlineErrorPanel code={errorCode} />;
}

function InlineErrorPanel({ code }: { code: 403 | 500 }) {
  const router = useRouter();
  const clearError = useApiErrorStore((s) => s.clearError);
  const config = errorConfig[code];
  const { Icon } = config;

  function handleGoBack() {
    clearError();
    router.back();
  }

  function handleGoHome() {
    clearError();
    router.push("/");
  }

  function handleRetry() {
    clearError();
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} aria-hidden="true" />
          </div>
        </div>
        <div className="text-5xl font-bold text-text-muted">{config.code}</div>
        <h1 className="text-xl font-bold text-text-primary">{config.title}</h1>
        <p className="text-sm text-text-secondary">{config.description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {code === 500 ? (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors min-h-[44px]"
            >
              Try Again
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors min-h-[44px]"
            >
              Go Back
            </button>
          )}
          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-border-muted text-text-secondary font-medium hover:bg-hover transition-colors min-h-[44px]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
