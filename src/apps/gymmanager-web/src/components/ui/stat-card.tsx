import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label: string;
  };
  progress?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary-500",
  iconBg = "bg-primary-50 dark:bg-primary-900/20",
  trend,
  progress,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl shadow-sm",
        "border border-border",
        "p-5 card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} aria-hidden="true" />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg",
              trend.value >= 0
                ? "text-accent-600 bg-accent-50 dark:text-accent-400 dark:bg-accent-900/20"
                : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-text-primary tracking-tight">
        {value}
      </p>
      <p className="text-xs font-medium text-text-muted mt-0.5">
        {label}
      </p>

      {trend && (
        <p className="text-xs text-text-muted mt-1">
          {trend.label}
        </p>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-hover rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full animate-progress", iconBg.includes("primary") ? "bg-primary-500" : iconBg.includes("accent") ? "bg-accent-500" : "bg-blue-500")}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1">{progress}% of goal</p>
        </div>
      )}
    </div>
  );
}
