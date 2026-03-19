"use client";

import { useState } from "react";
import { Plus, Megaphone } from "lucide-react";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { FormModal } from "@/components/ui/form-modal";
import { PermissionGate } from "@/components/permission-gate";
import { useRbacStore } from "@/stores/rbac-store";
import { useCreateModal } from "@/hooks/use-create-modal";
import { useToastStore } from "@/stores/toast-store";
import { AnnouncementForm } from "@/components/forms/announcement-form";
import type { AnnouncementDto } from "@/types/announcement";

const AUDIENCE_LABELS: Record<string, string> = {
  AllMembers: "All Members",
  ActiveMembers: "Active Members",
  Staff: "Staff",
  Trainers: "Trainers",
  Everyone: "Everyone",
};

function PublishStatusBadge({ announcement }: { announcement: AnnouncementDto }) {
  if (announcement.isPublished) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Published
      </span>
    );
  }
  const scheduledAt = new Date(announcement.publishAt);
  const isScheduled = scheduledAt > new Date();
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      {isScheduled ? "Scheduled" : "Pending"}
    </span>
  );
}

export default function AnnouncementsPage() {
  const { permissionMap } = useRbacStore();
  const [page, setPage] = useState(1);
  const { data: gymHouses } = useGymHouses();
  const [gymHouseId, setGymHouseId] = useState("");
  const createModal = useCreateModal();
  const { addToast } = useToastStore();

  const selectedGymHouseId = gymHouseId || gymHouses?.[0]?.id || "";

  const { data, isLoading, error } = useAnnouncements(selectedGymHouseId, page);

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (a: AnnouncementDto) => (
        <span className="font-semibold text-text-primary">{a.title}</span>
      ),
    },
    {
      key: "targetAudience",
      header: "Audience",
      render: (a: AnnouncementDto) => (
        <span className="text-text-secondary text-sm">
          {AUDIENCE_LABELS[a.targetAudience] ?? a.targetAudience}
        </span>
      ),
    },
    {
      key: "authorName",
      header: "Author",
      render: (a: AnnouncementDto) => (
        <span className="text-text-muted text-sm">{a.authorName}</span>
      ),
    },
    {
      key: "publishAt",
      header: "Publish Time",
      render: (a: AnnouncementDto) => (
        <time
          dateTime={a.publishAt}
          className="text-text-muted text-xs tabular-nums"
        >
          {new Date(a.publishAt).toLocaleString()}
        </time>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a: AnnouncementDto) => <PublishStatusBadge announcement={a} />,
    },
    {
      key: "gymHouseId",
      header: "Scope",
      render: (a: AnnouncementDto) => (
        <span className="text-text-muted text-xs">
          {a.gymHouseId ? "House-scoped" : "Chain-wide"}
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <Alert variant="error">
        Failed to load announcements. Please refresh the page.
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-text-muted" aria-hidden="true" />
          <h1 className="text-lg font-bold text-text-primary">Announcements</h1>
        </div>

        <div className="flex items-center gap-3">
          {(gymHouses?.length ?? 0) > 1 && (
            <div>
              <label htmlFor="gymHouseFilter" className="sr-only">
                Filter by gym house
              </label>
              <Select
                id="gymHouseFilter"
                value={gymHouseId}
                onChange={(e) => {
                  setGymHouseId(e.target.value);
                  setPage(1);
                }}
                className="w-44"
              >
                {gymHouses?.map((gh) => (
                  <option key={gh.id} value={gh.id}>
                    {gh.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <PermissionGate permission={permissionMap["ManageAnnouncements"] ?? 0n}>
            <Button variant="primary" size="md" onClick={createModal.open}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Announcement
            </Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No announcements found. Create your first announcement."
        pagination={
          data
            ? {
                page: data.page,
                pageSize: data.pageSize,
                totalCount: data.totalCount,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      <FormModal isOpen={createModal.isOpen} onClose={createModal.close} title="New Announcement" maxWidth="xl">
        <AnnouncementForm
          onSuccess={() => {
            createModal.close();
            addToast({ message: "Announcement created successfully", variant: "success" });
          }}
          onCancel={createModal.close}
        />
      </FormModal>
    </div>
  );
}
