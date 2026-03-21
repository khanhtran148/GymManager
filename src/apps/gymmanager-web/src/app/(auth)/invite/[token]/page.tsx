"use client";

import { use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { acceptInvitation } from "@/lib/invitations";
import { ROLES_METADATA_QUERY_KEY } from "@/hooks/use-roles-metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { AuthCard } from "@/components/ui/auth-card";

const acceptSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(200, "Full name is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AcceptFormData = z.infer<typeof acceptSchema>;

function getInviteErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object"
  ) {
    const res = error.response as Record<string, unknown>;
    if (res.status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    if (res.status === 404) {
      return "This invitation link is invalid or has expired.";
    }
    if (
      res.data &&
      typeof res.data === "object" &&
      "detail" in res.data
    ) {
      const detail = String((res.data as Record<string, unknown>).detail);
      if (detail.toLowerCase().includes("expired")) {
        return "This invitation has expired. Please ask for a new invite.";
      }
      if (detail.toLowerCase().includes("already accepted")) {
        return "This invitation has already been accepted. Try signing in instead.";
      }
      return detail;
    }
  }
  return "Something went wrong. Please try again.";
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function InviteAcceptPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const storeLogin = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptFormData>({
    resolver: zodResolver(acceptSchema),
  });

  function invalidateRbacCache(): void {
    if (typeof document !== "undefined") {
      document.cookie = "route_access=; path=/; max-age=0; SameSite=Lax";
    }
    queryClient.invalidateQueries({ queryKey: ROLES_METADATA_QUERY_KEY });
  }

  async function onSubmit(data: AcceptFormData) {
    setServerError(null);
    try {
      const response = await acceptInvitation(token, {
        password: data.password,
        fullName: data.fullName,
      });
      storeLogin(response);
      invalidateRbacCache();
      setIsSuccess(true);
      router.push("/");
    } catch (error: unknown) {
      setServerError(getInviteErrorMessage(error));
    }
  }

  if (isSuccess) {
    return (
      <AuthCard
        title="Welcome to GymManager"
        subtitle="Your account has been set up. Redirecting..."
      >
        <div
          role="status"
          className="flex items-center justify-center py-8 text-text-muted text-sm"
          aria-live="polite"
        >
          <span className="sr-only">Loading</span>
          <svg
            className="animate-spin w-5 h-5 mr-2 text-primary-500"
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
          Redirecting to dashboard...
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Accept your invitation"
      subtitle="Set up your account to join the gym"
    >
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          Set up my account
        </Button>
      </form>
    </AuthCard>
  );
}
