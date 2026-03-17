import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
  label?: string;
}

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  const sizeClasses = size === "sm" ? "w-4 h-4 border-2" : "w-6 h-6 border-2";

  return (
    <div className={cn("flex items-center justify-center gap-2 text-text-muted", className)}>
      <div
        className={cn(
          "border-primary-500/30 border-t-primary-500 rounded-full animate-spin",
          sizeClasses
        )}
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
