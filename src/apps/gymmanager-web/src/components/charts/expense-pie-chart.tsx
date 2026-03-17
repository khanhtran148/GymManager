"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  type TooltipProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import type { TransactionCategory } from "@/types/transaction";

interface ExpenseDataPoint {
  category: TransactionCategory;
  amount: number;
}

interface ExpensePieChartProps {
  data: ExpenseDataPoint[];
}

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Revenue: "#22c55e",
  OperatingExpense: "#f97316",
  CapitalExpense: "#3b82f6",
  Payroll: "#a855f7",
  Refund: "#ef4444",
};

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  Revenue: "Revenue",
  OperatingExpense: "Operating",
  CapitalExpense: "Capital",
  Payroll: "Payroll",
  Refund: "Refund",
};

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-muted">
        No expense data for this period.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: CATEGORY_LABELS[d.category],
    value: d.amount,
    category: d.category,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.category}
              fill={CATEGORY_COLORS[entry.category]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          formatter={((value: ValueType) => [formatCurrency(Number(value)), "Amount"]) as TooltipProps<ValueType, NameType>["formatter"]}
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border, #e5e7eb)",
            backgroundColor: "var(--color-card, #fff)",
            color: "var(--color-text-primary, #111827)",
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ fontSize: 11 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
