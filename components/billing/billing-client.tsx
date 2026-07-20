"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { OverviewTab } from "./overview-tab";
import { InvoicesTab } from "./invoices-tab";
import { CreditsTab } from "./credits-tab";
import { InvoiceViewDialog } from "./invoice-view-dialog";
import { PaymentOptionsDialog } from "./payment-options-dialog";
import {
  annualPrice,
  PayInvoiceDialog,
  type PayConfirmPayload,
  type PayLine,
} from "./pay-invoice-dialog";
import { ENTITY_TYPE_LABEL, getTermMonths } from "./shared";
import {
  adjustRenewalKeepItems,
  changeItemPlan,
  getPendingInvoice,
  prepaySubscription,
} from "@/lib/actions/billing-actions";
import type {
  Addon,
  BillingInvoice,
  CreditBalance,
  CreditPack,
  CreditTransaction,
  Package,
  Subscription,
} from "@/types/billing/types";

interface BillingClientProps {
  subscription: Subscription;
  packages: Package[];
  addons: Addon[];
  invoices: BillingInvoice[];
  totalInvoiceCount: number;
  businessId: string;
  creditBalances: CreditBalance[];
  creditPacks: CreditPack[];
  creditTransactions: CreditTransaction[];
  entityLabels?: Record<string, string>;
  contactDefaults?: { email: string; phone: string };
}

export function BillingClient({
  subscription,
  packages,
  addons,
  invoices,
  totalInvoiceCount,
  businessId,
  creditBalances,
  creditPacks,
  creditTransactions,
  entityLabels,
  contactDefaults,
}: BillingClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");

  // Settle/extend flow. `payMode` drives the design's single pay surface;
  // `payTarget` is the invoice handed on to the mobile-money step once the
  // amount and period are locked in.
  const [payMode, setPayMode] = useState<"pay" | "generate" | null>(null);
  const [payTarget, setPayTarget] = useState<BillingInvoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);

  const pendingInvoice = useMemo(
    () =>
      [...invoices]
        .filter((inv) => inv.status === "PENDING")
        .sort(
          (a, b) =>
            new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime(),
        )[0] ?? null,
    [invoices],
  );

  // One row per separately-billed entity. Bundled items ride on their
  // parent's price, so they'd double-count the total if listed here.
  const payLines: PayLine[] = useMemo(() => {
    const items = subscription.manageableItems ?? subscription.items;
    return items
      .filter(
        (item) =>
          !item.isBundled &&
          item.status !== "REMOVED" &&
          item.status !== "CANCELLED",
      )
      .map((item) => ({
        itemId: item.id,
        name:
          entityLabels?.[item.entityId] ??
          `${ENTITY_TYPE_LABEL[item.entityType]} ${item.entityId.slice(0, 8)}`,
        sublabel: `${ENTITY_TYPE_LABEL[item.entityType]} · v${item.packageVersion}`,
        currentPackageId: item.packageInfo?.id ?? null,
        currentAnnual: item.packageInfo ? annualPrice(item.packageInfo) : 0,
        entityType: item.entityType,
      }));
  }, [subscription, entityLabels]);

  const currency = pendingInvoice?.currency ?? subscription.currency ?? "TZS";
  const termMonths = getTermMonths(subscription.term);

  // The renewal-adjust endpoint finds its target by matching
  // `period == [billingCycleStart, billingCycleEnd]`, and throws when nothing matches.
  // A prepayment-generated invoice doesn't move the cycle, so its period won't line up —
  // only offer the per-entity keep-set when the open invoice IS the current cycle's renewal.
  const canAdjustKeepSet =
    !!pendingInvoice &&
    pendingInvoice.periodStart === subscription.billingCycleStart &&
    pendingInvoice.periodEnd === subscription.billingCycleEnd;

  const handleConfirm = useCallback(
    async (payload: PayConfirmPayload) => {
      const isGenerate = payMode === "generate";
      // A different period or a coupon means the invoice has to be re-issued;
      // package swaps re-issue it on the service side as a side effect.
      const reissues =
        payload.months !== termMonths ||
        !!payload.couponCode ||
        // Capacity is attached BY the prepayment call, so picking any forces that path —
        // the keep-set and pay-as-billed routes have nowhere to put it.
        (payload.stagedAddons?.length ?? 0) > 0;

      // Untouched invoice — settle exactly what was billed, no regeneration.
      // A keep-set counts as touched even on its own: dropping an entity changes
      // what gets billed without changing the period, package, or coupon.
      if (
        !isGenerate &&
        !reissues &&
        !payload.keepItemIds &&
        payload.planChanges.length === 0
      ) {
        if (!pendingInvoice) return;
        setPayMode(null);
        setPayTarget(pendingInvoice);
        return;
      }

      setSubmitting(true);
      try {
        // 1. Package swaps first. On an unpaid/expired item the service routes
        //    each one through reconcileOutstandingInvoice, which re-prices the
        //    outstanding invoice at the new tier — so these must land before we
        //    ask for a period re-issue, or the re-issue bills the old packages.
        //    Sequential on purpose: each call regenerates the invoice.
        for (const change of payload.planChanges) {
          try {
            await changeItemPlan(subscription.id, change.itemId, change.packageId);
          } catch (error) {
            const entity =
              payLines.find((l) => l.itemId === change.itemId)?.name ?? "this entity";
            toast({
              variant: "destructive",
              title: `Couldn't change the package for ${entity}`,
              description:
                (error as Error)?.message ??
                "The plan change was rejected. Try a different tier.",
            });
            return;
          }
        }

        // 2. Land on a payable invoice.
        let invoice: BillingInvoice | null;
        if (payload.keepItemIds) {
          // Billing a subset: re-issue the renewal for the kept entities only. The
          // dialog locks the period and coupon while a keep-set is in play, since
          // this endpoint always bills the subscription's own term and takes neither.
          invoice = await adjustRenewalKeepItems(subscription.id, payload.keepItemIds);
          if (!invoice) {
            toast({
              variant: "destructive",
              title: "Nothing left to bill",
              description:
                "That selection produced no payable invoice. Keep at least one entity.",
            });
            return;
          }
        } else if (isGenerate || reissues) {
          // A period change or coupon goes through the prepayment endpoint (which
          // supersedes the pending invoice); package-only changes already produced
          // a fresh re-priced one.
          try {
            invoice = await prepaySubscription(
              subscription.id,
              payload.months,
              payload.couponCode,
              payload.stagedAddons,
            );
          } catch (prepayError) {
            const err = prepayError as { status?: number; message?: string };
            const isConflict =
              err.status === 409 ||
              (err.message ?? "").toLowerCase().includes("invoice already exists");
            if (!isConflict) throw prepayError;

            invoice = await getPendingInvoice(subscription.id);
            if (!invoice) throw prepayError;
            toast({
              title: "Opening existing invoice",
              description:
                "An invoice for this period is already pending — continuing with that one.",
            });
          }
        } else {
          invoice = await getPendingInvoice(subscription.id);
        }

        if (!invoice) {
          toast({
            variant: "destructive",
            title: "No invoice to pay",
            description:
              "The re-priced invoice hasn't landed yet. Reload the page and try again.",
          });
          return;
        }

        setPayMode(null);
        setPayTarget(invoice);
        // Packages and/or the open invoice changed — refresh the page data
        // behind the payment dialog so the entities table and KPIs catch up.
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Could not generate invoice",
          description: (error as Error)?.message ?? "Please try again.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [payMode, pendingInvoice, payLines, subscription.id, termMonths, toast, router],
  );

  return (
    <>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="inline-flex h-auto max-w-full items-center justify-start gap-0.5 overflow-x-auto rounded-[10px] border border-line-2 bg-card p-[3px]">
          <BillingTabTrigger value="overview" label="Overview" />
          <BillingTabTrigger
            value="invoices"
            label="Invoices"
            count={totalInvoiceCount}
          />
          <BillingTabTrigger value="credits" label="Credits" />
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            subscription={subscription}
            packages={packages}
            addons={addons}
            entityLabels={entityLabels}
            pendingInvoice={pendingInvoice}
            onPay={() => setPayMode("pay")}
            onViewInvoice={() =>
              pendingInvoice && setViewInvoiceId(pendingInvoice.id)
            }
            onGenerate={() => setPayMode("generate")}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          {/*
           * Invoices are consolidated at the business level (one invoice per
           * business, with a line per entity). The "Bill to" party is therefore
           * the business itself, not whichever entity happens to be first in the
           * items list. We pass only businessId here so getInvoiceBillingParties
           * resolves the business record and leaves locationId undefined.
           */}
          <InvoicesTab
            invoices={invoices}
            businessId={businessId}
            contactDefaults={contactDefaults}
          />
        </TabsContent>

        <TabsContent value="credits" className="mt-6">
          <CreditsTab
            businessId={businessId}
            balances={creditBalances}
            packs={creditPacks}
            recentTransactions={creditTransactions}
          />
        </TabsContent>
      </Tabs>

      <PayInvoiceDialog
        open={payMode !== null}
        onOpenChange={(open) => !open && setPayMode(null)}
        mode={payMode === "generate" ? "generate" : "pay"}
        currency={currency}
        subscriptionId={subscription.id}
        termMonths={termMonths}
        invoice={
          pendingInvoice
            ? {
                invoiceNumber: pendingInvoice.invoiceNumber,
                invoiceDate: pendingInvoice.invoiceDate,
                lineCount: pendingInvoice.lineItems.length,
                total: pendingInvoice.totalAmount,
              }
            : null
        }
        lines={payLines}
        packages={packages}
        canAdjustKeepSet={canAdjustKeepSet}
        submitting={submitting}
        onConfirm={handleConfirm}
      />

      {payTarget && (
        <PaymentOptionsDialog
          open
          onOpenChange={(open) => !open && setPayTarget(null)}
          invoice={{
            id: payTarget.id,
            invoiceNumber: payTarget.invoiceNumber,
            amount: payTarget.totalAmount,
            currency: payTarget.currency,
          }}
          businessId={businessId}
          defaultEmail={contactDefaults?.email}
          defaultPhone={contactDefaults?.phone}
          onPaid={() => {
            setPayTarget(null);
            router.refresh();
          }}
        />
      )}

      <InvoiceViewDialog
        open={viewInvoiceId !== null}
        onOpenChange={(open) => !open && setViewInvoiceId(null)}
        invoiceId={viewInvoiceId}
        businessId={businessId}
        defaultEmail={contactDefaults?.email}
        defaultPhone={contactDefaults?.phone}
        onPaid={() => {
          setViewInvoiceId(null);
          router.refresh();
        }}
        onCancelled={() => {
          setViewInvoiceId(null);
          router.refresh();
        }}
      />
    </>
  );
}

/**
 * Segmented pill tab — same vocabulary as the dashboard's date-range
 * control (`components/filters/date-range-segmented.tsx`): hairline card
 * container, 28px segments, primary fill on the active one.
 */
function BillingTabTrigger({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count?: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-7 gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[12.5px] font-semibold text-ink-3 transition-colors hover:text-ink data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
    >
      {label}
      {count != null && count > 0 && (
        <span className="rounded-[5px] bg-canvas px-1.5 py-px font-mono text-[10.5px] font-semibold tabular-nums text-muted-foreground [[data-state=active]_&]:bg-primary-foreground/20 [[data-state=active]_&]:text-primary-foreground">
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}
