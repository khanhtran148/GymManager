"use client";

import { useState, useEffect } from "react";
import { Settings, Mail, Smartphone, Bell, CheckCircle } from "lucide-react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { NotificationChannel, NotificationPreferenceDto } from "@/types/notification";

const CHANNEL_CONFIG: Array<{
  channel: NotificationChannel;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}> = [
  {
    channel: "InApp",
    label: "In-App Notifications",
    description: "Receive notifications inside the dashboard in real time.",
    icon: Bell,
  },
  {
    channel: "Push",
    label: "Push Notifications",
    description: "Receive push notifications on your mobile device.",
    icon: Smartphone,
  },
  {
    channel: "Email",
    label: "Email Notifications",
    description: "Receive email digests for new announcements.",
    icon: Mail,
  },
];

const DEFAULT_PREFERENCES: NotificationPreferenceDto[] = CHANNEL_CONFIG.map(
  (c) => ({ channel: c.channel, isEnabled: true })
);

export default function NotificationPreferencesPage() {
  const { data, isLoading, error } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const [prefs, setPrefs] = useState<Map<NotificationChannel, boolean>>(
    new Map()
  );
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const source = data ?? DEFAULT_PREFERENCES;
    const map = new Map<NotificationChannel, boolean>(
      source.map((p) => [p.channel, p.isEnabled])
    );
    setPrefs(map);
  }, [data]);

  function toggleChannel(channel: NotificationChannel) {
    setPrefs((prev) => {
      const next = new Map(prev);
      next.set(channel, !next.get(channel));
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaveError(null);
    setSaved(false);
    try {
      await updatePrefs.mutateAsync({
        preferences: CHANNEL_CONFIG.map((c) => ({
          channel: c.channel,
          isEnabled: prefs.get(c.channel) ?? true,
        })),
      });
      setSaved(true);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const d = err.response.data;
        if (d && typeof d === "object" && "detail" in d) {
          setSaveError(String(d.detail));
        } else {
          setSaveError("Failed to save preferences. Please try again.");
        }
      } else {
        setSaveError("Something went wrong. Please try again.");
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load notification preferences. Please refresh the page.
      </Alert>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      <PageHeader
        backHref="/settings"
        breadcrumb="Settings"
        title="Notification Preferences"
      />

      {saveError && (
        <Alert variant="error">{saveError}</Alert>
      )}

      {saved && (
        <Alert variant="success" className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          Preferences saved successfully.
        </Alert>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-4 h-4 text-text-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-text-primary">
            Notification Channels
          </h2>
        </div>

        <ul role="list" className="space-y-4" aria-label="Notification channel preferences">
          {CHANNEL_CONFIG.map(({ channel, label, description, icon: Icon }) => {
            const enabled = prefs.get(channel) ?? true;
            const switchId = `channel-${channel}`;
            return (
              <li
                key={channel}
                className="flex items-start justify-between gap-4 py-3 border-b border-border-muted last:border-0"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-nav-icon-bg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-text-muted" aria-hidden={true} />
                  </div>
                  <div>
                    <label
                      htmlFor={switchId}
                      className="text-sm font-medium text-text-primary cursor-pointer"
                    >
                      {label}
                    </label>
                    <p className="text-xs text-text-muted mt-0.5">{description}</p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  id={switchId}
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => toggleChannel(channel)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                    enabled ? "bg-primary-500" : "bg-border"
                  }`}
                >
                  <span className="sr-only">
                    {enabled ? "Disable" : "Enable"} {label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={updatePrefs.isPending}
          >
            Save Preferences
          </Button>
        </div>
      </Card>
    </div>
  );
}
