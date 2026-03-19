"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useRecordTransaction } from "@/hooks/use-transactions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { PaymentMethod } from "@/types/transaction";

const schema = z.object({
  gymHouseId: z.string().min(1, "Gym house is required"),
  transactionType: z.enum([
    "MembershipFee",
    "SalaryPayment",
    "Rent",
    "Utilities",
    "Equipment",
    "Wages",
    "Expense",
    "Refund",
    "Other",
  ]),
  direction: z.enum(["Credit", "Debit"]),
  amount: z.string().min(1, "Amount is required").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Amount must be greater than 0"
  ),
  category: z.enum([
    "Revenue",
    "OperatingExpense",
    "CapitalExpense",
    "Payroll",
    "Refund",
  ]),
  description: z.string().min(1, "Description is required"),
  transactionDate: z.string().min(1, "Transaction date is required"),
  paymentMethod: z.string().optional(),
  externalReference: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "Cash", label: "Cash" },
  { value: "BankTransfer", label: "Bank Transfer" },
  { value: "Card", label: "Card" },
  { value: "Online", label: "Online" },
];

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gymHouseId: "",
      transactionType: "Expense",
      direction: "Debit",
      amount: "",
      category: "OperatingExpense",
      description: "",
      transactionDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      externalReference: "",
    },
  });

  const selectedGymHouseId = watch("gymHouseId");
  const mutation = useRecordTransaction(selectedGymHouseId);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const paymentMethod =
      values.paymentMethod && values.paymentMethod.length > 0
        ? (values.paymentMethod as PaymentMethod)
        : undefined;

    try {
      await mutation.mutateAsync({
        transactionType: values.transactionType,
        direction: values.direction,
        amount: parseFloat(values.amount),
        category: values.category,
        description: values.description,
        transactionDate: new Date(values.transactionDate).toISOString(),
        paymentMethod,
        externalReference: values.externalReference || undefined,
      });
      onSuccess();
    } catch {
      setServerError("Failed to record transaction. Please try again.");
    }
  }

  if (gymLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <h3 className="text-base font-semibold text-text-primary">Transaction Details</h3>

          <FormField
            label="Gym House"
            htmlFor="gymHouseId"
            error={errors.gymHouseId?.message}
            required
          >
            <Select
              id="gymHouseId"
              error={!!errors.gymHouseId}
              {...register("gymHouseId")}
            >
              <option value="">Select gym house...</option>
              {gymHouses?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label="Transaction Type"
              htmlFor="transactionType"
              error={errors.transactionType?.message}
              required
            >
              <Select
                id="transactionType"
                error={!!errors.transactionType}
                {...register("transactionType")}
              >
                <option value="MembershipFee">Membership Fee</option>
                <option value="SalaryPayment">Salary Payment</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Equipment">Equipment</option>
                <option value="Wages">Wages</option>
                <option value="Expense">Expense</option>
                <option value="Refund">Refund</option>
                <option value="Other">Other</option>
              </Select>
            </FormField>

            <FormField
              label="Direction"
              htmlFor="direction"
              error={errors.direction?.message}
              required
            >
              <Select
                id="direction"
                error={!!errors.direction}
                {...register("direction")}
              >
                <option value="Credit">Credit (Income)</option>
                <option value="Debit">Debit (Expense)</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label="Amount"
              htmlFor="amount"
              error={errors.amount?.message}
              required
            >
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                error={!!errors.amount}
                {...register("amount")}
              />
            </FormField>

            <FormField
              label="Category"
              htmlFor="category"
              error={errors.category?.message}
              required
            >
              <Select
                id="category"
                error={!!errors.category}
                {...register("category")}
              >
                <option value="Revenue">Revenue</option>
                <option value="OperatingExpense">Operating Expense</option>
                <option value="CapitalExpense">Capital Expense</option>
                <option value="Payroll">Payroll</option>
                <option value="Refund">Refund</option>
              </Select>
            </FormField>
          </div>

          <FormField
            label="Description"
            htmlFor="description"
            error={errors.description?.message}
            required
          >
            <Input
              id="description"
              type="text"
              placeholder="Enter a description..."
              error={!!errors.description}
              {...register("description")}
            />
          </FormField>

          <FormField
            label="Transaction Date"
            htmlFor="transactionDate"
            error={errors.transactionDate?.message}
            required
          >
            <Input
              id="transactionDate"
              type="date"
              error={!!errors.transactionDate}
              {...register("transactionDate")}
            />
          </FormField>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <h3 className="text-base font-semibold text-text-primary">Optional Details</h3>

          <FormField
            label="Payment Method"
            htmlFor="paymentMethod"
            error={errors.paymentMethod?.message}
          >
            <Select
              id="paymentMethod"
              {...register("paymentMethod")}
            >
              <option value="">Not specified</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="External Reference"
            htmlFor="externalReference"
            error={errors.externalReference?.message}
            hint="Invoice number, receipt ID, or other reference"
          >
            <Input
              id="externalReference"
              type="text"
              placeholder="e.g. INV-2024-001"
              {...register("externalReference")}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting || mutation.isPending}
            disabled={isSubmitting || mutation.isPending}
          >
            Record Transaction
          </Button>
        </div>
      </form>
    </>
  );
}
