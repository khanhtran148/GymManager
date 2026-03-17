"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  type TooltipProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface RevenueLineChartProps {
  data: RevenueDataPoint[];
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function RevenueLineChart({ data }: RevenueLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-muted">
        No revenue data for this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted, #e5e7eb)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--color-text-muted, #9ca3af)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-text-muted, #9ca3af)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCurrency}
          width={70}
        />
        <Tooltip
          formatter={((value: ValueType) => [formatCurrency(Number(value)), "Revenue"]) as TooltipProps<ValueType, NameType>["formatter"]}
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border, #e5e7eb)",
            backgroundColor: "var(--color-card, #fff)",
            color: "var(--color-text-primary, #111827)",
            fontSize: 12,
          }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#f97316" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
