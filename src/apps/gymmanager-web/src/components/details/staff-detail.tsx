"use client";

import { useStaffById } from "@/hooks/use-staff";
import { useShiftAssignments } from "@/hooks/use-shift-assignments";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { ShiftAssignmentDto, ShiftStatus, ShiftType } from "@/types/staff";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STAFF_TYPE_LABELS: Record<string, string> = {
  Trainer: "Trainer",
  SecurityGuard: "Security Guard",
  CleaningStaff: "Cleaning Staff",
  Reception: "Reception",
};

const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  Scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  Morning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Afternoon: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Evening: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  Night: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

function getDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 90);
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
}

interface StaffDetailProps {
  staffId: string;
  onClose: () => void;
  onEdit: () => void;
}

export function StaffDetail({ staffId, onClose, onEdit }: StaffDetailProps) {
  const { data: staff, isLoading, error } = useStaffById(staffId);
  const dateRange = getDateRange();
  const { data: shifts, isLoading: shiftsLoading } = useShiftAssignments(
    staff?.gymHouseId ?? "",
    dateRange.from,
    dateRange.to,
    staffId
  );

  const shiftColumns = [
    {
      key: "shiftDate",
      header: "Date",
      render: (s: ShiftAssignmentDto) => (
        <span className="tabular-nums text-xs text-text-muted">{s.shiftDate}</span>
      ),
    },
    {
      key: "shiftType",
      header: "Shift",
      render: (s: ShiftAssignmentDto) => (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", SHIFT_TYPE_COLORS[s.shiftType])}>
          {s.shiftType}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      render: (s: ShiftAssignmentDto) => (
        <span className="tabular-nums text-xs text-text-secondary">{s.startTime} – {s.endTime}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s: ShiftAssignmentDto) => (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", SHIFT_STATUS_COLORS[s.status])}>
          {s.status}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading staff..." />
      </div>
    );
  }

  if (error || !staff) {
    return <Alert variant="error">Staff member not found or failed to load.</Alert>;
  }

  return (
    <>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <dt className="text-xs text-text-muted font-medium">Name</dt>
          <dd className="text-sm text-text-primary font-semibold mt-0.5">{staff.userName}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted font-medium">Email</dt>
          <dd className="text-sm text-text-secondary mt-0.5">{staff.userEmail}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted font-medium">Staff Type</dt>
          <dd className="mt-0.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {STAFF_TYPE_LABELS[staff.staffType] ?? staff.staffType}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted font-medium">Hired Date</dt>
          <dd className="text-sm text-text-secondary mt-0.5">{formatDate(staff.hiredAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted font-medium">Base Salary</dt>
          <dd className="text-sm font-semibold tabular-nums text-text-primary mt-0.5">{formatCurrency(staff.baseSalary)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted font-medium">Per-Class Bonus</dt>
          <dd className="text-sm tabular-nums text-text-secondary mt-0.5">{formatCurrency(staff.perClassBonus)}</dd>
        </div>
      </dl>

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Shift History (Last 90 Days)
        </h3>
        <DataTable
          columns={shiftColumns}
          data={shifts?.filter((s) => s.staffId === staffId) ?? []}
          isLoading={shiftsLoading}
          emptyMessage="No shifts found for this staff member."
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-5">
        <Button type="button" variant="primary" size="md" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </>
  );
}
