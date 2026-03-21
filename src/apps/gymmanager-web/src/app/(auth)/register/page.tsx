"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePublicGymHouses } from "@/hooks/use-gym-houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { AuthCard } from "@/components/ui/auth-card";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(200, "Full name is too long"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[\d\s\-()]{7,20}$/.test(val),
        "Please enter a valid phone number"
      ),
    gymHouseId: z.string().uuid("Please select a gym").min(1, "Please select a gym"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { data: gymHouses, isLoading: isLoadingGyms, error: gymsError } = usePublicGymHouses();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setServerError(null);
    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        gymHouseId: data.gymHouseId,
      });
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
          setServerError("Registration failed. This email may already be in use.");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Get started with GymManager today">
      {serverError && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 bg-auth-error-bg border border-auth-error-border rounded-xl text-red-400 text-sm"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          label="Full name"
          htmlFor="fullName"
          error={errors.fullName?.message}
          required
        >
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            error={!!errors.fullName}
            className="input-auth"
            {...register("fullName")}
          />
        </FormField>

        <FormField
          label="Email address"
          htmlFor="email"
          error={errors.email?.message}
          required
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={!!errors.email}
            className="input-auth"
            {...register("email")}
          />
        </FormField>

        <FormField
          label="Gym"
          htmlFor="gymHouseId"
          error={errors.gymHouseId?.message}
          required
        >
          {isLoadingGyms ? (
            <div
              className="block w-full rounded-xl border border-border-muted px-3.5 py-2.5 text-sm text-text-secondary bg-input animate-pulse"
              aria-busy="true"
              aria-label="Loading gyms..."
            >
              Loading gyms...
            </div>
          ) : gymsError ? (
            <div
              role="alert"
              className="block w-full rounded-xl border border-red-400 px-3.5 py-2.5 text-sm text-red-400 bg-input"
            >
              Failed to load gyms. Please refresh the page.
            </div>
          ) : !gymHouses || gymHouses.length === 0 ? (
            <div
              role="status"
              className="block w-full rounded-xl border border-border-muted px-3.5 py-2.5 text-sm text-text-muted bg-input"
            >
              No gyms available at this time.
            </div>
          ) : (
            <Select
              id="gymHouseId"
              error={!!errors.gymHouseId}
              className="input-auth"
              defaultValue=""
              aria-label="Select a gym"
              {...register("gymHouseId")}
            >
              <option value="" disabled>
                Select a gym...
              </option>
              {gymHouses.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name} — {gym.address}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters with uppercase, lowercase, number, and special character"
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={!!errors.password}
            className="input-auth"
            {...register("password")}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={!!errors.confirmPassword}
            className="input-auth"
            {...register("confirmPassword")}
          />
        </FormField>

        <FormField
          label="Phone number"
          htmlFor="phone"
          error={errors.phone?.message}
          hint="Optional"
        >
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 (555) 000-0000"
            error={!!errors.phone}
            className="input-auth"
            {...register("phone")}
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isLoadingGyms || !!gymsError || !gymHouses?.length}
          className="w-full mt-2"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
