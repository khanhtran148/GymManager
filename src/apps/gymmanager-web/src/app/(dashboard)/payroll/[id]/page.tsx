"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { usePayrollPeriodById, useApprovePayroll } from "@/hooks/use-payroll";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { PermissionGate } from "@/components/permission-gate";
import { useRbacStore } from "@/stores/rbac-store";
import type { PayrollEntryDto, PayrollStatus, StaffType } from "@/types/staff";

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

const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  Trainer: "Trainer",
  SecurityGuard: "Security Guard",
  CleaningStaff: "Cleaning Staff",
  Reception: "Reception",
};

export default function PayrollDetailPage() {
  const { permissionMap } = useRbacStore();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
  const { data: period, isLoading, error } = usePayrollPeriodById(id);
  const { mutate: approvePayroll, isPending: isApproving, error: approveError } = useApprovePayroll();
  const [showConfirm, setShowConfirm] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);

  function handleApprove() {
    approvePayroll(id, {
      onSuccess: () => {
        setShowConfirm(false);
        setApproveSuccess(true);
      },
    });
  }

  const entryColumns = [
    {
      key: "staffName",
      header: "Staff Name",
      render: (e: PayrollEntryDto) => (
        <span className="font-medium text-text-primary">{e.staffName}</span>
      ),
    },
    {
      key: "staffType",
      header: "Type",
      render: (e: PayrollEntryDto) => (
        <span className="text-text-muted text-xs">{STAFF_TYPE_LABELS[e.staffType]}</span>
      ),
    },
    {
      key: "basePay",
      header: "Base Pay",
      render: (e: PayrollEntryDto) => (
        <span className="tabular-nums text-text-secondary">{formatCurrency(e.basePay)}</span>
      ),
    },
    {
      key: "classBonus",
      header: "Class Bonus",
      render: (e: PayrollEntryDto) => (
        <span className="tabular-nums text-text-secondary">{formatCurrency(e.classBonus)}</span>
      ),
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (e: PayrollEntryDto) => (
        <span className="tabular-nums text-red-600 dark:text-red-400">
          {e.deductions > 0 ? `-${formatCurrency(e.deductions)}` : "—"}
        </span>
      ),
    },
    {
      key: "netPay",
      header: "Net Pay",
      render: (e: PayrollEntryDto) => (
        <span className="font-semibold tabular-nums text-green-600 dark:text-green-400">
          {formatCurrency(e.netPay)}
        </span>
      ),
    },
    {
      key: "classesTaught",
      header: "Classes Taught",
      render: (e: PayrollEntryDto) => (
        <span className="tabular-nums text-text-muted">{e.classesTaught}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading payroll period..." />
      </div>
    );
  }

  if (error || !period) {
    return (
      <div className="max-w-2xl space-y-4">
        <Link href="/payroll">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </Button>
        </Link>
        <Alert variant="error">
          {error ? "Failed to load payroll period." : "Payroll period not found."}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/payroll" aria-label="Back to payroll list">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Staff & HR / Payroll</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            {period.periodStart} – {period.periodEnd}
          </h2>
        </div>
        {(period.status === "Draft" || period.status === "PendingApproval") && (
          <PermissionGate permission={permissionMap["ApprovePayroll"] ?? 0n}>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowConfirm(true)}
            >
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              Approve Payroll
            </Button>
          </PermissionGate>
        )}
      </div>

      {approveSuccess && (
        <Alert variant="success">Payroll period approved successfully.</Alert>
      )}

      {approveError && (
        <Alert variant="error">Failed to approve payroll. Please try again.</Alert>
      )}

      {/* Summary Card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Summary
        </h3>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <dt className="text-xs text-text-muted font-medium">Period Start</dt>
            <dd className="text-sm font-semibold text-text-primary mt-0.5 tabular-nums">
              {period.periodStart}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted font-medium">Period End</dt>
            <dd className="text-sm font-semibold text-text-primary mt-0.5 tabular-nums">
              {period.periodEnd}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted font-medium">Status</dt>
            <dd className="mt-0.5">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  PAYROLL_STATUS_COLORS[period.status]
                )}
              >
                {PAYROLL_STATUS_LABELS[period.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted font-medium">Total Net Pay</dt>
            <dd className="text-sm font-semibold text-green-600 dark:text-green-400 mt-0.5 tabular-nums">
              {formatCurrency(period.totalNetPay)}
            </dd>
          </div>
          {period.approvedAt && (
            <div>
              <dt className="text-xs text-text-muted font-medium">Approved At</dt>
              <dd className="text-sm text-text-secondary mt-0.5 tabular-nums">
                {new Date(period.approvedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-text-muted font-medium">Entries</dt>
            <dd className="text-sm text-text-secondary mt-0.5 tabular-nums">
              {period.entries.length}
            </dd>
          </div>
        </dl>
      </div>

      {/* Entries Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Payroll Entries
        </h3>
        <DataTable
          columns={entryColumns}
          data={period.entries}
          isLoading={false}
          emptyMessage="No payroll entries found for this period."
        />
      </div>

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Approve Payroll Period"
        description={`Approve payroll for ${period.periodStart} – ${period.periodEnd}? This will create salary payment transactions for all ${period.entries.length} staff entries (total: ${formatCurrency(period.totalNetPay)}).`}
        confirmLabel="Approve Payroll"
        cancelLabel="Cancel"
        variant="primary"
        isLoading={isApproving}
        onConfirm={handleApprove}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
