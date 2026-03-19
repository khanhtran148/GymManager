"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useGymHouses, useDeleteGymHouse } from "@/hooks/use-gym-houses";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { FormModal } from "@/components/ui/form-modal";
import { PermissionGate } from "@/components/permission-gate";
import { useRbacStore } from "@/stores/rbac-store";
import { useCreateModal } from "@/hooks/use-create-modal";
import { useEditModal } from "@/hooks/use-edit-modal";
import { useViewModal } from "@/hooks/use-view-modal";
import { useToastStore } from "@/stores/toast-store";
import { GymHouseForm } from "@/components/forms/gym-house-form";
import { GymHouseEditForm } from "@/components/forms/gym-house-edit-form";
import { GymHouseDetail } from "@/components/details/gym-house-detail";
import type { GymHouseDto } from "@/types/gym-house";

export default function GymHousesPage() {
  const { permissionMap } = useRbacStore();
  const { data: gymHouses, isLoading, error } = useGymHouses();
  const deleteGymHouse = useDeleteGymHouse();
  const [deleteTarget, setDeleteTarget] = useState<GymHouseDto | null>(null);
  const createModal = useCreateModal();
  const editModal = useEditModal();
  const viewModal = useViewModal();
  const { addToast } = useToastStore();

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (gym: GymHouseDto) => (
        <button
          type="button"
          onClick={() => viewModal.open(gym.id)}
          className="bg-transparent border-none p-0 cursor-pointer font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          {gym.name}
        </button>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (gym: GymHouseDto) => (
        <span className="text-text-secondary">{gym.address}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (gym: GymHouseDto) => (
        <span className="text-text-muted">{gym.phone ?? "—"}</span>
      ),
    },
    {
      key: "capacity",
      header: "Capacity / hr",
      render: (gym: GymHouseDto) => (
        <span className="font-semibold text-text-primary tabular-nums">{gym.hourlyCapacity}</span>
      ),
    },
    {
      key: "hours",
      header: "Operating Hours",
      render: (gym: GymHouseDto) => (
        <span className="text-text-muted">{gym.operatingHours ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (gym: GymHouseDto) => (
        <PermissionGate permission={permissionMap["ManageTenant"] ?? 0n}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editModal.open(gym.id)}
              aria-label={`Edit ${gym.name}`}
              className="text-text-muted hover:text-primary-500"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(gym)}
              aria-label={`Delete ${gym.name}`}
              className="text-text-muted hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  if (error) {
    return (
      <Alert variant="error">Failed to load gym houses. Please refresh the page.</Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-text-muted text-sm">
            {isLoading ? "Loading..." : `${gymHouses?.length ?? 0} locations registered`}
          </p>
        </div>
        <PermissionGate permission={permissionMap["ManageTenant"] ?? 0n}>
          <Button variant="primary" size="md" onClick={createModal.open}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Gym House
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={gymHouses ?? []}
        isLoading={isLoading}
        emptyMessage="No gym houses found. Create your first gym house to get started."
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Gym House"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteGymHouse.isPending}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteGymHouse.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <FormModal isOpen={createModal.isOpen} onClose={createModal.close} title="Add New Gym House">
        <GymHouseForm
          onSuccess={() => {
            createModal.close();
            addToast({ message: "Gym house created successfully", variant: "success" });
          }}
          onCancel={createModal.close}
        />
      </FormModal>

      <FormModal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit Gym House">
        {editModal.editId && (
          <GymHouseEditForm
            gymHouseId={editModal.editId}
            onSuccess={() => {
              editModal.close();
              addToast({ message: "Gym house updated successfully", variant: "success" });
            }}
            onCancel={editModal.close}
          />
        )}
      </FormModal>

      <FormModal isOpen={viewModal.isOpen} onClose={viewModal.close} title="Gym House Details" maxWidth="lg">
        {viewModal.viewId && (
          <GymHouseDetail
            gymHouseId={viewModal.viewId}
            onClose={viewModal.close}
            onEdit={() => {
              const id = viewModal.viewId!;
              viewModal.close();
              editModal.open(id);
            }}
          />
        )}
      </FormModal>
    </div>
  );
}
