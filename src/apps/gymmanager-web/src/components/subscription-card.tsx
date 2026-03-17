"use client";

import { useState } from "react";
import { RefreshCw, Snowflake, XCircle, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { SubscriptionDto } from "@/types/subscription";
import {
  useRenewSubscription,
  useFreezeSubscription,
  useCancelSubscription,
} from "@/hooks/use-subscriptions";

interface SubscriptionCardProps {
  subscription: SubscriptionDto;
  memberId: string;
}

export function SubscriptionCard({ subscription, memberId }: SubscriptionCardProps) {
  const renewMutation = useRenewSubscription();
  const freezeMutation = useFreezeSubscription();
  const cancelMutation = useCancelSubscription();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [freezeUntil, setFreezeUntil] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewEndDate, setRenewEndDate] = useState("");
  const [renewPrice, setRenewPrice] = useState(String(subscription.price));
  const [formError, setFormError] = useState<string | null>(null);

  const canRenew =
    subscription.status === "Active" || subscription.status === "Expired";
  const canFreeze = subscription.status === "Active";
  const canCancel =
    subscription.status === "Active" || subscription.status === "Frozen";

  async function handleFreeze() {
    if (!freezeUntil) {
      setFormError("Please select a freeze-until date.");
      return;
    }
    setFormError(null);
    await freezeMutation.mutateAsync({
      subscriptionId: subscription.id,
      memberId,
      data: { until: new Date(freezeUntil).toISOString() },
    });
    setShowFreezeDialog(false);
    setFreezeUntil("");
  }

  async function handleRenew() {
    if (!renewStartDate || !renewEndDate) {
      setFormError("Please fill in both start and end dates.");
      return;
    }
    const price = parseFloat(renewPrice);
    if (isNaN(price) || price < 0) {
      setFormError("Please enter a valid price.");
      return;
    }
    setFormError(null);
    await renewMutation.mutateAsync({
      subscriptionId: subscription.id,
      memberId,
      data: {
        startDate: new Date(renewStartDate).toISOString(),
        endDate: new Date(renewEndDate).toISOString(),
        price,
      },
    });
    setShowRenewForm(false);
  }

  async function handleCancel() {
    await cancelMutation.mutateAsync({
      subscriptionId: subscription.id,
      memberId,
    });
    setShowCancelDialog(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{subscription.type}</span>
            <Badge status={subscription.status} />
          </div>
          <p className="text-xs text-gray-400 font-mono">{subscription.id.slice(0, 8)}…</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">
            ${subscription.price.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Start:</span>
          <span className="text-gray-700">
            {new Date(subscription.startDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span>End:</span>
          <span className="text-gray-700">
            {new Date(subscription.endDate).toLocaleDateString()}
          </span>
        </div>
        {subscription.frozenUntil && (
          <div className="flex items-center gap-1.5 text-blue-500 col-span-2">
            <Snowflake className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Frozen until:</span>
            <span className="font-medium">
              {new Date(subscription.frozenUntil).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Renew form */}
      {showRenewForm && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-800">Renew Subscription</h4>
          {formError && (
            <p className="text-xs text-red-600" role="alert">{formError}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="New Start Date" htmlFor="renew-start" required>
              <Input
                id="renew-start"
                type="date"
                value={renewStartDate}
                onChange={(e) => setRenewStartDate(e.target.value)}
              />
            </FormField>
            <FormField label="New End Date" htmlFor="renew-end" required>
              <Input
                id="renew-end"
                type="date"
                value={renewEndDate}
                onChange={(e) => setRenewEndDate(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Price" htmlFor="renew-price" required>
            <Input
              id="renew-price"
              type="number"
              step="0.01"
              min="0"
              value={renewPrice}
              onChange={(e) => setRenewPrice(e.target.value)}
            />
          </FormField>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              isLoading={renewMutation.isPending}
              onClick={handleRenew}
            >
              Confirm Renewal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowRenewForm(false);
                setFormError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {(canRenew || canFreeze || canCancel) && !showRenewForm && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {canRenew && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRenewForm(true)}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Renew
            </Button>
          )}
          {canFreeze && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFreezeDialog(true)}
            >
              <Snowflake className="w-3.5 h-3.5" aria-hidden="true" />
              Freeze
            </Button>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Freeze dialog */}
      <ConfirmDialog
        isOpen={showFreezeDialog}
        title="Freeze Subscription"
        description="Select a date until which to freeze this subscription."
        confirmLabel="Freeze"
        variant="primary"
        isLoading={freezeMutation.isPending}
        onConfirm={handleFreeze}
        onCancel={() => {
          setShowFreezeDialog(false);
          setFreezeUntil("");
          setFormError(null);
        }}
      />

      {/* Freeze date input shown outside dialog for accessibility */}
      {showFreezeDialog && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-100">
          {formError && (
            <p className="text-xs text-red-600" role="alert">{formError}</p>
          )}
          <FormField label="Freeze Until" htmlFor="freeze-until" required>
            <Input
              id="freeze-until"
              type="date"
              value={freezeUntil}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setFreezeUntil(e.target.value)}
            />
          </FormField>
        </div>
      )}

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Subscription"
        description="Are you sure you want to cancel this subscription? This action cannot be undone."
        confirmLabel="Cancel Subscription"
        cancelLabel="Keep Subscription"
        variant="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
}
