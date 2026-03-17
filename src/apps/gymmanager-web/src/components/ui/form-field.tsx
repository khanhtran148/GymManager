import { cn } from "@/lib/utils";
import type { HTMLAttributes, LabelHTMLAttributes } from "react";

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
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
