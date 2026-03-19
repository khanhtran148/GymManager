"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useCreateGymHouse } from "@/hooks/use-gym-houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

const gymHouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-()]{7,20}$/.test(val),
      "Please enter a valid phone number"
    ),
  operatingHours: z.string().optional(),
  hourlyCapacity: z
    .number()
    .int("Must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(10000, "Capacity seems too high"),
});

type GymHouseFormData = z.infer<typeof gymHouseSchema>;

interface GymHouseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function GymHouseForm({ onSuccess, onCancel }: GymHouseFormProps) {
  const createGymHouse = useCreateGymHouse();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GymHouseFormData>({
    resolver: zodResolver(gymHouseSchema),
    defaultValues: { hourlyCapacity: 50 },
  });

  async function onSubmit(data: GymHouseFormData) {
    setServerError(null);
    try {
      await createGymHouse.mutateAsync({
        name: data.name,
        address: data.address,
        phone: data.phone || undefined,
        operatingHours: data.operatingHours || undefined,
        hourlyCapacity: data.hourlyCapacity,
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
          setServerError("Failed to create gym house. Please try again.");
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
          label="Gym House Name"
          htmlFor="name"
          error={errors.name?.message}
          required
        >
          <Input
            id="name"
            type="text"
            placeholder="Downtown Fitness Center"
            error={!!errors.name}
            {...register("name")}
          />
        </FormField>

        <FormField
          label="Address"
          htmlFor="address"
          error={errors.address?.message}
          required
        >
          <Input
            id="address"
            type="text"
            placeholder="123 Main St, City, State 12345"
            error={!!errors.address}
            {...register("address")}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Phone Number"
            htmlFor="phone"
            error={errors.phone?.message}
            hint="Optional"
          >
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              error={!!errors.phone}
              {...register("phone")}
            />
          </FormField>

          <FormField
            label="Hourly Capacity"
            htmlFor="hourlyCapacity"
            error={errors.hourlyCapacity?.message}
            required
            hint="Max members per hour"
          >
            <Input
              id="hourlyCapacity"
              type="number"
              min={1}
              placeholder="50"
              error={!!errors.hourlyCapacity}
              {...register("hourlyCapacity", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <FormField
          label="Operating Hours"
          htmlFor="operatingHours"
          error={errors.operatingHours?.message}
          hint="Optional — e.g. Mon-Fri 6am-10pm"
        >
          <Input
            id="operatingHours"
            type="text"
            placeholder="Mon-Fri 6:00am-10:00pm, Sat-Sun 8:00am-8:00pm"
            error={!!errors.operatingHours}
            {...register("operatingHours")}
          />
        </FormField>

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
            Create Gym House
          </Button>
        </div>
      </form>
    </>
  );
}
