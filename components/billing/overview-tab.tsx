"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  Repeat2,
  Sparkles,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemsTable } from "./items-table";
import { PlanChangeDialog } from "./plan-change-dialog";
import { AddonsDialog } from "./addons-dialog";
import { CancelSubscriptionDialog } from "./cancel-subscription-dialog";
import { formatBillingDate, getSubscriptionStatusMeta, isInTrial } from "./shared";
import type {
  Addon,
  Package,
  Subscription,
  SubscriptionItem,
} from "@/types/billing/types";

interface OverviewTabProps {
  subscription: Subscription;
  packages: Package[];
  addons: Addon[];
  entityLabels?: Record<string, string>;
}

export function OverviewTab({ subscription, packages, addons, entityLabels }: OverviewTabProps) {
  const [planItem, setPlanItem] = useState<SubscriptionItem | null>(null);
  const [addonsItem, setAddonsItem] = useState<SubscriptionItem | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const statusMeta = getSubscriptionStatusMeta(subscription.status);
  // Cancellable when the subscription header is ACTIVE or PAST_DUE, OR when
  // the entity is in a date-based trial (primary signal), OR when the header
  // still carries TRIAL (legacy/fallback for the subscription-level status).
  const isCancellable =
    subscription.status === "ACTIVE" ||
    subscription.status === "PAST_DUE" ||
    isInTrial(subscription.trialEndDate) ||
    subscription.status === "TRIAL";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryCard
          icon={<Wallet className="h-3.5 w-3.5 text-primary" />}
          label="Status"
          value={<Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
          footer={
            subscription.cancelledAt
              ? `Cancelled on ${formatBillingDate(subscription.cancelledAt)}`
              : subscription.isFreeSubscription
                ? "Free subscription"
                : subscription.hasActiveDiscount
                  ? `${subscription.activeDiscounts?.length ?? 0} active discount(s)`
                  : "No active discounts"
          }
        />
        <SummaryCard
          icon={<CalendarClock className="h-3.5 w-3.5 text-pos" />}
          label="Paid through"
          value={
            <p className="text-lg font-semibold tabular-nums text-ink">
              {formatBillingDate(subscription.paidThrough)}
            </p>
          }
          footer={
            subscription.nextBillingDate
              ? `Next billing ${formatBillingDate(subscription.nextBillingDate)}`
              : "No upcoming charge"
          }
        />
        <SummaryCard
          icon={<Repeat2 className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Auto-renew"
          value={
            <Badge variant={subscription.autoRenew ? "pos" : "soft"}>
              {subscription.autoRenew ? "On" : "Off"}
            </Badge>
          }
          footer={`Billing cycle ${formatBillingDate(subscription.billingCycleStart)} – ${formatBillingDate(
            subscription.billingCycleEnd,
          )}`}
        />
      </div>

      {subscription.hasActiveDiscount && subscription.activeDiscounts && subscription.activeDiscounts.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-pos/30 bg-pos-tint p-4">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-pos" />
          <div>
            <p className="text-sm font-medium text-pos">Active discount(s)</p>
            <ul className="mt-1 space-y-0.5 text-[12.5px] text-pos/80">
              {subscription.activeDiscounts.map((d) => (
                <li key={d.id}>
                  {d.description ?? "Discount"} —{" "}
                  {d.discountType === "PERCENTAGE"
                    ? `${d.discountValue}% off`
                    : `${d.discountValue.toLocaleString()} off`}
                  {d.validUntil ? ` (until ${formatBillingDate(d.validUntil)})` : " (no end date)"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              Subscribed entities
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              One row per location, warehouse, or store covered by this subscription. Bundled items inherit their parent&apos;s actions.
            </p>
          </div>
        </div>
        <ItemsTable
          subscription={subscription}
          entityLabels={entityLabels}
          onChangePlan={setPlanItem}
          onManageAddons={setAddonsItem}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-neg/30 bg-neg-tint/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-neg" />
          <div>
            <p className="text-sm font-medium text-ink">Danger zone</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Cancelling stops future billing. You keep access until {formatBillingDate(subscription.paidThrough)}.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCancelOpen(true)}
          disabled={!isCancellable}
          className="border-neg/40 text-neg hover:bg-neg-tint hover:text-neg"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Cancel subscription
        </Button>
      </div>

      <PlanChangeDialog
        open={planItem !== null}
        onOpenChange={(open) => !open && setPlanItem(null)}
        subscriptionId={subscription.id}
        item={planItem}
        packages={packages}
      />
      <AddonsDialog
        open={addonsItem !== null}
        onOpenChange={(open) => !open && setAddonsItem(null)}
        subscriptionId={subscription.id}
        item={addonsItem}
        addons={addons}
      />
      <CancelSubscriptionDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        subscriptionId={subscription.id}
        planSummary={subscription.items
          .filter((i) => i.status === "ACTIVE")
          .map((i) => i.packageInfo?.name)
          .filter(Boolean)
          .join(", ")}
      />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  footer,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  footer: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="mt-2">{value}</div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">{footer}</p>
    </div>
  );
}
