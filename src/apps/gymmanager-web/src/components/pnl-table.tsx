import { cn } from "@/lib/utils";
import type { PnLLineDto } from "@/types/transaction";

const CATEGORY_LABELS: Record<string, string> = {
  Revenue: "Revenue",
  OperatingExpense: "Operating Expense",
  CapitalExpense: "Capital Expense",
  Payroll: "Payroll",
  Refund: "Refund",
};

interface PnLTableProps {
  title: string;
  lines: PnLLineDto[];
  total: number;
  totalLabel: string;
  variant: "income" | "expense";
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PnLTable({ title, lines, total, totalLabel, variant }: PnLTableProps) {
  const totalColor =
    variant === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border-muted">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      </div>
      <table className="min-w-full divide-y divide-border-muted">
        <thead>
          <tr className="bg-table-header">
            <th
              scope="col"
              className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider"
            >
              Category
            </th>
            <th
              scope="col"
              className="px-5 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider"
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-table-divider">
          {lines.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-5 py-6 text-center text-sm text-text-muted">
                No data for this period.
              </td>
            </tr>
          ) : (
            lines.map((line) => (
              <tr key={line.category} className="hover:bg-table-row-hover transition-colors">
                <td className="px-5 py-3.5 text-sm text-text-secondary">
                  {CATEGORY_LABELS[line.category] ?? line.category}
                </td>
                <td
                  className={cn(
                    "px-5 py-3.5 text-sm font-medium text-right tabular-nums",
                    variant === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-text-secondary"
                  )}
                >
                  {formatCurrency(line.totalAmount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="bg-table-header">
            <td className="px-5 py-3.5 text-sm font-bold text-text-primary">{totalLabel}</td>
            <td className={cn("px-5 py-3.5 text-sm font-bold text-right tabular-nums", totalColor)}>
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
