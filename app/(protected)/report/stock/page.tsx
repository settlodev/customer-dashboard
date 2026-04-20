import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import {
  getAbcAnalysis,
  getDeadStock,
  getInventoryValuation,
  getReorderSuggestions,
  getStockAging,
  getStockoutForecast,
  getStockTurnover,
} from "@/lib/actions/inventory-analytics-actions";
import {
  getLocationSnapshotRange,
  getSnapshotForDate,
} from "@/lib/actions/inventory-snapshot-actions";
import { getAuditLogByLocation } from "@/lib/actions/audit-log-actions";
import { getLocationMovementSummary } from "@/lib/actions/reports-analytics-actions";
import { searchStockReservations } from "@/lib/actions/stock-reservation-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import { DayCloseCard } from "@/components/widgets/inventory/day-close-card";
import { StockReportView } from "./stock-report-view";

const breadcrumbItems = [
  { title: "Reports", link: "" },
  { title: "Stock", link: "/report/stock" },
];

export default async function StockReportPage() {
  const location = await getCurrentLocation();
  const locationId = location?.id ?? null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const toDate = now.toISOString().split("T")[0];
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
  const chartFromDate = ninetyDaysAgo.toISOString().split("T")[0];

  const [
    currency,
    balances,
    valuation,
    aging,
    deadStock,
    forecasts,
    reorder,
    abc,
    turnover,
    snapshots,
    auditPage,
    rsSummary,
    todaySnapshot,
    reservationPage,
  ] = await Promise.all([
    getLocationCurrency(),
    locationId ? getBalancesByLocation(locationId) : Promise.resolve([] as InventoryBalance[]),
    getInventoryValuation(),
    getStockAging(),
    getDeadStock(30),
    getStockoutForecast(),
    getReorderSuggestions(),
    getAbcAnalysis(),
    getStockTurnover(),
    getLocationSnapshotRange(chartFromDate, toDate),
    getAuditLogByLocation(0, 100),
    locationId
      ? getLocationMovementSummary(locationId, fromDate, toDate)
      : Promise.resolve(null),
    getSnapshotForDate(toDate),
    locationId
      ? searchStockReservations(locationId, { size: 200 })
      : Promise.resolve<
          Awaited<ReturnType<typeof searchStockReservations>>
        >({
          content: [],
          number: 0,
          size: 0,
          totalElements: 0,
          totalPages: 0,
          last: true,
        }),
  ]);

  const locationSnapshots = collapseSnapshots(snapshots);

  // Aggregate balance metrics
  let totalQty = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const b of balances) {
    totalQty += b.quantityOnHand;
    totalValue += b.quantityOnHand * (b.averageCost ?? 0);
    if (b.outOfStock) outOfStockCount += 1;
    else if (b.lowStock) lowStockCount += 1;
  }
  const activeSkus = balances.length;
  const criticalRiskCount = forecasts.filter(
    (f) => f.riskLevel === "CRITICAL" || f.riskLevel === "HIGH",
  ).length;
  const deadStockCount = deadStock.length;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4">
      <div className="space-y-1">
        <BreadcrumbsNav items={breadcrumbItems} />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Stock report
        </h1>
        <p className="text-muted-foreground text-sm">
          Location-wide inventory health — valuation, risk, movement, and
          activity over the last 30–90 days.
        </p>
      </div>

      <DayCloseCard todaySnapshot={todaySnapshot} currency={currency} />

      <StockReportView
        currency={currency}
        balances={balances}
        valuation={valuation}
        aging={aging}
        deadStock={deadStock}
        forecasts={forecasts}
        reorder={reorder}
        abc={abc}
        turnover={turnover}
        locationSnapshots={locationSnapshots}
        auditEntries={auditPage.content}
        rsSummary={rsSummary}
        totalQty={totalQty}
        totalValue={totalValue}
        activeSkus={activeSkus}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        criticalRiskCount={criticalRiskCount}
        deadStockCount={deadStockCount}
        reservations={reservationPage.content}
      />
    </div>
  );
}

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
