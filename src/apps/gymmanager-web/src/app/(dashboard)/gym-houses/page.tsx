"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { useGymHouses, useDeleteGymHouse } from "@/hooks/use-gym-houses";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { GymHouseDto } from "@/types/gym-house";

export default function GymHousesPage() {
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
          className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {gym.name}
        </Link>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (gym: GymHouseDto) => (
        <span className="text-gray-600">{gym.address}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (gym: GymHouseDto) => (
        <span className="text-gray-600">{gym.phone ?? "—"}</span>
      ),
    },
    {
      key: "capacity",
      header: "Capacity / hr",
      render: (gym: GymHouseDto) => (
        <span className="font-medium text-gray-800">{gym.hourlyCapacity}</span>
      ),
    },
    {
      key: "hours",
      header: "Operating Hours",
      render: (gym: GymHouseDto) => (
        <span className="text-gray-600">{gym.operatingHours ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (gym: GymHouseDto) => (
        <div className="flex items-center gap-1">
          <Link href={`/gym-houses/${gym.id}`}>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${gym.name}`}
              className="text-gray-500 hover:text-indigo-600"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(gym)}
            aria-label={`Delete ${gym.name}`}
            className="text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
      >
        Failed to load gym houses. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-gray-500 text-sm">
            {isLoading ? "Loading..." : `${gymHouses?.length ?? 0} locations registered`}
          </p>
        </div>
        <Link href="/gym-houses/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Gym House
          </Button>
        </Link>
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
