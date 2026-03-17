"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, User, Mail, Phone, Calendar, Building2 } from "lucide-react";
import { useMember } from "@/hooks/use-members";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubscriptionCard } from "@/components/subscription-card";

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();

  const { data: member, isLoading: memberLoading, error: memberError } = useMember(params.id);
  const { data: subscriptions, isLoading: subsLoading } = useSubscriptions(params.id);
  const { data: gymHouses } = useGymHouses();

  const gymHouse = gymHouses?.find((g) => g.id === member?.gymHouseId);

  if (memberLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <svg
          className="h-6 w-6 animate-spin mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading member...</span>
      </div>
    );
  }

  if (memberError || !member) {
    return (
      <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        Member not found or failed to load.{" "}
        <Link href="/members" className="underline">Back to members</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/members"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Back to members"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500">Members</p>
          <h2 className="text-xl font-bold text-gray-900 truncate">{member.fullName}</h2>
        </div>
        <Link href={`/members/${member.id}/subscriptions/new`}>
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Subscription
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member info */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-indigo-700 font-bold text-xl">
                {member.fullName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{member.fullName}</h3>
              <div className="mt-1">
                <Badge status={member.status} />
              </div>
            </div>
          </div>

          <dl className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <dt className="sr-only">Email</dt>
                <dd className="text-sm text-gray-700 break-all">{member.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <dt className="sr-only">Phone</dt>
                <dd className="text-sm text-gray-700">{member.phone ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <dt className="text-xs text-gray-400">Gym House</dt>
                <dd className="text-sm text-gray-700">{gymHouse?.name ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <dt className="text-xs text-gray-400">Joined</dt>
                <dd className="text-sm text-gray-700">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </dd>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-50">
              <dt className="text-xs text-gray-400 mb-1">Member Code</dt>
              <dd className="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                {member.memberCode}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Subscriptions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Subscriptions</h3>
            <span className="text-sm text-gray-500">
              {subsLoading ? "..." : `${subscriptions?.length ?? 0} total`}
            </span>
          </div>

          {subsLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <svg
                className="h-5 w-5 animate-spin mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading subscriptions...</span>
            </div>
          ) : subscriptions?.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
              <p className="text-sm">No subscriptions yet.</p>
              <Link href={`/members/${member.id}/subscriptions/new`}>
                <Button variant="primary" size="sm" className="mt-3">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add First Subscription
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions?.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  memberId={member.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
