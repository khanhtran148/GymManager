"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { usePayrollPeriods } from "@/hooks/use-payroll";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { FormModal } from "@/components/ui/form-modal";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { PermissionGate } from "@/components/permission-gate";
import { useRbacStore } from "@/stores/rbac-store";
import { useCreateModal } from "@/hooks/use-create-modal";
import { useViewModal } from "@/hooks/use-view-modal";
import { useToastStore } from "@/stores/toast-store";
import { PayrollForm } from "@/components/forms/payroll-form";
import { PayrollDetail } from "@/components/details/payroll-detail";
import type { PayrollPeriodDto, PayrollStatus } from "@/types/staff";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAYROLL_STATUS_COLORS: Record<PayrollStatus, string> = {
  Draft: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
  PendingApproval: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  Draft: "Draft",
  PendingApproval: "Pending Approval",
  Approved: "Approved",
  Paid: "Paid",
};

export default function PayrollPage() {
  const { permissionMap } = useRbacStore();
  const createModal = useCreateModal();
  const viewModal = useViewModal();
  const { addToast } = useToastStore();
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");
  const [page, setPage] = useState(1);

  const gymHouseId = selectedHouseId || (gymHouses?.[0]?.id ?? "");

  const { data, isLoading, error } = usePayrollPeriods(gymHouseId, page);

  const columns = [
    {
      key: "period",
      header: "Period",
      render: (p: PayrollPeriodDto) => (
        <button
          type="button"
          onClick={() => viewModal.open(p.id)}
          className="bg-transparent border-none p-0 cursor-pointer font-medium text-text-primary hover:text-primary-500 transition-colors tabular-nums"
        >
          {p.periodStart} – {p.periodEnd}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p: PayrollPeriodDto) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
            PAYROLL_STATUS_COLORS[p.status]
          )}
        >
          {PAYROLL_STATUS_LABELS[p.status]}
        </span>
      ),
    },
    {
      key: "entryCount",
      header: "Entries",
      render: (p: PayrollPeriodDto) => (
        <span className="tabular-nums text-text-secondary">{p.entryCount}</span>
      ),
    },
    {
      key: "totalNetPay",
      header: "Total Net Pay",
      render: (p: PayrollPeriodDto) => (
        <span className="font-semibold tabular-nums text-text-primary">
          {formatCurrency(p.totalNetPay)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (p: PayrollPeriodDto) => (
        <span className="text-text-muted text-xs tabular-nums">
          {new Date(p.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (p: PayrollPeriodDto) => (
        <Button variant="ghost" size="sm" onClick={() => viewModal.open(p.id)}>
          View
        </Button>
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
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Payroll</h2>
        </div>
        <PermissionGate permission={permissionMap["ManageStaff"] ?? 0n}>
          <Button variant="primary" size="md" onClick={createModal.open}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Generate Payroll
          </Button>
        </PermissionGate>
      </div>

      {error && (
        <Alert variant="error">Failed to load payroll periods. Please try again.</Alert>
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
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No payroll periods found. Generate payroll to get started."
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

      <FormModal isOpen={createModal.isOpen} onClose={createModal.close} title="Generate Payroll">
        <PayrollForm
          onSuccess={() => {
            createModal.close();
            addToast({ message: "Payroll generated successfully", variant: "success" });
          }}
          onCancel={createModal.close}
        />
      </FormModal>

      <FormModal isOpen={viewModal.isOpen} onClose={viewModal.close} title="Payroll Details" maxWidth="xl">
        {viewModal.viewId && (
          <PayrollDetail
            payrollId={viewModal.viewId}
            onClose={viewModal.close}
          />
        )}
      </FormModal>
    </div>
  );
}
