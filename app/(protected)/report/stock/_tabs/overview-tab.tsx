import { addDays, format } from "date-fns";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Hourglass,
  PackageMinus,
  PackageX,
  ShieldAlert,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import {
  QtyOnHandChart,
  StockValueChart,
} from "@/components/widgets/inventory/stock-item-charts";
import { getCurrentDestination } from "@/lib/actions/context";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import {
  getDeadStock,
  getStockoutForecast,
} from "@/lib/actions/inventory-analytics-actions";
import { getLocationSnapshotRange } from "@/lib/actions/inventory-snapshot-actions";
import { getExpiringBatches } from "@/lib/actions/stock-batch-actions";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";

interface Props {
  /** Snapshot date for the KPI strip (yyyy-MM-dd). */
  asOf: string;
  /** Trend range start. */
  from: string;
  /** Trend range end. */
  to: string;
}

const fmt = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * Overview — snapshot KPIs as of `asOf`, plus value & quantity trends
 * over `from..to`. The KPIs are derived from current balances rather
 * than a stored snapshot so the numbers always reflect "right now"
 * (the asOf date control gates which day's snapshot the trend chart
 * highlights).
 *
 * No day-session anywhere — every figure is purely time-driven.
 */
export async function OverviewTab({ asOf: _asOf, from, to }: Props) {
  // Follow the active destination (location OR store), not just the location —
  // in store mode getCurrentLocation() is null, which would blank the report.
  const destination = await getCurrentDestination();
  const locationId = destination?.id ?? null;

  // 7-day lookahead matches the inventory service's BATCH_EXPIRY_APPROACHING
  // scheduler window — same horizon the operator already sees in alerts.
  const expiryHorizon = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const [currency, balances, forecasts, deadStock, snapshots, expiring] = await Promise.all([
    getLocationCurrency(),
    locationId
      ? getBalancesByLocation(locationId)
      : Promise.resolve<InventoryBalance[]>([]),
    getStockoutForecast(),
    getDeadStock(30),
    getLocationSnapshotRange(from, to),
    getExpiringBatches(expiryHorizon),
  ]);

  const collapsed = collapseSnapshots(snapshots);
  const metrics = aggregate(balances);
  const criticalRiskCount = forecasts.filter(
    (f) => f.riskLevel === "CRITICAL" || f.riskLevel === "HIGH",
  ).length;
  const expiringValue = expiring.reduce(
    (sum, b) => sum + b.quantityOnHand * (b.unitCost ?? 0),
    0,
  );

  return (
    <>
      <KpiStrip cols={6}>
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Stock value"
          value={metrics.totalValue > 0 ? fmt(metrics.totalValue) : "—"}
          unit={currency}
          delta={`${fmt(metrics.totalQty)} units on hand`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Boxes className="h-3 w-3" />}
          label="Active SKUs"
          value={metrics.activeSkus > 0 ? fmt(metrics.activeSkus) : "—"}
          delta="Tracked variants"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<PackageMinus className="h-3 w-3" />}
          label="Low stock"
          value={metrics.lowStock > 0 ? fmt(metrics.lowStock) : "—"}
          delta={metrics.lowStock > 0 ? "Below threshold" : "All comfortable"}
          deltaTone={metrics.lowStock > 0 ? "neg" : "pos"}
        />
        <KpiCard
          icon={<PackageX className="h-3 w-3" />}
          label="Out of stock"
          value={metrics.outOfStock > 0 ? fmt(metrics.outOfStock) : "—"}
          delta="Zero on hand"
          deltaTone={metrics.outOfStock > 0 ? "neg" : "neutral"}
        />
        <KpiCard
          icon={<Hourglass className="h-3 w-3" />}
          label="Expiring soon"
          value={expiring.length > 0 ? fmt(expiring.length) : "—"}
          unit={expiring.length > 0 ? currency : undefined}
          delta={
            expiring.length > 0
              ? `${fmt(expiringValue)} tied up · next 7 days`
              : "Nothing in next 7 days"
          }
          deltaTone={expiring.length > 0 ? "neg" : "pos"}
        />
        <KpiCard
          icon={<ShieldAlert className="h-3 w-3" />}
          label="At risk"
          value={criticalRiskCount > 0 ? fmt(criticalRiskCount) : "—"}
          delta={`${fmt(deadStock.length)} dead`}
          deltaTone={criticalRiskCount > 0 ? "neg" : "neutral"}
        />
      </KpiStrip>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold tracking-tight text-ink">
                Stock value
              </h3>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                {currency}
              </span>
            </header>
            <StockValueChart snapshots={collapsed} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold tracking-tight text-ink">
                Quantity on hand
              </h3>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                units
              </span>
            </header>
            <QtyOnHandChart snapshots={collapsed} />
          </CardContent>
        </Card>
      </div>

      {(metrics.outOfStock > 0 ||
        criticalRiskCount > 0 ||
        deadStock.length > 0 ||
        expiring.length > 0) && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[12.5px]">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-medium text-ink">Action items</span>
            </span>
            {metrics.outOfStock > 0 && (
              <span className="text-muted-foreground">
                <span className="font-medium text-rose-600">
                  {metrics.outOfStock}
                </span>{" "}
                SKU{metrics.outOfStock === 1 ? "" : "s"} out of stock
              </span>
            )}
            {expiring.length > 0 && (
              <span className="text-muted-foreground">
                <span className="font-medium text-amber-700">
                  {expiring.length}
                </span>{" "}
                batch{expiring.length === 1 ? "" : "es"} expiring soon
              </span>
            )}
            {criticalRiskCount > 0 && (
              <span className="text-muted-foreground">
                <span className="font-medium text-amber-700">
                  {criticalRiskCount}
                </span>{" "}
                forecast-critical
              </span>
            )}
            {deadStock.length > 0 && (
              <span className="text-muted-foreground">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {deadStock.length}
                </span>{" "}
                dead-stock SKU{deadStock.length === 1 ? "" : "s"}
              </span>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function aggregate(balances: InventoryBalance[]) {
  let totalQty = 0;
  let totalValue = 0;
  let reserved = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let activeSkus = 0;
  for (const b of balances) {
    totalQty += b.quantityOnHand;
    totalValue += b.quantityOnHand * (b.averageCost ?? 0);
    reserved += b.reservedQuantity;
    if (b.outOfStock) outOfStock += 1;
    else if (b.lowStock) lowStock += 1;
    activeSkus += 1;
  }
  return { totalQty, totalValue, reserved, lowStock, outOfStock, activeSkus };
}

/**
 * Daily snapshots sometimes arrive split per stock category. Collapse
 * by `snapshotDate` so the chart renders one point per day rather than
 * a jagged sawtooth.
 */
function collapseSnapshots(rows: InventorySnapshot[]): InventorySnapshot[] {
  const byDate = new Map<string, InventorySnapshot>();
  for (const r of rows) {
    const existing = byDate.get(r.snapshotDate);
    if (!existing) {
      byDate.set(r.snapshotDate, { ...r });
      continue;
    }
    existing.openingQuantity += Number(r.openingQuantity ?? 0);
    existing.closingQuantity += Number(r.closingQuantity ?? 0);
    existing.openingValue += Number(r.openingValue ?? 0);
    existing.closingValue += Number(r.closingValue ?? 0);
    existing.purchaseQuantity += Number(r.purchaseQuantity ?? 0);
    existing.saleQuantity += Number(r.saleQuantity ?? 0);
    existing.transferInQuantity += Number(r.transferInQuantity ?? 0);
    existing.transferOutQuantity += Number(r.transferOutQuantity ?? 0);
    existing.adjustmentQuantity += Number(r.adjustmentQuantity ?? 0);
    existing.damageQuantity += Number(r.damageQuantity ?? 0);
    existing.returnQuantity += Number(r.returnQuantity ?? 0);
    existing.recipeUsageQuantity += Number(r.recipeUsageQuantity ?? 0);
    existing.openingBalanceQuantity += Number(r.openingBalanceQuantity ?? 0);
    existing.reservedQuantity += Number(r.reservedQuantity ?? 0);
    existing.inTransitQuantity += Number(r.inTransitQuantity ?? 0);
  }
  return Array.from(byDate.values()).sort((a, b) =>
    a.snapshotDate.localeCompare(b.snapshotDate),
  );
}
