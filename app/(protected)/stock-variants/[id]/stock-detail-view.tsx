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
} from "lucide-react";
import type { Stock } from "@/types/stock/type";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type { StockMovement } from "@/types/stock-movement/type";
import { MOVEMENT_TYPE_LABELS } from "@/types/stock-movement/type";
import type {
  StockoutForecastItem,
  StockTurnoverItem,
  AbcAnalysisItem,
  MovementTypeSummary,
} from "@/types/inventory-analytics/type";
import { RISK_LEVEL_CONFIG, ABC_CONFIG } from "@/types/inventory-analytics/type";

interface Props {
  stock: Stock;
  balanceMap: Record<string, InventoryBalance>;
  movements: StockMovement[];
  forecasts: StockoutForecastItem[];
  turnover: StockTurnoverItem[];
  abc: AbcAnalysisItem[];
  movementSummary: MovementTypeSummary[];
  totalQty: number;
  totalValue: number;
  worstRisk: StockoutForecastItem | null;
  avgTurnover: number;
}

const TABS = [
  { key: "overview", label: "Overview", icon: Package },
  { key: "movements", label: "Movements", icon: Activity },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
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
  movements,
  forecasts,
  turnover,
  abc,
  movementSummary,
  totalQty,
  totalValue,
  worstRisk,
  avgTurnover,
}: Props) {
  const [tab, setTab] = useState<TabKey>("overview");

  const riskCfg = worstRisk
    ? RISK_LEVEL_CONFIG[worstRisk.riskLevel]
    : RISK_LEVEL_CONFIG.NO_CONSUMPTION;

  return (
    <div className="space-y-6">
      {/* ── Summary cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Boxes className="h-4 w-4" />}
          label="Qty on Hand"
          value={totalQty.toLocaleString()}
        />
        <SummaryCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Value"
          value={totalValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Turnover Ratio"
          value={avgTurnover > 0 ? `${avgTurnover.toFixed(1)}x` : "\u2014"}
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
      <div className="border-b">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      {tab === "overview" && (
        <OverviewTab stock={stock} balanceMap={balanceMap} forecasts={forecasts} abc={abc} />
      )}
      {tab === "movements" && (
        <MovementsTab movements={movements} movementSummary={movementSummary} />
      )}
      {tab === "analytics" && (
        <AnalyticsTab forecasts={forecasts} turnover={turnover} abc={abc} />
      )}
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
  value: string;
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
  forecasts,
  abc,
}: {
  stock: Stock;
  balanceMap: Record<string, InventoryBalance>;
  forecasts: StockoutForecastItem[];
  abc: AbcAnalysisItem[];
}) {
  const forecastMap = new Map(forecasts.map((f) => [f.stockVariantId, f]));
  const abcMap = new Map(abc.map((a) => [a.stockVariantId, a]));

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
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>ABC</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.variants.map((v) => {
                const bal = balanceMap[v.id];
                const fc = forecastMap.get(v.id);
                const abcItem = abcMap.get(v.id);
                const qty = bal?.quantityOnHand ?? 0;
                const cost = bal?.averageCost ?? 0;
                const value = qty * cost;
                const riskCfg = fc
                  ? RISK_LEVEL_CONFIG[fc.riskLevel]
                  : null;
                const abcCfg = abcItem
                  ? ABC_CONFIG[abcItem.classification]
                  : null;

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
                        {v.sku && (
                          <span className="block text-xs text-muted-foreground">
                            SKU: {v.sku}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span>{v.unitAbbreviation}</span>
                      {v.conversionToBase !== 1 && (
                        <span className="block text-[10px] text-muted-foreground">
                          1 {v.unitAbbreviation} = {v.conversionToBase.toLocaleString(undefined, { maximumFractionDigits: 6 })} {stock.baseUnitAbbreviation}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {v.barcode || "\u2014"}
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
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {cost > 0
                        ? cost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {value > 0
                        ? value.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {riskCfg ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${riskCfg.bgColor} ${riskCfg.color}`}
                        >
                          {fc!.daysUntilStockout >= 0
                            ? `${fc!.daysUntilStockout}d`
                            : riskCfg.label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          \u2014
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {abcCfg ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${abcCfg.bgColor} ${abcCfg.color}`}
                        >
                          {abcItem!.classification}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          \u2014
                        </span>
                      )}
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

// ── Movements tab ───────────────────────────────────────────────────

function MovementsTab({
  movements,
  movementSummary,
}: {
  movements: StockMovement[];
  movementSummary: MovementTypeSummary[];
}) {
  // Compute in/out from movements
  const totalIn = movements
    .filter((m) => INBOUND_TYPES.has(m.movementType))
    .reduce((s, m) => s + Math.abs(m.quantity), 0);
  const totalOut = movements
    .filter((m) => !INBOUND_TYPES.has(m.movementType))
    .reduce((s, m) => s + Math.abs(m.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Movement summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowDownRight className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium">Total In (30d)</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              +{totalIn.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium">Total Out (30d)</span>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              -{totalOut.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Total Movements</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {movements.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Movement type breakdown */}
      {movementSummary.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">
              Movement Breakdown (30 days)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {movementSummary.map((s) => {
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
                    <span className="text-[10px] text-muted-foreground">
                      {s.count} transaction{s.count !== 1 ? "s" : ""}
                    </span>
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
            Movement History ({movements.length > 100 ? "latest 100" : movements.length})
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 100).map((m) => {
                    const isIn = INBOUND_TYPES.has(m.movementType);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(m.occurredAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year:
                              new Date(m.occurredAt).getFullYear() !==
                              new Date().getFullYear()
                                ? "numeric"
                                : undefined,
                          })}
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
                          {m.stockVariantName}
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
                            ? m.unitCost.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
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

// ── Analytics tab ───────────────────────────────────────────────────

function AnalyticsTab({
  forecasts,
  turnover,
  abc,
}: {
  forecasts: StockoutForecastItem[];
  turnover: StockTurnoverItem[];
  abc: AbcAnalysisItem[];
}) {
  return (
    <div className="space-y-6">
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
                Stock Turnover
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
      {forecasts.length === 0 && turnover.length === 0 && abc.length === 0 && (
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
