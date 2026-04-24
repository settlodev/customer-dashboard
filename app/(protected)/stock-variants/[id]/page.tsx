import { notFound } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStock } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import {
  getMovementsByVariant,
  getMovementSummaryByVariant,
} from "@/lib/actions/stock-movement-actions";
import {
  getStockoutForecast,
  getStockTurnover,
  getAbcAnalysis,
  getReorderSuggestions,
} from "@/lib/actions/inventory-analytics-actions";
import { getBatchesByVariant } from "@/lib/actions/stock-batch-actions";
import { getItemSalesSummary } from "@/lib/actions/item-sales-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import { getVariantSnapshotHistory } from "@/lib/actions/inventory-snapshot-actions";
import { getAuditLogByEntity } from "@/lib/actions/audit-log-actions";
import { getMovementSummaryForVariant } from "@/lib/actions/reports-analytics-actions";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type {
  StockMovement,
  StockMovementSummary,
  MovementTypeBreakdown,
} from "@/types/stock-movement/type";
import type {
  StockoutForecastItem,
  StockTurnoverItem,
  AbcAnalysisItem,
  ReorderSuggestion,
} from "@/types/inventory-analytics/type";
import type { StockBatch } from "@/types/stock-batch/type";
import type { ItemSalesAggregate } from "@/types/item-sales/type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { AuditLogEntry } from "@/types/audit-log/type";
import type { RsMovementSummary } from "@/types/reports-analytics/type";
import { MATERIAL_TYPE_OPTIONS } from "@/types/catalogue/enums";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { StockDetailActions } from "./stock-detail-actions";
import { StockDetailView } from "./stock-detail-view";

type Params = Promise<{ id: string }>;

export default async function StockDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const [stock, location, currency, locationConfig] = await Promise.all([
    getStock(id),
    getCurrentLocation(),
    getLocationCurrency(),
    getLocationConfig(),
  ]);

  if (!stock) notFound();

  const locationId = location?.id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
  const toDate = now.toISOString().split("T")[0];

  const variantIds = new Set(stock.variants.map((v) => v.id));

  // 90-day window for chart time-series; keeps the ledger view anchored on 30d.
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const chartFromDate = ninetyDaysAgo.toISOString().split("T")[0];

  // Parallel: all data fetching
  const [
    allBalances,
    movementPages,
    movementSummaries,
    allForecasts,
    allTurnover,
    allAbc,
    reorderSuggestions,
    batchArrays,
    salesSummary,
    snapshotArrays,
    auditPage,
    rsMovementSummaries,
  ] = await Promise.all([
    locationId ? getBalancesByLocation(locationId) : Promise.resolve([]),
    Promise.all(
      stock.variants.map((v) =>
        locationId
          ? getMovementsByVariant(locationId, v.id, fromDate, toDate, 0, 100)
          : Promise.resolve({ content: [] as StockMovement[], page: 0, size: 100, totalElements: 0, totalPages: 0, last: true }),
      ),
    ),
    locationId
      ? Promise.all(
          stock.variants.map((v) =>
            getMovementSummaryByVariant(locationId, v.id, fromDate, toDate),
          ),
        )
      : Promise.resolve([] as (StockMovementSummary | null)[]),
    getStockoutForecast(),
    getStockTurnover(),
    getAbcAnalysis(),
    getReorderSuggestions(),
    Promise.all(stock.variants.map((v) => getBatchesByVariant(v.id))),
    locationId
      ? getItemSalesSummary(locationId, fromDate, toDate)
      : Promise.resolve(null),
    Promise.all(
      stock.variants.map((v) =>
        getVariantSnapshotHistory(v.id, chartFromDate, toDate),
      ),
    ),
    getAuditLogByEntity("STOCK", id, 0, 50),
    locationId
      ? Promise.all(
          stock.variants.map((v) =>
            getMovementSummaryForVariant(locationId, v.id, fromDate, toDate),
          ),
        )
      : Promise.resolve([] as (RsMovementSummary | null)[]),
  ]);

  // Balance map keyed by variant ID
  const balanceMap: Record<string, InventoryBalance> = {};
  for (const b of allBalances) {
    if (variantIds.has(b.stockVariantId)) balanceMap[b.stockVariantId] = b;
  }

  // Batches map keyed by variant ID
  const batchMap: Record<string, StockBatch[]> = {};
  stock.variants.forEach((v, i) => {
    const batches = batchArrays[i];
    if (batches.length > 0) batchMap[v.id] = batches;
  });

  // Per-variant movement summaries map
  const variantSummaryMap: Record<string, StockMovementSummary> = {};
  stock.variants.forEach((v, i) => {
    const ms = movementSummaries[i];
    if (ms) variantSummaryMap[v.id] = ms;
  });

  // Merged movements sorted by date
  const movements = movementPages
    .flatMap((p) => p.content)
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

  // Merge per-variant summaries into a single combined summary
  const movementSummary: StockMovementSummary = {
    locationId: locationId ?? "",
    startDate: fromDate,
    endDate: toDate,
    totalMovements: movementSummaries.reduce((s, ms) => s + (ms?.totalMovements ?? 0), 0),
    totalQuantityIn: movementSummaries.reduce((s, ms) => s + (ms?.totalQuantityIn ?? 0), 0),
    totalQuantityOut: movementSummaries.reduce((s, ms) => s + (ms?.totalQuantityOut ?? 0), 0),
    netQuantityChange: movementSummaries.reduce((s, ms) => s + (ms?.netQuantityChange ?? 0), 0),
    totalCostIn: movementSummaries.reduce((s, ms) => s + (ms?.totalCostIn ?? 0), 0),
    totalCostOut: movementSummaries.reduce((s, ms) => s + (ms?.totalCostOut ?? 0), 0),
    byType: mergeBreakdowns(movementSummaries.filter((s): s is StockMovementSummary => s !== null)),
  };

  // Filter analytics to this stock's variants
  const forecasts = allForecasts.filter((f) => variantIds.has(f.stockVariantId));
  const turnover = allTurnover.filter((t) => variantIds.has(t.stockVariantId));
  const abc = allAbc.filter((a) => variantIds.has(a.stockVariantId));
  const reorder = reorderSuggestions.filter((r) => variantIds.has(r.stockVariantId));

  // Filter sales data to this stock's variants (sales are by product variant ID,
  // which may differ from stock variant ID — include all for now, the view filters)
  const salesItems: ItemSalesAggregate[] = salesSummary?.items ?? [];

  // Per-variant snapshot map, plus a summed-by-date series for stock-level charts.
  const variantSnapshotMap: Record<string, InventorySnapshot[]> = {};
  stock.variants.forEach((v, i) => {
    variantSnapshotMap[v.id] = snapshotArrays[i] ?? [];
  });
  const stockSnapshots = collapseSnapshots(
    snapshotArrays.flat(),
  );

  // Audit log — entity-scoped to this stock. Variant-level mutations are often
  // captured here too via the StockService entry point.
  const auditEntries: AuditLogEntry[] = auditPage.content ?? [];

  // Reports Service summary — preferred source for movement volumes.
  const rsSummary = mergeRsSummaries(
    rsMovementSummaries.filter((s): s is RsMovementSummary => s !== null),
  );

  // Aggregates
  let totalQty = 0;
  let totalValue = 0;
  let totalReserved = 0;
  let totalInTransit = 0;
  let totalAvailable = 0;
  for (const v of stock.variants) {
    const b = balanceMap[v.id];
    if (b) {
      totalQty += b.quantityOnHand;
      totalValue += b.quantityOnHand * (b.averageCost ?? 0);
      totalReserved += b.reservedQuantity;
      totalInTransit += b.inTransitQuantity;
      totalAvailable += b.availableQuantity;
    }
  }

  const worstRisk = forecasts.reduce<StockoutForecastItem | null>(
    (worst, f) => {
      if (!worst) return f;
      const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NO_CONSUMPTION"];
      return order.indexOf(f.riskLevel) < order.indexOf(worst.riskLevel)
        ? f
        : worst;
    },
    null,
  );

  const avgTurnover =
    turnover.length > 0
      ? turnover.reduce((s, t) => s + t.turnoverRatio, 0) / turnover.length
      : 0;

  const materialLabel =
    MATERIAL_TYPE_OPTIONS.find((o) => o.value === stock.materialType)?.label ??
    stock.materialType;

  const breadcrumbItems = [
    { title: "Stock Items", link: "/stock-variants" },
    { title: stock.name, link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {stock.name}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                stock.archived
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              }`}
            >
              {stock.archived ? "Archived" : "Active"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {materialLabel} &middot; {stock.baseUnitName}
            {stock.description ? ` \u00B7 ${stock.description}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/stock-variants/${id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <StockDetailActions stock={stock} />
        </div>
      </div>

      {/* Tabbed detail content (client component) */}
      <StockDetailView
        stock={stock}
        balanceMap={balanceMap}
        batchMap={batchMap}
        variantSummaryMap={variantSummaryMap}
        movements={movements}
        forecasts={forecasts}
        turnover={turnover}
        abc={abc}
        reorder={reorder}
        salesItems={salesItems}
        movementSummary={movementSummary}
        totalQty={totalQty}
        totalValue={totalValue}
        totalReserved={totalReserved}
        totalInTransit={totalInTransit}
        totalAvailable={totalAvailable}
        worstRisk={worstRisk}
        avgTurnover={avgTurnover}
        currency={currency}
        locationId={locationId ?? null}
        autoReorderEnabled={locationConfig?.autoReorderEnabled ?? false}
        variantSnapshotMap={variantSnapshotMap}
        stockSnapshots={stockSnapshots}
        auditEntries={auditEntries}
        rsSummary={rsSummary}
      />
    </div>
  );
}

/**
 * Flatten per-variant daily snapshots into a single time-series keyed by date.
 * Quantities and values sum across variants; costs pick the weighted average so
 * the stock-level chart stays meaningful for multi-variant stocks.
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

function mergeRsSummaries(summaries: RsMovementSummary[]): RsMovementSummary | null {
  if (summaries.length === 0) return null;
  const base: RsMovementSummary = {
    locationId: summaries[0].locationId,
    startDate: summaries[0].startDate,
    endDate: summaries[0].endDate,
    totalMovements: 0,
    totalQuantityIn: 0,
    totalQuantityOut: 0,
    netQuantityChange: 0,
    totalCostIn: 0,
    totalCostOut: 0,
    byType: [],
  };
  const typeMap = new Map<string, RsMovementSummary["byType"][number]>();
  for (const s of summaries) {
    base.totalMovements += Number(s.totalMovements ?? 0);
    base.totalQuantityIn += Number(s.totalQuantityIn ?? 0);
    base.totalQuantityOut += Number(s.totalQuantityOut ?? 0);
    base.netQuantityChange += Number(s.netQuantityChange ?? 0);
    base.totalCostIn += Number(s.totalCostIn ?? 0);
    base.totalCostOut += Number(s.totalCostOut ?? 0);
    for (const t of s.byType ?? []) {
      const prev = typeMap.get(t.movementType);
      if (prev) {
        prev.count += Number(t.count ?? 0);
        prev.totalQuantity += Number(t.totalQuantity ?? 0);
        prev.totalCost += Number(t.totalCost ?? 0);
      } else {
        typeMap.set(t.movementType, { ...t });
      }
    }
  }
  base.byType = Array.from(typeMap.values()).sort((a, b) => b.count - a.count);
  return base;
}

function mergeBreakdowns(summaries: StockMovementSummary[]): MovementTypeBreakdown[] {
  const map = new Map<string, MovementTypeBreakdown>();
  for (const s of summaries) {
    for (const b of s.byType) {
      const existing = map.get(b.movementType);
      if (existing) {
        existing.count += b.count;
        existing.totalQuantity += b.totalQuantity;
        existing.totalCost += b.totalCost;
      } else {
        map.set(b.movementType, { ...b });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
