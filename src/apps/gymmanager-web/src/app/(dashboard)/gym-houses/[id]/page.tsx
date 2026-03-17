"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useGymHouse, useUpdateGymHouse } from "@/hooks/use-gym-houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";

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

export default function GymHouseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: gymHouse, isLoading, error } = useGymHouse(params.id);
  const updateGymHouse = useUpdateGymHouse();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<GymHouseFormData>({
    resolver: zodResolver(gymHouseSchema),
  });

  useEffect(() => {
    if (gymHouse) {
      reset({
        name: gymHouse.name,
        address: gymHouse.address,
        phone: gymHouse.phone ?? "",
        operatingHours: gymHouse.operatingHours ?? "",
        hourlyCapacity: gymHouse.hourlyCapacity,
      });
    }
  }, [gymHouse, reset]);

  async function onSubmit(data: GymHouseFormData) {
    setServerError(null);
    setSaved(false);
    try {
      await updateGymHouse.mutateAsync({
        id: params.id,
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone || undefined,
          operatingHours: data.operatingHours || undefined,
          hourlyCapacity: data.hourlyCapacity,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
          setServerError("Failed to update gym house. Please try again.");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <svg
          className="h-6 w-6 animate-spin mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Loading gym house...</span>
      </div>
    );
  }

  if (error || !gymHouse) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
      >
        Gym house not found or failed to load.{" "}
        <Link href="/gym-houses" className="underline">
          Back to gym houses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/gym-houses"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Back to gym houses"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div>
          <p className="text-sm text-gray-500">Gym Houses</p>
          <h2 className="text-xl font-bold text-gray-900">{gymHouse.name}</h2>
        </div>
      </div>

      <Card>
        {serverError && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {serverError}
          </div>
        )}
        {saved && (
          <div
            role="status"
            className="mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
          >
            Gym house updated successfully.
          </div>
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
            hint="Optional — e.g. Mon–Fri 6am–10pm"
          >
            <Input
              id="operatingHours"
              type="text"
              placeholder="Mon–Fri 6:00am–10:00pm, Sat–Sun 8:00am–8:00pm"
              error={!!errors.operatingHours}
              {...register("operatingHours")}
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/gym-houses">
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
