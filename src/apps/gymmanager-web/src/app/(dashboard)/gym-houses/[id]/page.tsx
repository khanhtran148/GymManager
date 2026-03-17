"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useGymHouse, useUpdateGymHouse, useDeleteGymHouse } from "@/hooks/use-gym-houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const deleteGymHouse = useDeleteGymHouse();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  async function handleDelete() {
    await deleteGymHouse.mutateAsync(params.id);
    router.push("/gym-houses");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Loading gym house..." />
      </div>
    );
  }

  if (error || !gymHouse) {
    return (
      <Alert variant="error">
        Gym house not found or failed to load.{" "}
        <Link href="/gym-houses" className="underline font-medium">
          Back to gym houses
        </Link>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <PageHeader backHref="/gym-houses" breadcrumb="Gym Houses" title={gymHouse.name} />
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              document.getElementById("name")?.focus();
            }}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <Card>
        {serverError && (
          <Alert variant="error" className="mb-5">{serverError}</Alert>
        )}
        {saved && (
          <Alert variant="success" className="mb-5">Gym house updated successfully.</Alert>
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Gym House"
        description={`Are you sure you want to delete "${gymHouse.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteGymHouse.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
