"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { useCreateBooking } from "@/hooks/use-bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";

// TODO: Get from gym house selector/context
const gymHouseId = "placeholder-gym-id";

const bookingSchema = z
  .object({
    memberId: z.string().uuid("Must be a valid UUID"),
    bookingType: z.number().min(0).max(1),
    timeSlotId: z.string().optional(),
    classScheduleId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.bookingType === 0) return !!data.timeSlotId;
      if (data.bookingType === 1) return !!data.classScheduleId;
      return false;
    },
    {
      message:
        "Time slot ID is required for TimeSlot bookings; class schedule ID for ClassSession bookings.",
      path: ["timeSlotId"],
    }
  );

type BookingFormData = z.infer<typeof bookingSchema>;

export default function NewBookingPage() {
  const router = useRouter();
  const createBooking = useCreateBooking(gymHouseId);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { bookingType: 0 },
  });

  const bookingType = watch("bookingType");

  async function onSubmit(data: BookingFormData) {
    setServerError(null);
    try {
      const booking = await createBooking.mutateAsync({
        memberId: data.memberId,
        bookingType: data.bookingType,
        timeSlotId: data.bookingType === 0 ? data.timeSlotId : undefined,
        classScheduleId:
          data.bookingType === 1 ? data.classScheduleId : undefined,
      });
      router.push(`/bookings/${booking.id}`);
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
          setServerError("Failed to create booking. Please try again.");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        backHref="/bookings"
        breadcrumb="Bookings"
        title="New Booking"
      />

      <Card>
        {serverError && (
          <Alert variant="error" className="mb-5">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            label="Member ID"
            htmlFor="memberId"
            error={errors.memberId?.message}
            required
            hint="UUID of the member to book for"
          >
            <Input
              id="memberId"
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              error={!!errors.memberId}
              {...register("memberId")}
            />
          </FormField>

          <FormField
            label="Booking Type"
            htmlFor="bookingType"
            error={errors.bookingType?.message}
            required
          >
            <Select
              id="bookingType"
              value={bookingType}
              error={!!errors.bookingType}
              onChange={(e) => setValue("bookingType", Number(e.target.value))}
            >
              <option value={0}>Time Slot</option>
              <option value={1}>Class Session</option>
            </Select>
          </FormField>

          {bookingType === 0 && (
            <FormField
              label="Time Slot ID"
              htmlFor="timeSlotId"
              error={errors.timeSlotId?.message}
              required
              hint="UUID of the time slot to book"
            >
              <Input
                id="timeSlotId"
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                error={!!errors.timeSlotId}
                {...register("timeSlotId")}
              />
            </FormField>
          )}

          {bookingType === 1 && (
            <FormField
              label="Class Schedule ID"
              htmlFor="classScheduleId"
              error={errors.classScheduleId?.message}
              required
              hint="UUID of the class schedule to enroll in"
            >
              <Input
                id="classScheduleId"
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                error={!!errors.classScheduleId}
                {...register("classScheduleId")}
              />
            </FormField>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/bookings">
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
              Create Booking
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
