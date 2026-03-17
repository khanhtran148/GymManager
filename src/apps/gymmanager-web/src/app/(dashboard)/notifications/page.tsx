"use client";

import { Bell } from "lucide-react";
import { NotificationFeed } from "@/components/notification-feed";

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-text-muted" aria-hidden="true" />
        <h1 className="text-lg font-bold text-text-primary">Notifications</h1>
      </div>
      <NotificationFeed />
    </div>
  );
}
