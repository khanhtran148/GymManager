import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  hint,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-text-secondary"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-primary-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 font-medium" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
