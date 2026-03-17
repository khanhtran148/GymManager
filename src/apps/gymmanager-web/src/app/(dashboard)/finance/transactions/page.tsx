"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useTransactions } from "@/hooks/use-transactions";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { TransactionDto, TransactionType, TransactionDirection } from "@/types/transaction";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TRANSACTION_TYPES: TransactionType[] = [
  "MembershipFee",
  "SalaryPayment",
  "Rent",
  "Utilities",
  "Equipment",
  "Wages",
  "Expense",
  "Refund",
  "Other",
];

const TYPE_LABELS: Record<TransactionType, string> = {
  MembershipFee: "Membership Fee",
  SalaryPayment: "Salary Payment",
  Rent: "Rent",
  Utilities: "Utilities",
  Equipment: "Equipment",
  Wages: "Wages",
  Expense: "Expense",
  Refund: "Refund",
  Other: "Other",
};

export default function TransactionsPage() {
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<TransactionType | "">("");
  const [filterDirection, setFilterDirection] = useState<TransactionDirection | "">("");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const gymHouseId = selectedHouseId || (gymHouses?.[0]?.id ?? "");

  const { data, isLoading, error } = useTransactions(gymHouseId, page, {
    type: filterType || undefined,
    direction: filterDirection || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
  });

  function handleFilterChange() {
    setPage(1);
  }

  const columns = [
    {
      key: "transactionDate",
      header: "Date",
      render: (t: TransactionDto) => (
        <span className="text-text-muted text-xs tabular-nums">{formatDate(t.transactionDate)}</span>
      ),
    },
    {
      key: "transactionType",
      header: "Type",
      render: (t: TransactionDto) => (
        <span className="text-text-secondary">{TYPE_LABELS[t.transactionType]}</span>
      ),
    },
    {
      key: "direction",
      header: "Direction",
      render: (t: TransactionDto) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
            t.direction === "Credit"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {t.direction}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (t: TransactionDto) => (
        <span
          className={cn(
            "font-semibold tabular-nums",
            t.direction === "Credit"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {t.direction === "Credit" ? "+" : "-"}
          {formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (t: TransactionDto) => (
        <span className="text-text-muted text-xs">{t.category}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      className: "max-w-xs",
      render: (t: TransactionDto) => (
        <span className="text-text-secondary truncate block max-w-[200px]" title={t.description}>
          {t.description}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (t: TransactionDto) => (
        <span className="text-text-muted text-xs">{t.paymentMethod ?? "—"}</span>
      ),
    },
  ];

  if (gymLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Finance</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Transactions</h2>
        </div>
        <Link href="/finance/transactions/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Record Transaction
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error">Failed to load transactions. Please try again.</Alert>
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
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {gymHouses && gymHouses.length > 1 && (
            <Select
              value={selectedHouseId}
              onChange={(e) => {
                setSelectedHouseId(e.target.value);
                setPage(1);
              }}
              aria-label="Gym house"
            >
              <option value="">All Houses</option>
              {gymHouses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          )}

          <Select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as TransactionType | "");
              handleFilterChange();
            }}
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>

          <Select
            value={filterDirection}
            onChange={(e) => {
              setFilterDirection(e.target.value as TransactionDirection | "");
              handleFilterChange();
            }}
            aria-label="Filter by direction"
          >
            <option value="">All Directions</option>
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
          </Select>

          <div>
            <label htmlFor="filter-from" className="sr-only">
              From date
            </label>
            <Input
              id="filter-from"
              type="date"
              value={filterFrom}
              onChange={(e) => {
                setFilterFrom(e.target.value);
                handleFilterChange();
              }}
              aria-label="From date"
              placeholder="From date"
            />
          </div>

          <div>
            <label htmlFor="filter-to" className="sr-only">
              To date
            </label>
            <Input
              id="filter-to"
              type="date"
              value={filterTo}
              onChange={(e) => {
                setFilterTo(e.target.value);
                handleFilterChange();
              }}
              aria-label="To date"
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No transactions found. Try adjusting the filters."
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
    </div>
  );
}
