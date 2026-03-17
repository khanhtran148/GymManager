"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useBookings, useCancelBooking } from "@/hooks/use-bookings";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import {
  bookingTypeLabel,
  bookingStatusLabel,
} from "@/lib/booking-utils";
import type { BookingDto } from "@/types/booking";

// TODO: Get from gym house selector/context
const gymHouseId = "placeholder-gym-id";

const statusBadgeMap: Record<string, string> = {
  Confirmed: "Active",
  Cancelled: "Cancelled",
  "No Show": "Expired",
  Completed: "Active",
  "Wait Listed": "Frozen",
};

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data, isLoading, error } = useBookings(
    gymHouseId,
    page,
    appliedFrom || undefined,
    appliedTo || undefined
  );
  const cancelBooking = useCancelBooking(gymHouseId);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFrom(from);
    setAppliedTo(to);
    setPage(1);
  }

  function handleFilterClear() {
    setFrom("");
    setTo("");
    setAppliedFrom("");
    setAppliedTo("");
    setPage(1);
  }

  async function handleCancelConfirm() {
    if (!cancelId) return;
    await cancelBooking.mutateAsync(cancelId);
    setCancelId(null);
  }

  const columns = [
    {
      key: "memberCode",
      header: "Member Code",
      render: (b: BookingDto) => (
        <span className="font-mono text-xs text-text-muted">{b.memberCode}</span>
      ),
    },
    {
      key: "memberName",
      header: "Member Name",
      render: (b: BookingDto) => (
        <Link
          href={`/bookings/${b.id}`}
          className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          {b.memberName}
        </Link>
      ),
    },
    {
      key: "bookingType",
      header: "Type",
      render: (b: BookingDto) => (
        <span className="text-text-secondary text-xs">
          {bookingTypeLabel(b.bookingType)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (b: BookingDto) => {
        const label = bookingStatusLabel(b.status);
        const mappedStatus = statusBadgeMap[label] ?? label;
        return <Badge status={mappedStatus} />;
      },
    },
    {
      key: "bookedAt",
      header: "Booked At",
      render: (b: BookingDto) => (
        <span className="text-text-muted text-xs tabular-nums">
          {new Date(b.bookedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (b: BookingDto) => (
        <div className="flex items-center gap-2">
          <Link href={`/bookings/${b.id}`}>
            <Button variant="secondary" size="sm">
              View
            </Button>
          </Link>
          {b.status !== 1 && b.status !== 3 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelId(b.id)}
            >
              <X className="w-3 h-3" aria-hidden="true" />
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <Alert variant="error">
        Failed to load bookings. Please refresh the page.
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <form
          onSubmit={handleFilterSubmit}
          className="flex items-end gap-3 flex-wrap"
          role="search"
          aria-label="Filter bookings by date"
        >
          <FormField label="From" htmlFor="from">
            <Input
              id="from"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-48"
              aria-label="Filter from date"
            />
          </FormField>
          <FormField label="To" htmlFor="to">
            <Input
              id="to"
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-48"
              aria-label="Filter to date"
            />
          </FormField>
          <div className="flex gap-2 pb-0.5">
            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>
            {(appliedFrom || appliedTo) && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleFilterClear}
                aria-label="Clear date filters"
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        <Link href="/bookings/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Booking
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No bookings found. Try adjusting the date range or create a new booking."
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

      <ConfirmDialog
        isOpen={!!cancelId}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action will decrement the slot capacity and may promote a waitlisted member."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        variant="danger"
        isLoading={cancelBooking.isPending}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
}
