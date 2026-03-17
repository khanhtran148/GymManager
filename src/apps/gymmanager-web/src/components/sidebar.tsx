"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/use-permissions";
import type { RoleType } from "@/lib/roles";
import {
  LayoutDashboard,
  Building2,
  Users,
  Menu,
  X,
  Dumbbell,
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
  allowedRoles?: RoleType[];
}

interface NavGroup {
  label: string;
  icon: IconComponent;
  prefix: string;
  children: NavItem[];
  allowedRoles?: RoleType[];
}

type NavEntry = NavItem | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const ALL_ROLES: RoleType[] = ["Owner", "HouseManager", "Trainer", "Staff", "Member"];
const STAFF_AND_ABOVE: RoleType[] = ["Owner", "HouseManager", "Trainer", "Staff"];
const MANAGEMENT_ONLY: RoleType[] = ["Owner", "HouseManager"];

const navEntries: NavEntry[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, allowedRoles: ALL_ROLES },
  { label: "Gym Houses", href: "/gym-houses", icon: Building2, allowedRoles: STAFF_AND_ABOVE },
  { label: "Members", href: "/members", icon: Users, allowedRoles: ALL_ROLES },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck, allowedRoles: ALL_ROLES },
  { label: "Class Schedules", href: "/class-schedules", icon: GraduationCap, allowedRoles: ALL_ROLES },
  { label: "Time Slots", href: "/time-slots", icon: Clock, allowedRoles: ALL_ROLES },
  { label: "Check-in", href: "/check-in", icon: ScanLine, allowedRoles: STAFF_AND_ABOVE },
  {
    label: "Finance",
    icon: Wallet,
    prefix: "/finance",
    allowedRoles: ["Owner", "HouseManager", "Staff"],
    children: [
      { label: "Dashboard", href: "/finance", icon: Wallet, allowedRoles: ["Owner", "HouseManager", "Staff"] },
      { label: "Transactions", href: "/finance/transactions", icon: Receipt, allowedRoles: ["Owner", "HouseManager", "Staff"] },
      { label: "P&L Report", href: "/finance/pnl", icon: FileText, allowedRoles: MANAGEMENT_ONLY },
    ],
  },
  {
    label: "Staff & HR",
    icon: UserCog,
    prefix: "/staff-hr",
    allowedRoles: MANAGEMENT_ONLY,
    children: [
      { label: "Staff", href: "/staff", icon: Users, allowedRoles: MANAGEMENT_ONLY },
      { label: "Shifts", href: "/shifts", icon: CalendarDays, allowedRoles: MANAGEMENT_ONLY },
      { label: "Payroll", href: "/payroll", icon: Banknote, allowedRoles: MANAGEMENT_ONLY },
    ],
  },
  { label: "Announcements", href: "/announcements", icon: Megaphone, allowedRoles: ALL_ROLES },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "/finance": true, "/staff-hr": true });

  const filteredEntries = useMemo(() => {
    if (!role) return navEntries;

    return navEntries
      .map((entry) => {
        if (isNavGroup(entry)) {
          if (entry.allowedRoles && !entry.allowedRoles.includes(role)) return null;
          const filteredChildren = entry.children.filter(
            (child) => !child.allowedRoles || child.allowedRoles.includes(role)
          );
          if (filteredChildren.length === 0) return null;
          return { ...entry, children: filteredChildren };
        }
        if (entry.allowedRoles && !entry.allowedRoles.includes(role)) return null;
        return entry;
      })
      .filter((entry): entry is NavEntry => entry !== null);
  }, [role]);

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
      {filteredEntries.map((entry) =>
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-sidebar-border-color">
          <p className="text-[10px] text-text-muted font-medium">Phase 5 -- Communications v5.0</p>
        </div>
      </aside>
    </>
  );
}
