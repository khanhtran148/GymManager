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
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50",
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-2 text-xs font-medium flex items-center gap-1",
                trend.value >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
              <span className="text-gray-400 font-normal">{trend.label}</span>
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl shrink-0", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
