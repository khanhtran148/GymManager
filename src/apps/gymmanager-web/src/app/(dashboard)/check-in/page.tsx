"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useBookings, useCheckIn } from "@/hooks/use-bookings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { CheckInCard } from "@/components/check-in-card";
import type { BookingDto } from "@/types/booking";

// TODO: Get from gym house selector/context
const gymHouseId = "placeholder-gym-id";

export default function CheckInPage() {
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Load today's bookings; filter client-side by member name or code
  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;

  const { data, isLoading, error } = useBookings(
    gymHouseId,
    1,
    todayStart,
    todayEnd
  );
  const checkIn = useCheckIn(gymHouseId);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittedSearch(searchInput.trim().toLowerCase());
  }

  const filteredBookings: BookingDto[] =
    data?.items.filter((b) => {
      if (!submittedSearch) return false;
      return (
        b.memberName.toLowerCase().includes(submittedSearch) ||
        b.memberCode.toLowerCase().includes(submittedSearch)
      );
    }) ?? [];

  async function handleCheckIn(bookingId: string, source: number) {
    setCheckInError(null);
    setCheckingInId(bookingId);
    try {
      await checkIn.mutateAsync({ id: bookingId, data: { source } });
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
          setCheckInError(String(respData.detail));
        } else {
          setCheckInError("Failed to check in. Please try again.");
        }
      } else {
        setCheckInError("Something went wrong.");
      }
    } finally {
      setCheckingInId(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-2"
        role="search"
        aria-label="Search members to check in"
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by member name or code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            aria-label="Member name or code"
          />
        </div>
        <Button type="submit" variant="secondary" size="md">
          Search
        </Button>
      </form>

      {checkInError && (
        <Alert variant="error">{checkInError}</Alert>
      )}

      {error && (
        <Alert variant="error">
          Failed to load today&apos;s bookings. Please refresh the page.
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner label="Loading bookings..." />
        </div>
      )}

      {!isLoading && submittedSearch && filteredBookings.length === 0 && (
        <p className="text-center text-sm text-text-muted py-10">
          No bookings found today for &ldquo;{submittedSearch}&rdquo;.
        </p>
      )}

      {!isLoading && !submittedSearch && (
        <p className="text-center text-sm text-text-muted py-10">
          Enter a member name or code to find today&apos;s bookings.
        </p>
      )}

      {filteredBookings.length > 0 && (
        <div className="space-y-3" role="list" aria-label="Bookings for member">
          {filteredBookings.map((booking) => (
            <div key={booking.id} role="listitem">
              <CheckInCard
                booking={booking}
                onCheckIn={handleCheckIn}
                isLoading={checkingInId === booking.id && checkIn.isPending}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
