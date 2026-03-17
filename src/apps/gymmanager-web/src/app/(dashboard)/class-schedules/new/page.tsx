"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { useCreateClassSchedule } from "@/hooks/use-class-schedules";
import { useActiveGymHouse } from "@/hooks/use-active-gym-house";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

const classScheduleSchema = z
  .object({
    trainerId: z.string().uuid("Must be a valid UUID"),
    className: z
      .string()
      .min(2, "Class name must be at least 2 characters")
      .max(100, "Class name is too long"),
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    maxCapacity: z.number().int().min(1, "Capacity must be at least 1"),
    isRecurring: z.boolean(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type ClassScheduleFormData = z.infer<typeof classScheduleSchema>;

export default function NewClassSchedulePage() {
  const router = useRouter();
  const { gymHouseId, isLoading: gymHouseLoading } = useActiveGymHouse();
  const createClassSchedule = useCreateClassSchedule(gymHouseId ?? "");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClassScheduleFormData>({
    resolver: zodResolver(classScheduleSchema),
    defaultValues: {
      dayOfWeek: 1,
      maxCapacity: 20,
      isRecurring: true,
    },
  });

  const dayOfWeek = watch("dayOfWeek");
  const maxCapacity = watch("maxCapacity");

  async function onSubmit(data: ClassScheduleFormData) {
    setServerError(null);
    try {
      await createClassSchedule.mutateAsync({
        trainerId: data.trainerId,
        className: data.className,
        dayOfWeek: data.dayOfWeek,
        startTime: `${data.startTime}:00`,
        endTime: `${data.endTime}:00`,
        maxCapacity: data.maxCapacity,
        isRecurring: data.isRecurring,
      });
      router.push("/class-schedules");
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
          setServerError("Failed to create class schedule. Please try again.");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  if (gymHouseLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading gym house..." />
      </div>
    );
  }

  if (!gymHouseId) {
    return (
      <Alert variant="error">
        Please create a gym house first before creating class schedules.
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        backHref="/class-schedules"
        breadcrumb="Class Schedules"
        title="New Class Schedule"
      />

      <Card>
        {serverError && (
          <Alert variant="error" className="mb-5">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            label="Class Name"
            htmlFor="className"
            error={errors.className?.message}
            required
          >
            <Input
              id="className"
              type="text"
              placeholder="e.g. Yoga Basics, HIIT Circuit"
              error={!!errors.className}
              {...register("className")}
            />
          </FormField>

          <FormField
            label="Trainer ID"
            htmlFor="trainerId"
            error={errors.trainerId?.message}
            required
            hint="UUID of the trainer leading this class"
          >
            <Input
              id="trainerId"
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              error={!!errors.trainerId}
              {...register("trainerId")}
            />
          </FormField>

          <FormField
            label="Day of Week"
            htmlFor="dayOfWeek"
            error={errors.dayOfWeek?.message}
            required
          >
            <Select
              id="dayOfWeek"
              value={dayOfWeek}
              error={!!errors.dayOfWeek}
              onChange={(e) => setValue("dayOfWeek", Number(e.target.value))}
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Time"
              htmlFor="startTime"
              error={errors.startTime?.message}
              required
            >
              <Input
                id="startTime"
                type="time"
                error={!!errors.startTime}
                {...register("startTime")}
              />
            </FormField>

            <FormField
              label="End Time"
              htmlFor="endTime"
              error={errors.endTime?.message}
              required
            >
              <Input
                id="endTime"
                type="time"
                error={!!errors.endTime}
                {...register("endTime")}
              />
            </FormField>
          </div>

          <FormField
            label="Max Capacity"
            htmlFor="maxCapacity"
            error={errors.maxCapacity?.message}
            required
          >
            <Input
              id="maxCapacity"
              type="number"
              min={1}
              placeholder="20"
              value={maxCapacity}
              error={!!errors.maxCapacity}
              onChange={(e) => setValue("maxCapacity", Number(e.target.value))}
            />
          </FormField>

          <div className="flex items-center gap-3 py-1">
            <input
              id="isRecurring"
              type="checkbox"
              className="w-4 h-4 rounded border-border-muted text-primary-500 focus:ring-primary-500/40 focus:ring-2 cursor-pointer"
              {...register("isRecurring")}
            />
            <label
              htmlFor="isRecurring"
              className="text-sm font-medium text-text-secondary cursor-pointer select-none"
            >
              Recurring weekly
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/class-schedules">
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
              Create Class
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
