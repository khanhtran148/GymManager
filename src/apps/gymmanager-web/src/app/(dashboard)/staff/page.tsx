"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useStaff } from "@/hooks/use-staff";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FormModal } from "@/components/ui/form-modal";
import { cn } from "@/lib/utils";
import { PermissionGate } from "@/components/permission-gate";
import { useRbacStore } from "@/stores/rbac-store";
import { useCreateModal } from "@/hooks/use-create-modal";
import { useEditModal } from "@/hooks/use-edit-modal";
import { useViewModal } from "@/hooks/use-view-modal";
import { useToastStore } from "@/stores/toast-store";
import { StaffForm } from "@/components/forms/staff-form";
import { StaffEditForm } from "@/components/forms/staff-edit-form";
import { StaffDetail } from "@/components/details/staff-detail";
import type { StaffDto, StaffType } from "@/types/staff";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STAFF_TYPES: StaffType[] = ["Trainer", "SecurityGuard", "CleaningStaff", "Reception"];

const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  Trainer: "Trainer",
  SecurityGuard: "Security Guard",
  CleaningStaff: "Cleaning Staff",
  Reception: "Reception",
};

const STAFF_TYPE_COLORS: Record<StaffType, string> = {
  Trainer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SecurityGuard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CleaningStaff: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Reception: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function StaffPage() {
  const { permissionMap } = useRbacStore();
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<StaffType | "">("");
  const createModal = useCreateModal();
  const editModal = useEditModal();
  const viewModal = useViewModal();
  const { addToast } = useToastStore();

  const gymHouseId = selectedHouseId || (gymHouses?.[0]?.id ?? "");

  const { data, isLoading, error } = useStaff(
    gymHouseId,
    page,
    filterType || undefined
  );

  const columns = [
    {
      key: "userName",
      header: "Name",
      render: (s: StaffDto) => (
        <button
          type="button"
          onClick={() => viewModal.open(s.id)}
          className="bg-transparent border-none p-0 cursor-pointer font-medium text-text-primary hover:text-primary-500 transition-colors"
        >
          {s.userName}
        </button>
      ),
    },
    {
      key: "userEmail",
      header: "Email",
      render: (s: StaffDto) => (
        <span className="text-text-muted text-xs">{s.userEmail}</span>
      ),
    },
    {
      key: "staffType",
      header: "Type",
      render: (s: StaffDto) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
            STAFF_TYPE_COLORS[s.staffType]
          )}
        >
          {STAFF_TYPE_LABELS[s.staffType]}
        </span>
      ),
    },
    {
      key: "baseSalary",
      header: "Base Salary",
      render: (s: StaffDto) => (
        <span className="font-semibold tabular-nums text-text-primary">
          {formatCurrency(s.baseSalary)}
        </span>
      ),
    },
    {
      key: "perClassBonus",
      header: "Per-Class Bonus",
      render: (s: StaffDto) => (
        <span className="tabular-nums text-text-secondary">
          {formatCurrency(s.perClassBonus)}
        </span>
      ),
    },
    {
      key: "hiredAt",
      header: "Hired Date",
      render: (s: StaffDto) => (
        <span className="text-text-muted text-xs tabular-nums">{formatDate(s.hiredAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (s: StaffDto) => (
        <PermissionGate permission={permissionMap["ManageStaff"] ?? 0n}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editModal.open(s.id)}
            aria-label={`Edit ${s.userName}`}
            className="text-text-muted hover:text-primary-500"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </Button>
        </PermissionGate>
      ),
    },
  ];

  if (gymLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Staff & HR</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Staff</h2>
        </div>
        <PermissionGate permission={permissionMap["ManageStaff"] ?? 0n}>
          <Button variant="primary" size="md" onClick={createModal.open}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Staff
          </Button>
        </PermissionGate>
      </div>

      {error && (
        <Alert variant="error">Failed to load staff. Please try again.</Alert>
      )}

      {!gymHouseId && (
        <Alert variant="error">
          No gym house found. Please{" "}
          <Link href="/gym-houses?create=true" className="underline font-medium">
            create a gym house
          </Link>{" "}
          first.
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gymHouses && gymHouses.length > 1 && (
            <Select
              value={selectedHouseId}
              onChange={(e) => {
                setSelectedHouseId(e.target.value);
                setPage(1);
              }}
              aria-label="Gym house"
            >
              <option value="">All Houses</option>
              {gymHouses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          )}

          <Select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as StaffType | "");
              setPage(1);
            }}
            aria-label="Filter by staff type"
          >
            <option value="">All Types</option>
            {STAFF_TYPES.map((t) => (
              <option key={t} value={t}>
                {STAFF_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No staff found. Try adjusting the filters or add new staff."
        pagination={
          data
            ? {
                page: data.page,
                pageSize: data.pageSize,
                totalCount: data.totalCount,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      <FormModal isOpen={createModal.isOpen} onClose={createModal.close} title="Add Staff">
        <StaffForm
          onSuccess={() => {
            createModal.close();
            addToast({ message: "Staff member added successfully", variant: "success" });
          }}
          onCancel={createModal.close}
        />
      </FormModal>

      <FormModal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit Staff">
        {editModal.editId && (
          <StaffEditForm
            staffId={editModal.editId}
            onSuccess={() => {
              editModal.close();
              addToast({ message: "Staff updated successfully", variant: "success" });
            }}
            onCancel={editModal.close}
          />
        )}
      </FormModal>

      <FormModal isOpen={viewModal.isOpen} onClose={viewModal.close} title="Staff Details" maxWidth="xl">
        {viewModal.viewId && (
          <StaffDetail
            staffId={viewModal.viewId}
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
