"use client";

import { useEffect } from "react";
import { useRolesMetadata } from "@/hooks/use-roles-metadata";
import { useRbacStore } from "@/stores/rbac-store";
import type { RouteAccessRule } from "@/types/rbac";

interface RbacProviderProps {
  children: React.ReactNode;
}

/**
 * Loads RBAC metadata from the API on mount and writes it to the Zustand store.
 * Also serialises the routeAccess list to a `route_access` cookie (base64-encoded JSON)
 * so the Next.js middleware can do role-based route guards without calling the API.
 *
 * Renders a loading skeleton while metadata is being fetched.
 * On error, renders an error message with a retry button (fail-open: after retry the
 * page remains usable even if metadata is still unavailable — the store retains defaults).
 */
export function RbacProvider({ children }: RbacProviderProps) {
  const { data, isSuccess, isError, refetch } = useRolesMetadata();
  const { setMetadata, isLoaded } = useRbacStore();

  useEffect(() => {
    if (isSuccess && data) {
      setMetadata(data);
      syncRouteAccessCookie(data.routeAccess);
    }
  }, [isSuccess, data, setMetadata]);

  // Show error state with retry — do NOT block the dashboard indefinitely
  if (isError && !isLoaded) {
    return <RbacErrorFallback onRetry={() => void refetch()} />;
  }

  // While metadata has not yet loaded, show a full-page skeleton
  if (!isLoaded) {
    return <RbacLoadingSkeleton />;
  }

  return <>{children}</>;
}

/**
 * Serialise the routeAccess list to a base64-encoded JSON cookie so the
 * Next.js middleware can read it at the edge without calling the API.
 * Cookie name: `route_access`
 * Encoding: base64url(JSON.stringify(routeAccess))
 */
function syncRouteAccessCookie(routeAccess: RouteAccessRule[]): void {
  if (typeof document === "undefined") return;
  try {
    const json = JSON.stringify(routeAccess);
    const b64 = btoa(json);
    // 7 days, same-site lax, no Secure flag needed (read by middleware, not by server)
    document.cookie = `route_access=${b64}; path=/; max-age=604800; SameSite=Lax`;
  } catch {
    // Non-critical — middleware will fall back to STATIC_ROUTE_MAP
  }
}

interface RbacErrorFallbackProps {
  onRetry: () => void;
}

function RbacErrorFallback({ onRetry }: RbacErrorFallbackProps) {
  return (
    <div
      className="min-h-screen bg-page flex items-center justify-center"
      role="alert"
      aria-label="Failed to load permissions"
    >
      <div className="flex flex-col items-center gap-4 max-w-sm text-center px-4">
        <div
          className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-red-500 text-lg font-bold">!</span>
        </div>
        <p className="text-sm font-medium text-text-primary">
          Failed to load permissions
        </p>
        <p className="text-xs text-text-muted">
          Could not reach the permissions service. Your access may be limited.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function RbacLoadingSkeleton() {
  return (
    <div
      className="min-h-screen bg-page flex items-center justify-center"
      aria-busy="true"
      aria-label="Loading permissions..."
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl bg-primary-500/20 animate-pulse"
          aria-hidden="true"
        />
        <div className="space-y-2 w-48" aria-hidden="true">
          <div className="h-2 bg-surface-300 dark:bg-surface-600 rounded-full animate-pulse" />
          <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full animate-pulse w-3/4 mx-auto" />
        </div>
        <p className="text-sm text-text-muted sr-only">Loading role permissions...</p>
      </div>
    </div>
  );
}
