"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useResetDefaultPermissions } from "@/hooks/use-role-permissions";

interface ResetDefaultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function ResetDefaultsDialog({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ResetDefaultsDialogProps) {
  const resetMutation = useResetDefaultPermissions();

  function handleConfirm() {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
      onError: () => {
        onError?.("Failed to reset permissions. Please try again.");
      },
    });
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Reset to Default Permissions"
      description="This will overwrite any custom permission changes and restore all roles to factory defaults. All affected users will have their permissions updated immediately."
      confirmLabel="Reset Defaults"
      cancelLabel="Cancel"
      variant="danger"
      isLoading={resetMutation.isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
