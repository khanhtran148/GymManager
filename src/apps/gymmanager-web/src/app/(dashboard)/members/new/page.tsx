"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useCreateMember } from "@/hooks/use-members";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";

const memberSchema = z.object({
  userId: z.string().uuid("Must be a valid UUID"),
  gymHouseId: z.string().min(1, "Please select a gym house"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-()]{7,20}$/.test(val),
      "Please enter a valid phone number"
    ),
});

type MemberFormData = z.infer<typeof memberSchema>;

export default function NewMemberPage() {
  const router = useRouter();
  const createMember = useCreateMember();
  const { data: gymHouses } = useGymHouses();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  async function onSubmit(data: MemberFormData) {
    setServerError(null);
    try {
      const member = await createMember.mutateAsync({
        userId: data.userId,
        gymHouseId: data.gymHouseId,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || undefined,
      });
      router.push(`/members/${member.id}`);
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
          setServerError("Failed to create member. Please try again.");
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
          href="/members"
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-800 transition-all"
          aria-label="Back to members"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div>
          <p className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">Members</p>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">Add New Member</h2>
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
              <option value="">Select a gym house</option>
              {gymHouses?.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="User ID"
            htmlFor="userId"
            error={errors.userId?.message}
            required
            hint="UUID of the existing user account"
          >
            <Input
              id="userId"
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              error={!!errors.userId}
              {...register("userId")}
            />
          </FormField>

          <FormField
            label="Full Name"
            htmlFor="fullName"
            error={errors.fullName?.message}
            required
          >
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              error={!!errors.fullName}
              {...register("fullName")}
            />
          </FormField>

          <FormField
            label="Email Address"
            htmlFor="email"
            error={errors.email?.message}
            required
          >
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              error={!!errors.email}
              {...register("email")}
            />
          </FormField>

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

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/members">
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
              Create Member
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
