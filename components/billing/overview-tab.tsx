"use client";

import React, { useState } from "react";
import { Ban, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemsTable } from "./items-table";
import { PlanChangeDialog } from "./plan-change-dialog";
import { AddonsDialog } from "./addons-dialog";
import { CancelSubscriptionDialog } from "./cancel-subscription-dialog";
import { CancelItemDialog } from "./cancel-item-dialog";
import { DueCard, SettledCard, type DueGroup } from "./billing-hero";
import { ENTITY_TYPE_LABEL, formatBillingDate, isInTrial } from "./shared";
import type {
  Addon,
  BillingInvoice,
  Package,
  Subscription,
  SubscriptionItem,
} from "@/types/billing/types";

interface OverviewTabProps {
  subscription: Subscription;
  packages: Package[];
  addons: Addon[];
  entityLabels?: Record<string, string>;
  /** The open invoice driving the hero banner, if any. */
  pendingInvoice: BillingInvoice | null;
  onPay: () => void;
  onViewInvoice: () => void;
  onGenerate: () => void;
}

export function OverviewTab({
  subscription,
  packages,
  addons,
  entityLabels,
  pendingInvoice,
  onPay,
  onViewInvoice,
  onGenerate,
}: OverviewTabProps) {
  const [planItem, setPlanItem] = useState<SubscriptionItem | null>(null);
  const [addonsItem, setAddonsItem] = useState<SubscriptionItem | null>(null);
  const [cancelItem, setCancelItem] = useState<SubscriptionItem | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Cancellable when the subscription header is ACTIVE or PAST_DUE, OR when
  // the entity is in a date-based trial (primary signal), OR when the header
  // still carries TRIAL (legacy/fallback for the subscription-level status).
  const isCancellable =
    subscription.status === "ACTIVE" ||
    subscription.status === "PAST_DUE" ||
    isInTrial(subscription.trialEndDate) ||
    subscription.status === "TRIAL";

  return (
    <div>
      {pendingInvoice ? (
        <DueCard
          invoiceNumber={pendingInvoice.invoiceNumber}
          total={pendingInvoice.totalAmount}
          currency={pendingInvoice.currency}
          lineCount={pendingInvoice.lineItems.length}
          groups={buildDueGroups(pendingInvoice)}
          onPay={onPay}
          onView={onViewInvoice}
        />
      ) : (
        <SettledCard onGenerate={onGenerate} />
      )}

      {subscription.hasActiveDiscount &&
        subscription.activeDiscounts &&
        subscription.activeDiscounts.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-pos/30 bg-pos-tint p-4">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-pos" />
            <div>
              <p className="text-sm font-medium text-pos">Active discount(s)</p>
              <ul className="mt-1 space-y-0.5 text-[12.5px] text-pos/80">
                {subscription.activeDiscounts.map((d) => (
                  <li key={d.id}>
                    {d.description ?? "Discount"} —{" "}
                    {d.discountType === "PERCENTAGE"
                      ? `${d.discountValue}% off`
                      : `${d.discountValue.toLocaleString("en-US")} off`}
                    {d.validUntil
                      ? ` (until ${formatBillingDate(d.validUntil)})`
                      : " (no end date)"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      <section className="mt-8">
        <h2 className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">
          Subscribed entities
        </h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          One row per location, warehouse, or store covered by this
          subscription. Bundled items inherit their parent&apos;s actions.
        </p>
        <div className="mt-4">
          <ItemsTable
            subscription={subscription}
            entityLabels={entityLabels}
            onChangePlan={setPlanItem}
            onManageAddons={setAddonsItem}
            onCancelItem={setCancelItem}
          />
        </div>
      </section>

      {/*
       * Danger zone surface, mixed the way the design specifies: a 4% wash
       * of --neg into the card colour with a 22% wash into the hairline.
       * Both tokens flip under `.dark`, so the wash follows the theme.
       * (Don't reach for the -tint tokens with an opacity modifier here —
       * --neg-tint already carries an alpha, so the extra modifier emits an
       * invalid `hsl(… / .1 / .4)` and the browser drops the declaration.)
       */}
      <div className="mt-6 flex flex-col gap-6 rounded-xl border border-[color-mix(in_oklab,hsl(var(--neg))_22%,hsl(var(--line)))] bg-[color-mix(in_oklab,hsl(var(--neg))_4%,hsl(var(--card)))] px-6 py-[22px] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2.5 text-[16px] font-bold tracking-[-0.01em] text-ink">
            <Ban className="h-5 w-5 text-neg" />
            Danger zone
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-3">
            Cancelling stops future billing. You keep access until{" "}
            {formatBillingDate(subscription.paidThrough)}.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setCancelOpen(true)}
          disabled={!isCancellable}
          className="h-10 flex-none self-start border-neg/30 text-neg hover:border-neg hover:bg-neg-tint hover:text-neg sm:self-center"
        >
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
      <CancelItemDialog
        open={cancelItem !== null}
        onOpenChange={(open) => !open && setCancelItem(null)}
        subscriptionId={subscription.id}
        item={cancelItem}
        entityName={
          cancelItem
            ? (entityLabels?.[cancelItem.entityId] ??
              `${ENTITY_TYPE_LABEL[cancelItem.entityType]} ${cancelItem.entityId.slice(0, 8)}`)
            : ""
        }
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

/**
 * Collapses an invoice's line items into the few summary rows shown on
 * the right of the due banner. Identical descriptions roll up into one
 * "N× <plan>" row; anything past the fourth distinct row is folded into
 * a single "Other items" line so the banner never grows a scrollbar.
 */
const MAX_DUE_GROUPS = 4;

function buildDueGroups(invoice: BillingInvoice): DueGroup[] {
  const byDescription = new Map<string, DueGroup>();
  for (const line of invoice.lineItems) {
    const existing = byDescription.get(line.description) ?? {
      label: line.description,
      quantity: 0,
      amount: 0,
    };
    existing.quantity += line.quantity || 1;
    existing.amount += line.totalPrice;
    byDescription.set(line.description, existing);
  }

  const groups = [...byDescription.values()];
  if (groups.length <= MAX_DUE_GROUPS) return groups;

  const head = groups.slice(0, MAX_DUE_GROUPS - 1);
  const rest = groups.slice(MAX_DUE_GROUPS - 1);
  head.push({
    label: "Other items",
    quantity: rest.reduce((sum, g) => sum + g.quantity, 0),
    amount: rest.reduce((sum, g) => sum + g.amount, 0),
  });
  return head;
}
