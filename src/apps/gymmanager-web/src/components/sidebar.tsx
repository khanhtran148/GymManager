"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Menu,
  X,
  Dumbbell,
  Crown,
  Zap,
  CalendarCheck,
  GraduationCap,
  Clock,
  ScanLine,
  Wallet,
  Receipt,
  FileText,
  ChevronDown,
  UserCog,
  CalendarDays,
  Banknote,
  Megaphone,
} from "lucide-react";

type IconComponent = React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

interface NavItem {
  label: string;
  href: string;
  icon: IconComponent;
}

interface NavGroup {
  label: string;
  icon: IconComponent;
  prefix: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const navEntries: NavEntry[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Gym Houses", href: "/gym-houses", icon: Building2 },
  { label: "Members", href: "/members", icon: Users },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Class Schedules", href: "/class-schedules", icon: GraduationCap },
  { label: "Time Slots", href: "/time-slots", icon: Clock },
  { label: "Check-in", href: "/check-in", icon: ScanLine },
  {
    label: "Finance",
    icon: Wallet,
    prefix: "/finance",
    children: [
      { label: "Dashboard", href: "/finance", icon: Wallet },
      { label: "Transactions", href: "/finance/transactions", icon: Receipt },
      { label: "P&L Report", href: "/finance/pnl", icon: FileText },
    ],
  },
  {
    label: "Staff & HR",
    icon: UserCog,
    prefix: "/staff-hr",
    children: [
      { label: "Staff", href: "/staff", icon: Users },
      { label: "Shifts", href: "/shifts", icon: CalendarDays },
      { label: "Payroll", href: "/payroll", icon: Banknote },
    ],
  },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "/finance": true, "/staff-hr": true });

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  };

  const isGroupActive = (group: NavGroup) => {
    if (pathname.startsWith(group.prefix)) return true;
    return group.children.some((child) => isActive(child.href));
  };

  const toggleGroup = (prefix: string) => {
    setExpandedGroups((prev) => ({ ...prev, [prefix]: !prev[prefix] }));
  };

  function renderNavItem(item: NavItem, indent = false) {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          indent && "ml-4",
          active
            ? "bg-nav-active-bg text-nav-active-text shadow-sm"
            : "text-text-muted hover:bg-nav-hover-bg hover:text-text-secondary"
        )}
        aria-current={active ? "page" : undefined}
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
            active
              ? "bg-nav-active-icon-bg text-nav-active-text"
              : "bg-nav-icon-bg text-text-muted group-hover:bg-nav-icon-hover-bg group-hover:text-text-secondary"
          )}
        >
          <Icon className="w-4 h-4" aria-hidden={true} />
        </div>
        {item.label}
        {active && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" aria-hidden="true" />
        )}
      </Link>
    );
  }

  function renderNavGroup(group: NavGroup) {
    const Icon = group.icon;
    const groupActive = isGroupActive(group);
    const expanded = expandedGroups[group.prefix] ?? groupActive;
    return (
      <div key={group.prefix}>
        <button
          type="button"
          onClick={() => toggleGroup(group.prefix)}
          className={cn(
            "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            groupActive
              ? "text-nav-active-text"
              : "text-text-muted hover:bg-nav-hover-bg hover:text-text-secondary"
          )}
          aria-expanded={expanded}
        >
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
              groupActive
                ? "bg-nav-active-icon-bg text-nav-active-text"
                : "bg-nav-icon-bg text-text-muted group-hover:bg-nav-icon-hover-bg group-hover:text-text-secondary"
            )}
          >
            <Icon className="w-4 h-4" aria-hidden={true} />
          </div>
          <span className="flex-1 text-left">{group.label}</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              expanded ? "rotate-180" : ""
            )}
            aria-hidden="true"
          />
        </button>
        {expanded && (
          <div className="mt-0.5 space-y-0.5">
            {group.children.map((child) => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  }

  const navContent = (
    <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1 sidebar-scroll overflow-y-auto">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        Menu
      </p>
      {navEntries.map((entry) =>
        isNavGroup(entry) ? renderNavGroup(entry) : renderNavItem(entry)
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-sidebar-bg text-text-secondary shadow-lg border border-sidebar-border-color"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
        aria-controls="sidebar-nav"
      >
        {mobileOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        className={cn(
          "fixed top-0 left-0 h-full z-40 w-64 flex flex-col transition-transform duration-300",
          "bg-sidebar-bg border-r border-sidebar-border-color",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border-color">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
            <Dumbbell className="w-4.5 h-4.5 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="text-text-primary font-bold text-base leading-tight block tracking-tight">
              GymManager
            </span>
            <span className="text-text-muted text-[10px] font-medium uppercase tracking-wider">
              Pro Dashboard
            </span>
          </div>
        </div>

        {navContent}

        {/* Upgrade card */}
        <div className="px-3 pb-3">
          <div className="rounded-xl bg-upgrade-bg border border-upgrade-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-nav-active-text" aria-hidden="true" />
              <span className="text-xs font-semibold text-nav-active-text">Go Premium</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed mb-3">
              Unlock analytics, reports, and advanced features.
            </p>
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-semibold shadow-sm shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700 transition-all">
              <Zap className="w-3 h-3" aria-hidden="true" />
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-sidebar-border-color">
          <p className="text-[10px] text-text-muted font-medium">Phase 5 — Communications v5.0</p>
        </div>
      </aside>
    </>
  );
}
