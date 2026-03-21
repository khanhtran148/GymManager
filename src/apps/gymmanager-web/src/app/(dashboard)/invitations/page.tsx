"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Check, Mail } from "lucide-react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { createInvitation } from "@/lib/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { InvitationResponse } from "@/types/invitation";

const ROLE_OPTIONS = [
  { value: "HouseManager", label: "House Manager" },
  { value: "Trainer", label: "Trainer" },
  { value: "Staff", label: "Staff" },
  { value: "Member", label: "Member" },
] as const;

type InvitationRole = typeof ROLE_OPTIONS[number]["value"];

const createInvitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["HouseManager", "Trainer", "Staff", "Member"] as const, {
    error: "Please select a role",
  }),
  gymHouseId: z.string().uuid("Please select a gym").min(1, "Please select a gym"),
});

type CreateInvitationFormData = z.infer<typeof createInvitationSchema>;

export default function InvitationsPage() {
  const { data: gymHouses, isLoading: isLoadingGyms, error: gymsError } = useGymHouses();
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] = useState<InvitationResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvitationFormData>({
    resolver: zodResolver(createInvitationSchema),
  });

  async function onSubmit(data: CreateInvitationFormData) {
    setServerError(null);
    setCreatedInvitation(null);
    try {
      const invitation = await createInvitation({
        email: data.email,
        role: data.role as InvitationRole,
        gymHouseId: data.gymHouseId,
      });
      setCreatedInvitation(invitation);
      reset();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object"
      ) {
        const res = error.response as Record<string, unknown>;
        if (res.status === 409) {
          setServerError("A pending invitation already exists for this email at this gym.");
          return;
        }
        if (res.status === 403) {
          setServerError("You don't have permission to create invitations.");
          return;
        }
        if (
          res.data &&
          typeof res.data === "object" &&
          "detail" in res.data
        ) {
          setServerError(String((res.data as Record<string, unknown>).detail));
          return;
        }
      }
      setServerError("Failed to create invitation. Please try again.");
    }
  }

  async function copyInviteLink() {
    if (!createdInvitation?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(createdInvitation.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — select text manually
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Invite People</h1>
        <p className="mt-1 text-sm text-text-muted">
          Send an invitation to give someone access to your gym.
        </p>
      </div>

      {gymsError && (
        <Alert variant="error">
          Failed to load gym houses. Please refresh the page.
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New invitation</CardTitle>
        </CardHeader>

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
            htmlFor="invite-email"
            error={errors.email?.message}
            required
          >
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              placeholder="colleague@example.com"
              error={!!errors.email}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Role"
            htmlFor="invite-role"
            error={errors.role?.message}
            required
          >
            <Select
              id="invite-role"
              error={!!errors.role}
              defaultValue=""
              aria-label="Select a role"
              {...register("role")}
            >
              <option value="" disabled>
                Select a role...
              </option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Gym"
            htmlFor="invite-gym"
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
            ) : (
              <Select
                id="invite-gym"
                error={!!errors.gymHouseId}
                defaultValue=""
                aria-label="Select a gym"
                {...register("gymHouseId")}
              >
                <option value="" disabled>
                  Select a gym...
                </option>
                {(gymHouses ?? []).map((gym) => (
                  <option key={gym.id} value={gym.id}>
                    {gym.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isLoadingGyms || !!gymsError}
            className="w-full sm:w-auto"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            Send invitation
          </Button>
        </form>
      </Card>

      {createdInvitation && (
        <Card>
          <CardHeader>
            <CardTitle>Invitation created</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Share this link with{" "}
              <span className="font-semibold text-text-primary">{createdInvitation.email}</span>.
              The link expires on{" "}
              <time dateTime={createdInvitation.expiresAt} className="font-semibold text-text-primary">
                {new Date(createdInvitation.expiresAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              .
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-border-muted bg-surface-50 dark:bg-surface-900 p-3">
              <p
                className="flex-1 text-xs font-mono text-text-secondary break-all"
                aria-label="Invite link"
              >
                {createdInvitation.inviteUrl}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyInviteLink}
                aria-label={copied ? "Link copied" : "Copy invite link"}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </Button>
            </div>

            {copied && (
              <p role="status" aria-live="polite" className="text-xs text-green-500">
                Link copied to clipboard.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
