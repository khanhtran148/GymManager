import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "block w-full rounded-xl border px-3.5 py-2.5 text-sm",
          "text-text-primary",
          "bg-input",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500",
          "disabled:cursor-not-allowed disabled:bg-surface-50 dark:disabled:bg-surface-800 disabled:text-surface-400",
          "transition-all duration-200",
          error
            ? "border-red-400 focus:ring-red-500/40 focus:border-red-500"
            : "border-border-muted dark:border-surface-700",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
