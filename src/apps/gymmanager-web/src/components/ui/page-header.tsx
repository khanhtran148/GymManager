import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  backHref: string;
  backLabel?: string;
  breadcrumb: string;
  title: string;
  actions?: React.ReactNode;
}

export function PageHeader({ backHref, backLabel, breadcrumb, title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={backHref}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-hover transition-all"
        aria-label={backLabel ?? `Back to ${breadcrumb}`}
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{breadcrumb}</p>
        <h2 className="text-xl font-bold text-text-primary tracking-tight truncate">{title}</h2>
      </div>
      {actions}
    </div>
  );
}
