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
    bg: "bg-badge-active-bg",
    text: "text-badge-active-text",
    dot: "bg-badge-active-dot",
  },
  Frozen: {
    bg: "bg-badge-frozen-bg",
    text: "text-badge-frozen-text",
    dot: "bg-badge-frozen-dot",
  },
  Expired: {
    bg: "bg-badge-expired-bg",
    text: "text-badge-expired-text",
    dot: "bg-badge-expired-dot",
  },
  Cancelled: {
    bg: "bg-badge-cancelled-bg",
    text: "text-badge-cancelled-text",
    dot: "bg-badge-cancelled-dot",
  },
};

const defaultStyle = {
  bg: "bg-badge-expired-bg",
  text: "text-badge-expired-text",
  dot: "bg-badge-expired-dot",
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
