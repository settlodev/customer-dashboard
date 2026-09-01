"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpCircle,
  Gift,
  Link2,
  ListChecks,
  Loader2,
  PackagePlus,
  Plus,
  ReceiptText,
  RefreshCw,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { useToast } from "@/hooks/use-toast";

import { AddAddonDialog } from "@/components/admin/billing/add-addon-dialog";
import { ApplyDiscountDialog } from "@/components/admin/billing/apply-discount-dialog";
import { AttachInvoiceDialog } from "@/components/admin/billing/attach-invoice-dialog";
import { GenerateInvoiceDialog } from "@/components/admin/billing/generate-invoice-dialog";
import { GenerateItemInvoiceDialog } from "@/components/admin/billing/generate-item-invoice-dialog";
import { GrantFreeSubscriptionDialog } from "@/components/admin/billing/grant-free-subscription-dialog";
import { InvoiceActionsDialog } from "@/components/admin/billing/invoice-actions-dialog";
import { buildInvoiceColumns } from "@/components/tables/admin-invoices/column";
import { UpgradePlanDialog } from "@/components/admin/billing/upgrade-plan-dialog";
import {
  reconcileMigratedPayments,
  repairSubscription,
  republishSubscriptions,
  revokeDiscount,
} from "@/lib/actions/admin/billing";
import {
  DiscountResponse,
  InvoicePage,
  InvoiceResponse,
  SubscriptionDiscountResponse,
  SubscriptionItemResponse,
  SubscriptionResponse,
  SubscriptionStatus,
} from "@/types/admin/billing";

interface BillingViewProps {
  businessId: string;
  subscription: SubscriptionResponse | null;
  invoicePage: InvoicePage | null;
  activeDiscounts: SubscriptionDiscountResponse[];
  availableDiscounts: DiscountResponse[];
  /** entityId -> location/warehouse/store name (billing doesn't own these). */
  entityNames: Record<string, string>;
  /** Auth user id -> staff display name, for "recorded by"/"approved by" on manual payments. */
  actorNames: Record<string, string>;
  canGrantFree: boolean;
  /** System admin only — lets the custom-invoice tool bill a cancelled/still-in-trial item. */
  canOverrideBilling: boolean;
  errors: {
    subscription: string | null;
    invoices: string | null;
    activeDiscounts: string | null;
    availableDiscounts: string | null;
  };
}

const SUBSCRIPTION_STATUS_BADGE: Record<
  SubscriptionStatus,
  { label: string; className: string }
> = {
  TRIAL: {
    label: "Trial",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  ACTIVE: {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  PAST_DUE: {
    label: "Past due",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  },
  EXPIRED: {
    label: "Expired",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
  SUSPENDED: {
    label: "Suspended",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "border-muted bg-muted text-muted-foreground",
  },
  VOIDED: {
    label: "Voided",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * A still-active item has no `removedAt`, but it isn't open-ended: it lapses
 * at `paidThrough` (or `trialEndDate` while still trialing) unless renewed.
 */
function itemEndDate(item: SubscriptionItemResponse): string {
  if (item.removedAt) return formatDate(item.removedAt);
  if (item.paidThrough) return `${formatDate(item.paidThrough)} (paid through)`;
  if (item.trialEndDate) return `${formatDate(item.trialEndDate)} (trial ends)`;
  return "Ongoing";
}

export function BillingView({
  businessId,
  subscription,
  invoicePage,
  activeDiscounts,
  availableDiscounts,
  entityNames,
  actorNames,
  canGrantFree,
  canOverrideBilling,
  errors,
}: BillingViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateItemsOpen, setGenerateItemsOpen] = useState(false);
  const [applyDiscountOpen, setApplyDiscountOpen] = useState(false);
  const [grantFreeOpen, setGrantFreeOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [addAddonOpen, setAddAddonOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState<InvoiceResponse | null>(
    null,
  );

  const invoiceColumns = useMemo(
    () => buildInvoiceColumns({ onView: setInvoiceTarget }),
    [],
  );

  // ACTIVE + degraded units, so Change plan can target an expired entity (a business whose
  // subscription has lapsed). Entitlement/MRR still read `items`. Falls back on pre-deploy
  // responses that don't carry manageableItems yet.
  const manageableItems = subscription?.manageableItems ?? subscription?.items ?? [];

  const handleRepublish = useCallback(() => {
    if (
      !confirm(
        "Republish SUBSCRIPTION_UPDATED events for this business? Use after a downstream consumer (entitlements, sidebar) has drifted out of sync.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await republishSubscriptions(businessId);
      if (result.responseType === "error") {
        toast({
          title: "Republish failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  }, [businessId, router, toast]);

  /**
   * A business's only history is a VOIDED subscription (an internal-mistake row) — voiding
   * never touches its actual locations/warehouses/stores, so nothing automatically
   * re-subscribes them. This clones the most recent voided generation's items onto a fresh
   * subscription and generates its activation invoice.
   */
  const handleRepairSubscription = useCallback(() => {
    if (
      !confirm(
        "Repair this business's subscription? Clones the most recently voided subscription's items onto a brand-new one and generates its activation invoice.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await repairSubscription(businessId);
      if (result.responseType === "error") {
        toast({
          title: "Repair failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  }, [businessId, router, toast]);

  /**
   * Grant the access this business has already paid for. Invoices imported at
   * the monolith cutover were written straight into the database as PAID, so no
   * payment handler ever ran for them and the subscription never learned it had
   * been paid — it reads Expired, then Suspended once the daily scheduler moves
   * it on.
   *
   * Previews first and puts the concrete projection in the confirm, so nobody
   * applies this blind. A held-back CANCELLED subscription is called out by
   * name: reviving one is a human decision (support cancels subscriptions by
   * hand, but so does a genuine churn), never a silent side effect.
   */
  const handleReconcile = useCallback(() => {
    startTransition(async () => {
      const dry = await reconcileMigratedPayments({
        businessId,
        dryRun: true,
        includeCancelled: false,
      });
      if (dry.responseType === "error") {
        toast({
          title: "Preview failed",
          description: dry.message,
          variant: "destructive",
        });
        return;
      }

      const row = dry.data?.subscriptions?.[0];
      if (!row) {
        toast({
          title: "Nothing to reconcile",
          description:
            "Every paid invoice for this business is already reflected in the subscription.",
        });
        return;
      }

      const held = row.action === "SKIPPED_CANCELLED";
      const unmatched = row.itemsUnmatched
        ? `\n\n${row.itemsUnmatched} entity(ies) could not be matched to any paid invoice and will be left alone — check those by hand.`
        : "";
      const revive = held
        ? "\n\nThis subscription is CANCELLED. Reviving it sets it ACTIVE and turns auto-renew back on."
        : "";
      if (
        !confirm(
          `Reconcile this business against its paid invoices?\n\n` +
            `Paid through ${row.oldPaidThrough?.slice(0, 10) ?? "—"} → ${
              row.newPaidThrough?.slice(0, 10) ?? "—"
            } (invoice ${row.anchorInvoiceNumber ?? "—"})\n` +
            `Status ${row.oldStatus} → ACTIVE · ${row.itemsStamped} entity(ies) reactivated` +
            revive +
            unmatched,
        )
      ) {
        return;
      }

      const result = await reconcileMigratedPayments({
        businessId,
        dryRun: false,
        includeCancelled: held,
      });
      if (result.responseType === "error") {
        toast({
          title: "Reconcile failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  }, [businessId, router, toast]);

  const handleRevoke = useCallback(
    (discount: SubscriptionDiscountResponse) => {
      if (!confirm(`Revoke "${discount.discountName}" discount?`)) return;
      startTransition(async () => {
        const result = await revokeDiscount(businessId, discount.id);
        if (result.responseType === "error") {
          toast({
            title: "Failed to revoke discount",
            description: result.message,
            variant: "destructive",
          });
          return;
        }
        toast({ title: result.message });
        router.refresh();
      });
    },
    [businessId, router, toast],
  );

  const refresh = () => router.refresh();

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => setGenerateOpen(true)}
          disabled={!subscription}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Generate invoice
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setGenerateItemsOpen(true)}
          disabled={!subscription || manageableItems.length === 0}
        >
          <ListChecks className="mr-1.5 h-4 w-4" />
          Build custom invoice
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setUpgradeOpen(true)}
          disabled={!subscription || manageableItems.length === 0}
        >
          <ArrowUpCircle className="mr-1.5 h-4 w-4" />
          Change plan
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddAddonOpen(true)}
          disabled={!subscription || subscription.items.length === 0}
        >
          <PackagePlus className="mr-1.5 h-4 w-4" />
          Attach addon
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setApplyDiscountOpen(true)}
          disabled={!subscription || availableDiscounts.length === 0}
        >
          <Sparkles className="mr-1.5 h-4 w-4" />
          Apply discount
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAttachOpen(true)}
        >
          <Link2 className="mr-1.5 h-4 w-4" />
          Attach prospect invoice
        </Button>
        {canGrantFree && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGrantFreeOpen(true)}
            disabled={!subscription}
            className="text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
          >
            <Gift className="mr-1.5 h-4 w-4" />
            Grant free subscription
          </Button>
        )}
        {canGrantFree && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReconcile}
            disabled={isPending || !subscription}
            className="ml-auto text-muted-foreground hover:text-ink"
            title="Re-derive coverage from this business's paid invoices"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <ReceiptText className="mr-1.5 h-4 w-4" />
            )}
            Reconcile migrated payments
          </Button>
        )}
        {canGrantFree && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRepublish}
            disabled={isPending || !subscription}
            className="text-muted-foreground hover:text-ink"
            title="Republish SUBSCRIPTION_UPDATED events"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            Republish events
          </Button>
        )}
      </div>

      {/* Subscription summary */}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">Subscription</h3>
          <div className="flex items-center gap-2">
            {/* Surfaced next to the status because the two are read together: an exempt
                account is active by exemption, so its status and paid-through dates say
                nothing about whether it was actually paid for. */}
            {subscription?.billingExempt && (
              <Badge variant="outline" className="border-line bg-canvas text-ink-2">
                Billing exempt
              </Badge>
            )}
            {subscription && (
              <Badge
                variant="outline"
                className={SUBSCRIPTION_STATUS_BADGE[subscription.status].className}
              >
                {SUBSCRIPTION_STATUS_BADGE[subscription.status].label}
              </Badge>
            )}
          </div>
        </div>
        {!subscription ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              No subscription found for this business.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRepairSubscription}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="mr-1.5 h-4 w-4" />
              )}
              Repair subscription
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Info label="Subscription ID" value={subscription.id} mono />
            <Info
              label="Auto renew"
              value={subscription.autoRenew ? "Yes" : "No"}
            />
            <Info
              label="Free subscription"
              value={subscription.isFreeSubscription ? "Yes" : "No"}
            />
            <Info
              label="Billing exempt"
              value={
                subscription.billingExempt ? (
                  <span className="text-ink">Yes — internal account</span>
                ) : (
                  "No"
                )
              }
            />
            <Info
              label="Active discount"
              value={subscription.hasActiveDiscount ? "Yes" : "No"}
            />
            <Info
              label="Trial"
              value={
                subscription.trialEndDate
                  ? `${formatDate(subscription.trialStartDate)} → ${formatDate(subscription.trialEndDate)}`
                  : "—"
              }
            />
            {/* The real date is kept even when exempt — staff need the true record of what
                was last paid for, since un-marking the account resumes degradation from it.
                The suffix stops it being misread as a live expiry. */}
            <Info
              label="Paid through"
              value={
                <>
                  {formatDate(subscription.paidThrough)}
                  {subscription.billingExempt && (
                    <span className="text-muted-foreground"> — not enforced</span>
                  )}
                </>
              }
            />
            <Info
              label="Next billing"
              value={formatDate(subscription.nextBillingDate)}
            />
            <Info
              label="Cancelled at"
              value={formatDate(subscription.cancelledAt)}
            />
          </div>
        )}

        {subscription && manageableItems.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <h4 className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              Subscription items
            </h4>
            <p className="mb-2 text-[12px] text-muted-foreground">
              Includes lapsed units (expired/suspended) so their plan can be changed before the
              business pays to reactivate.
            </p>
            <ul className="space-y-1.5">
              {manageableItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-canvas/40 px-3 py-2 text-[13px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {entityNames[item.entityId] ?? `${item.entityType} · ${item.entityId}`}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {item.entityType} · {item.packageInfo?.name ?? "No package"}
                      {item.packageInfo?.basePrice != null
                        ? ` · ${formatMoney(item.packageInfo.basePrice)}`
                        : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-ink">{item.status}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {formatDate(item.addedAt)} → {itemEndDate(item)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Active discounts */}
      <div className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink">
          Active discounts
        </h3>
        {errors.activeDiscounts ? (
          <p className="text-sm text-destructive">{errors.activeDiscounts}</p>
        ) : activeDiscounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active discounts.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeDiscounts.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-canvas/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {d.discountName}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {d.discountType === "PERCENTAGE"
                      ? `${d.discountValue}% off`
                      : `${formatMoney(d.discountValue)} off`}
                    {d.isFreeSubscription ? " · free subscription" : ""}
                    {d.expiresAt ? ` · expires ${formatDate(d.expiresAt)}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(d)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invoices */}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Invoices</h3>
          {invoicePage && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {invoicePage.totalElements} total
            </p>
          )}
        </div>

        {errors.invoices ? (
          <p className="text-sm text-destructive">{errors.invoices}</p>
        ) : !invoicePage || invoicePage.content.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invoices on file for this business.
          </p>
        ) : (
          <DataTable
            columns={invoiceColumns}
            data={invoicePage.content}
            searchKey="invoiceNumber"
            hideSearch
            pageNo={invoicePage.number}
            total={invoicePage.totalElements}
            pageCount={Math.max(1, invoicePage.totalPages)}
            defaultPageSize={invoicePage.size ?? 20}
            disableArchive
          />
        )}
      </div>

      {/* Dialogs */}
      {subscription && (
        <GenerateInvoiceDialog
          businessId={businessId}
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          onCreated={refresh}
        />
      )}
      {subscription && (
        <GenerateItemInvoiceDialog
          businessId={businessId}
          items={manageableItems}
          entityNames={entityNames}
          canOverride={canOverrideBilling}
          open={generateItemsOpen}
          onOpenChange={setGenerateItemsOpen}
          onCreated={refresh}
        />
      )}
      {subscription && (
        <ApplyDiscountDialog
          businessId={businessId}
          discounts={availableDiscounts}
          open={applyDiscountOpen}
          onOpenChange={setApplyDiscountOpen}
          onApplied={refresh}
        />
      )}
      {subscription && canGrantFree && (
        <GrantFreeSubscriptionDialog
          businessId={businessId}
          open={grantFreeOpen}
          onOpenChange={setGrantFreeOpen}
          onGranted={refresh}
        />
      )}
      {subscription && (
        <UpgradePlanDialog
          businessId={businessId}
          items={manageableItems}
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          onUpgraded={refresh}
        />
      )}
      {subscription && (
        <AddAddonDialog
          businessId={businessId}
          items={subscription.items}
          open={addAddonOpen}
          onOpenChange={setAddAddonOpen}
          onAdded={refresh}
        />
      )}
      <AttachInvoiceDialog
        businessId={businessId}
        open={attachOpen}
        onOpenChange={setAttachOpen}
        onAttached={refresh}
      />
      {invoiceTarget && (
        <InvoiceActionsDialog
          businessId={businessId}
          invoice={invoiceTarget}
          entityNames={entityNames}
          actorNames={actorNames}
          isSystemAdmin={canOverrideBilling}
          open={!!invoiceTarget}
          onOpenChange={(open) => {
            if (!open) setInvoiceTarget(null);
          }}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          mono
            ? "break-all font-mono text-[12px] text-ink"
            : "break-words text-[13px] text-ink"
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
