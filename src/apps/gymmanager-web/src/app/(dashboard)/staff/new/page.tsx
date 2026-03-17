"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useCreateStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/ui/form-field";
import type { StaffType } from "@/types/staff";

const STAFF_TYPES: StaffType[] = ["Trainer", "SecurityGuard", "CleaningStaff", "Reception"];

const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  Trainer: "Trainer",
  SecurityGuard: "Security Guard",
  CleaningStaff: "Cleaning Staff",
  Reception: "Reception",
};

interface FormErrors {
  userId?: string;
  gymHouseId?: string;
  staffType?: string;
  baseSalary?: string;
  perClassBonus?: string;
}

export default function NewStaffPage() {
  const router = useRouter();
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const { mutate: createStaff, isPending, error: mutationError } = useCreateStaff();

  const [userId, setUserId] = useState("");
  const [gymHouseId, setGymHouseId] = useState("");
  const [staffType, setStaffType] = useState<StaffType>("Trainer");
  const [baseSalary, setBaseSalary] = useState("");
  const [perClassBonus, setPerClassBonus] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!userId.trim()) errors.userId = "User ID is required.";
    if (!gymHouseId) errors.gymHouseId = "Gym house is required.";
    if (!staffType) errors.staffType = "Staff type is required.";
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

    createStaff(
      {
        userId: userId.trim(),
        gymHouseId,
        staffType,
        baseSalary: parseFloat(baseSalary),
        perClassBonus: parseFloat(perClassBonus),
      },
      {
        onSuccess: () => {
          router.push("/staff");
        },
      }
    );
  }

  const apiErrorMessage =
    mutationError instanceof Error ? mutationError.message : mutationError ? "Failed to create staff." : null;

  if (gymLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/staff" aria-label="Back to staff list">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </Button>
        </Link>
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Staff & HR</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Add Staff</h2>
        </div>
      </div>

      {apiErrorMessage && (
        <Alert variant="error">{apiErrorMessage}</Alert>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5"
      >
        <FormField
          label="User ID"
          htmlFor="userId"
          required
          error={formErrors.userId}
        >
          <Input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user UUID"
            aria-required="true"
            aria-describedby={formErrors.userId ? "userId-error" : undefined}
          />
        </FormField>

        <FormField
          label="Gym House"
          htmlFor="gymHouseId"
          required
          error={formErrors.gymHouseId}
        >
          <Select
            id="gymHouseId"
            value={gymHouseId}
            onChange={(e) => setGymHouseId(e.target.value)}
            aria-required="true"
          >
            <option value="">Select gym house</option>
            {gymHouses?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Staff Type"
          htmlFor="staffType"
          required
          error={formErrors.staffType}
        >
          <Select
            id="staffType"
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

        <FormField
          label="Base Salary (monthly)"
          htmlFor="baseSalary"
          required
          error={formErrors.baseSalary}
        >
          <Input
            id="baseSalary"
            type="number"
            min="0"
            step="0.01"
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            placeholder="0.00"
            aria-required="true"
          />
        </FormField>

        <FormField
          label="Per-Class Bonus"
          htmlFor="perClassBonus"
          required
          error={formErrors.perClassBonus}
          hint="Amount earned per class taught (applies to Trainers)"
        >
          <Input
            id="perClassBonus"
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
          <Link href="/staff">
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="md" isLoading={isPending}>
            Add Staff
          </Button>
        </div>
      </form>
    </div>
  );
}
