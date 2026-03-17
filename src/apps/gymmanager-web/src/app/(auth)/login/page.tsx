"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    try {
      await login(data);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const data = error.response.data;
        if (data && typeof data === "object" && "detail" in data) {
          setServerError(String(data.detail));
        } else {
          setServerError("Invalid email or password.");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Dumbbell className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">GymManager</h1>
          <p className="text-surface-500 text-[10px] font-medium uppercase tracking-wider">Pro Dashboard</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Welcome back</h2>
      <p className="text-surface-400 text-sm mb-6">
        Sign in to your account to continue
      </p>

      {serverError && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
            className="bg-white/[0.06] border-white/10 text-white placeholder-surface-500 focus:border-primary-500 focus:ring-primary-500/30"
            {...register("email")}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={!!errors.password}
            className="bg-white/[0.06] border-white/10 text-white placeholder-surface-500 focus:border-primary-500 focus:ring-primary-500/30"
            {...register("password")}
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
