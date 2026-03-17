"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import { Spinner } from "@/components/ui/spinner";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const realtimeItems = useNotificationStore((s) => s.realtimeItems);

  const { data, isLoading } = useNotifications(1);
  const markRead = useMarkNotificationRead();

  // Merge server items + realtime items (deduplicate by id)
  const serverItems = data?.items ?? [];
  const realtimeIds = new Set(realtimeItems.map((n) => n.id));
  const merged = [
    ...realtimeItems,
    ...serverItems.filter((n) => !realtimeIds.has(n.id)),
  ].slice(0, 10);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleMarkRead(id: string) {
    markRead.mutate(id);
  }

  const badgeCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-hover transition-all"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
            aria-hidden="true"
          >
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl",
            "bg-card border border-border z-50 overflow-hidden"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
            <h2 className="text-sm font-semibold text-text-primary">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="text-xs text-text-muted">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading && merged.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : merged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-text-muted">
                <BellOff className="w-8 h-8" aria-hidden="true" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-border-muted">
                {merged.map((notification) => {
                  const isUnread = notification.status !== "Read";
                  return (
                    <li
                      key={notification.id}
                      className={cn(
                        "px-4 py-3 hover:bg-hover transition-colors",
                        isUnread && "bg-primary-500/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm truncate",
                              isUnread
                                ? "font-semibold text-text-primary"
                                : "font-medium text-text-secondary"
                            )}
                          >
                            {notification.announcementTitle}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                            {notification.announcementContent}
                          </p>
                          {notification.sentAt && (
                            <time
                              dateTime={notification.sentAt}
                              className="text-[10px] text-text-muted mt-1 block tabular-nums"
                            >
                              {new Date(notification.sentAt).toLocaleString()}
                            </time>
                          )}
                        </div>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(notification.id)}
                            disabled={markRead.isPending}
                            className="shrink-0 p-1 rounded-lg text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                            aria-label={`Mark "${notification.announcementTitle}" as read`}
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {merged.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border-muted">
              <a
                href="/notifications"
                className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
