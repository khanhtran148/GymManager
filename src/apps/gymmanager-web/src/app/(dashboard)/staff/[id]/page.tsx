"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useStaffById, useUpdateStaff } from "@/hooks/use-staff";
import { useShiftAssignments } from "@/hooks/use-shift-assignments";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import type { StaffType, ShiftAssignmentDto, ShiftStatus, ShiftType } from "@/types/staff";

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

interface FormErrors {
  baseSalary?: string;
  perClassBonus?: string;
}

function getDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 90);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function StaffDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
  const { data: staff, isLoading, error } = useStaffById(id);
  const { mutate: updateStaff, isPending: isUpdating, error: updateError } = useUpdateStaff();

  const dateRange = getDateRange();
  const { data: shifts, isLoading: shiftsLoading } = useShiftAssignments(
    staff?.gymHouseId ?? "",
    dateRange.from,
    dateRange.to,
    id
  );

  const [staffType, setStaffType] = useState<StaffType | null>(null);
  const [baseSalary, setBaseSalary] = useState<string>("");
  const [perClassBonus, setPerClassBonus] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentStaffType = staffType ?? staff?.staffType ?? "Trainer";
  const currentBaseSalary = editMode ? baseSalary : (staff?.baseSalary?.toString() ?? "");
  const currentPerClassBonus = editMode ? perClassBonus : (staff?.perClassBonus?.toString() ?? "");

  function handleEditStart() {
    if (!staff) return;
    setStaffType(staff.staffType);
    setBaseSalary(staff.baseSalary.toString());
    setPerClassBonus(staff.perClassBonus.toString());
    setFormErrors({});
    setSaveSuccess(false);
    setEditMode(true);
  }

  function handleEditCancel() {
    setEditMode(false);
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    const salary = parseFloat(baseSalary);
    if (isNaN(salary) || salary < 0) errors.baseSalary = "Base salary must be a valid non-negative number.";
    const bonus = parseFloat(perClassBonus);
    if (isNaN(bonus) || bonus < 0) errors.perClassBonus = "Per-class bonus must be a valid non-negative number.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    updateStaff(
      {
        id,
        data: {
          staffType: currentStaffType,
          baseSalary: parseFloat(baseSalary),
          perClassBonus: parseFloat(perClassBonus),
        },
      },
      {
        onSuccess: () => {
          setEditMode(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
      }
    );
  }

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
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
            SHIFT_TYPE_COLORS[s.shiftType]
          )}
        >
          {s.shiftType}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      render: (s: ShiftAssignmentDto) => (
        <span className="tabular-nums text-xs text-text-secondary">
          {s.startTime} – {s.endTime}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s: ShiftAssignmentDto) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
            SHIFT_STATUS_COLORS[s.status]
          )}
        >
          {s.status}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading staff..." />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="max-w-2xl space-y-4">
        <Link href="/staff">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </Button>
        </Link>
        <Alert variant="error">
          {error ? "Failed to load staff member." : "Staff member not found."}
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/staff" aria-label="Back to staff list">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Staff & HR</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">{staff.userName}</h2>
        </div>
        {!editMode && (
          <Button variant="secondary" size="md" onClick={handleEditStart}>
            Edit
          </Button>
        )}
      </div>

      {saveSuccess && (
        <Alert variant="success">Staff member updated successfully.</Alert>
      )}

      {updateError && (
        <Alert variant="error">Failed to update staff. Please try again.</Alert>
      )}

      {/* Staff Info + Edit Form */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Staff Information
        </h3>

        {!editMode ? (
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
                  {STAFF_TYPE_LABELS[staff.staffType]}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted font-medium">Hired Date</dt>
              <dd className="text-sm text-text-secondary mt-0.5">{formatDate(staff.hiredAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted font-medium">Base Salary</dt>
              <dd className="text-sm font-semibold tabular-nums text-text-primary mt-0.5">
                {formatCurrency(staff.baseSalary)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted font-medium">Per-Class Bonus</dt>
              <dd className="text-sm tabular-nums text-text-secondary mt-0.5">
                {formatCurrency(staff.perClassBonus)}
              </dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleSave} noValidate className="space-y-4">
            <FormField
              label="Staff Type"
              htmlFor="edit-staffType"
              required
            >
              <Select
                id="edit-staffType"
                value={currentStaffType}
                onChange={(e) => setStaffType(e.target.value as StaffType)}
                aria-required="true"
              >
                {STAFF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {STAFF_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Base Salary (monthly)"
              htmlFor="edit-baseSalary"
              required
              error={formErrors.baseSalary}
            >
              <Input
                id="edit-baseSalary"
                type="number"
                min="0"
                step="0.01"
                value={currentBaseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="0.00"
                aria-required="true"
              />
            </FormField>

            <FormField
              label="Per-Class Bonus"
              htmlFor="edit-perClassBonus"
              required
              error={formErrors.perClassBonus}
            >
              <Input
                id="edit-perClassBonus"
                type="number"
                min="0"
                step="0.01"
                value={currentPerClassBonus}
                onChange={(e) => setPerClassBonus(e.target.value)}
                placeholder="0.00"
                aria-required="true"
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleEditCancel}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isUpdating}>
                <Save className="w-4 h-4" aria-hidden="true" />
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Shift History */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Shift History (Last 90 Days)
        </h3>
        <DataTable
          columns={shiftColumns}
          data={shifts?.filter((s) => s.staffId === id) ?? []}
          isLoading={shiftsLoading}
          emptyMessage="No shifts found for this staff member."
        />
      </div>
    </div>
  );
}
