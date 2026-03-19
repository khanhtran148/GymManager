"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGymHouse, useDeleteGymHouse } from "@/hooks/use-gym-houses";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PermissionGate } from "@/components/permission-gate";
import { useRbacStore } from "@/stores/rbac-store";

interface GymHouseDetailProps {
  gymHouseId: string;
  onClose: () => void;
  onEdit: () => void;
}

export function GymHouseDetail({ gymHouseId, onClose, onEdit }: GymHouseDetailProps) {
  const { permissionMap } = useRbacStore();
  const router = useRouter();
  const { data: gymHouse, isLoading, error } = useGymHouse(gymHouseId);
  const deleteGymHouse = useDeleteGymHouse();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleDelete() {
    await deleteGymHouse.mutateAsync(gymHouseId);
    setShowDeleteConfirm(false);
    onClose();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading gym house..." />
      </div>
    );
  }

  if (error || !gymHouse) {
    return <Alert variant="error">Gym house not found or failed to load.</Alert>;
  }

  return (
    <>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <dt className="text-xs text-text-muted font-medium">Name</dt>
          <dd className="text-sm text-text-primary font-semibold mt-0.5">{gymHouse.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted font-medium">Address</dt>
          <dd className="text-sm text-text-secondary mt-0.5">{gymHouse.address}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted font-medium">Phone</dt>
          <dd className="text-sm text-text-secondary mt-0.5">{gymHouse.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted font-medium">Hourly Capacity</dt>
          <dd className="text-sm font-semibold tabular-nums text-text-primary mt-0.5">{gymHouse.hourlyCapacity}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-text-muted font-medium">Operating Hours</dt>
          <dd className="text-sm text-text-secondary mt-0.5">{gymHouse.operatingHours ?? "—"}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-5">
        <PermissionGate permission={permissionMap["ManageTenant"] ?? 0n}>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
          <Button type="button" variant="primary" size="md" onClick={onEdit}>
            Edit
          </Button>
        </PermissionGate>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Gym House"
        description={`Are you sure you want to delete "${gymHouse.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteGymHouse.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
