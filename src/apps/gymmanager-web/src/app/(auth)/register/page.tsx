"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { AuthCard } from "@/components/ui/auth-card";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[\d\s\-()]{7,20}$/.test(val),
        "Please enter a valid phone number"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
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
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters, one uppercase letter and one number"
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
