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
import type { BusinessLocationBreakdownRow } from "@/types/admin/business-intel";
import type { EntityStockSummary } from "@/types/admin/inventory";

// ── Props ────────────────────────────────────────────────────────────────────

export interface EntityDetailViewProps {
  entityType: "LOCATION" | "WAREHOUSE" | "STORE";
  businessId: string;
  subscriptionId: string | null;
  item: SubscriptionItemResponse | null;
  ordersRow: BusinessLocationBreakdownRow | null;
  rangeLabel: string;
  canBilling: boolean;
  /** SYSTEM_ADMIN (billing's super admin) — may override-extend a paid/used entity's trial. */
  isSuperAdmin: boolean;
  stock: EntityStockSummary | null;
}

// ── Currency helper (no dedicated export in format.ts) ───────────────────────

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// ── Component ────────────────────────────────────────────────────────────────

export function EntityDetailView({
  entityType,
  businessId,
  subscriptionId,
  item,
  ordersRow,
  rangeLabel,
  canBilling,
  isSuperAdmin,
  stock,
}: EntityDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);

  const entityLabel = entityType.toLowerCase();
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
                <DefRow
                  label="Paid through"
                  value={formatDate(item.paidThrough)}
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
            {ordersRow == null ? (
              <SectionCard title="Orders" subtitle={rangeLabel}>
                <p className="text-sm text-muted-foreground">
                  No order data for this location in {rangeLabel}.
                </p>
              </SectionCard>
            ) : (
              <SectionCard title="Orders" subtitle={rangeLabel}>
                <MetricGrid cols={4}>
                  <MetricCell
                    label="Total orders"
                    value={formatMoney(ordersRow.total_orders ?? 0)}
                  />
                  <MetricCell
                    label="Completed"
                    value={formatMoney(ordersRow.completed_orders ?? 0)}
                  />
                  <MetricCell
                    label="Net sales"
                    value={compactNumber(ordersRow.net_sales ?? 0)}
                  />
                  <MetricCell
                    label="Gross profit"
                    value={compactNumber(ordersRow.gross_profit ?? 0)}
                  />
                  <MetricCell
                    label="Avg order value"
                    value={formatMoney(ordersRow.avg_order_value ?? 0)}
                  />
                  <MetricCell
                    label="Active staff"
                    value={formatMoney(ordersRow.active_staff ?? 0)}
                    small
                  />
                  <MetricCell
                    label="Unique customers"
                    value={formatMoney(ordersRow.unique_customers ?? 0)}
                    small
                  />
                </MetricGrid>
              </SectionCard>
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
