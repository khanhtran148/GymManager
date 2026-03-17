"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/gym-houses": "Gym Houses",
  "/members": "Members",
};

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/gym-houses")) return "Gym Houses";
  if (pathname.startsWith("/members")) return "Members";
  return "GymManager";
}

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = getPageTitle(pathname);

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

  const displayName = user?.email ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Spacer for sidebar on desktop */}
        <div className="lg:hidden w-8" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={cn(
            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors",
            "hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          )}
          aria-label="User menu"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold" aria-hidden="true">
              {initials}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform hidden sm:block",
              dropdownOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            className={cn(
              "absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg",
              "border border-gray-100 py-1 z-50"
            )}
          >
            <div className="px-4 py-2.5 border-b border-gray-100">
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
            </div>
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600",
                "hover:bg-red-50 transition-colors"
              )}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
