"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, CalendarPlus, Loader2, PackagePlus } from "lucide-react";

import { cn } from "@/lib/utils";
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
import { extendEntityTrial } from "@/lib/actions/admin/billing";

import type { SubscriptionItemResponse, SubscriptionStatus } from "@/types/admin/billing";
import type { BusinessLocationBreakdownRow } from "@/types/admin/business-intel";

// ── Re-implement the SubscriptionStatusBadge inline so we don't import from a
//    non-public column module (columns.tsx is collocated with the table and
//    doesn't export this helper).
type StatusTone = "pos" | "blue" | "warn" | "neg" | "muted";

const STATUS_TONE: Record<StatusTone, string> = {
  pos: "bg-pos-tint text-pos",
  blue: "bg-[#2563EB]/10 text-[#2563EB]",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
  muted: "bg-black/[0.05] text-ink-3 dark:bg-white/[0.06]",
};

// SubscriptionItemStatus is a superset of SubscriptionStatus — map the
// item-level statuses that don't exist on SubscriptionStatus (REMOVED → muted).
const ITEM_STATUS_META: Record<
  SubscriptionItemResponse["status"],
  { label: string; tone: StatusTone }
> = {
  ACTIVE: { label: "Active", tone: "pos" },
  PAST_DUE: { label: "Past due", tone: "warn" },
  EXPIRED: { label: "Expired", tone: "neg" },
  SUSPENDED: { label: "Suspended", tone: "neg" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  REMOVED: { label: "Removed", tone: "muted" },
};

function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionItemResponse["status"] | null;
}) {
  const meta = status
    ? (ITEM_STATUS_META[status] ?? { label: status, tone: "muted" as StatusTone })
    : { label: "No subscription", tone: "muted" as StatusTone };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold",
        STATUS_TONE[meta.tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface EntityDetailViewProps {
  entityType: "LOCATION" | "WAREHOUSE" | "STORE";
  entityId: string;
  entityName: string;
  region: string | null;
  businessId: string;
  businessName: string | null;
  subscriptionId: string | null;
  item: SubscriptionItemResponse | null;
  ordersRow: BusinessLocationBreakdownRow | null;
  rangeLabel: string;
  canBilling: boolean;
}

// ── Currency helper (no dedicated export in format.ts) ───────────────────────

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// ── Component ────────────────────────────────────────────────────────────────

export function EntityDetailView({
  entityType,
  entityId,
  entityName,
  region,
  businessId,
  businessName,
  subscriptionId,
  item,
  ordersRow,
  rangeLabel,
  canBilling,
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
    if (!confirm(`Extend this ${entityLabel}'s trial?`)) return;
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

  const showActions = canBilling && !!subscriptionId && !!item;
  const canExtendTrial = item?.paidThrough == null && item?.status !== "CANCELLED";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Tabs defaultValue="subscription">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
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
                      <SubscriptionStatusBadge status={item.status} />
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
                      Extend trial
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
        <TabsContent value="orders" className="space-y-4">
          {entityType !== "LOCATION" ? (
            <SectionCard
              stub
              title="Orders"
              subtitle={rangeLabel}
            >
              <p className="text-sm text-muted-foreground">
                Per-{entityLabel} orders — pending a dedicated data endpoint.
              </p>
            </SectionCard>
          ) : ordersRow == null ? (
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

        {/* ── Tab 3: Stock & Products ───────────────────────────────────── */}
        <TabsContent value="stock" className="space-y-4">
          <SectionCard stub title="Stock &amp; Products">
            <p className="text-sm text-muted-foreground">
              Per-{entityLabel} stock &amp; products — pending a dedicated data endpoint.
            </p>
          </SectionCard>
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
