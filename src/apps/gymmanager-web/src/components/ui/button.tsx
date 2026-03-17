import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700 focus-visible:ring-primary-500 disabled:from-primary-300 disabled:to-primary-400 disabled:shadow-none",
  accent:
    "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-sm shadow-accent-500/25 hover:from-accent-600 hover:to-accent-700 focus-visible:ring-accent-500 disabled:from-accent-300 disabled:to-accent-400 disabled:shadow-none",
  secondary:
    "bg-card text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 focus-visible:ring-surface-400 disabled:opacity-50 shadow-sm",
  danger:
    "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm shadow-red-500/25 hover:from-red-600 hover:to-red-700 focus-visible:ring-red-500 disabled:from-red-300 disabled:to-red-400 disabled:shadow-none",
  ghost:
    "bg-transparent text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:ring-surface-400 disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs min-h-[32px]",
  md: "px-4 py-2 text-sm min-h-[40px]",
  lg: "px-6 py-2.5 text-sm min-h-[44px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900",
          "disabled:cursor-not-allowed active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
