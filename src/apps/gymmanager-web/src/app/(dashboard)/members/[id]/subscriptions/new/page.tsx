"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useMember } from "@/hooks/use-members";
import { useCreateSubscription } from "@/hooks/use-subscriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";

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

export default function NewSubscriptionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: member } = useMember(params.id);
  const createSubscription = useCreateSubscription();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      type: "Monthly",
      price: 0,
    },
  });

  async function onSubmit(data: SubscriptionFormData) {
    setServerError(null);
    try {
      await createSubscription.mutateAsync({
        memberId: params.id,
        data: {
          type: data.type,
          price: data.price,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        },
      });
      router.push(`/members/${params.id}`);
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
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/members/${params.id}`}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-800 transition-all"
          aria-label="Back to member"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div>
          <p className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
            {member ? member.fullName : "Member"} / Subscriptions
          </p>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">
            Add New Subscription
          </h2>
        </div>
      </div>

      <Card>
        {serverError && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm"
          >
            {serverError}
          </div>
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
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 text-sm font-medium"
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
            >
              <Input
                id="endDate"
                type="date"
                error={!!errors.endDate}
                {...register("endDate")}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href={`/members/${params.id}`}>
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
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
      </Card>
    </div>
  );
}
