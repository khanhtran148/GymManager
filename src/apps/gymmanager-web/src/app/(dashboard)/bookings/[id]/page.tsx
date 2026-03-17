"use client";

import { use, useState } from "react";
import { useBooking, useCancelBooking, useCheckIn, useMarkNoShow } from "@/hooks/use-bookings";
import { useActiveGymHouse } from "@/hooks/use-active-gym-house";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  bookingTypeLabel,
  bookingStatusLabel,
  checkInSourceLabel,
} from "@/lib/booking-utils";

const statusBadgeMap: Record<string, string> = {
  Confirmed: "Active",
  Cancelled: "Cancelled",
  "No Show": "Expired",
  Completed: "Active",
  "Wait Listed": "Frozen",
};

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  const { gymHouseId, isLoading: gymHouseLoading } = useActiveGymHouse();
  const { data: booking, isLoading, error } = useBooking(gymHouseId ?? "", id);
  const cancelBooking = useCancelBooking(gymHouseId ?? "");
  const checkIn = useCheckIn(gymHouseId ?? "");
  const markNoShow = useMarkNoShow(gymHouseId ?? "");

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [checkInSource, setCheckInSource] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCancel() {
    setActionError(null);
    try {
      await cancelBooking.mutateAsync(id);
      setShowCancelDialog(false);
    } catch (err: unknown) {
      setShowCancelDialog(false);
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const respData = err.response.data;
        if (respData && typeof respData === "object" && "detail" in respData) {
          setActionError(String(respData.detail));
        } else {
          setActionError("Failed to cancel booking.");
        }
      } else {
        setActionError("Something went wrong.");
      }
    }
  }

  async function handleCheckIn() {
    setActionError(null);
    try {
      await checkIn.mutateAsync({ id, data: { source: checkInSource } });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const respData = err.response.data;
        if (respData && typeof respData === "object" && "detail" in respData) {
          setActionError(String(respData.detail));
        } else {
          setActionError("Failed to check in.");
        }
      } else {
        setActionError("Something went wrong.");
      }
    }
  }

  async function handleMarkNoShow() {
    setActionError(null);
    try {
      await markNoShow.mutateAsync(id);
      setShowNoShowDialog(false);
    } catch (err: unknown) {
      setShowNoShowDialog(false);
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const respData = err.response.data;
        if (respData && typeof respData === "object" && "detail" in respData) {
          setActionError(String(respData.detail));
        } else {
          setActionError("Failed to mark no-show.");
        }
      } else {
        setActionError("Something went wrong.");
      }
    }
  }

  if (gymHouseLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading booking..." />
      </div>
    );
  }

  if (!gymHouseId) {
    return (
      <Alert variant="error">
        Please create a gym house first before viewing bookings.
      </Alert>
    );
  }

  if (error || !booking) {
    return (
      <Alert variant="error">
        Failed to load booking. It may not exist or you may not have permission
        to view it.
      </Alert>
    );
  }

  const statusLabel = bookingStatusLabel(booking.status);
  const mappedStatus = statusBadgeMap[statusLabel] ?? statusLabel;
  const isConfirmed = booking.status === 0;
  const isCheckedIn = !!booking.checkedInAt;

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        backHref="/bookings"
        breadcrumb="Bookings"
        title={`Booking — ${booking.memberName}`}
      />

      {actionError && (
        <Alert variant="error">{actionError}</Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Booking Details</CardTitle>
            <Badge status={mappedStatus} />
          </div>
        </CardHeader>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
              Member Code
            </dt>
            <dd className="font-mono text-sm text-text-primary">
              {booking.memberCode}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
              Member Name
            </dt>
            <dd className="text-sm text-text-primary">{booking.memberName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
              Booking Type
            </dt>
            <dd className="text-sm text-text-primary">
              {bookingTypeLabel(booking.bookingType)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
              Status
            </dt>
            <dd className="text-sm text-text-primary">{statusLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
              Booked At
            </dt>
            <dd className="text-sm text-text-muted tabular-nums">
              {new Date(booking.bookedAt).toLocaleString()}
            </dd>
          </div>
          {booking.checkedInAt && (
            <div>
              <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                Checked In At
              </dt>
              <dd className="text-sm text-text-muted tabular-nums">
                {new Date(booking.checkedInAt).toLocaleString()}
              </dd>
            </div>
          )}
          {booking.checkInSource !== null && (
            <div>
              <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                Check-in Source
              </dt>
              <dd className="text-sm text-text-primary">
                {checkInSourceLabel(booking.checkInSource)}
              </dd>
            </div>
          )}
          {booking.timeSlotId && (
            <div>
              <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                Time Slot ID
              </dt>
              <dd className="font-mono text-xs text-text-muted break-all">
                {booking.timeSlotId}
              </dd>
            </div>
          )}
          {booking.classScheduleId && (
            <div>
              <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                Class Schedule ID
              </dt>
              <dd className="font-mono text-xs text-text-muted break-all">
                {booking.classScheduleId}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {isConfirmed && !isCheckedIn && (
        <Card>
          <CardHeader>
            <CardTitle>Check In Member</CardTitle>
          </CardHeader>
          <div className="flex items-end gap-3 flex-wrap">
            <FormField label="Check-in Source" htmlFor="checkInSource" className="flex-1 min-w-[180px]">
              <Select
                id="checkInSource"
                value={checkInSource}
                onChange={(e) => setCheckInSource(Number(e.target.value))}
                aria-label="Select check-in source"
              >
                <option value={0}>QR Scan</option>
                <option value={1}>Manual by Staff</option>
                <option value={2}>Self Kiosk</option>
              </Select>
            </FormField>
            <Button
              variant="primary"
              size="md"
              onClick={handleCheckIn}
              isLoading={checkIn.isPending}
              aria-label="Check in this member"
            >
              Check In
            </Button>
          </div>
        </Card>
      )}

      {isConfirmed && (
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowCancelDialog(true)}
          >
            Cancel Booking
          </Button>
          {!isCheckedIn && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowNoShowDialog(true)}
            >
              Mark No Show
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action will decrement the slot capacity and may promote a waitlisted member."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        variant="danger"
        isLoading={cancelBooking.isPending}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
      />

      <ConfirmDialog
        isOpen={showNoShowDialog}
        title="Mark as No Show"
        description="Are you sure you want to mark this booking as a no-show? This cannot be undone."
        confirmLabel="Mark No Show"
        cancelLabel="Go Back"
        variant="danger"
        isLoading={markNoShow.isPending}
        onConfirm={handleMarkNoShow}
        onCancel={() => setShowNoShowDialog(false)}
      />
    </div>
  );
}
