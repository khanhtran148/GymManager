"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { useCreateAnnouncement } from "@/hooks/use-announcements";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import type { TargetAudience } from "@/types/announcement";

const TARGET_AUDIENCE_OPTIONS: { value: TargetAudience; label: string }[] = [
  { value: "AllMembers", label: "All Members" },
  { value: "ActiveMembers", label: "Active Members" },
  { value: "Staff", label: "Staff" },
  { value: "Trainers", label: "Trainers" },
  { value: "Everyone", label: "Everyone" },
];

// Min datetime string for the input (now, in local timezone, ISO-like for datetime-local)
function minDateTimeLocal(): string {
  const now = new Date();
  // Round up to next minute
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() + 1);
  return now.toISOString().slice(0, 16);
}

const announcementSchema = z.object({
  gymHouseId: z.string(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content must be at most 5000 characters"),
  targetAudience: z.enum([
    "AllMembers",
    "ActiveMembers",
    "Staff",
    "Trainers",
    "Everyone",
  ] as const),
  publishAt: z.string().min(1, "Publish time is required"),
  isChainWide: z.boolean(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function NewAnnouncementPage() {
  const router = useRouter();
  const createAnnouncement = useCreateAnnouncement();
  const { data: gymHouses } = useGymHouses();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      targetAudience: "AllMembers",
      isChainWide: false,
    },
  });

  const isChainWide = watch("isChainWide");
  const contentValue = watch("content") ?? "";

  async function onSubmit(data: AnnouncementFormData) {
    setServerError(null);
    try {
      // Convert local datetime-local value to UTC ISO string
      const publishAtUtc = new Date(data.publishAt).toISOString();

      await createAnnouncement.mutateAsync({
        gymHouseId: data.isChainWide ? null : data.gymHouseId || null,
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience,
        publishAt: publishAtUtc,
      });

      router.push("/announcements");
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
        if (
          respData &&
          typeof respData === "object" &&
          "detail" in respData
        ) {
          setServerError(String(respData.detail));
        } else {
          setServerError("Failed to create announcement. Please try again.");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        backHref="/announcements"
        breadcrumb="Announcements"
        title="New Announcement"
      />

      <Card>
        {serverError && (
          <Alert variant="error" className="mb-5">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Chain-wide toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isChainWide"
              className="w-4 h-4 rounded border-border text-primary-500 focus:ring-primary-500"
              {...register("isChainWide")}
            />
            <label
              htmlFor="isChainWide"
              className="text-sm font-medium text-text-secondary cursor-pointer"
            >
              Chain-wide announcement{" "}
              <span className="text-text-muted font-normal">
                (Owner only — visible across all gym houses)
              </span>
            </label>
          </div>

          {/* Gym House selector — hidden when chain-wide */}
          {!isChainWide && (
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
                {gymHouses?.map((gh) => (
                  <option key={gh.id} value={gh.id}>
                    {gh.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField
            label="Title"
            htmlFor="title"
            error={errors.title?.message}
            required
          >
            <Input
              id="title"
              type="text"
              placeholder="e.g. Grand Opening Promo"
              maxLength={200}
              error={!!errors.title}
              {...register("title")}
            />
          </FormField>

          <FormField
            label="Content"
            htmlFor="content"
            error={errors.content?.message}
            required
            hint={`${contentValue.length}/5000 characters`}
          >
            <textarea
              id="content"
              rows={5}
              placeholder="Write your announcement content here…"
              maxLength={5000}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y transition-shadow ${
                errors.content
                  ? "border-red-400 focus:ring-red-400/50"
                  : "border-border"
              }`}
              aria-describedby={
                errors.content ? "content-error" : undefined
              }
              {...register("content")}
            />
          </FormField>

          <FormField
            label="Target Audience"
            htmlFor="targetAudience"
            error={errors.targetAudience?.message}
            required
          >
            <Select
              id="targetAudience"
              error={!!errors.targetAudience}
              {...register("targetAudience")}
            >
              {TARGET_AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Publish At"
            htmlFor="publishAt"
            error={errors.publishAt?.message}
            required
            hint="Schedule when this announcement should go live (UTC)"
          >
            <Input
              id="publishAt"
              type="datetime-local"
              min={minDateTimeLocal()}
              error={!!errors.publishAt}
              {...register("publishAt")}
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/announcements">
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
              Create Announcement
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
