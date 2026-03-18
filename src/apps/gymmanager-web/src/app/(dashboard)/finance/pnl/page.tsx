"use client";

import { useState } from "react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { usePnLReport } from "@/hooks/use-transactions";
import { PnLTable } from "@/components/pnl-table";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import Link from "next/link";

function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PnLReportPage() {
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");
  const defaultRange = getDefaultDateRange();
  const [pendingFrom, setPendingFrom] = useState(defaultRange.from);
  const [pendingTo, setPendingTo] = useState(defaultRange.to);
  const [appliedFrom, setAppliedFrom] = useState(defaultRange.from);
  const [appliedTo, setAppliedTo] = useState(defaultRange.to);

  const gymHouseId = selectedHouseId || (gymHouses?.[0]?.id ?? "");

  const { data: pnl, isLoading, error } = usePnLReport(gymHouseId, appliedFrom, appliedTo);

  function handleApply() {
    setAppliedFrom(pendingFrom);
    setAppliedTo(pendingTo);
  }

  const netPositive = (pnl?.netProfit ?? 0) >= 0;

  if (gymLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Finance</p>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          Profit &amp; Loss Report
        </h2>
      </div>

      {error && (
        <Alert variant="error">Failed to load P&amp;L report. Please try again.</Alert>
      )}

      {!gymHouseId && (
        <Alert variant="error">
          No gym house found. Please{" "}
          <Link href="/gym-houses/new" className="underline font-medium">
            create a gym house
          </Link>{" "}
          first.
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {gymHouses && gymHouses.length > 0 && (
            <div>
              <label
                htmlFor="pnl-gym-house"
                className="block text-sm font-medium text-text-secondary mb-1.5"
              >
                Gym House
              </label>
              <Select
                id="pnl-gym-house"
                value={selectedHouseId}
                onChange={(e) => setSelectedHouseId(e.target.value)}
              >
                <option value="">
                  {gymHouses.length > 1 ? "All Houses" : gymHouses[0]?.name}
                </option>
                {gymHouses.length > 1 &&
                  gymHouses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
              </Select>
            </div>
          )}

          <div>
            <label
              htmlFor="pnl-from"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              From
            </label>
            <Input
              id="pnl-from"
              type="date"
              value={pendingFrom}
              onChange={(e) => setPendingFrom(e.target.value)}
              aria-label="From date"
            />
          </div>

          <div>
            <label
              htmlFor="pnl-to"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              To
            </label>
            <Input
              id="pnl-to"
              type="date"
              value={pendingTo}
              onChange={(e) => setPendingTo(e.target.value)}
              aria-label="To date"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            disabled={!pendingFrom || !pendingTo || !gymHouseId}
          >
            Apply
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner label="Loading P&L report..." />
        </div>
      )}

      {!isLoading && pnl && (
        <>
          {/* Date range label */}
          <p className="text-sm text-text-muted">
            Report period:{" "}
            <span className="font-medium text-text-secondary">
              {new Date(pnl.from).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>{" "}
            —{" "}
            <span className="font-medium text-text-secondary">
              {new Date(pnl.to).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </p>

          {/* Income table */}
          <PnLTable
            title="Income"
            lines={pnl.incomeLines}
            total={pnl.totalIncome}
            totalLabel="Total Income"
            variant="income"
          />

          {/* Expense table */}
          <PnLTable
            title="Expenses"
            lines={pnl.expenseLines}
            total={pnl.totalExpense}
            totalLabel="Total Expenses"
            variant="expense"
          />

          {/* Net profit/loss summary */}
          <div
            className={cn(
              "rounded-2xl border shadow-sm p-6",
              netPositive
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted uppercase tracking-wider">
                  {netPositive ? "Net Profit" : "Net Loss"}
                </p>
                <p
                  className={cn(
                    "text-3xl font-bold tabular-nums mt-1",
                    netPositive
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  )}
                >
                  {netPositive ? "+" : ""}
                  {formatCurrency(pnl.netProfit)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-text-muted">
                  Total Income:{" "}
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(pnl.totalIncome)}
                  </span>
                </p>
                <p className="text-sm text-text-muted">
                  Total Expenses:{" "}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(pnl.totalExpense)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {!isLoading && !pnl && gymHouseId && (
        <div className="text-center py-16 text-sm text-text-muted">
          Select a date range and click Apply to generate the report.
        </div>
      )}
    </div>
  );
}
