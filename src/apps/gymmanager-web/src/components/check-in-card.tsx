"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import {
  bookingTypeLabel,
  bookingStatusLabel,
  checkInSourceLabel,
} from "@/lib/booking-utils";
import type { BookingDto } from "@/types/booking";

interface CheckInCardProps {
  booking: BookingDto;
  onCheckIn: (bookingId: string, source: number) => Promise<void>;
  isLoading?: boolean;
}

const statusBadgeMap: Record<string, string> = {
  Confirmed: "Active",
  Cancelled: "Cancelled",
  "No Show": "Expired",
  Completed: "Active",
  "Wait Listed": "Frozen",
};

export function CheckInCard({ booking, onCheckIn, isLoading = false }: CheckInCardProps) {
  const [source, setSource] = useState(1);
  const isCheckedIn = !!booking.checkedInAt;
  const isConfirmed = booking.status === 0;
  const statusLabel = bookingStatusLabel(booking.status);
  const mappedStatus = statusBadgeMap[statusLabel] ?? statusLabel;

  async function handleCheckIn() {
    await onCheckIn(booking.id, source);
  }

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-text-primary">
            {bookingTypeLabel(booking.bookingType)}
          </p>
          {booking.timeSlotId && (
            <p className="text-xs text-text-muted font-mono truncate max-w-[180px]">
              Slot: {booking.timeSlotId.slice(0, 8)}…
            </p>
          )}
          {booking.classScheduleId && (
            <p className="text-xs text-text-muted font-mono truncate max-w-[180px]">
              Class: {booking.classScheduleId.slice(0, 8)}…
            </p>
          )}
        </div>
        <Badge status={mappedStatus} />
      </div>

      {isCheckedIn ? (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle
            className="w-4 h-4 text-green-500 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-semibold text-green-600 dark:text-green-400">
              Checked in
            </p>
            <p className="text-xs text-text-muted tabular-nums">
              {new Date(booking.checkedInAt!).toLocaleString()} &middot;{" "}
              {booking.checkInSource !== null
                ? checkInSourceLabel(booking.checkInSource)
                : ""}
            </p>
          </div>
        </div>
      ) : isConfirmed ? (
        <div className="flex items-end gap-3 flex-wrap pt-1">
          <FormField
            label="Source"
            htmlFor={`source-${booking.id}`}
            className="flex-1 min-w-[140px]"
          >
            <Select
              id={`source-${booking.id}`}
              value={source}
              onChange={(e) => setSource(Number(e.target.value))}
              aria-label="Select check-in source"
            >
              <option value={0}>QR Scan</option>
              <option value={1}>Manual by Staff</option>
              <option value={2}>Self Kiosk</option>
            </Select>
          </FormField>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCheckIn}
            isLoading={isLoading}
            aria-label={`Check in booking ${booking.id}`}
          >
            Check In
          </Button>
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-1">
          Status: {statusLabel} — check-in not available.
        </p>
      )}
    </Card>
  );
}
