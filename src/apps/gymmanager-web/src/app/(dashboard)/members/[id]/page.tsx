"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Mail, Phone, Calendar, Building2, Hash } from "lucide-react";
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
      <div className="flex items-center justify-center py-16 text-surface-400 dark:text-surface-500">
        <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mr-3" />
        <span className="text-sm">Loading member...</span>
      </div>
    );
  }

  if (memberError || !member) {
    return (
      <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
        Member not found or failed to load.{" "}
        <Link href="/members" className="underline font-medium">Back to members</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/members"
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-800 transition-all"
          aria-label="Back to members"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">Members</p>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white truncate tracking-tight">{member.fullName}</h2>
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
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
              <span className="text-white font-bold text-lg">
                {member.fullName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-surface-900 dark:text-white truncate">{member.fullName}</h3>
              <div className="mt-1.5">
                <Badge status={member.status} />
              </div>
            </div>
          </div>

          <dl className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 pt-1">
                <dt className="sr-only">Email</dt>
                <dd className="text-sm text-surface-700 dark:text-surface-300 break-all">{member.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
              </div>
              <div className="pt-1">
                <dt className="sr-only">Phone</dt>
                <dd className="text-sm text-surface-700 dark:text-surface-300">{member.phone ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
              </div>
              <div className="pt-1">
                <dt className="text-[10px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">Gym House</dt>
                <dd className="text-sm text-surface-700 dark:text-surface-300">{gymHouse?.name ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
              </div>
              <div className="pt-1">
                <dt className="text-[10px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">Joined</dt>
                <dd className="text-sm text-surface-700 dark:text-surface-300">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </dd>
              </div>
            </div>
            <div className="pt-3 border-t border-surface-100 dark:border-surface-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center shrink-0">
                  <Hash className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
                </div>
                <div className="pt-1">
                  <dt className="text-[10px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">Member Code</dt>
                  <dd className="font-mono text-sm text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-700/50 px-2.5 py-1 rounded-lg mt-1 inline-block">
                    {member.memberCode}
                  </dd>
                </div>
              </div>
            </div>
          </dl>
        </Card>

        {/* Subscriptions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">Subscriptions</h3>
            <span className="text-sm text-surface-400 dark:text-surface-500 tabular-nums">
              {subsLoading ? "..." : `${subscriptions?.length ?? 0} total`}
            </span>
          </div>

          {subsLoading ? (
            <div className="flex items-center justify-center py-12 text-surface-400 dark:text-surface-500">
              <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mr-2" />
              <span className="text-sm">Loading subscriptions...</span>
            </div>
          ) : subscriptions?.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-sm text-surface-400 dark:text-surface-500 mb-3">No subscriptions yet.</p>
              <Link href={`/members/${member.id}/subscriptions/new`}>
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add First Subscription
                </Button>
              </Link>
            </Card>
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
