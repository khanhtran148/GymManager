"use client";

import { useState } from "react";
import { Check, BellOff, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/stores/notification-store";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import type { NotificationDto } from "@/types/notification";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pending",
  Sent: "Sent",
  Delivered: "Delivered",
  Read: "Read",
  Failed: "Failed",
};

const CHANNEL_LABELS: Record<string, string> = {
  InApp: "In-App",
  Push: "Push",
  Email: "Email",
};

interface NotificationRowProps {
  notification: NotificationDto;
  onMarkRead: (id: string) => void;
  isPending: boolean;
}

function NotificationRow({ notification, onMarkRead, isPending }: NotificationRowProps) {
  const isUnread = notification.status !== "Read";

  return (
    <li
      className={cn(
        "px-5 py-4 flex items-start gap-4 hover:bg-hover transition-colors",
        isUnread && "bg-primary-500/5"
      )}
    >
      {isUnread && (
        <span
          className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 shrink-0"
          aria-hidden="true"
        />
      )}
      {!isUnread && (
        <span className="mt-1.5 w-2 h-2 rounded-full bg-transparent shrink-0" aria-hidden="true" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm",
              isUnread ? "font-semibold text-text-primary" : "font-medium text-text-secondary"
            )}
          >
            {notification.announcementTitle}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-text-muted bg-card border border-border-muted px-1.5 py-0.5 rounded-md">
              {CHANNEL_LABELS[notification.channel] ?? notification.channel}
            </span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md border",
                notification.status === "Read"
                  ? "text-text-muted border-border-muted"
                  : notification.status === "Failed"
                  ? "text-red-500 border-red-200"
                  : "text-primary-500 border-primary-200"
              )}
            >
              {STATUS_LABELS[notification.status] ?? notification.status}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-muted mt-1 line-clamp-2">
          {notification.announcementContent}
        </p>

        <div className="flex items-center justify-between mt-2">
          {notification.sentAt ? (
            <time
              dateTime={notification.sentAt}
              className="text-[10px] text-text-muted tabular-nums"
            >
              {new Date(notification.sentAt).toLocaleString()}
            </time>
          ) : (
            <span />
          )}

          {isUnread && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onMarkRead(notification.id)}
              isLoading={isPending}
              aria-label={`Mark "${notification.announcementTitle}" as read`}
            >
              <Check className="w-3 h-3" aria-hidden="true" />
              Mark read
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export function NotificationFeed() {
  const [page, setPage] = useState(1);
  const realtimeItems = useNotificationStore((s) => s.realtimeItems);
  const { data, isLoading, error } = useNotifications(page);
  const markRead = useMarkNotificationRead();

  const serverItems = data?.items ?? [];
  const realtimeIds = new Set(realtimeItems.map((n) => n.id));
  const merged =
    page === 1
      ? [
          ...realtimeItems,
          ...serverItems.filter((n) => !realtimeIds.has(n.id)),
        ]
      : serverItems;

  const totalCount = data?.totalCount ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (error) {
    return (
      <Alert variant="error">
        Failed to load notifications. Please refresh the page.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading && merged.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="md" />
        </div>
      ) : merged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <BellOff className="w-10 h-10" aria-hidden="true" />
          <p className="text-sm font-medium">You have no notifications yet</p>
        </div>
      ) : (
        <ul
          role="list"
          aria-label="Notifications"
          className="divide-y divide-border-muted rounded-xl border border-border overflow-hidden bg-card"
        >
          {merged.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markRead.mutate(id)}
              isPending={markRead.isPending}
            />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Notification pages"
          className="flex items-center justify-between pt-2"
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Previous
          </Button>
          <span className="text-sm text-text-muted tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
}
