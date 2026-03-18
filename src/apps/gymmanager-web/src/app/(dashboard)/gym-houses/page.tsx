"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useGymHouses, useDeleteGymHouse } from "@/hooks/use-gym-houses";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { PermissionGate } from "@/components/permission-gate";
import { useRbacStore } from "@/stores/rbac-store";
import type { GymHouseDto } from "@/types/gym-house";

export default function GymHousesPage() {
  const { permissionMap } = useRbacStore();
  const { data: gymHouses, isLoading, error } = useGymHouses();
  const deleteGymHouse = useDeleteGymHouse();
  const [deleteTarget, setDeleteTarget] = useState<GymHouseDto | null>(null);

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (gym: GymHouseDto) => (
        <Link
          href={`/gym-houses/${gym.id}`}
          className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          {gym.name}
        </Link>
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
            <Link href={`/gym-houses/${gym.id}`}>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Edit ${gym.name}`}
                className="text-text-muted hover:text-primary-500"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
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
          <Link href="/gym-houses/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Gym House
            </Button>
          </Link>
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
    </div>
  );
}
