"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDivisibleQuantity } from "@/lib/format-divisible-quantity";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Boxes,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Package,
  BarChart3,
  Activity,
  Layers,
  ShieldCheck,
  Truck,
  RefreshCw,
  History,
  LineChart as LineChartIcon,
} from "lucide-react";
import type { Stock } from "@/types/stock/type";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type {
  PageResponse,
  StockMovement,
  StockMovementSummary,
} from "@/types/stock-movement/type";
import type {
  StockoutForecastItem,
  StockTurnoverItem,
  AbcAnalysisItem,
  ReorderSuggestion,
} from "@/types/inventory-analytics/type";
import {
  RISK_LEVEL_CONFIG,
  ABC_CONFIG,
} from "@/types/inventory-analytics/type";
import type { BatchPage, StockBatch } from "@/types/stock-batch/type";
import { Money } from "@/components/widgets/money";
import {
  ReorderConfigDialog,
  ReorderConfigSummary,
} from "@/components/widgets/inventory/reorder-config-dialog";
import { BarcodeManager } from "@/components/widgets/barcode-manager";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { AuditLogEntry } from "@/types/audit-log/type";
import type { RsMovementSummary } from "@/types/reports-analytics/type";
import {
  MovementMixChart,
  MovementTypeBreakdownChart,
  QtyOnHandChart,
  StockValueChart,
} from "@/components/widgets/inventory/stock-item-charts";
import {
  MovementLedger,
  type LedgerRange,
} from "@/components/widgets/inventory/movement-ledger";
import { BatchPanel } from "@/components/widgets/inventory/batch-panel";
import { VariantTabs } from "@/components/widgets/inventory/variant-tabs";
import { StockActivityTimeline } from "@/components/widgets/inventory/stock-activity-timeline";

interface Props {
  stock: Stock;
  balanceMap: Record<string, InventoryBalance>;
  batchMap: Record<string, StockBatch[]>;
  /** Server-rendered first page of batches for the first active variant. */
  initialBatchPage: BatchPage | null;
  /** ACTIVE batches for that variant, in consumption order. */
  initialConsumptionOrder: StockBatch[];
  variantSummaryMap: Record<string, StockMovementSummary>;
  /**
   * Server-rendered first page of the movement ledger, for the first active
   * variant over {@link initialLedgerRange}. The ledger pages and filters
   * itself from there.
   */
  initialLedgerPage: PageResponse<StockMovement> | null;
  /** Range the server-rendered ledger page was fetched for. */
  initialLedgerRange: LedgerRange;
  /** Actor id → display name, keyed by both staff id and auth id. */
  staffNames: Record<string, string>;
  forecasts: StockoutForecastItem[];
  turnover: StockTurnoverItem[];
  abc: AbcAnalysisItem[];
  reorder: ReorderSuggestion[];
  movementSummary: StockMovementSummary;
  totalQty: number;
  totalValue: number;
  totalReserved: number;
  totalInTransit: number;
  totalAvailable: number;
  worstRisk: StockoutForecastItem | null;
  avgTurnover: number;
  /** Location base currency — labels all cost/value displays inside this view. */
  currency: string;
  /** Current location id — required by per-variant reorder config writes. */
  locationId: string | null;
  /** Drives the in-dialog warning banner when auto-reorder is off. */
  autoReorderEnabled: boolean;
  /** Per-variant daily snapshots (last ~90 days). */
  variantSnapshotMap: Record<string, InventorySnapshot[]>;
  /** Snapshots rolled up to the stock level — feeds the default charts tab. */
  stockSnapshots: InventorySnapshot[];
  /** Audit trail for this stock (entity-scoped). */
  auditEntries: AuditLogEntry[];
  /**
   * Newest movements merged across every variant — the raw material for the
   * Activity rail. The Movements tab owns the full paged ledger.
   */
  activityMovements: StockMovement[];
  /** True when {@link activityMovements} is only a slice of a longer ledger. */
  activityMovementsTruncated: boolean;
  /** Aggregated Reports Service movement summary across all variants. */
  rsSummary: RsMovementSummary | null;
}

const TABS = [
  { key: "overview", label: "Overview", icon: Package },
  { key: "batches", label: "Batches", icon: Layers },
  { key: "movements", label: "Movements", icon: Activity },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "activity", label: "Activity", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function StockDetailView({
  stock,
  balanceMap,
  batchMap,
  initialBatchPage,
  initialConsumptionOrder,
  variantSummaryMap,
  initialLedgerPage,
  initialLedgerRange,
  staffNames,
  forecasts,
  turnover,
  abc,
  reorder,
  movementSummary,
  totalQty,
  totalValue,
  totalReserved,
  totalInTransit,
  totalAvailable,
  worstRisk,
  avgTurnover,
  currency,
  locationId,
  autoReorderEnabled,
  variantSnapshotMap,
  stockSnapshots,
  auditEntries,
  activityMovements,
  activityMovementsTruncated,
  rsSummary,
}: Props) {
  const [tab, setTab] = useState<TabKey>("overview");

  const riskCfg = worstRisk
    ? RISK_LEVEL_CONFIG[worstRisk.riskLevel]
    : RISK_LEVEL_CONFIG.NO_CONSUMPTION;

  // Per-variant batch counts label the batch tab and its variant pills; the
  // panel itself pages its rows straight from the server.
  const batchCountByVariant: Record<string, number> = {};
  for (const [variantId, batches] of Object.entries(batchMap)) {
    batchCountByVariant[variantId] = batches.length;
  }
  const totalBatches = Object.values(batchCountByVariant).reduce(
    (s, n) => s + n,
    0,
  );

  return (
    <div className="space-y-6">
      {/* ── Summary KPIs ──────────────────────────────────────── */}
      <KpiStrip cols={6}>
        <KpiCard
          icon={<Boxes className="h-3 w-3" />}
          label="Qty on hand"
          value={formatDivisibleQuantity(totalQty, {
            baseUnitName: stock.baseUnitName,
            divisibleUnitRatio: stock.divisibleUnitRatio,
            divisibleUnitName: stock.divisibleUnitName,
          })}
          unit={stock.baseUnitName}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Total value"
          value={totalValue.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
        />
        <KpiCard
          icon={<ShieldCheck className="h-3 w-3" />}
          label="Available"
          value={totalAvailable.toLocaleString()}
          delta={
            totalReserved > 0
              ? `${totalReserved.toLocaleString()} reserved`
              : undefined
          }
          deltaTone={totalReserved > 0 ? "neg" : "neutral"}
        />
        <KpiCard
          icon={<Truck className="h-3 w-3" />}
          label="In transit"
          value={
            totalInTransit > 0 ? totalInTransit.toLocaleString() : "\u2014"
          }
          delta={
            totalInTransit > 0
              ? `Expected ${(totalQty + totalInTransit).toLocaleString()}`
              : undefined
          }
          deltaTone="neutral"
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Turnover (30d)"
          value={avgTurnover > 0 ? avgTurnover.toFixed(1) : "\u2014"}
          unit={avgTurnover > 0 ? "\u00d7" : undefined}
          delta={
            avgTurnover >= 3
              ? "Fast moving"
              : avgTurnover >= 1
                ? "Normal"
                : avgTurnover > 0
                  ? "Slow moving"
                  : undefined
          }
          deltaTone={
            avgTurnover >= 3
              ? "pos"
              : avgTurnover >= 1
                ? "neutral"
                : avgTurnover > 0
                  ? "neg"
                  : "neutral"
          }
        />
        <KpiCard
          icon={<AlertTriangle className="h-3 w-3" />}
          label="Stockout risk"
          value={
            worstRisk
              ? worstRisk.daysUntilStockout >= 0
                ? worstRisk.daysUntilStockout
                : riskCfg.label
              : "\u2014"
          }
          unit={
            worstRisk && worstRisk.daysUntilStockout >= 0 ? "days" : undefined
          }
          delta={worstRisk ? riskCfg.label : undefined}
          deltaTone={
            worstRisk
              ? worstRisk.riskLevel === "CRITICAL" ||
                worstRisk.riskLevel === "HIGH"
                ? "neg"
                : worstRisk.riskLevel === "MEDIUM"
                  ? "neutral"
                  : "pos"
              : "neutral"
          }
        />
      </KpiStrip>

      {/* ── Tabs ──────────────────────────────────────────────────
          Design vocabulary: segmented underline tabs sitting on the
          surface tone of a card shell. Lifts straight from the
          prototype's `.form-tabs`. */}
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            let badge: string | null = null;
            if (t.key === "batches" && totalBatches > 0)
              badge = String(totalBatches);
            if (t.key === "movements" && movementSummary.totalMovements > 0)
              badge = String(movementSummary.totalMovements);
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-primary text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink-2"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {t.label}
                {badge && (
                  <span
                    className={`rounded-[3px] px-1.5 font-mono text-[9.5px] tracking-[0.02em] ${
                      isActive
                        ? "border border-line bg-card text-ink-3"
                        : "bg-canvas text-muted-foreground"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      {tab === "overview" && (
        <OverviewTab
          stock={stock}
          balanceMap={balanceMap}
          currency={currency}
          locationId={locationId}
          autoReorderEnabled={autoReorderEnabled}
        />
      )}
      {tab === "batches" && (
        <BatchesTab
          stock={stock}
          currency={currency}
          batchCountByVariant={batchCountByVariant}
          initialBatchPage={initialBatchPage}
          initialConsumptionOrder={initialConsumptionOrder}
        />
      )}
      {tab === "movements" && (
        <MovementsTab
          stock={stock}
          variantSummaryMap={variantSummaryMap}
          currency={currency}
          locationId={locationId}
          initialLedgerPage={initialLedgerPage}
          initialLedgerRange={initialLedgerRange}
          staffNames={staffNames}
        />
      )}
      {tab === "analytics" && (
        <AnalyticsTab
          stock={stock}
          balanceMap={balanceMap}
          forecasts={forecasts}
          turnover={turnover}
          abc={abc}
          reorder={reorder}
          stockSnapshots={stockSnapshots}
          variantSnapshotMap={variantSnapshotMap}
          rsSummary={rsSummary}
          currency={currency}
        />
      )}
      {tab === "activity" && (
        <StockActivityTimeline
          stock={stock}
          movements={activityMovements}
          movementsTruncated={activityMovementsTruncated}
          batches={Object.values(batchMap).flat()}
          auditEntries={auditEntries}
          snapshots={stockSnapshots}
          staffNames={staffNames}
          currency={currency}
          onOpenLedger={() => setTab("movements")}
        />
      )}
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────────

function OverviewTab({
  stock,
  balanceMap,
  currency,
  locationId,
  autoReorderEnabled,
}: {
  stock: Stock;
  balanceMap: Record<string, InventoryBalance>;
  currency: string;
  locationId: string | null;
  autoReorderEnabled: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-gray-400" />
          Variants
        </h2>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">In Transit</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Reorder</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.variants.map((v) => {
                const bal = balanceMap[v.id];
                const qty = bal?.quantityOnHand ?? 0;
                const cost = bal?.averageCost ?? 0;
                const value = qty * cost;

                return (
                  <TableRow
                    key={v.id}
                    className={v.archived ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium">{v.displayName}</span>
                        {v.isDefault && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-medium">
                            Default
                          </span>
                        )}
                        {v.serialTracked && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 font-medium">
                            Serial
                          </span>
                        )}
                        {v.sku && (
                          <span className="block text-xs text-muted-foreground">
                            SKU: {v.sku}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{v.unitAbbreviation}</span>
                    </TableCell>
                    <TableCell>
                      <BarcodeManager
                        variantId={v.id}
                        variantName={v.displayName}
                        barcode={v.barcode}
                        sku={v.sku}
                        disabled={v.archived}
                      />
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        bal?.outOfStock
                          ? "text-red-600 dark:text-red-400"
                          : bal?.lowStock
                            ? "text-amber-600 dark:text-amber-400"
                            : ""
                      }`}
                    >
                      {formatDivisibleQuantity(qty, {
                        baseUnitName: stock.baseUnitName,
                        divisibleUnitRatio: v.divisibleUnitRatio,
                        divisibleUnitName: v.divisibleUnitName,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {(bal?.availableQuantity ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(bal?.reservedQuantity ?? 0) > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {bal!.reservedQuantity.toLocaleString()}
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(bal?.inTransitQuantity ?? 0) > 0 ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {bal!.inTransitQuantity.toLocaleString()}
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {value > 0 ? (
                        <Money amount={value} currency={currency} />
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ReorderConfigSummary
                          balance={bal}
                          unitAbbreviation={v.unitAbbreviation}
                        />
                        {locationId && !v.archived && (
                          <ReorderConfigDialog
                            locationId={locationId}
                            variantId={v.id}
                            variantName={v.displayName}
                            unitAbbreviation={v.unitAbbreviation}
                            balance={bal ?? null}
                            autoReorderEnabled={autoReorderEnabled}
                            compact
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          v.archived
                            ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        }`}
                      >
                        {v.archived ? "Archived" : "Active"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Batches tab ────────────────────────────────────────────────────

function BatchesTab({
  stock,
  currency,
  batchCountByVariant,
  initialBatchPage,
  initialConsumptionOrder,
}: {
  stock: Stock;
  currency: string;
  batchCountByVariant: Record<string, number>;
  initialBatchPage: BatchPage | null;
  initialConsumptionOrder: StockBatch[];
}) {
  const activeVariants = stock.variants.filter((v) => !v.archived);
  const [activeVariantId, setActiveVariantId] = useState<string>(
    activeVariants[0]?.id ?? "",
  );
  const activeVariant =
    activeVariants.find((v) => v.id === activeVariantId) ?? activeVariants[0];

  if (!activeVariant || !initialBatchPage) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No batches for this stock item. Batches are created when stock is
            received via GRN.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <VariantTabs
        ariaLabel="Variant batches"
        activeId={activeVariant.id}
        onChange={setActiveVariantId}
        options={activeVariants.map((v) => ({
          id: v.id,
          label: v.displayName ?? v.name,
          count: batchCountByVariant[v.id],
        }))}
      />
      <BatchPanel
        variantId={activeVariant.id}
        variantLabel={activeVariant.displayName ?? activeVariant.name}
        initialPage={initialBatchPage}
        initialConsumptionOrder={initialConsumptionOrder}
        stock={stock}
        currency={currency}
      />
    </div>
  );
}

// ── Movements tab ───────────────────────────────────────────────────

function MovementsTab({
  stock,
  variantSummaryMap,
  currency,
  locationId,
  initialLedgerPage,
  initialLedgerRange,
  staffNames,
}: {
  stock: Stock;
  variantSummaryMap: Record<string, StockMovementSummary>;
  currency: string;
  locationId: string | null;
  initialLedgerPage: PageResponse<StockMovement> | null;
  initialLedgerRange: LedgerRange;
  staffNames: Record<string, string>;
}) {
  const activeVariants = stock.variants.filter((v) => !v.archived);
  const [activeVariantId, setActiveVariantId] = useState<string>(
    activeVariants[0]?.id ?? "",
  );
  const activeVariant =
    activeVariants.find((v) => v.id === activeVariantId) ?? activeVariants[0];
  const variantLabel =
    activeVariant?.displayName ?? activeVariant?.name ?? "variant";

  if (!activeVariant || !locationId || !initialLedgerPage) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No movement ledger available for this stock item.
          </p>
        </CardContent>
      </Card>
    );
  }

  // The ledger owns its own filters, paging and totals. Only the variant
  // selector lives out here — one variant's ledger at a time, so Coca-Cola
  // 300ml entries never interleave with Coca-Cola 500ml.
  return (
    <div className="space-y-4">
      <VariantTabs
        ariaLabel="Variant movements"
        activeId={activeVariant.id}
        onChange={setActiveVariantId}
        options={activeVariants.map((v) => ({
          id: v.id,
          label: v.displayName ?? v.name,
          count: variantSummaryMap[v.id]?.totalMovements,
        }))}
      />

      <MovementLedger
        locationId={locationId}
        variantId={activeVariant.id}
        variantLabel={variantLabel}
        initialPage={initialLedgerPage}
        initialSummary={variantSummaryMap[activeVariant.id] ?? null}
        initialRange={initialLedgerRange}
        currency={currency}
        staffNames={staffNames}
      />
    </div>
  );
}

// ── Analytics tab ───────────────────────────────────────────────────
//
// Charts and analytics used to be two tabs, which split one question ("how is
// this item behaving?") across two places: the shape of the movement was in
// one, the verdict drawn from it in the other. They're now a single section
// under one variant scope — pick a variant and the headline, the charts and
// the tables all narrow together.

function AnalyticsTab({
  stock,
  balanceMap,
  forecasts,
  turnover,
  abc,
  reorder,
  stockSnapshots,
  variantSnapshotMap,
  rsSummary,
  currency,
}: {
  stock: Stock;
  balanceMap: Record<string, InventoryBalance>;
  forecasts: StockoutForecastItem[];
  turnover: StockTurnoverItem[];
  abc: AbcAnalysisItem[];
  reorder: ReorderSuggestion[];
  stockSnapshots: InventorySnapshot[];
  variantSnapshotMap: Record<string, InventorySnapshot[]>;
  rsSummary: RsMovementSummary | null;
  currency: string;
}) {
  const activeVariants = stock.variants.filter((v) => !v.archived);
  const [scope, setScope] = useState<string>("__all__");
  const scopedIds =
    scope === "__all__"
      ? new Set(stock.variants.map((v) => v.id))
      : new Set([scope]);

  const scopedForecasts = forecasts.filter((f) =>
    scopedIds.has(f.stockVariantId),
  );
  const scopedTurnover = turnover.filter((t) =>
    scopedIds.has(t.stockVariantId),
  );
  const scopedAbc = abc.filter((a) => scopedIds.has(a.stockVariantId));
  const scopedReorder = reorder.filter((r) => scopedIds.has(r.stockVariantId));
  const snapshots =
    scope === "__all__" ? stockSnapshots : (variantSnapshotMap[scope] ?? []);

  const hasData =
    scopedForecasts.length > 0 ||
    scopedTurnover.length > 0 ||
    scopedAbc.length > 0 ||
    scopedReorder.length > 0;

  // Days on the chart that were never closed and had to be computed from the
  // live balance. Quantities hold; their valuation uses today's average cost.
  const derivedDays = snapshots.filter((s) => s.derived).length;

  const scopedQty = [...scopedIds].reduce(
    (sum, id) => sum + (balanceMap[id]?.quantityOnHand ?? 0),
    0,
  );

  // Headline verdicts. Each collapses the scoped rows to the single number a
  // stock controller would act on.
  const worstForecast = scopedForecasts.reduce<StockoutForecastItem | null>(
    (worst, f) => {
      if (!worst) return f;
      const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NO_CONSUMPTION"];
      return order.indexOf(f.riskLevel) < order.indexOf(worst.riskLevel)
        ? f
        : worst;
    },
    null,
  );
  const riskCfg = worstForecast
    ? RISK_LEVEL_CONFIG[worstForecast.riskLevel]
    : null;
  const avgTurnoverRatio =
    scopedTurnover.length > 0
      ? scopedTurnover.reduce((s, t) => s + t.turnoverRatio, 0) /
        scopedTurnover.length
      : 0;
  const topAbc = scopedAbc.reduce<AbcAnalysisItem | null>(
    (best, a) =>
      !best || a.annualConsumptionValue > best.annualConsumptionValue
        ? a
        : best,
    null,
  );
  const dailyUse = scopedForecasts.reduce(
    (s, f) => s + (f.avgDailyConsumption ?? 0),
    0,
  );
  const toOrder = scopedReorder.filter(
    (r) => r.currentAvailableQuantity <= r.reorderPoint,
  );
  const orderQty = toOrder.reduce((s, r) => s + r.suggestedOrderQuantity, 0);

  return (
    <div className="space-y-6">
      {/* ── Scope — one picker for the whole section ─────────────── */}
      {activeVariants.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Scope
          </span>
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setScope("__all__")}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                scope === "__all__"
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All variants
            </button>
            {activeVariants.map((v) => (
              <button
                key={v.id}
                onClick={() => setScope(v.id)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  scope === v.id
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Verdicts — what the series below adds up to ──────────── */}
      <KpiStrip cols={4}>
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Turnover (30d)"
          value={avgTurnoverRatio > 0 ? avgTurnoverRatio.toFixed(1) : "—"}
          unit={avgTurnoverRatio > 0 ? "×" : undefined}
          delta={
            avgTurnoverRatio >= 3
              ? "Fast moving"
              : avgTurnoverRatio >= 1
                ? "Normal"
                : avgTurnoverRatio > 0
                  ? "Slow moving"
                  : "No movement in window"
          }
          deltaTone={
            avgTurnoverRatio >= 3
              ? "pos"
              : avgTurnoverRatio >= 1
                ? "neutral"
                : "neg"
          }
        />
        <KpiCard
          icon={<AlertTriangle className="h-3 w-3" />}
          label="Days of cover"
          value={
            worstForecast && worstForecast.daysUntilStockout >= 0
              ? worstForecast.daysUntilStockout
              : "—"
          }
          unit={
            worstForecast && worstForecast.daysUntilStockout >= 0
              ? "days"
              : undefined
          }
          delta={riskCfg ? riskCfg.label : "No consumption recorded"}
          deltaTone={
            worstForecast
              ? worstForecast.riskLevel === "CRITICAL" ||
                worstForecast.riskLevel === "HIGH"
                ? "neg"
                : worstForecast.riskLevel === "MEDIUM"
                  ? "neutral"
                  : "pos"
              : "neutral"
          }
        />
        <KpiCard
          icon={<Boxes className="h-3 w-3" />}
          label="Daily usage"
          value={
            dailyUse > 0
              ? dailyUse.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })
              : "—"
          }
          unit={dailyUse > 0 ? stock.baseUnitAbbreviation : undefined}
          delta={
            dailyUse > 0
              ? `${scopedQty.toLocaleString()} on hand`
              : "Not consumed in the last 30 days"
          }
          deltaTone="neutral"
        />
        <KpiCard
          icon={<RefreshCw className="h-3 w-3" />}
          label="Reorder"
          value={
            toOrder.length > 0
              ? orderQty.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })
              : "Healthy"
          }
          unit={toOrder.length > 0 ? stock.baseUnitAbbreviation : undefined}
          delta={
            toOrder.length > 0
              ? `${toOrder.length} variant${toOrder.length === 1 ? "" : "s"} below reorder point`
              : topAbc
                ? `Class ${topAbc.classification} · ${topAbc.percentageOfTotal.toFixed(1)}% of consumption value`
                : "Above reorder point"
          }
          deltaTone={toOrder.length > 0 ? "neg" : "pos"}
        />
      </KpiStrip>

      {/* ── Charts ───────────────────────────────────────────────── */}
      {snapshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LineChartIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No daily history for the last 90 days — this variant has no
              balance at this location yet, so there is nothing to plot.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {derivedDays > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {derivedDays} of {snapshots.length} days on these charts were
              never closed and are computed from the live balance and the
              ledger. Quantities are exact; their value uses today&apos;s
              average cost.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QtyOnHandChart snapshots={snapshots} />
            <StockValueChart snapshots={snapshots} currency={currency} />
            <div className="lg:col-span-2">
              <MovementMixChart snapshots={snapshots} />
            </div>
          </div>
        </div>
      )}

      {/* Movement volume by type — Reports Service */}
      {rsSummary && rsSummary.byType.length > 0 && (
        <MovementTypeBreakdownChart breakdown={rsSummary.byType} />
      )}

      {/* Reorder position — every scoped variant, not only the ones that need
          ordering, so "nothing to do here" is a visible answer. */}
      {scopedReorder.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              Reorder Position
            </h3>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Current Qty</TableHead>
                    <TableHead className="text-right">Daily Usage</TableHead>
                    <TableHead className="text-right">Reorder Point</TableHead>
                    <TableHead className="text-right">
                      Suggested Order
                    </TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedReorder.map((r) => (
                    <TableRow key={r.stockVariantId}>
                      <TableCell className="font-medium">
                        {r.variantName}
                      </TableCell>
                      <TableCell>
                        {r.currentAvailableQuantity <= r.reorderPoint &&
                        r.avgDailyConsumption > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
                            Order now
                          </span>
                        ) : r.avgDailyConsumption > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                            Covered
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            No usage
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          r.currentAvailableQuantity <= r.reorderPoint
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }`}
                      >
                        {r.currentAvailableQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.avgDailyConsumption > 0
                          ? r.avgDailyConsumption.toLocaleString(undefined, {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.reorderPoint.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400">
                        {r.suggestedOrderQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            r.daysOfStockRemaining <= 3
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : r.daysOfStockRemaining <= 7
                                ? "text-amber-600 dark:text-amber-400"
                                : ""
                          }
                        >
                          {r.daysOfStockRemaining >= 0
                            ? `${r.daysOfStockRemaining}d`
                            : "\u2014"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stockout forecast */}
      {scopedForecasts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Stockout Forecast
            </h3>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Current Qty</TableHead>
                    <TableHead className="text-right">Daily Usage</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Est. Stockout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedForecasts.map((f) => {
                    const cfg = RISK_LEVEL_CONFIG[f.riskLevel];
                    return (
                      <TableRow key={f.stockVariantId}>
                        <TableCell className="font-medium">
                          {f.variantName}
                        </TableCell>
                        <TableCell className="text-right">
                          {f.currentQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {f.avgDailyConsumption > 0
                            ? f.avgDailyConsumption.toLocaleString(undefined, {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {f.daysUntilStockout >= 0
                            ? f.daysUntilStockout
                            : "\u2014"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bgColor} ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {f.estimatedStockoutDate
                            ? new Date(
                                f.estimatedStockoutDate,
                              ).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "\u2014"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Turnover + ABC side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Turnover */}
        {scopedTurnover.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Stock Turnover (30d)
              </h3>
              <div className="space-y-3">
                {scopedTurnover.map((t) => (
                  <div
                    key={t.stockVariantId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{t.variantName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.totalMovementQuantity.toLocaleString()} moved /{" "}
                        {t.currentQuantity.toLocaleString()} on hand
                      </p>
                    </div>
                    <span
                      className={`text-lg font-bold ${
                        t.turnoverRatio >= 3
                          ? "text-green-600 dark:text-green-400"
                          : t.turnoverRatio >= 1
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {t.turnoverRatio.toFixed(1)}x
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ABC */}
        {scopedAbc.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                ABC Classification
              </h3>
              <div className="space-y-3">
                {scopedAbc.map((a) => {
                  const cfg = ABC_CONFIG[a.classification];
                  return (
                    <div
                      key={a.stockVariantId}
                      className={`flex items-center justify-between rounded-lg border p-3 ${cfg.bgColor}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${cfg.color} border`}
                          >
                            {a.classification}
                          </span>
                          <p className="text-sm font-medium">{a.variantName}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-9">
                          {cfg.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {a.annualConsumptionValue.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {a.percentageOfTotal.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No analytics data available yet. Analytics are generated once
              stock movements are recorded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
