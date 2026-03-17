import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface AlertProps {
  variant: "error" | "success";
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant, className, children }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "px-4 py-3 rounded-xl text-sm border",
        variant === "error" && "bg-error-bg border-error-border text-error-text",
        variant === "success" && "bg-success-bg border-success-border text-success-text flex items-center gap-2",
        className
      )}
    >
      {variant === "success" && <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />}
      {children}
    </div>
  );
}
