import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/types/member";
import type { SubscriptionStatus } from "@/types/subscription";

type BadgeStatus = MemberStatus | SubscriptionStatus | string;

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusStyles: Record<string, string> = {
  Active: "bg-green-100 text-green-700 border-green-200",
  Frozen: "bg-blue-100 text-blue-700 border-blue-200",
  Expired: "bg-gray-100 text-gray-600 border-gray-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
};

export function Badge({ status, className }: BadgeProps) {
  const styles = statusStyles[status] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles,
        className
      )}
    >
      {status}
    </span>
  );
}
