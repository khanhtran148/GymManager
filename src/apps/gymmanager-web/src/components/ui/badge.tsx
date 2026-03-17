import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/types/member";
import type { SubscriptionStatus } from "@/types/subscription";

type BadgeStatus = MemberStatus | SubscriptionStatus | string;

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Active: {
    bg: "bg-accent-50 dark:bg-accent-900/20",
    text: "text-accent-700 dark:text-accent-400",
    dot: "bg-accent-500",
  },
  Frozen: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  Expired: {
    bg: "bg-surface-100 dark:bg-surface-700/50",
    text: "text-surface-600 dark:text-surface-400",
    dot: "bg-surface-400",
  },
  Cancelled: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
};

const defaultStyle = {
  bg: "bg-surface-100 dark:bg-surface-700/50",
  text: "text-surface-600 dark:text-surface-400",
  dot: "bg-surface-400",
};

export function Badge({ status, className }: BadgeProps) {
  const styles = statusStyles[status] ?? defaultStyle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
        styles.bg,
        styles.text,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} aria-hidden="true" />
      {status}
    </span>
  );
}
