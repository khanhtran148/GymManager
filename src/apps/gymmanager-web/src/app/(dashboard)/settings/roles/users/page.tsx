"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleUserTable } from "@/components/role-user-table";
import { useHasRole } from "@/hooks/use-permissions";
import { Role } from "@/lib/roles";

interface Toast {
  id: number;
  message: string;
  variant: "success" | "error";
}

let toastIdCounter = 0;

export default function UserRolesPage() {
  const router = useRouter();
  const isOwner = useHasRole(Role.Owner);
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
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Settings
        </p>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          User Roles
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          View and manage the roles assigned to each user in your gym.
        </p>
      </div>

      {/* User role table */}
      <RoleUserTable
        onToast={({ message, variant }) => addToast(message, variant)}
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
