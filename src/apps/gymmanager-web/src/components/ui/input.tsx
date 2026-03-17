import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
          "transition-colors",
          error
            ? "border-red-400 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
