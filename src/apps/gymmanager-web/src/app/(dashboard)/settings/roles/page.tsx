"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionToggleGrid } from "@/components/permission-toggle-grid";
import { ResetDefaultsDialog } from "@/components/reset-defaults-dialog";
import { useHasRole } from "@/hooks/use-permissions";

interface Toast {
  id: string;
  message: string;
  variant: "success" | "error";
}

export default function RolePermissionsPage() {
  const router = useRouter();
  const isOwner = useHasRole("Owner");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Redirect non-owners to 403 — must be in useEffect, not render phase
  useEffect(() => {
    if (!isOwner) {
      router.replace("/403");
    }
  }, [isOwner, router]);

  function addToast(message: string, variant: "success" | "error") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current.delete(id);
    }, 4000);
    toastTimers.current.set(id, timer);
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Settings
          </p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Role Permissions
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Toggle which permissions each role has. Changes take effect immediately.
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setResetDialogOpen(true)}
          aria-label="Reset to Defaults"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reset to Defaults
        </Button>
      </div>

      {/* Permission grid */}
      <PermissionToggleGrid
        onSuccess={(msg) => addToast(msg, "success")}
        onError={(msg) => addToast(msg, "error")}
      />

      {/* Reset defaults dialog */}
      <ResetDefaultsDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onSuccess={() => addToast("Permissions reset to defaults", "success")}
        onError={(msg) => addToast(msg, "error")}
      />

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          aria-atomic="false"
          className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto
                ${toast.variant === "success"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
                }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
