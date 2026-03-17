"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { X, AlertTriangle } from "lucide-react";
import { Role } from "@/lib/roles";
import type { RoleType } from "@/lib/roles";
import { useChangeUserRole } from "@/hooks/use-role-users";
import type { RoleUserDto } from "@/hooks/use-role-users";

// Owner cannot be assigned — exclude from selectable roles
const ASSIGNABLE_ROLES: RoleType[] = [
  Role.HouseManager,
  Role.Trainer,
  Role.Staff,
  Role.Member,
];

interface ChangeRoleDialogProps {
  user: RoleUserDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ChangeRoleDialog({
  user,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ChangeRoleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const changeRoleMutation = useChangeUserRole();

  // Default selection: current role if assignable, else first option
  const defaultRole = (user?.role as RoleType | undefined);
  const initialRole =
    defaultRole && ASSIGNABLE_ROLES.includes(defaultRole)
      ? defaultRole
      : ASSIGNABLE_ROLES[0];

  const [selectedRole, setSelectedRole] = useState<RoleType>(initialRole);

  // Reset selection when user changes
  useEffect(() => {
    if (user) {
      const userRole = user.role as RoleType;
      setSelectedRole(
        ASSIGNABLE_ROLES.includes(userRole) ? userRole : ASSIGNABLE_ROLES[0]
      );
    }
  }, [user]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
      cancelButtonRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !user) return null;

  const isSameRole = selectedRole === (user.role as RoleType);

  function handleConfirm() {
    if (!user) return;
    changeRoleMutation.mutate(
      { userId: user.userId, role: selectedRole },
      {
        onSuccess: () => {
          onSuccess?.(`Changed ${user.fullName}'s role to ${selectedRole}`);
          onClose();
        },
        onError: () => {
          onError?.(`Failed to change ${user.fullName}'s role. Please try again.`);
        },
      }
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl p-6 shadow-2xl",
        "bg-card",
        "border border-border",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "open:flex open:flex-col open:gap-4"
      )}
      aria-modal="true"
      aria-labelledby="change-role-dialog-title"
      aria-describedby="change-role-dialog-description"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h2
            id="change-role-dialog-title"
            className="text-base font-semibold text-text-primary"
          >
            Change User Role
          </h2>
          <p
            id="change-role-dialog-description"
            className="mt-1 text-sm text-text-muted leading-relaxed"
          >
            Change{" "}
            <span className="font-semibold text-text-primary">{user.fullName}</span>
            &apos;s role from{" "}
            <span className="font-semibold text-text-primary">{user.role}</span> to:
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-hover transition-all"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Role selector */}
      <div className="space-y-2">
        <label
          htmlFor="change-role-select"
          className="block text-sm font-medium text-text-secondary"
        >
          New Role
        </label>
        <Select
          id="change-role-select"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as RoleType)}
          disabled={changeRoleMutation.isPending}
          aria-label="Select new role"
        >
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
      </div>

      {/* Warning */}
      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2.5 border border-amber-200 dark:border-amber-800">
        This will immediately update their permissions. The change takes effect on their next action or token refresh.
      </p>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button
          ref={cancelButtonRef}
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={changeRoleMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          isLoading={changeRoleMutation.isPending}
          onClick={handleConfirm}
          disabled={isSameRole}
        >
          Change Role
        </Button>
      </div>
    </dialog>
  );
}
