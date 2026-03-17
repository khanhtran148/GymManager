"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowRight,
  Activity,
  Target,
  Flame,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { get } from "@/lib/api-client";
import type { GymHouseDto } from "@/types/gym-house";
import type { PaginatedResponse } from "@/types/member";
import type { MemberDto } from "@/types/member";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { RoleGate } from "@/components/role-gate";
import { PermissionGate } from "@/components/permission-gate";
import { Permission } from "@/lib/permissions";
import { Role } from "@/lib/roles";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: gymHouses, isLoading: gymLoading } = useQuery({
    queryKey: ["gym-houses"],
    queryFn: () => get<GymHouseDto[]>("/gym-houses"),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["members", 1, ""],
    queryFn: () =>
      get<PaginatedResponse<MemberDto>>("/members", {
        params: { page: 1, pageSize: 1 },
      }),
  });

  const activeCount =
    members?.items.filter((m) => m.status === "Active").length ?? 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" aria-hidden="true" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-primary-200" aria-hidden="true" />
            <span className="text-xs font-semibold text-primary-200 uppercase tracking-wider">Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting()}
            {user?.fullName ? `, ${user.fullName}` : ""}
          </h2>
          <p className="text-primary-100 mt-1 text-sm sm:text-base max-w-lg">
            Here&apos;s what&apos;s happening with your gyms today. Stay on track and keep growing.
          </p>
        </div>
      </div>

      {/* Stats grid - visible to Owner, HouseManager, Staff */}
      <RoleGate roles={[Role.Owner, Role.HouseManager, Role.Staff]}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Members"
            value={membersLoading ? "..." : (members?.totalCount ?? 0)}
            icon={Users}
            iconColor="text-primary-500"
            iconBg="bg-primary-50 dark:bg-primary-900/20"
            trend={{ value: 12, label: "vs last month" }}
          />
          <StatCard
            label="Active Subscriptions"
            value={membersLoading ? "..." : activeCount}
            icon={CreditCard}
            iconColor="text-accent-500"
            iconBg="bg-accent-50 dark:bg-accent-900/20"
            trend={{ value: 8, label: "vs last month" }}
          />
          <StatCard
            label="Gym Houses"
            value={gymLoading ? "..." : (gymHouses?.length ?? 0)}
            icon={Building2}
            iconColor="text-blue-500"
            iconBg="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard
            label="Revenue"
            value="$0"
            icon={TrendingUp}
            iconColor="text-violet-500"
            iconBg="bg-violet-50 dark:bg-violet-900/20"
            trend={{ value: 0, label: "Phase 2" }}
          />
        </div>
      </RoleGate>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-text-primary">Quick Actions</h3>
            <Activity className="w-4 h-4 text-surface-400" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PermissionGate permission={Permission.ManageTenant}>
              <Link
                href="/gym-houses/new"
                className={cn(
                  "flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 group border border-transparent",
                  "hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                  "hover:border-border-muted"
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all bg-blue-50 dark:bg-blue-900/20">
                  <Building2 className="w-4.5 h-4.5 text-blue-500" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Add Gym House</p>
                  <p className="text-xs text-text-muted">Register a new gym location</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
              </Link>
            </PermissionGate>

            <PermissionGate permission={Permission.ManageMembers}>
              <Link
                href="/members/new"
                className={cn(
                  "flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 group border border-transparent",
                  "hover:bg-primary-50/50 dark:hover:bg-primary-900/10",
                  "hover:border-border-muted"
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all bg-primary-50 dark:bg-primary-900/20">
                  <Users className="w-4.5 h-4.5 text-primary-500" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Add Member</p>
                  <p className="text-xs text-text-muted">Enroll a new gym member</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
              </Link>
            </PermissionGate>

            <Link
              href="/members"
              className={cn(
                "flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 group border border-transparent",
                "hover:bg-accent-50/50 dark:hover:bg-accent-900/10",
                "hover:border-border-muted"
              )}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all bg-accent-50 dark:bg-accent-900/20">
                <Target className="w-4.5 h-4.5 text-accent-500" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">View Members</p>
                <p className="text-xs text-text-muted">Browse and manage all members</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </Link>

            <Link
              href="/gym-houses"
              className={cn(
                "flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 group border border-transparent",
                "hover:bg-violet-50/50 dark:hover:bg-violet-900/10",
                "hover:border-border-muted"
              )}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all bg-violet-50 dark:bg-violet-900/20">
                <TrendingUp className="w-4.5 h-4.5 text-violet-500" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">View Gym Houses</p>
                <p className="text-xs text-text-muted">Manage all gym locations</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* System Overview - visible to Owner and HouseManager only */}
        <RoleGate roles={[Role.Owner, Role.HouseManager]}>
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-base font-semibold text-text-primary mb-5">System Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2.5 border-b border-border-muted">
                <span className="text-sm text-text-muted">Status</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 dark:text-accent-400">
                  <span className="relative w-2 h-2 rounded-full bg-accent-500">
                    <span className="absolute inset-0 rounded-full bg-accent-500 animate-ping opacity-75" aria-hidden="true" />
                  </span>
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border-muted">
                <span className="text-sm text-text-muted">Phase</span>
                <span className="text-sm font-semibold text-text-primary">
                  1 — Foundation
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border-muted">
                <span className="text-sm text-text-muted">API Version</span>
                <span className="text-sm font-semibold text-text-primary">v1</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-text-muted">Uptime</span>
                <span className="text-sm font-semibold text-text-primary">99.9%</span>
              </div>
            </div>

            {/* Phase progress */}
            <div className="mt-5 pt-4 border-t border-border-muted">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-muted">Phase 1 Progress</span>
                <span className="text-xs font-bold text-primary-500">60%</span>
              </div>
              <div className="h-2 bg-hover rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full animate-progress" />
              </div>
            </div>
          </div>
        </RoleGate>
      </div>
    </div>
  );
}
