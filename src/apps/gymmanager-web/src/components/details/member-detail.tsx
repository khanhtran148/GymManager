"use client";

import { useState } from "react";
import { Plus, Mail, Phone, Calendar, Building2, Hash } from "lucide-react";
import { useMember } from "@/hooks/use-members";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useActiveGymHouse } from "@/hooks/use-active-gym-house";
import { useRbacStore } from "@/stores/rbac-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormModal } from "@/components/ui/form-modal";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { PermissionGate } from "@/components/permission-gate";
import { SubscriptionCard } from "@/components/subscription-card";
import { SubscriptionForm } from "@/components/forms/subscription-form";

interface MemberDetailProps {
  memberId: string;
  onClose: () => void;
}

export function MemberDetail({ memberId, onClose: _onClose }: MemberDetailProps) {
  const [showSubForm, setShowSubForm] = useState(false);
  const { addToast } = useToastStore();
  const { permissionMap } = useRbacStore();
  const { gymHouseId } = useActiveGymHouse();

  const { data: member, isLoading: memberLoading, error: memberError } = useMember(gymHouseId, memberId);
  const { data: subscriptions, isLoading: subsLoading } = useSubscriptions(memberId, gymHouseId ?? undefined);
  const { data: gymHouses } = useGymHouses();

  const gymHouse = gymHouses?.find((g) => g.id === member?.gymHouseId);

  if (memberLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Loading member..." />
      </div>
    );
  }

  if (memberError || !member) {
    return (
      <Alert variant="error">
        Member not found or failed to load.
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column — Member info */}
      <div className="lg:col-span-1 space-y-5">
        {/* Avatar + Name + Status */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold text-lg" aria-hidden="true">
              {member.fullName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text-primary truncate text-lg">{member.fullName}</h3>
            <div className="mt-1.5">
              <Badge status={member.status} />
            </div>
          </div>
        </div>

        <Card>
          <dl className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-card-inset flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 pt-1">
                <dt className="sr-only">Email</dt>
                <dd className="text-sm text-text-secondary break-all">{member.email}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-card-inset flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
              </div>
              <div className="pt-1">
                <dt className="sr-only">Phone</dt>
                <dd className="text-sm text-text-secondary">{member.phone ?? "—"}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-card-inset flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
              </div>
              <div className="pt-1">
                <dt className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Gym House</dt>
                <dd className="text-sm text-text-secondary">{gymHouse?.name ?? "—"}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-card-inset flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
              </div>
              <div className="pt-1">
                <dt className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Joined</dt>
                <dd className="text-sm text-text-secondary tabular-nums">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </dd>
              </div>
            </div>

            <div className="pt-3 border-t border-border-muted">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-card-inset flex items-center justify-center shrink-0">
                  <Hash className="w-3.5 h-3.5 text-surface-400" aria-hidden="true" />
                </div>
                <div className="pt-1">
                  <dt className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Member Code</dt>
                  <dd className="font-mono text-sm text-text-secondary bg-card-inset px-2.5 py-1 rounded-lg mt-1 inline-block">
                    {member.memberCode}
                  </dd>
                </div>
              </div>
            </div>
          </dl>
        </Card>
      </div>

      {/* Right column — Subscriptions */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">Subscriptions</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted tabular-nums">
              {subsLoading ? "..." : `${subscriptions?.length ?? 0} total`}
            </span>
            <PermissionGate permission={permissionMap["ManageMembers"] ?? 0n}>
              <Button variant="primary" size="sm" onClick={() => setShowSubForm(true)}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Subscription
              </Button>
            </PermissionGate>
          </div>
        </div>

        {subsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner label="Loading subscriptions..." />
          </div>
        ) : subscriptions?.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-sm text-text-muted mb-3">No subscriptions yet.</p>
            <PermissionGate permission={permissionMap["ManageMembers"] ?? 0n}>
              <Button variant="primary" size="sm" onClick={() => setShowSubForm(true)}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add First Subscription
              </Button>
            </PermissionGate>
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

      <FormModal isOpen={showSubForm} onClose={() => setShowSubForm(false)} title="Add New Subscription">
        <SubscriptionForm
          memberId={memberId}
          onSuccess={() => {
            setShowSubForm(false);
            addToast({ message: "Subscription created successfully", variant: "success" });
          }}
          onCancel={() => setShowSubForm(false)}
        />
      </FormModal>
    </div>
  );
}
