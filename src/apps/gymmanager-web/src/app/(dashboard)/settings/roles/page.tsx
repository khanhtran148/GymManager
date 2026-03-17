"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionToggleGrid } from "@/components/permission-toggle-grid";
import { ResetDefaultsDialog } from "@/components/reset-defaults-dialog";
import { useHasRole } from "@/hooks/use-permissions";
import { Role } from "@/lib/roles";

interface Toast {
  id: number;
  message: string;
  variant: "success" | "error";
}

let toastIdCounter = 0;

export default function RolePermissionsPage() {
  const router = useRouter();
  const isOwner = useHasRole(Role.Owner);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Redirect non-owners to 403
  if (!isOwner) {
    router.replace("/403");
    return null;
  }

  function addToast(message: string, variant: "success" | "error") {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  return (
    <div className="space-y-6 max-w-7xl">
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
