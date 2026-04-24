"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Layers,
  ShieldCheck,
  Truck,
  Clock,
  ShoppingCart,
  RefreshCw,
  History,
  LineChart as LineChartIcon,
  User,
} from "lucide-react";
import type { Stock } from "@/types/stock/type";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type { StockMovement, StockMovementSummary } from "@/types/stock-movement/type";
import { MOVEMENT_TYPE_LABELS } from "@/types/stock-movement/type";
import type {
  StockoutForecastItem,
  StockTurnoverItem,
  AbcAnalysisItem,
  ReorderSuggestion,
} from "@/types/inventory-analytics/type";
import { RISK_LEVEL_CONFIG, ABC_CONFIG } from "@/types/inventory-analytics/type";
import type { StockBatch } from "@/types/stock-batch/type";
import { BATCH_STATUS_CONFIG } from "@/types/stock-batch/type";
import type { ItemSalesAggregate } from "@/types/item-sales/type";
import { Money } from "@/components/widgets/money";
import {
  ReorderConfigDialog,
  ReorderConfigSummary,
} from "@/components/widgets/inventory/reorder-config-dialog";
import { BarcodeManager } from "@/components/widgets/barcode-manager";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { AuditLogEntry } from "@/types/audit-log/type";
import { AUDIT_ACTION_LABELS } from "@/types/audit-log/type";
import type { RsMovementSummary } from "@/types/reports-analytics/type";
import {
  MovementMixChart,
  MovementTypeBreakdownChart,
  QtyOnHandChart,
  StockValueChart,
} from "@/components/widgets/inventory/stock-item-charts";

interface Props {
  stock: Stock;
  balanceMap: Record<string, InventoryBalance>;
  batchMap: Record<string, StockBatch[]>;
  variantSummaryMap: Record<string, StockMovementSummary>;
  movements: StockMovement[];
  forecasts: StockoutForecastItem[];
  turnover: StockTurnoverItem[];
  abc: AbcAnalysisItem[];
  reorder: ReorderSuggestion[];
  salesItems: ItemSalesAggregate[];
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
  /** Aggregated Reports Service movement summary across all variants. */
  rsSummary: RsMovementSummary | null;
}

const TABS = [
  { key: "overview", label: "Overview", icon: Package },
  { key: "charts", label: "Charts", icon: LineChartIcon },
  { key: "batches", label: "Batches", icon: Layers },
  { key: "movements", label: "Movements", icon: Activity },
  { key: "sales", label: "Sales", icon: ShoppingCart },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "audit", label: "Audit", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const INBOUND_TYPES = new Set([
  "PURCHASE",
  "TRANSFER_IN",
  "RETURN",
  "OPENING_BALANCE",
]);

export function StockDetailView({
  stock,
  balanceMap,
  batchMap,
  variantSummaryMap,
  movements,
  forecasts,
  turnover,
  abc,
  reorder,
  salesItems,
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
  rsSummary,
}: Props) {
  const [tab, setTab] = useState<TabKey>("overview");

  const riskCfg = worstRisk
    ? RISK_LEVEL_CONFIG[worstRisk.riskLevel]
    : RISK_LEVEL_CONFIG.NO_CONSUMPTION;

  const totalBatches = Object.values(batchMap).reduce((s, b) => s + b.length, 0);

  // Count batches expiring within 7 days
  const now = new Date();
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const expiringBatchCount = Object.values(batchMap)
    .flat()
    .filter(
      (b) =>
        b.expiryDate &&
        new Date(b.expiryDate) <= sevenDaysOut &&
        new Date(b.expiryDate) > now,
    ).length;

  return (
    <div className="space-y-6">
      {/* ── Summary cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard
          icon={<Boxes className="h-4 w-4" />}
          label="Qty on Hand"
          value={totalQty.toLocaleString()}
        />
        <SummaryCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Value"
          value={<Money amount={totalValue} currency={currency} />}
        />
        <SummaryCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Available"
          value={totalAvailable.toLocaleString()}
          subtitle={
            totalReserved > 0
              ? `${totalReserved.toLocaleString()} reserved`
              : undefined
          }
          subtitleClass="text-amber-600 dark:text-amber-400"
        />
        <SummaryCard
          icon={<Truck className="h-4 w-4" />}
          label="In Transit"
          value={totalInTransit > 0 ? totalInTransit.toLocaleString() : "\u2014"}
          subtitle={
            totalInTransit > 0
              ? `Expected: ${(totalQty + totalInTransit).toLocaleString()}`
              : undefined
          }
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Turnover (30d)"
          value={avgTurnover > 0 ? `${avgTurnover.toFixed(1)}x` : "\u2014"}
          subtitle={
            avgTurnover >= 3
              ? "Fast moving"
              : avgTurnover >= 1
                ? "Normal"
                : avgTurnover > 0
                  ? "Slow moving"
                  : undefined
          }
          subtitleClass={
            avgTurnover >= 3
              ? "text-green-600 dark:text-green-400"
              : avgTurnover >= 1
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
          }
        />
        <SummaryCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Stockout Risk"
          value={
            worstRisk
              ? worstRisk.daysUntilStockout >= 0
                ? `${worstRisk.daysUntilStockout}d`
                : riskCfg.label
              : "\u2014"
          }
          valueClass={riskCfg.color}
          subtitle={worstRisk ? riskCfg.label : undefined}
          subtitleClass={riskCfg.color}
        />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            let badge: string | null = null;
            if (t.key === "batches" && totalBatches > 0) badge = String(totalBatches);
            if (t.key === "movements" && movements.length > 0)
              badge = String(movementSummary.totalMovements);
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {badge && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
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
      {tab === "charts" && (
        <ChartsTab
          stock={stock}
          stockSnapshots={stockSnapshots}
          variantSnapshotMap={variantSnapshotMap}
          rsSummary={rsSummary}
          currency={currency}
        />
      )}
      {tab === "batches" && (
        <BatchesTab
          stock={stock}
          batchMap={batchMap}
          expiringCount={expiringBatchCount}
          currency={currency}
        />
      )}
      {tab === "movements" && (
        <MovementsTab
          movements={movements}
          movementSummary={movementSummary}
          currency={currency}
          rsSummary={rsSummary}
        />
      )}
      {tab === "sales" && (
        <SalesTab salesItems={salesItems} stock={stock} />
      )}
      {tab === "analytics" && (
        <AnalyticsTab
          forecasts={forecasts}
          turnover={turnover}
          abc={abc}
          reorder={reorder}
        />
      )}
      {tab === "audit" && <AuditTab entries={auditEntries} />}
    </div>
  );
}

// ── Summary card ────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  valueClass,
  subtitle,
  subtitleClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  subtitle?: string;
  subtitleClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p
          className={`text-2xl font-bold ${valueClass || "text-gray-900 dark:text-gray-100"}`}
        >
          {value}
        </p>
        {subtitle && (
          <p className={`text-xs mt-0.5 ${subtitleClass || "text-muted-foreground"}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
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
                        <span className="font-medium text-sm">
                          {v.displayName}
                        </span>
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
                    <TableCell className="text-sm">
                      <span>{v.unitAbbreviation}</span>
                      {v.conversionToBase !== 1 &&
                        (() => {
                          const c = v.conversionToBase;
                          if (c >= 1) {
                            return (
                              <span className="block text-[10px] text-muted-foreground">
                                1 {v.unitAbbreviation} ={" "}
                                {c.toLocaleString(undefined, {
                                  maximumFractionDigits: 6,
                                })}{" "}
                                {stock.baseUnitAbbreviation}
                              </span>
                            );
                          }
                          const inv = Math.round((1 / c) * 1e6) / 1e6;
                          return (
                            <span className="block text-[10px] text-muted-foreground">
                              {inv.toLocaleString(undefined, {
                                maximumFractionDigits: 6,
                              })}{" "}
                              {v.unitAbbreviation} = 1{" "}
                              {stock.baseUnitAbbreviation}
                            </span>
                          );
                        })()}
                    </TableCell>
                    <TableCell className="text-sm">
                      <BarcodeManager
                        variantId={v.id}
                        variantName={v.displayName}
                        barcode={v.barcode}
                        sku={v.sku}
                        disabled={v.archived}
                      />
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-medium ${
                        bal?.outOfStock
                          ? "text-red-600 dark:text-red-400"
                          : bal?.lowStock
                            ? "text-amber-600 dark:text-amber-400"
                            : ""
                      }`}
                    >
                      {qty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {(bal?.availableQuantity ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {(bal?.reservedQuantity ?? 0) > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {bal!.reservedQuantity.toLocaleString()}
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {(bal?.inTransitQuantity ?? 0) > 0 ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {bal!.inTransitQuantity.toLocaleString()}
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {value > 0 ? <Money amount={value} currency={currency} /> : "\u2014"}
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
  batchMap,
  expiringCount,
  currency,
}: {
  stock: Stock;
  batchMap: Record<string, StockBatch[]>;
  expiringCount: number;
  currency: string;
}) {
  const allBatches = Object.values(batchMap).flat();

  if (allBatches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No active batches. Batches are created when stock is received via
            GRN.
          </p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  // Sort: expiring first, then by received date
  const sorted = [...allBatches].sort((a, b) => {
    if (a.expiryDate && b.expiryDate)
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    if (a.expiryDate) return -1;
    if (b.expiryDate) return 1;
    return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime();
  });

  const totalBatchQty = allBatches.reduce((s, b) => s + b.quantityOnHand, 0);
  const totalBatchValue = allBatches.reduce(
    (s, b) => s + b.quantityOnHand * (b.unitCost ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Batch summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Layers className="h-4 w-4" />
              <span className="text-xs font-medium">Active Batches</span>
            </div>
            <p className="text-xl font-bold">{allBatches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Boxes className="h-4 w-4" />
              <span className="text-xs font-medium">Batch Qty</span>
            </div>
            <p className="text-xl font-bold">{totalBatchQty.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Batch Value</span>
            </div>
            <p className="text-xl font-bold">
              <Money amount={totalBatchValue} currency={currency} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium">Expiring Soon</span>
            </div>
            <p
              className={`text-xl font-bold ${
                expiringCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : ""
              }`}
            >
              {expiringCount}
            </p>
            {expiringCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                within 7 days
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">Batch Details</h3>
          <div className="rounded-md border overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Supplier Ref</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Qty On Hand</TableHead>
                  <TableHead className="text-right">Initial Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((b) => {
                  const isExpiringSoon =
                    b.expiryDate &&
                    new Date(b.expiryDate) <= sevenDaysOut &&
                    new Date(b.expiryDate) > now;
                  const isExpired =
                    b.expiryDate && new Date(b.expiryDate) <= now;
                  const batchValue =
                    b.quantityOnHand * (b.unitCost ?? 0);
                  const consumed =
                    b.initialQuantity > 0
                      ? ((b.initialQuantity - b.quantityOnHand) /
                          b.initialQuantity) *
                        100
                      : 0;
                  const statusCfg = BATCH_STATUS_CONFIG[b.status];

                  return (
                    <TableRow
                      key={b.id}
                      className={
                        isExpired
                          ? "bg-red-50/50 dark:bg-red-950/10"
                          : isExpiringSoon
                            ? "bg-amber-50/50 dark:bg-amber-950/10"
                            : ""
                      }
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {b.batchNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {b.variantName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {b.supplierBatchReference || "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {b.expiryDate ? (
                          <span
                            className={
                              isExpired
                                ? "text-red-600 dark:text-red-400 font-medium"
                                : isExpiringSoon
                                  ? "text-amber-600 dark:text-amber-400 font-medium"
                                  : ""
                            }
                          >
                            {new Date(b.expiryDate).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric", year: "numeric" },
                            )}
                            {isExpired && (
                              <span className="block text-[10px]">Expired</span>
                            )}
                            {isExpiringSoon && (
                              <span className="block text-[10px]">
                                {Math.ceil(
                                  (new Date(b.expiryDate).getTime() -
                                    now.getTime()) /
                                    86400000,
                                )}
                                d left
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            No expiry
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {b.quantityOnHand.toLocaleString()}
                        <span className="block text-[10px] text-muted-foreground">
                          {consumed.toFixed(0)}% used
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {b.initialQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {b.unitCost != null
                          ? (
                            <div className="flex flex-col items-end">
                              <Money amount={b.unitCost} currency={b.currency || currency} />
                              {b.originalCurrency &&
                                b.originalCurrency !== (b.currency || currency) &&
                                b.originalUnitCost != null && (
                                  <span className="text-[10px] text-muted-foreground">
                                    orig{" "}
                                    <Money
                                      amount={b.originalUnitCost}
                                      currency={b.originalCurrency}
                                    />
                                    {b.rateUsed != null && b.rateUsed !== 1
                                      ? ` @ ${b.rateUsed.toLocaleString(undefined, { maximumFractionDigits: 6 })}`
                                      : ""}
                                  </span>
                                )}
                            </div>
                          )
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {batchValue > 0
                          ? <Money amount={batchValue} currency={b.currency || currency} />
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(b.receivedDate).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.bgColor} ${statusCfg.color}`}
                        >
                          {statusCfg.label}
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
    </div>
  );
}

// ── Movements tab ───────────────────────────────────────────────────

function MovementsTab({
  movements,
  movementSummary,
  currency,
  rsSummary,
}: {
  movements: StockMovement[];
  movementSummary: StockMovementSummary;
  currency: string;
  rsSummary: RsMovementSummary | null;
}) {
  // Prefer Reports Service totals when available — materialised views are the
  // canonical source for aggregations. Falls back to the inventory sum otherwise.
  const summary = rsSummary
    ? {
        ...movementSummary,
        totalMovements: rsSummary.totalMovements,
        totalQuantityIn: rsSummary.totalQuantityIn,
        totalQuantityOut: rsSummary.totalQuantityOut,
        netQuantityChange: rsSummary.netQuantityChange,
        totalCostIn: rsSummary.totalCostIn,
        totalCostOut: rsSummary.totalCostOut,
        byType: rsSummary.byType.map((t) => ({
          movementType: t.movementType,
          count: t.count,
          totalQuantity: t.totalQuantity,
          totalCost: t.totalCost,
        })),
      }
    : movementSummary;
  return (
    <div className="space-y-6">
      {/* Movement summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowDownRight className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium">Qty In (30d)</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              +{summary.totalQuantityIn.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium">Qty Out (30d)</span>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              -{summary.totalQuantityOut.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Net Change</span>
            </div>
            <p
              className={`text-xl font-bold ${
                summary.netQuantityChange > 0
                  ? "text-green-600 dark:text-green-400"
                  : summary.netQuantityChange < 0
                    ? "text-red-600 dark:text-red-400"
                    : ""
              }`}
            >
              {summary.netQuantityChange > 0 ? "+" : ""}
              {summary.netQuantityChange.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium">Cost In</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              <Money amount={summary.totalCostIn} currency={currency} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium">Cost Out</span>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              <Money amount={summary.totalCostOut} currency={currency} />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Movement type breakdown */}
      {summary.byType.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">
              Movement Breakdown (30 days)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {summary.byType.map((s) => {
                const isIn = INBOUND_TYPES.has(s.movementType);
                return (
                  <div
                    key={s.movementType}
                    className="rounded-lg border p-3 space-y-1"
                  >
                    <span className="text-xs text-muted-foreground">
                      {MOVEMENT_TYPE_LABELS[
                        s.movementType as keyof typeof MOVEMENT_TYPE_LABELS
                      ] ?? s.movementType}
                    </span>
                    <p
                      className={`text-lg font-semibold ${
                        isIn
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isIn ? "+" : "-"}
                      {Math.abs(s.totalQuantity).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {s.count} txn{s.count !== 1 ? "s" : ""}
                      </span>
                      {s.totalCost > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {s.totalCost.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movement history */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">
            Movement History (
            {movements.length > 100 ? "latest 100" : movements.length})
          </h3>
          {movements.length > 0 ? (
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 100).map((m) => {
                    const isIn = INBOUND_TYPES.has(m.movementType);
                    return (
                      <TableRow key={m.movementId}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(m.occurredAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year:
                                new Date(m.occurredAt).getFullYear() !==
                                new Date().getFullYear()
                                  ? "numeric"
                                  : undefined,
                            },
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              isIn
                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                            }`}
                          >
                            {MOVEMENT_TYPE_LABELS[
                              m.movementType as keyof typeof MOVEMENT_TYPE_LABELS
                            ] ?? m.movementType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.variantName}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-medium ${
                            isIn
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isIn ? "+" : ""}
                          {m.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {m.unitCost != null
                            ? <Money amount={m.unitCost} currency={m.currency || currency} />
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {m.totalCost != null && m.totalCost > 0
                            ? <Money amount={m.totalCost} currency={m.currency || currency} />
                            : "\u2014"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No movements recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sales tab ──────────────────────────────────────────────────────

function SalesTab({
  salesItems,
  stock,
}: {
  salesItems: ItemSalesAggregate[];
  stock: Stock;
}) {
  if (salesItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No sales data available for the last 30 days. Sales data appears
            when linked product variants are sold via POS.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalQtySold = salesItems.reduce((s, i) => s + i.quantitySold, 0);
  const totalGross = salesItems.reduce((s, i) => s + i.grossSales, 0);
  const totalNet = salesItems.reduce((s, i) => s + i.netSales, 0);
  const totalCost = salesItems.reduce((s, i) => s + i.totalCost, 0);
  const totalProfit = salesItems.reduce((s, i) => s + i.grossProfit, 0);
  const totalDiscount = salesItems.reduce((s, i) => s + i.totalDiscount, 0);
  const profitMargin = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Sales summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs font-medium">Qty Sold</span>
            </div>
            <p className="text-xl font-bold">
              {totalQtySold.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Gross Sales</span>
            </div>
            <p className="text-xl font-bold">
              {totalGross.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Net Sales</span>
            </div>
            <p className="text-xl font-bold">
              {totalNet.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
            {totalDiscount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                -{totalDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })} discounts
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-xs font-medium">COGS</span>
            </div>
            <p className="text-xl font-bold">
              {totalCost.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Gross Profit</span>
            </div>
            <p
              className={`text-xl font-bold ${
                totalProfit >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {totalProfit.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">Margin</span>
            </div>
            <p
              className={`text-xl font-bold ${
                profitMargin >= 20
                  ? "text-green-600 dark:text-green-400"
                  : profitMargin >= 10
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales per item table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">
            Item Sales Breakdown (30 days)
          </h3>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Gross Sales</TableHead>
                  <TableHead className="text-right">Discounts</TableHead>
                  <TableHead className="text-right">Net Sales</TableHead>
                  <TableHead className="text-right">COGS</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesItems.map((item, idx) => {
                  const margin =
                    item.netSales > 0
                      ? (item.grossProfit / item.netSales) * 100
                      : 0;
                  return (
                    <TableRow key={`${item.variantId}-${idx}`}>
                      <TableCell className="font-medium text-sm">
                        {item.itemName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.departmentName || "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.quantitySold.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.grossSales.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {item.totalDiscount > 0
                          ? item.totalDiscount.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.netSales.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {item.totalCost.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          item.grossProfit >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.grossProfit.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span
                          className={
                            margin >= 20
                              ? "text-green-600 dark:text-green-400"
                              : margin >= 10
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }
                        >
                          {margin.toFixed(1)}%
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
    </div>
  );
}

// ── Analytics tab ───────────────────────────────────────────────────

function AnalyticsTab({
  forecasts,
  turnover,
  abc,
  reorder,
}: {
  forecasts: StockoutForecastItem[];
  turnover: StockTurnoverItem[];
  abc: AbcAnalysisItem[];
  reorder: ReorderSuggestion[];
}) {
  const hasData =
    forecasts.length > 0 ||
    turnover.length > 0 ||
    abc.length > 0 ||
    reorder.length > 0;

  return (
    <div className="space-y-6">
      {/* Reorder suggestions */}
      {reorder.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              Reorder Suggestions
            </h3>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Current Qty</TableHead>
                    <TableHead className="text-right">Daily Usage</TableHead>
                    <TableHead className="text-right">Reorder Point</TableHead>
                    <TableHead className="text-right">Suggested Order</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reorder.map((r) => (
                    <TableRow key={r.stockVariantId}>
                      <TableCell className="font-medium text-sm">
                        {r.variantName}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          r.currentAvailableQuantity <= r.reorderPoint
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }`}
                      >
                        {r.currentAvailableQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {r.avgDailyConsumption > 0
                          ? r.avgDailyConsumption.toLocaleString(undefined, {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {r.reorderPoint.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-blue-600 dark:text-blue-400">
                        {r.suggestedOrderQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
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
      {forecasts.length > 0 && (
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
                  {forecasts.map((f) => {
                    const cfg = RISK_LEVEL_CONFIG[f.riskLevel];
                    return (
                      <TableRow key={f.stockVariantId}>
                        <TableCell className="font-medium text-sm">
                          {f.variantName}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {f.currentQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {f.avgDailyConsumption > 0
                            ? f.avgDailyConsumption.toLocaleString(undefined, {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
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
                        <TableCell className="text-sm text-muted-foreground">
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
        {turnover.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Stock Turnover (30d)
              </h3>
              <div className="space-y-3">
                {turnover.map((t) => (
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
        {abc.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                ABC Classification
              </h3>
              <div className="space-y-3">
                {abc.map((a) => {
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

// ── Charts tab ──────────────────────────────────────────────────────

function ChartsTab({
  stock,
  stockSnapshots,
  variantSnapshotMap,
  rsSummary,
  currency,
}: {
  stock: Stock;
  stockSnapshots: InventorySnapshot[];
  variantSnapshotMap: Record<string, InventorySnapshot[]>;
  rsSummary: RsMovementSummary | null;
  currency: string;
}) {
  const activeVariants = stock.variants.filter((v) => !v.archived);
  const [variantId, setVariantId] = useState<string>("__all__");
  const snapshots =
    variantId === "__all__"
      ? stockSnapshots
      : variantSnapshotMap[variantId] ?? [];

  return (
    <div className="space-y-6">
      {/* Variant scope picker */}
      {activeVariants.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Scope
          </span>
          <div className="inline-flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setVariantId("__all__")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                variantId === "__all__"
                  ? "bg-background shadow-sm font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All variants
            </button>
            {activeVariants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  variantId === v.id
                    ? "bg-background shadow-sm font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {snapshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LineChartIcon className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No daily snapshots yet for the last 90 days. Charts populate once
              end-of-day snapshots have been captured.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <QtyOnHandChart snapshots={snapshots} />
          <StockValueChart snapshots={snapshots} currency={currency} />
          <div className="lg:col-span-2">
            <MovementMixChart snapshots={snapshots} />
          </div>
        </div>
      )}

      {/* Movement volume by type — Reports Service */}
      {rsSummary && rsSummary.byType.length > 0 && (
        <MovementTypeBreakdownChart breakdown={rsSummary.byType} />
      )}
    </div>
  );
}

// ── Audit tab ───────────────────────────────────────────────────────

function AuditTab({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No audit trail yet. Changes to this stock — edits, archives,
            deletes, and linked workflows — show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-3">Recent changes</h3>
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {entry.entityType}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.staffName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {entry.staffName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[360px]">
                    {entry.details ? (
                      <span className="line-clamp-2 whitespace-pre-wrap">
                        {entry.details}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
