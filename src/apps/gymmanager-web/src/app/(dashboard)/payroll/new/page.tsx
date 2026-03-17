"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useCreatePayrollPeriod } from "@/hooks/use-payroll";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/ui/form-field";

interface FormErrors {
  gymHouseId?: string;
  periodStart?: string;
  periodEnd?: string;
  dateRange?: string;
}

export default function NewPayrollPage() {
  const router = useRouter();
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const { mutate: createPayroll, isPending, error: mutationError } = useCreatePayrollPeriod();

  const [gymHouseId, setGymHouseId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!gymHouseId) errors.gymHouseId = "Gym house is required.";
    if (!periodStart) errors.periodStart = "Period start date is required.";
    if (!periodEnd) errors.periodEnd = "Period end date is required.";
    if (periodStart && periodEnd && periodEnd <= periodStart) {
      errors.dateRange = "Period end must be after period start.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createPayroll(
      {
        gymHouseId,
        periodStart,
        periodEnd,
      },
      {
        onSuccess: (created) => {
          router.push(`/payroll/${created.id}`);
        },
      }
    );
  }

  const apiErrorMessage =
    mutationError instanceof Error
      ? mutationError.message
      : mutationError
      ? "Failed to generate payroll."
      : null;

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
        <Link href="/payroll" aria-label="Back to payroll list">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </Button>
        </Link>
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Staff & HR</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Generate Payroll</h2>
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
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-text-primary">Payroll Details</h3>
          <p className="text-xs text-text-muted">
            Select a gym house and define the payroll period. The system will automatically calculate
            salary entries for all active staff members.
          </p>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Period Start"
            htmlFor="periodStart"
            required
            error={formErrors.periodStart}
          >
            <Input
              id="periodStart"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              aria-required="true"
            />
          </FormField>

          <FormField
            label="Period End"
            htmlFor="periodEnd"
            required
            error={formErrors.periodEnd}
          >
            <Input
              id="periodEnd"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              aria-required="true"
            />
          </FormField>
        </div>

        {formErrors.dateRange && (
          <p className="text-xs text-red-500 font-medium" role="alert" aria-live="polite">
            {formErrors.dateRange}
          </p>
        )}

        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-4 text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p className="font-semibold">What happens when you generate payroll?</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-500">
            <li>A payroll period record is created in Draft status.</li>
            <li>Salary entries are auto-generated for all staff at the selected gym house.</li>
            <li>Trainer class bonuses are calculated from completed classes in the period.</li>
            <li>You can review entries before approving the payroll.</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/payroll">
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="md" isLoading={isPending}>
            Generate Payroll
          </Button>
        </div>
      </form>
    </div>
  );
}
