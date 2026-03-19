"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/gym-houses")) return "Gym Houses";
  if (pathname.startsWith("/members")) return "Members";
  if (pathname.startsWith("/bookings")) return "Bookings";
  if (pathname.startsWith("/class-schedules")) return "Class Schedules";
  if (pathname.startsWith("/time-slots")) return "Time Slots";
  if (pathname.startsWith("/check-in")) return "Check-in";
  if (pathname.startsWith("/announcements")) return "Announcements";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/settings")) return "Settings";
  return "GymManager";
}

function getPageDescription(pathname: string): string {
  if (pathname === "/") return "Welcome back! Here's your overview.";
  if (pathname.startsWith("/gym-houses")) return "Manage your gym locations";
  if (pathname.startsWith("/members")) return "Manage gym members";
  if (pathname.startsWith("/bookings")) return "Manage member bookings";
  if (pathname.startsWith("/class-schedules")) return "Manage class schedules";
  if (pathname.startsWith("/time-slots")) return "Manage time slots";
  if (pathname.startsWith("/check-in")) return "Check in members";
  if (pathname.startsWith("/announcements")) return "Create and manage announcements";
  if (pathname.startsWith("/notifications")) return "Your notification inbox";
  if (pathname.startsWith("/settings/notifications")) return "Manage notification preferences";
  return "";
}

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = getPageTitle(pathname);
  const description = getPageDescription(pathname);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const fullName = user?.fullName ?? "";
  const email = user?.email ?? "";
  const displayName = fullName || email || "User";
  const initials = (fullName || email).slice(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-topbar backdrop-blur-xl border-b border-topbar-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Spacer for sidebar on mobile */}
        <div className="lg:hidden w-8" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-text-muted hidden sm:block">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          type="button"
          className="p-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-hover transition-all hidden sm:flex"
          aria-label="Search"
        >
          <Search className="w-[18px] h-[18px]" aria-hidden="true" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        <ThemeToggle />

        {/* Divider */}
        <div className="w-px h-6 bg-border-muted mx-1" aria-hidden="true" />

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-200",
              "hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            )}
            aria-label="User menu"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20">
              <span className="text-white text-xs font-bold" aria-hidden="true">
                {initials}
              </span>
            </div>
            <span className="text-sm font-medium text-text-secondary hidden sm:block max-w-[160px] truncate">
              {fullName || email}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-text-muted transition-transform hidden sm:block",
                dropdownOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className={cn(
                "absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl",
                "bg-card border border-border py-1 z-50"
              )}
            >
              <div className="px-4 py-3 border-b border-border-muted">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Signed in as
                </p>
                {fullName && (
                  <p className="text-sm font-medium text-text-primary truncate mt-0.5">
                    {fullName}
                  </p>
                )}
                {email && (
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {email}
                  </p>
                )}
              </div>
              <button
                role="menuitem"
                type="button"
                onClick={handleLogout}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500",
                  "hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                )}
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
