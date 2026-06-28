"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpCircle,
  Gift,
  Link2,
  Loader2,
  PackagePlus,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { useToast } from "@/hooks/use-toast";

import { AddAddonDialog } from "@/components/admin/billing/add-addon-dialog";
import { ApplyDiscountDialog } from "@/components/admin/billing/apply-discount-dialog";
import { AttachInvoiceDialog } from "@/components/admin/billing/attach-invoice-dialog";
import { GenerateInvoiceDialog } from "@/components/admin/billing/generate-invoice-dialog";
import { GrantFreeSubscriptionDialog } from "@/components/admin/billing/grant-free-subscription-dialog";
import { InvoiceActionsDialog } from "@/components/admin/billing/invoice-actions-dialog";
import { buildInvoiceColumns } from "@/components/tables/admin-invoices/column";
import { UpgradePlanDialog } from "@/components/admin/billing/upgrade-plan-dialog";
import { republishSubscriptions, revokeDiscount } from "@/lib/actions/admin/billing";
import {
  DiscountResponse,
  InvoicePage,
  InvoiceResponse,
  SubscriptionDiscountResponse,
  SubscriptionResponse,
  SubscriptionStatus,
} from "@/types/admin/billing";

interface BillingViewProps {
  businessId: string;
  subscription: SubscriptionResponse | null;
  invoicePage: InvoicePage | null;
  activeDiscounts: SubscriptionDiscountResponse[];
  availableDiscounts: DiscountResponse[];
  canGrantFree: boolean;
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

export function BillingView({
  businessId,
  subscription,
  invoicePage,
  activeDiscounts,
  availableDiscounts,
  canGrantFree,
  errors,
}: BillingViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [generateOpen, setGenerateOpen] = useState(false);
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
            onClick={handleRepublish}
            disabled={isPending || !subscription}
            className="ml-auto text-muted-foreground hover:text-ink"
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
          {subscription && (
            <Badge
              variant="outline"
              className={SUBSCRIPTION_STATUS_BADGE[subscription.status].className}
            >
              {SUBSCRIPTION_STATUS_BADGE[subscription.status].label}
            </Badge>
          )}
        </div>
        {!subscription ? (
          <p className="text-sm text-muted-foreground">
            No subscription found for this business.
          </p>
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
            <Info
              label="Paid through"
              value={formatDate(subscription.paidThrough)}
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
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="font-medium text-ink">
                    {item.packageInfo?.name ?? item.entityType}
                  </span>
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {item.entityType} · {item.status}
                    {item.packageInfo?.basePrice != null
                      ? ` · ${formatMoney(item.packageInfo.basePrice)}`
                      : ""}
                  </span>
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
