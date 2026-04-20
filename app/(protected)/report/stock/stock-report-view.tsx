"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  Clock,
  DollarSign,
  History,
  Layers,
  LineChart as LineChartIcon,
  Lock,
  PackageMinus,
  PackageX,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money } from "@/components/widgets/money";
import {
  MovementMixChart,
  MovementTypeBreakdownChart,
  QtyOnHandChart,
  StockValueChart,
} from "@/components/widgets/inventory/stock-item-charts";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type {
  AbcAnalysisItem,
  DeadStockItem,
  InventoryValuationItem,
  ReorderSuggestion,
  StockAging,
  StockoutForecastItem,
  StockTurnoverItem,
} from "@/types/inventory-analytics/type";
import { ABC_CONFIG, RISK_LEVEL_CONFIG } from "@/types/inventory-analytics/type";
import type { AuditLogEntry } from "@/types/audit-log/type";
import { AUDIT_ACTION_LABELS } from "@/types/audit-log/type";
import type { RsMovementSummary } from "@/types/reports-analytics/type";
import type { StockReservation } from "@/types/stock-reservation/type";
import { ReservationsPanel } from "@/components/widgets/inventory/reservations-panel";

interface Props {
  currency: string;
  balances: InventoryBalance[];
  valuation: InventoryValuationItem[];
  aging: StockAging | null;
  deadStock: DeadStockItem[];
  forecasts: StockoutForecastItem[];
  reorder: ReorderSuggestion[];
  abc: AbcAnalysisItem[];
  turnover: StockTurnoverItem[];
  locationSnapshots: InventorySnapshot[];
  auditEntries: AuditLogEntry[];
  rsSummary: RsMovementSummary | null;
  totalQty: number;
  totalValue: number;
  activeSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  criticalRiskCount: number;
  deadStockCount: number;
  reservations: StockReservation[];
}

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "charts", label: "Charts", icon: LineChartIcon },
  { key: "risk", label: "Forecast & Reorder", icon: ShieldAlert },
  { key: "ranking", label: "ABC & Turnover", icon: TrendingUp },
  { key: "aging", label: "Aging & Dead stock", icon: Clock },
  { key: "reservations", label: "Reservations", icon: Lock },
  { key: "activity", label: "Activity", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function StockReportView(props: Props) {
  const {
    currency,
    balances,
    valuation,
    aging,
    deadStock,
    forecasts,
    reorder,
    abc,
    turnover,
    locationSnapshots,
    auditEntries,
    rsSummary,
    totalQty,
    totalValue,
    activeSkus,
    lowStockCount,
    outOfStockCount,
    criticalRiskCount,
    deadStockCount,
    reservations,
  } = props;

  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <SummaryCard icon={<Boxes className="h-4 w-4" />} label="Active SKUs" value={activeSkus.toLocaleString()} />
        <SummaryCard
          icon={<Layers className="h-4 w-4" />}
          label="Total qty"
          value={totalQty.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        />
        <SummaryCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total value"
          value={<Money amount={totalValue} currency={currency} />}
        />
        <SummaryCard
          icon={<PackageMinus className="h-4 w-4" />}
          label="Low stock"
          value={lowStockCount.toLocaleString()}
          valueClass={lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
        />
        <SummaryCard
          icon={<PackageX className="h-4 w-4" />}
          label="Out of stock"
          value={outOfStockCount.toLocaleString()}
          valueClass={outOfStockCount > 0 ? "text-red-600 dark:text-red-400" : undefined}
        />
        <SummaryCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="At risk"
          value={criticalRiskCount.toLocaleString()}
          subtitle="Critical + high"
          valueClass={criticalRiskCount > 0 ? "text-red-600 dark:text-red-400" : undefined}
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          label="Dead stock"
          value={deadStockCount.toLocaleString()}
          subtitle="30+ days idle"
          valueClass={deadStockCount > 0 ? "text-gray-700 dark:text-gray-300" : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
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
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && (
        <OverviewTab
          currency={currency}
          balances={balances}
          valuation={valuation}
          rsSummary={rsSummary}
          locationSnapshots={locationSnapshots}
        />
      )}
      {tab === "charts" && (
        <ChartsTab
          locationSnapshots={locationSnapshots}
          rsSummary={rsSummary}
          currency={currency}
        />
      )}
      {tab === "risk" && (
        <RiskTab forecasts={forecasts} reorder={reorder} currency={currency} />
      )}
      {tab === "ranking" && <RankingTab abc={abc} turnover={turnover} />}
      {tab === "aging" && (
        <AgingTab aging={aging} deadStock={deadStock} currency={currency} />
      )}
      {tab === "reservations" && <ReservationsPanel reservations={reservations} />}
      {tab === "activity" && <ActivityTab entries={auditEntries} />}
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
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${valueClass || "text-gray-900 dark:text-gray-100"}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Overview tab ────────────────────────────────────────────────────

function OverviewTab({
  currency,
  balances,
  valuation,
  rsSummary,
  locationSnapshots,
}: {
  currency: string;
  balances: InventoryBalance[];
  valuation: InventoryValuationItem[];
  rsSummary: RsMovementSummary | null;
  locationSnapshots: InventorySnapshot[];
}) {
  const lows = balances.filter((b) => b.lowStock && !b.outOfStock).slice(0, 10);
  const outs = balances.filter((b) => b.outOfStock).slice(0, 10);
  const topValued = [...valuation]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QtyOnHandChart snapshots={locationSnapshots} />
        <StockValueChart snapshots={locationSnapshots} currency={currency} />
      </div>

      {rsSummary && rsSummary.byType.length > 0 && (
        <MovementTypeBreakdownChart breakdown={rsSummary.byType} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ListCard
          icon={<PackageMinus className="h-5 w-5 text-amber-600" />}
          title="Low stock"
          emptyLabel="No low-stock alerts."
          items={lows.map((b) => ({
            id: b.id,
            name: b.variantName || b.stockName || "(unknown variant)",
            tone: "amber" as const,
            value: `${b.quantityOnHand.toLocaleString()} on hand`,
          }))}
        />
        <ListCard
          icon={<PackageX className="h-5 w-5 text-red-600" />}
          title="Out of stock"
          emptyLabel="Nothing is out of stock."
          items={outs.map((b) => ({
            id: b.id,
            name: b.variantName || b.stockName || "(unknown variant)",
            tone: "red" as const,
            value: "0 on hand",
          }))}
        />
      </div>

      {topValued.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Top-valued SKUs
            </h3>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Qty on hand</TableHead>
                    <TableHead className="text-right">Avg cost</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topValued.map((v) => (
                    <TableRow key={v.stockVariantId}>
                      <TableCell className="text-sm font-medium">{v.variantName}</TableCell>
                      <TableCell className="text-right text-sm">
                        {v.quantityOnHand.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {v.averageCost > 0 ? (
                          <Money amount={v.averageCost} currency={currency} />
                        ) : (
                          "\u2014"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        <Money amount={v.totalValue} currency={currency} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Charts tab ──────────────────────────────────────────────────────

function ChartsTab({
  locationSnapshots,
  rsSummary,
  currency,
}: {
  locationSnapshots: InventorySnapshot[];
  rsSummary: RsMovementSummary | null;
  currency: string;
}) {
  if (locationSnapshots.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <LineChartIcon className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No daily snapshots yet for the last 90 days. Charts populate once
            end-of-day snapshots are captured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QtyOnHandChart snapshots={locationSnapshots} />
        <StockValueChart snapshots={locationSnapshots} currency={currency} />
      </div>
      <MovementMixChart snapshots={locationSnapshots} />
      {rsSummary && rsSummary.byType.length > 0 && (
        <MovementTypeBreakdownChart breakdown={rsSummary.byType} />
      )}
    </div>
  );
}

// ── Risk tab ────────────────────────────────────────────────────────

function RiskTab({
  forecasts,
  reorder,
  currency,
}: {
  forecasts: StockoutForecastItem[];
  reorder: ReorderSuggestion[];
  currency: string;
}) {
  const ranked = [...forecasts].sort((a, b) => {
    const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NO_CONSUMPTION"];
    const ra = order.indexOf(a.riskLevel);
    const rb = order.indexOf(b.riskLevel);
    if (ra !== rb) return ra - rb;
    return a.daysUntilStockout - b.daysUntilStockout;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Stockout forecast
          </h3>
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nothing at risk — healthy cover across all SKUs.
            </p>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Current qty</TableHead>
                    <TableHead className="text-right">Daily usage</TableHead>
                    <TableHead className="text-right">Days left</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.slice(0, 50).map((f) => {
                    const cfg = RISK_LEVEL_CONFIG[f.riskLevel];
                    return (
                      <TableRow key={f.stockVariantId}>
                        <TableCell className="text-sm font-medium">{f.variantName}</TableCell>
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
                          {f.daysUntilStockout >= 0 ? f.daysUntilStockout : "\u2014"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bgColor} ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-500" />
            Reorder suggestions
          </h3>
          {reorder.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No items below their reorder point right now.
            </p>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Reorder point</TableHead>
                    <TableHead className="text-right">Suggested</TableHead>
                    <TableHead className="text-right">Days left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reorder.slice(0, 50).map((r) => (
                    <TableRow key={r.stockVariantId}>
                      <TableCell className="text-sm font-medium">{r.variantName}</TableCell>
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
                        {r.reorderPoint.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-blue-600 dark:text-blue-400">
                        {r.suggestedOrderQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.daysOfStockRemaining >= 0 ? `${r.daysOfStockRemaining}d` : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <DollarSign className="h-3 w-3" />
        Costs shown in {currency}.
      </p>
    </div>
  );
}

// ── Ranking tab (ABC + Turnover) ────────────────────────────────────

function RankingTab({
  abc,
  turnover,
}: {
  abc: AbcAnalysisItem[];
  turnover: StockTurnoverItem[];
}) {
  const grouped = useMemo(() => {
    const map: Record<"A" | "B" | "C", AbcAnalysisItem[]> = { A: [], B: [], C: [] };
    for (const item of abc) map[item.classification].push(item);
    return map;
  }, [abc]);

  const fastest = useMemo(
    () => [...turnover].sort((a, b) => b.turnoverRatio - a.turnoverRatio).slice(0, 10),
    [turnover],
  );
  const slowest = useMemo(
    () => [...turnover].sort((a, b) => a.turnoverRatio - b.turnoverRatio).slice(0, 10),
    [turnover],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["A", "B", "C"] as const).map((klass) => {
          const cfg = ABC_CONFIG[klass];
          const items = grouped[klass];
          return (
            <Card key={klass}>
              <CardContent className="pt-4">
                <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${cfg.bgColor}`}>
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{cfg.description}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 max-h-[300px] overflow-auto">
                  {items.slice(0, 20).map((i) => (
                    <div key={i.stockVariantId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{i.variantName}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {i.percentageOfTotal.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {items.length > 20 && (
                    <p className="text-[11px] text-muted-foreground pt-2">
                      + {items.length - 20} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TurnoverCard title="Fastest movers" tone="green" items={fastest} />
        <TurnoverCard title="Slowest movers" tone="red" items={slowest} />
      </div>
    </div>
  );
}

function TurnoverCard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "green" | "red";
  items: StockTurnoverItem[];
}) {
  const toneClass =
    tone === "green"
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {title}
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No data.</p>
        ) : (
          <div className="space-y-2">
            {items.map((t) => (
              <div key={t.stockVariantId} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{t.variantName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.totalMovementQuantity.toLocaleString()} moved · {t.currentQuantity.toLocaleString()} on hand
                  </p>
                </div>
                <span className={`text-lg font-bold ${toneClass}`}>{t.turnoverRatio.toFixed(1)}x</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Aging tab ───────────────────────────────────────────────────────

function AgingTab({
  aging,
  deadStock,
  currency,
}: {
  aging: StockAging | null;
  deadStock: DeadStockItem[];
  currency: string;
}) {
  const buckets = aging?.buckets ?? [];
  const displayCurrency = aging?.currency ?? currency;

  return (
    <div className="space-y-6">
      {buckets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {buckets.map((b) => (
            <Card key={b.range}>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {b.range}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {b.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {b.itemCount} batch{b.itemCount === 1 ? "" : "es"} ·{" "}
                  <Money amount={b.totalValue} currency={displayCurrency} />
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No aging data yet. Aging buckets populate once batches are received.
          </CardContent>
        </Card>
      )}

      {buckets.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Aging detail</h3>
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Bucket</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Days held</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buckets.flatMap((b) =>
                    b.items.slice(0, 20).map((i) => (
                      <TableRow key={`${b.range}-${i.batchNumber ?? i.variantId}`}>
                        <TableCell className="text-sm font-medium">{i.displayName}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {i.batchNumber ?? "\u2014"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{b.range}</TableCell>
                        <TableCell className="text-right text-sm">{i.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">
                          <Money amount={i.value} currency={displayCurrency} />
                        </TableCell>
                        <TableCell className="text-right text-sm">{i.daysSinceReceipt}d</TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Dead stock (30+ days idle)
          </h3>
          {deadStock.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nothing idle beyond 30 days — good movement across the board.
            </p>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Qty on hand</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Days idle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadStock.slice(0, 100).map((d) => (
                    <TableRow key={d.stockVariantId}>
                      <TableCell className="text-sm font-medium">{d.variantName}</TableCell>
                      <TableCell className="text-right text-sm">
                        {d.quantityOnHand.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <Money amount={d.totalValue} currency={currency} />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {d.daysSinceLastMovement}d
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Activity tab ────────────────────────────────────────────────────

function ActivityTab({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No recent activity recorded for this location.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Recent activity
        </h3>
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
                    {entry.staffName ?? <span className="text-muted-foreground">\u2014</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[360px]">
                    {entry.details ? (
                      <span className="line-clamp-2 whitespace-pre-wrap">{entry.details}</span>
                    ) : (
                      "\u2014"
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

// ── Helper: generic list card ───────────────────────────────────────

function ListCard({
  icon,
  title,
  emptyLabel,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  emptyLabel: string;
  items: Array<{
    id: string;
    name: string;
    value: string;
    tone: "amber" | "red";
  }>;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => {
              const tone =
                item.tone === "amber"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400";
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <span className="text-sm truncate">{item.name}</span>
                  <span className={`text-xs font-medium whitespace-nowrap ${tone}`}>
                    {item.value}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
