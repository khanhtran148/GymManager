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

const registerSchema = z.object({
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
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-()]{7,20}$/.test(val),
      "Please enter a valid phone number"
    ),
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
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">GymManager</h1>
          <p className="text-slate-400 text-xs">Management Platform</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
      <p className="text-slate-400 text-sm mb-6">
        Get started with GymManager today
      </p>

      {serverError && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm"
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
            className="bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-indigo-400"
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
            className="bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-indigo-400"
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
            placeholder="••••••••"
            error={!!errors.password}
            className="bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-indigo-400"
            {...register("password")}
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
            className="bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-indigo-400"
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

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
