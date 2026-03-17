"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Building2, CreditCard } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { get } from "@/lib/api-client";
import type { GymHouseDto } from "@/types/gym-house";
import type { PaginatedResponse } from "@/types/member";
import type { MemberDto } from "@/types/member";
import { useAuthStore } from "@/stores/auth-store";

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h2>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your gyms today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Members"
          value={membersLoading ? "—" : (members?.totalCount ?? 0)}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Active Subscriptions"
          value={membersLoading ? "—" : activeCount}
          icon={CreditCard}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          label="Gym Houses"
          value={gymLoading ? "—" : (gymHouses?.length ?? 0)}
          icon={Building2}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a
              href="/gym-houses/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Building2 className="w-4 h-4 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Add Gym House</p>
                <p className="text-xs text-gray-500">Register a new gym location</p>
              </div>
            </a>
            <a
              href="/members/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Users className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Add Member</p>
                <p className="text-xs text-gray-500">Enroll a new gym member</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Platform Status</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                Operational
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Phase</span>
              <span className="text-sm font-medium text-gray-800">1 — Foundation</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">API Version</span>
              <span className="text-sm font-medium text-gray-800">v1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
