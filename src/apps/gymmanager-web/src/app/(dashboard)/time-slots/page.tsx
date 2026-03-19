"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useTimeSlots, useCreateTimeSlot } from "@/hooks/use-time-slots";
import { useActiveGymHouse } from "@/hooks/use-active-gym-house";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import type { TimeSlotDto } from "@/types/booking";

function CapacityBar({ slot }: { slot: TimeSlotDto }) {
  const fillPct =
    slot.maxCapacity > 0
      ? Math.round((slot.currentBookings / slot.maxCapacity) * 100)
      : 0;
  const barColor =
    fillPct > 80
      ? "bg-red-500"
      : fillPct >= 50
      ? "bg-yellow-400"
      : "bg-green-500";
  const textColor =
    fillPct > 80
      ? "text-red-600 dark:text-red-400"
      : fillPct >= 50
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-green-600 dark:text-green-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold tabular-nums ${textColor}`}>
          {slot.currentBookings}/{slot.maxCapacity}
        </span>
        <span className="text-text-muted">{slot.availableSpots} spots left</span>
      </div>
      <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${fillPct}%` }}
          role="progressbar"
          aria-valuenow={fillPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${fillPct}% capacity used`}
        />
      </div>
    </div>
  );
}

export default function TimeSlotsPage() {
  const { gymHouseId, isLoading: gymHouseLoading } = useActiveGymHouse();
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [appliedFrom, setAppliedFrom] = useState(today);
  const [appliedTo, setAppliedTo] = useState(today);
  const [showNewForm, setShowNewForm] = useState(false);

  const [newDate, setNewDate] = useState(today);
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newCapacity, setNewCapacity] = useState("20");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, error } = useTimeSlots(gymHouseId ?? "", appliedFrom, appliedTo);
  const createTimeSlot = useCreateTimeSlot(gymHouseId ?? "");

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!newDate || !newStartTime || !newEndTime) {
      setFormError("Date, start time, and end time are required.");
      return;
    }
    if (newStartTime >= newEndTime) {
      setFormError("End time must be after start time.");
      return;
    }
    const cap = Number(newCapacity);
    if (!cap || cap < 1) {
      setFormError("Capacity must be at least 1.");
      return;
    }

    try {
      await createTimeSlot.mutateAsync({
        date: newDate,
        startTime: `${newStartTime}:00`,
        endTime: `${newEndTime}:00`,
        maxCapacity: cap,
      });
      setShowNewForm(false);
      setNewStartTime("");
      setNewEndTime("");
      setNewCapacity("20");
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
          setFormError(String(respData.detail));
        } else {
          setFormError("Failed to create time slot.");
        }
      } else {
        setFormError("Something went wrong.");
      }
    }
  }

  if (gymHouseLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading gym house..." />
      </div>
    );
  }

  if (!gymHouseId) {
    return (
      <Alert variant="error">
        Please create a gym house first before managing time slots.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load time slots. Please refresh the page.
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <form
          onSubmit={handleFilterSubmit}
          className="flex items-end gap-3 flex-wrap"
          role="search"
          aria-label="Filter time slots by date range"
        >
          <FormField label="From Date" htmlFor="from">
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
              aria-label="From date"
            />
          </FormField>
          <FormField label="To Date" htmlFor="to">
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
              aria-label="To date"
            />
          </FormField>
          <Button type="submit" variant="secondary" size="md" className="mb-0.5">
            Apply
          </Button>
        </form>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowNewForm(!showNewForm)}
          aria-expanded={showNewForm}
        >
          {showNewForm ? (
            <>
              <X className="w-4 h-4" aria-hidden="true" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Slot
            </>
          )}
        </Button>
      </div>

      {showNewForm && (
        <Card>
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Create Time Slot
          </h2>
          {formError && (
            <Alert variant="error" className="mb-4">
              {formError}
            </Alert>
          )}
          <form
            onSubmit={handleCreateSlot}
            noValidate
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <FormField label="Date" htmlFor="newDate" required>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                aria-label="Slot date"
              />
            </FormField>
            <FormField label="Max Capacity" htmlFor="newCapacity" required>
              <Input
                id="newCapacity"
                type="number"
                min={1}
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                aria-label="Max capacity"
              />
            </FormField>
            <FormField label="Start Time" htmlFor="newStartTime" required>
              <Input
                id="newStartTime"
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                aria-label="Start time"
              />
            </FormField>
            <FormField label="End Time" htmlFor="newEndTime" required>
              <Input
                id="newEndTime"
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                aria-label="End time"
              />
            </FormField>
            <div className="sm:col-span-2 flex justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={createTimeSlot.isPending}
              >
                Create Slot
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner label="Loading time slots..." />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-16 text-sm text-text-muted">
          No time slots found for the selected date range.
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          role="list"
          aria-label="Time slots"
        >
          {data.map((slot: TimeSlotDto) => (
            <Card key={slot.id} padding="md" role="listitem">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text-primary tabular-nums">
                  {slot.startTime.slice(0, 5)} — {slot.endTime.slice(0, 5)}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(slot.date + "T00:00:00").toLocaleDateString(
                    undefined,
                    { weekday: "short", month: "short", day: "numeric" }
                  )}
                </span>
              </div>
              <CapacityBar slot={slot} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
