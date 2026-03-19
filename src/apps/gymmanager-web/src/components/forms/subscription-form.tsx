"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useCreateSubscription } from "@/hooks/use-subscriptions";
import { useActiveGymHouse } from "@/hooks/use-active-gym-house";
import { SUBSCRIPTION_TYPE_VALUES } from "@/types/subscription";
import type { SubscriptionType } from "@/types/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

const subscriptionSchema = z
  .object({
    type: z.enum(["Monthly", "Quarterly", "Annual", "DayPass"]),
    price: z
      .number()
      .min(0, "Price cannot be negative"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    { message: "End date must be after start date", path: ["endDate"] }
  );

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  memberId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function defaultEndDate(type: string, start: string): string {
  const d = new Date(start);
  switch (type) {
    case "Monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "Quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "Annual":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "DayPass":
      d.setDate(d.getDate() + 1);
      break;
  }
  return d.toISOString().split("T")[0];
}

export function SubscriptionForm({ memberId, onSuccess, onCancel }: SubscriptionFormProps) {
  const { gymHouseId } = useActiveGymHouse();
  const createSubscription = useCreateSubscription(gymHouseId ?? "");
  const [serverError, setServerError] = useState<string | null>(null);
  const today = todayStr();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      type: "Monthly",
      price: 0,
      startDate: today,
      endDate: defaultEndDate("Monthly", today),
    },
  });

  const subscriptionType = watch("type");
  const startDate = watch("startDate");

  useEffect(() => {
    if (startDate) {
      setValue("endDate", defaultEndDate(subscriptionType, startDate));
    }
  }, [subscriptionType, startDate, setValue]);

  async function onSubmit(data: SubscriptionFormData) {
    setServerError(null);
    try {
      await createSubscription.mutateAsync({
        memberId,
        data: {
          type: SUBSCRIPTION_TYPE_VALUES[data.type as SubscriptionType],
          price: data.price,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        },
      });
      onSuccess();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const respData = error.response.data;
        if (respData && typeof respData === "object" && "detail" in respData) {
          setServerError(String(respData.detail));
        } else {
          setServerError("Failed to create subscription. Please try again.");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <>
      {serverError && (
        <Alert variant="error" className="mb-5">{serverError}</Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          label="Subscription Type"
          htmlFor="type"
          error={errors.type?.message}
          required
        >
          <Select
            id="type"
            error={!!errors.type}
            {...register("type")}
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
            <option value="DayPass">Day Pass</option>
          </Select>
        </FormField>

        <FormField
          label="Price"
          htmlFor="price"
          error={errors.price?.message}
          required
        >
          <div className="relative">
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium"
              aria-hidden="true"
            >
              $
            </span>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="pl-7"
              error={!!errors.price}
              {...register("price", { valueAsNumber: true })}
            />
          </div>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Start Date"
            htmlFor="startDate"
            error={errors.startDate?.message}
            required
          >
            <Input
              id="startDate"
              type="date"
              error={!!errors.startDate}
              {...register("startDate")}
            />
          </FormField>

          <FormField
            label="End Date"
            htmlFor="endDate"
            error={errors.endDate?.message}
            required
            hint="Auto-calculated from type"
          >
            <Input
              id="endDate"
              type="date"
              error={!!errors.endDate}
              disabled
              className="disabled:opacity-60 disabled:cursor-not-allowed"
              {...register("endDate")}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            Create Subscription
          </Button>
        </div>
      </form>
    </>
  );
}
