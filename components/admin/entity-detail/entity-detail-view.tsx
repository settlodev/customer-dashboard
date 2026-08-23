"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, CalendarPlus, Loader2, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import { AddAddonDialog } from "@/components/admin/billing/add-addon-dialog";
import { UpgradePlanDialog } from "@/components/admin/billing/upgrade-plan-dialog";
import { SectionCard } from "@/components/admin/shared/section-card";
import { DefList, DefRow } from "@/components/admin/shared/def-list";
import { MetricGrid, MetricCell } from "@/components/admin/shared/metric-cell";
import { PlanBadge, planTier } from "@/components/admin/shared/plan-badge";
import { formatDate, compactNumber } from "@/components/admin/shared/format";
import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";
import { extendEntityTrial } from "@/lib/actions/admin/billing";

import type { SubscriptionItemResponse } from "@/types/admin/billing";
import type {
  BusinessLocationBreakdownRow,
  BusinessOverviewSnapshot,
} from "@/types/admin/business-intel";
import type { EntityStockSummary } from "@/types/admin/inventory";

// ── Props ────────────────────────────────────────────────────────────────────

export interface EntityDetailViewProps {
  entityType: "LOCATION" | "WAREHOUSE" | "STORE";
  businessId: string;
  subscriptionId: string | null;
  /** The owning account bypasses billing (internal). Its per-item paidThrough is left at the
   *  true, usually past, value, so it must not be presented as a live expiry. */
  billingExempt?: boolean;
  item: SubscriptionItemResponse | null;
  ordersRow: BusinessLocationBreakdownRow | null;
  rangeLabel: string;
  canBilling: boolean;
  /** SYSTEM_ADMIN (billing's super admin) — may override-extend a paid/used entity's trial. */
  isSuperAdmin: boolean;
  stock: EntityStockSummary | null;
  /**
   * Location-grained trading, same three windows the business detail shows.
   * LOCATION only — stores and warehouses don't ring up sales of their own.
   * Null when the pull failed or the location has never traded.
   */
  overviewToday?: BusinessOverviewSnapshot | null;
  overview7d?: BusinessOverviewSnapshot | null;
  overview30d?: BusinessOverviewSnapshot | null;
  /** Owning business's base currency, for the money labels. */
  currency?: string;
}

// ── Currency helper (no dedicated export in format.ts) ───────────────────────

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** ClickHouse sends Decimal columns as strings; coerce, treating nullish as 0. */
function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function plural(count: number, singular: string, pluralWord?: string): string {
  const word = count === 1 ? singular : (pluralWord ?? `${singular}s`);
  return `${count.toLocaleString()} ${word}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function EntityDetailView({
  entityType,
  businessId,
  subscriptionId,
  billingExempt = false,
  item,
  ordersRow,
  rangeLabel,
  canBilling,
  isSuperAdmin,
  stock,
  overviewToday = null,
  overview7d = null,
  overview30d = null,
  currency = "TZS",
}: EntityDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);

  const entityLabel = entityType.toLowerCase();
  // A location that has never traded has an overview of all zeros rather than a
  // null body, so "has data" is a real question about the numbers — not just
  // whether the fetch returned. `ordersRow` keeps the older breakdown path
  // working if the overview pull is the one that failed.
  const hasTrading =
    num(overview30d?.total_orders) > 0 ||
    num(overviewToday?.total_orders) > 0 ||
    num(ordersRow?.total_orders) > 0;
  const isTrialActive =
    item?.status === "ACTIVE" &&
    !!item.trialEndDate &&
    new Date(item.trialEndDate).getTime() > Date.now();

  // ── Extend trial ─────────────────────────────────────────────────────────

  function handleExtendTrial() {
    if (!item || !subscriptionId) return;
    const overriding = item.paidThrough != null;
    const confirmMsg = overriding
      ? `Override: this ${entityLabel} has already paid or started using. Extend its trial anyway?`
      : `Extend this ${entityLabel}'s trial?`;
    if (!confirm(confirmMsg)) return;
    startTransition(async () => {
      const res = await extendEntityTrial(businessId, subscriptionId, item.id);
      if (res.responseType === "success") {
        const updatedItem = res.data?.items.find((i) => i.id === item.id);
        toast({
          title: "Trial extended",
          description: updatedItem?.trialEndDate
            ? `New end: ${formatDate(updatedItem.trialEndDate)}`
            : undefined,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't extend",
          description: res.message,
        });
      }
    });
  }

  // Bundled units inherit the parent's plan/addons — no independent billing actions.
  const showActions = canBilling && !!subscriptionId && !!item && !item.isBundled;
  // Normally only a never-paid, non-cancelled entity can be extended. A super admin
  // (SYSTEM_ADMIN) may override the paid/used block; billing remains authoritative and
  // still enforces the live-subscription + bundled/cancelled rules.
  const itemPaidOrUsed = item?.paidThrough != null;
  const canExtendTrial =
    item?.status !== "CANCELLED" && (!itemPaidOrUsed || isSuperAdmin);
  const isOverrideExtend = canExtendTrial && itemPaidOrUsed;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Tabs defaultValue="subscription">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          {entityType === "LOCATION" && <TabsTrigger value="orders">Orders</TabsTrigger>}
          <TabsTrigger value="stock">Stock &amp; Products</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Subscription ──────────────────────────────────────── */}
        <TabsContent value="subscription" className="space-y-4">
          {!item ? (
            <SectionCard title="Subscription">
              <p className="text-sm text-muted-foreground">
                No subscription for this {entityLabel}.
              </p>
            </SectionCard>
          ) : (
            <SectionCard title="Subscription">
              <DefList>
                <DefRow
                  label="Plan"
                  rawValue
                  value={
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[12.5px] text-ink">
                        {item.packageInfo?.name ?? "—"}
                      </span>
                      {item.packageInfo?.name && (
                        <PlanBadge
                          tier={planTier(item.packageInfo.name)}
                          label={item.packageInfo.name}
                        />
                      )}
                    </span>
                  }
                />
                <DefRow
                  label="Status"
                  rawValue
                  value={
                    <span className="flex items-center gap-2">
                      <SubscriptionItemStatusBadge status={item.status} />
                      {isTrialActive && (
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                          Trial active
                        </span>
                      )}
                    </span>
                  }
                />
                <DefRow
                  label="Trial end"
                  value={formatDate(item.trialEndDate)}
                />
                {/* Kept as the real date even when exempt — it is the true record of what
                    was last paid for, and un-marking the account resumes degradation from
                    it. The suffix stops it reading as a live expiry. */}
                <DefRow
                  label="Paid through"
                  value={`${formatDate(item.paidThrough)}${
                    billingExempt ? " — not enforced (internal)" : ""
                  }`}
                />
                <DefRow
                  label="Added"
                  value={formatDate(item.addedAt)}
                />
              </DefList>

              {showActions && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  {canExtendTrial && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={handleExtendTrial}
                      className="text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10"
                    >
                      {isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <CalendarPlus className="mr-1.5 h-4 w-4" />
                      )}
                      {isOverrideExtend ? "Override extend trial" : "Extend trial"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setUpgradeOpen(true)}
                  >
                    <ArrowUpCircle className="mr-1.5 h-4 w-4" />
                    Upgrade plan
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAddonOpen(true)}
                  >
                    <PackagePlus className="mr-1.5 h-4 w-4" />
                    Manage addons
                  </Button>
                </div>
              )}
            </SectionCard>
          )}
        </TabsContent>

        {/* ── Tab 2: Orders ─────────────────────────────────────────────── */}
        {entityType === "LOCATION" && (
          <TabsContent value="orders" className="space-y-4">
            {!hasTrading ? (
              <SectionCard title="Revenue &amp; orders" subtitle={rangeLabel}>
                <p className="text-sm text-muted-foreground">
                  No order data for this location in {rangeLabel}.
                </p>
              </SectionCard>
            ) : (
              <>
                {/*
                  Deliberately the same card the business detail shows, one grain
                  down: a location is what actually trades, so it gets the same
                  scorecard rather than a reduced one.
                */}
                <SectionCard
                  title="Revenue &amp; orders"
                  subtitle={`${rangeLabel} · ${currency}`}
                >
                  <MetricGrid cols={4}>
                    <MetricCell
                      label="Today net sales"
                      value={compactNumber(num(overviewToday?.net_sales))}
                      sub={plural(num(overviewToday?.total_orders), "order")}
                    />
                    <MetricCell
                      label="7-day net sales"
                      value={compactNumber(num(overview7d?.net_sales))}
                      sub={`AOV ${compactNumber(num(overview7d?.avg_order_value))}`}
                    />
                    <MetricCell
                      label="30-day net sales"
                      value={compactNumber(num(overview30d?.net_sales))}
                      sub={plural(num(overview30d?.total_orders), "order")}
                    />
                    <MetricCell
                      label="30-day gross profit"
                      value={compactNumber(num(overview30d?.gross_profit))}
                      sub={`cost ${compactNumber(num(overview30d?.total_cost))}`}
                    />
                  </MetricGrid>
                  <div className="mt-2.5">
                    <MetricGrid cols={4}>
                      <MetricCell
                        small
                        label="30-day customers"
                        value={formatMoney(num(overview30d?.unique_customers))}
                        sub={plural(num(overview30d?.active_staff), "active staff", "active staff")}
                      />
                      <MetricCell
                        small
                        label="Cancelled 30d"
                        value={formatMoney(num(overview30d?.cancelled_orders))}
                      />
                      <MetricCell
                        small
                        label="Refunded 30d"
                        value={formatMoney(num(overview30d?.total_refund_count))}
                        sub={`${compactNumber(num(overview30d?.total_refunded_amount))} refunded`}
                      />
                      <MetricCell
                        small
                        label="Tips 30d"
                        value={compactNumber(num(overview30d?.total_tips))}
                      />
                    </MetricGrid>
                  </div>
                </SectionCard>

                {/*
                  Money in and out at this location — the overview's closing-balance
                  components. The business detail sources these from Accounting,
                  which has no location cut yet; these come straight off the
                  location's own transaction/expense facts.
                */}
                <SectionCard
                  title="Money in &amp; out"
                  subtitle={`${rangeLabel} · ${currency}`}
                >
                  <MetricGrid cols={4}>
                    <MetricCell
                      label="Transactions taken"
                      value={compactNumber(num(overview30d?.transactions_amount))}
                      sub="incl. tips & prepayment top-ups"
                    />
                    <MetricCell
                      label="Expenses paid"
                      value={compactNumber(num(overview30d?.expenses_paid))}
                    />
                    <MetricCell
                      small
                      label="Complimentary"
                      value={compactNumber(num(overview30d?.complimentary_amount))}
                    />
                    <MetricCell
                      small
                      label="Signed bills"
                      value={compactNumber(num(overview30d?.signed_bill_amount))}
                    />
                  </MetricGrid>
                </SectionCard>
              </>
            )}
          </TabsContent>
        )}

        {/* ── Tab 3: Stock & Products ───────────────────────────────────── */}
        <TabsContent value="stock" className="space-y-4">
          {!stock ||
          (stock.productCount === 0 &&
            stock.variantCount === 0 &&
            stock.totalStockValue === 0) ? (
            <SectionCard title="Stock &amp; Products">
              <p className="text-sm text-muted-foreground">
                No stock recorded for this {entityLabel}.
              </p>
            </SectionCard>
          ) : (
            <>
              <SectionCard title="Stock &amp; Products">
                <MetricGrid cols={4}>
                  <MetricCell label="Products" value={formatMoney(stock.productCount)} />
                  <MetricCell label="Stock items" value={formatMoney(stock.variantCount)} />
                  <MetricCell label="Stock value" value={compactNumber(stock.totalStockValue)} />
                  <MetricCell label="Qty on hand" value={compactNumber(stock.totalQuantityOnHand)} />
                  <MetricCell label="Low stock" value={formatMoney(stock.lowStockCount)} small />
                  <MetricCell label="Out of stock" value={formatMoney(stock.outOfStockCount)} small />
                  <MetricCell label="Active batches" value={formatMoney(stock.activeBatchCount)} small />
                  <MetricCell
                    label="Last movement"
                    value={stock.lastMovementAt ? formatDate(stock.lastMovementAt) : "—"}
                    small
                  />
                </MetricGrid>
              </SectionCard>

              <SectionCard title="Top items by value">
                {stock.topItemsByValue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items in stock.</p>
                ) : (
                  <div className="flex flex-col">
                    {stock.topItemsByValue.map((row) => (
                      <div
                        key={row.variantId}
                        className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{row.name}</div>
                        <div className="flex-shrink-0 font-mono text-[11px] text-muted-foreground">
                          {compactNumber(row.quantityOnHand)} on hand
                        </div>
                        <div className="w-24 flex-shrink-0 text-right font-mono text-[12.5px] font-semibold text-ink">
                          {compactNumber(row.stockValue)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Low-stock items">
                {stock.lowStockItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No low-stock items.</p>
                ) : (
                  <div className="flex flex-col">
                    {stock.lowStockItems.map((row) => (
                      <div
                        key={row.variantId}
                        className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{row.name}</div>
                        <div className="flex-shrink-0 font-mono text-[11px] text-warn">
                          {compactNumber(row.available)} left
                        </div>
                        <div className="w-24 flex-shrink-0 text-right font-mono text-[12px] text-muted-foreground">
                          ≤ {compactNumber(row.lowStockThreshold)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      {showActions && (
        <>
          <UpgradePlanDialog
            businessId={businessId}
            items={item ? [item] : []}
            open={upgradeOpen}
            onOpenChange={setUpgradeOpen}
            onUpgraded={() => router.refresh()}
          />
          <AddAddonDialog
            businessId={businessId}
            items={item ? [item] : []}
            open={addonOpen}
            onOpenChange={setAddonOpen}
            onAdded={() => router.refresh()}
          />
        </>
      )}
    </div>
  );
}
