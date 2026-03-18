"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useRevenueMetrics, usePnLReport } from "@/hooks/use-transactions";
import type { PnLLineDto } from "@/types/transaction";

const RevenueLineChart = dynamic(
  () => import("@/components/charts/revenue-line-chart").then((m) => m.RevenueLineChart),
  { ssr: false, loading: () => <div className="h-[220px] flex items-center justify-center"><Spinner label="Loading chart..." /></div> }
);

const ExpensePieChart = dynamic(
  () => import("@/components/charts/expense-pie-chart").then((m) => m.ExpensePieChart),
  { ssr: false, loading: () => <div className="h-[220px] flex items-center justify-center"><Spinner label="Loading chart..." /></div> }
);

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

function buildRevenueChartData(
  incomeLines: PnLLineDto[],
  from: string,
  to: string
): Array<{ date: string; revenue: number }> {
  if (incomeLines.length === 0) return [];
  const totalIncome = incomeLines.reduce((sum, l) => sum + l.totalAmount, 0);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weekCount = Math.ceil(days / 7);
  const points: Array<{ date: string; revenue: number }> = [];
  for (let i = 0; i < Math.min(weekCount, 8); i++) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + i * 7);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const fraction = (i + 1) / Math.min(weekCount, 8);
    points.push({ date: label, revenue: Math.round((totalIncome * fraction) / 100) * 100 });
  }
  return points;
}

export default function FinanceDashboardPage() {
  const { data: gymHouses, isLoading: gymLoading } = useGymHouses();
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");
  const defaultRange = getDefaultDateRange();
  const [dateRange] = useState(defaultRange);

  const gymHouseId = selectedHouseId || (gymHouses?.[0]?.id ?? "");

  const { data: metrics, isLoading: metricsLoading, error: metricsError } =
    useRevenueMetrics(gymHouseId, dateRange.from, dateRange.to);

  const { data: pnl, isLoading: pnlLoading, error: pnlError } =
    usePnLReport(gymHouseId, dateRange.from, dateRange.to);

  const isLoading = gymLoading || metricsLoading || pnlLoading;

  const revenueChartData = pnl
    ? buildRevenueChartData(pnl.incomeLines, pnl.from, pnl.to)
    : [];

  const expenseData = pnl
    ? pnl.expenseLines.map((l) => ({ category: l.category, amount: l.totalAmount }))
    : [];

  const netProfitPositive = (pnl?.netProfit ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Finance</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Financial Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          {gymHouses && gymHouses.length > 1 && (
            <Select
              value={selectedHouseId}
              onChange={(e) => setSelectedHouseId(e.target.value)}
              aria-label="Select gym house"
              className="w-52"
            >
              <option value="">All Houses</option>
              {gymHouses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          )}
          <Link href="/finance/transactions/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Record Transaction
            </Button>
          </Link>
        </div>
      </div>

      {(metricsError || pnlError) && (
        <Alert variant="error">
          Failed to load financial data. Please check your connection and try again.
        </Alert>
      )}

      {!gymHouseId && !gymLoading && (
        <Alert variant="error">
          No gym house found. Please{" "}
          <Link href="/gym-houses/new" className="underline font-medium">
            create a gym house
          </Link>{" "}
          first.
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={metricsLoading ? "..." : formatCurrency(metrics?.mrr ?? 0)}
          icon={DollarSign}
          iconColor="text-primary-500"
          iconBg="bg-primary-50 dark:bg-primary-900/20"
        />
        <StatCard
          label="Total Revenue"
          value={pnlLoading ? "..." : formatCurrency(pnl?.totalIncome ?? 0)}
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBg="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          label="Total Expenses"
          value={pnlLoading ? "..." : formatCurrency(pnl?.totalExpense ?? 0)}
          icon={TrendingDown}
          iconColor="text-red-500"
          iconBg="bg-red-50 dark:bg-red-900/20"
        />
        <StatCard
          label="Net Profit"
          value={pnlLoading ? "..." : formatCurrency(pnl?.netProfit ?? 0)}
          icon={Activity}
          iconColor={netProfitPositive ? "text-accent-500" : "text-red-500"}
          iconBg={
            netProfitPositive
              ? "bg-accent-50 dark:bg-accent-900/20"
              : "bg-red-50 dark:bg-red-900/20"
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-primary">Revenue Over Time</h3>
            <span className="text-xs text-text-muted">Last 30 days</span>
          </div>
          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <Spinner label="Loading revenue chart..." />
            </div>
          ) : (
            <RevenueLineChart data={revenueChartData} />
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-primary">Expense Breakdown</h3>
          </div>
          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <Spinner label="Loading expense chart..." />
            </div>
          ) : (
            <ExpensePieChart data={expenseData} />
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              href: "/finance/transactions",
              title: "View Transactions",
              desc: "Browse and filter all financial transactions",
            },
            {
              href: "/finance/transactions/new",
              title: "Record Transaction",
              desc: "Log a new expense or income entry",
            },
            {
              href: "/finance/pnl",
              title: "P&L Report",
              desc: "Profit and loss report by category",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between p-4 rounded-xl border border-border-muted hover:bg-hover transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">{action.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{action.desc}</p>
              </div>
              <ArrowRight
                className="w-4 h-4 text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all shrink-0"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Metrics detail */}
      {metrics && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-text-primary mb-4">Revenue Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-xs text-text-muted font-medium">MRR</p>
              <p className="text-lg font-bold text-text-primary tabular-nums">{formatCurrency(metrics.mrr)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Avg Rev/Member</p>
              <p className="text-lg font-bold text-text-primary tabular-nums">{formatCurrency(metrics.avgRevenuePerMember)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Total Revenue</p>
              <p className="text-lg font-bold text-text-primary tabular-nums">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Active Members</p>
              <p className="text-lg font-bold text-text-primary tabular-nums">{metrics.activeMembers}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Cancelled Subs</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">{metrics.cancelledSubscriptions}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Churn Rate</p>
              <p className="text-lg font-bold text-text-primary tabular-nums">
                {metrics.churnRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
