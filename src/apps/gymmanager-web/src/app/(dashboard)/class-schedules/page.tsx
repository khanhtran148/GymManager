"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useClassSchedules } from "@/hooks/use-class-schedules";
import { useActiveGymHouse } from "@/hooks/use-active-gym-house";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { dayOfWeekLabel } from "@/lib/booking-utils";
import type { ClassScheduleDto } from "@/types/booking";

export default function ClassSchedulesPage() {
  const { gymHouseId, isLoading: gymHouseLoading } = useActiveGymHouse();
  const [dayFilter, setDayFilter] = useState<string>("");

  const { data, isLoading, error } = useClassSchedules(
    gymHouseId ?? "",
    dayFilter !== "" ? Number(dayFilter) : undefined
  );

  const columns = [
    {
      key: "className",
      header: "Class Name",
      render: (cs: ClassScheduleDto) => (
        <span className="font-semibold text-text-primary">{cs.className}</span>
      ),
    },
    {
      key: "trainer",
      header: "Trainer",
      render: (cs: ClassScheduleDto) => (
        <span className="text-text-secondary">{cs.trainerName}</span>
      ),
    },
    {
      key: "dayOfWeek",
      header: "Day",
      render: (cs: ClassScheduleDto) => (
        <span className="text-text-secondary">
          {dayOfWeekLabel(cs.dayOfWeek)}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      render: (cs: ClassScheduleDto) => (
        <span className="text-text-muted text-xs tabular-nums">
          {cs.startTime.slice(0, 5)} — {cs.endTime.slice(0, 5)}
        </span>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (cs: ClassScheduleDto) => {
        const fillPct =
          cs.maxCapacity > 0
            ? Math.round((cs.currentEnrollment / cs.maxCapacity) * 100)
            : 0;
        const barColor =
          fillPct > 80
            ? "bg-red-500"
            : fillPct >= 50
            ? "bg-yellow-400"
            : "bg-green-500";
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all`}
                style={{ width: `${fillPct}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs text-text-muted tabular-nums whitespace-nowrap">
              {cs.currentEnrollment}/{cs.maxCapacity}
            </span>
          </div>
        );
      },
    },
    {
      key: "recurring",
      header: "Recurring",
      render: (cs: ClassScheduleDto) =>
        cs.isRecurring ? (
          <Badge status="Active" />
        ) : (
          <Badge status="Expired" />
        ),
    },
  ];

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
        Please create a gym house first before managing class schedules.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load class schedules. Please refresh the page.
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <FormField label="Filter by Day" htmlFor="dayFilter" className="min-w-[180px]">
          <Select
            id="dayFilter"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            aria-label="Filter by day of week"
          >
            <option value="">All Days</option>
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </Select>
        </FormField>

        <Link href="/class-schedules/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Class
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        emptyMessage="No class schedules found. Add a new class to get started."
      />
    </div>
  );
}
