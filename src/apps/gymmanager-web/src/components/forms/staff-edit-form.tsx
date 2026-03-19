"use client";

import { useState, useEffect } from "react";
import { useStaffById, useUpdateStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { StaffType } from "@/types/staff";

const STAFF_TYPES: StaffType[] = ["Trainer", "SecurityGuard", "CleaningStaff", "Reception"];

const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  Trainer: "Trainer",
  SecurityGuard: "Security Guard",
  CleaningStaff: "Cleaning Staff",
  Reception: "Reception",
};

interface FormErrors {
  baseSalary?: string;
  perClassBonus?: string;
}

interface StaffEditFormProps {
  staffId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StaffEditForm({ staffId, onSuccess, onCancel }: StaffEditFormProps) {
  const { data: staff, isLoading: fetching } = useStaffById(staffId);
  const { mutate: updateStaff, isPending: isUpdating, error: updateError } = useUpdateStaff();

  const [staffType, setStaffType] = useState<StaffType>("Trainer");
  const [baseSalary, setBaseSalary] = useState("");
  const [perClassBonus, setPerClassBonus] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (staff) {
      setStaffType(staff.staffType);
      setBaseSalary(staff.baseSalary.toString());
      setPerClassBonus(staff.perClassBonus.toString());
    }
  }, [staff]);

  function validate(): boolean {
    const errors: FormErrors = {};
    const salary = parseFloat(baseSalary);
    if (isNaN(salary) || salary < 0) errors.baseSalary = "Base salary must be a valid non-negative number.";
    const bonus = parseFloat(perClassBonus);
    if (isNaN(bonus) || bonus < 0) errors.perClassBonus = "Per-class bonus must be a valid non-negative number.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    updateStaff(
      {
        id: staffId,
        data: {
          staffType,
          baseSalary: parseFloat(baseSalary),
          perClassBonus: parseFloat(perClassBonus),
        },
      },
      { onSuccess }
    );
  }

  const apiErrorMessage =
    updateError instanceof Error ? updateError.message : updateError ? "Failed to update staff." : null;

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading staff..." />
      </div>
    );
  }

  if (!staff) {
    return <Alert variant="error">Staff member not found.</Alert>;
  }

  return (
    <>
      {apiErrorMessage && <Alert variant="error" className="mb-5">{apiErrorMessage}</Alert>}

      <div className="mb-4 text-sm text-text-secondary">
        Editing <span className="font-semibold text-text-primary">{staff.userName}</span> ({staff.userEmail})
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Staff Type" htmlFor="edit-staffType" required>
          <Select
            id="edit-staffType"
            value={staffType}
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

        <FormField label="Base Salary (monthly)" htmlFor="edit-baseSalary" required error={formErrors.baseSalary}>
          <Input
            id="edit-baseSalary"
            type="number"
            min="0"
            step="0.01"
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            placeholder="0.00"
            aria-required="true"
          />
        </FormField>

        <FormField label="Per-Class Bonus" htmlFor="edit-perClassBonus" required error={formErrors.perClassBonus}>
          <Input
            id="edit-perClassBonus"
            type="number"
            min="0"
            step="0.01"
            value={perClassBonus}
            onChange={(e) => setPerClassBonus(e.target.value)}
            placeholder="0.00"
            aria-required="true"
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isUpdating}>
            Save Changes
          </Button>
        </div>
      </form>
    </>
  );
}
