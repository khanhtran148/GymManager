"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useStaff } from "@/hooks/use-staff";
import {
  useShiftAssignments,
  useCreateShiftAssignment,
} from "@/hooks/use-shift-assignments";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import type {
  ShiftAssignmentDto,
  ShiftStatus,
  ShiftType,
} from "@/types/staff";

const SHIFT_TYPES: ShiftType[] = ["Morning", "Afternoon", "Evening", "Night"];

const SHIFT_TYPE_TIMES: Record<ShiftType, { start: string; end: string }> = {
  Morning: { start: "06:00", end: "12:00" },
  Afternoon: { start: "12:00", end: "18:00" },
  Evening: { start: "18:00", end: "22:00" },
  Night: { start: "22:00", end: "06:00" },
};

const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  Morning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Afternoon: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Evening: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  Night: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  Scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

interface ShiftFormErrors {
  staffId?: string;
  shiftDate?: string;
  shiftType?: string;
  startTime?: string;
  endTime?: string;
}

export default function ShiftsPage() {
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState<ShiftFormErrors>({});

  const gymHouseId = selectedHouseId || (gymHouses?.[0]?.id ?? "");

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const from = formatDateISO(weekStart);
  const to = formatDateISO(addDays(weekStart, 6));

  const { data: shifts, isLoading: shiftsLoading, error } = useShiftAssignments(
    gymHouseId,
    from,
    to
  );

  const { data: staffData, isLoading: staffLoading } = useStaff(gymHouseId, 1);

  const { mutate: createShift, isPending: isCreating, error: createError } = useCreateShiftAssignment();

  // Form state
  const [formStaffId, setFormStaffId] = useState("");
  const [formShiftDate, setFormShiftDate] = useState("");
  const [formShiftType, setFormShiftType] = useState<ShiftType>("Morning");
  const [formStartTime, setFormStartTime] = useState("06:00");
  const [formEndTime, setFormEndTime] = useState("12:00");

  function handleShiftTypeChange(type: ShiftType) {
    setFormShiftType(type);
    setFormStartTime(SHIFT_TYPE_TIMES[type].start);
    setFormEndTime(SHIFT_TYPE_TIMES[type].end);
  }

  function validateForm(): boolean {
    const errors: ShiftFormErrors = {};
    if (!formStaffId) errors.staffId = "Staff member is required.";
    if (!formShiftDate) errors.shiftDate = "Shift date is required.";
    if (!formShiftType) errors.shiftType = "Shift type is required.";
    if (!formStartTime) errors.startTime = "Start time is required.";
    if (!formEndTime) errors.endTime = "End time is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    createShift(
      {
        staffId: formStaffId,
        gymHouseId,
        shiftDate: formShiftDate,
        startTime: formStartTime,
        endTime: formEndTime,
        shiftType: formShiftType,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          resetForm();
        },
      }
    );
  }

  function resetForm() {
    setFormStaffId("");
    setFormShiftDate("");
    setFormShiftType("Morning");
    setFormStartTime("06:00");
    setFormEndTime("12:00");
    setFormErrors({});
  }

  function handleOpenModal() {
    resetForm();
    setShowModal(true);
  }

  // Build a map: staffId -> staffName and shifts per day
  const staffList = staffData?.items ?? [];

  function getShiftsForStaffOnDay(staffId: string, date: Date): ShiftAssignmentDto[] {
    const dateStr = formatDateISO(date);
    return (shifts ?? []).filter(
      (s) => s.staffId === staffId && s.shiftDate === dateStr
    );
  }

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
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Shift Schedule</h2>
        </div>
        <Button variant="primary" size="md" onClick={handleOpenModal} disabled={!gymHouseId}>
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Shift
        </Button>
      </div>

      {error && (
        <Alert variant="error">Failed to load shifts. Please try again.</Alert>
      )}

      {!gymHouseId && (
        <Alert variant="error">No gym house found. Please create a gym house first.</Alert>
      )}

      {/* Filters + Week navigation */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {gymHouses && gymHouses.length > 1 && (
            <Select
              value={selectedHouseId}
              onChange={(e) => setSelectedHouseId(e.target.value)}
              aria-label="Gym house"
              className="w-48"
            >
              <option value="">All Houses</option>
              {gymHouses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <span className="text-sm font-medium text-text-secondary tabular-nums px-1">
              {formatDayLabel(weekStart)} – {formatDayLabel(addDays(weekStart, 6))}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekStart(getWeekStart(new Date()))}
            >
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Weekly calendar grid */}
      <div className="overflow-x-auto rounded-2xl border border-border shadow-sm bg-card">
        {shiftsLoading || staffLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner label="Loading shifts..." />
          </div>
        ) : (
          <table className="min-w-full" role="grid" aria-label="Weekly shift schedule">
            <thead>
              <tr className="bg-table-header">
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-40 sticky left-0 bg-table-header z-10"
                >
                  Staff
                </th>
                {weekDays.map((day) => (
                  <th
                    key={formatDateISO(day)}
                    scope="col"
                    className={cn(
                      "px-3 py-3.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider min-w-[100px]",
                      formatDateISO(day) === formatDateISO(new Date()) &&
                        "text-primary-500"
                    )}
                  >
                    {formatDayLabel(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-table-divider">
              {staffList.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-sm text-text-muted"
                  >
                    No staff found. Add staff members first.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-table-row-hover transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary font-medium sticky left-0 bg-card z-10 whitespace-nowrap border-r border-border-muted">
                      <div className="font-medium">{staff.userName}</div>
                      <div className="text-xs text-text-muted">{staff.staffType}</div>
                    </td>
                    {weekDays.map((day) => {
                      const dayShifts = getShiftsForStaffOnDay(staff.id, day);
                      return (
                        <td
                          key={formatDateISO(day)}
                          className="px-2 py-2 text-center align-top min-h-[60px]"
                        >
                          <div className="flex flex-col gap-1 items-center">
                            {dayShifts.length === 0 ? (
                              <span className="text-text-muted text-xs">—</span>
                            ) : (
                              dayShifts.map((shift) => (
                                <div key={shift.id} className="w-full space-y-0.5">
                                  <span
                                    className={cn(
                                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-full justify-center",
                                      SHIFT_TYPE_COLORS[shift.shiftType]
                                    )}
                                  >
                                    {shift.shiftType}
                                  </span>
                                  <span
                                    className={cn(
                                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-full justify-center",
                                      SHIFT_STATUS_COLORS[shift.status]
                                    )}
                                  >
                                    {shift.status}
                                  </span>
                                  <div className="text-[10px] text-text-muted tabular-nums">
                                    {shift.startTime}–{shift.endTime}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Shift Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shift-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              resetForm();
            }
          }}
        >
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div>
              <h3 id="shift-modal-title" className="text-base font-semibold text-text-primary">
                Add Shift Assignment
              </h3>
              <p className="text-sm text-text-muted mt-1">
                Assign a shift to a staff member.
              </p>
            </div>

            {createError && (
              <Alert variant="error">Failed to create shift. Please try again.</Alert>
            )}

            <form onSubmit={handleModalSubmit} noValidate className="space-y-4">
              <FormField
                label="Staff Member"
                htmlFor="shift-staffId"
                required
                error={formErrors.staffId}
              >
                <Select
                  id="shift-staffId"
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  aria-required="true"
                >
                  <option value="">Select staff member</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.userName} ({s.staffType})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Shift Date"
                htmlFor="shift-date"
                required
                error={formErrors.shiftDate}
              >
                <Input
                  id="shift-date"
                  type="date"
                  value={formShiftDate}
                  onChange={(e) => setFormShiftDate(e.target.value)}
                  aria-required="true"
                />
              </FormField>

              <FormField
                label="Shift Type"
                htmlFor="shift-type"
                required
                error={formErrors.shiftType}
              >
                <Select
                  id="shift-type"
                  value={formShiftType}
                  onChange={(e) => handleShiftTypeChange(e.target.value as ShiftType)}
                  aria-required="true"
                >
                  {SHIFT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Start Time"
                  htmlFor="shift-start"
                  required
                  error={formErrors.startTime}
                >
                  <Input
                    id="shift-start"
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    aria-required="true"
                  />
                </FormField>
                <FormField
                  label="End Time"
                  htmlFor="shift-end"
                  required
                  error={formErrors.endTime}
                >
                  <Input
                    id="shift-end"
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    aria-required="true"
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isCreating}>
                  Add Shift
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
