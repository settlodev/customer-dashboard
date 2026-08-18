import { notFound, redirect } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { getStock, getStockByVariantId } from "@/lib/actions/stock-actions";
import { getCurrentDestination } from "@/lib/actions/context";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import {
  getVariantMovementsPage,
  getMovementSummaryByVariant,
} from "@/lib/actions/stock-movement-actions";
import {
  getStockoutForecast,
  getStockTurnover,
  getAbcAnalysis,
  getReorderSuggestions,
} from "@/lib/actions/inventory-analytics-actions";
import {
  getBatchesByVariant,
  getVariantBatchesPage,
  getBatchConsumptionOrder,
} from "@/lib/actions/stock-batch-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import { getVariantSnapshotHistory } from "@/lib/actions/inventory-snapshot-actions";
import { getAuditLogByEntity } from "@/lib/actions/audit-log-actions";
import { getMovementSummaryForVariant } from "@/lib/actions/reports-analytics-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type {
  StockMovement,
  StockMovementSummary,
  MovementTypeBreakdown,
  PageResponse,
} from "@/types/stock-movement/type";
import { ALL_TIME_START } from "@/types/stock-movement/type";
import type {
  StockoutForecastItem,
  StockTurnoverItem,
  AbcAnalysisItem,
  ReorderSuggestion,
} from "@/types/inventory-analytics/type";
import type { BatchPage, StockBatch } from "@/types/stock-batch/type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { AuditLogEntry } from "@/types/audit-log/type";
import type { RsMovementSummary } from "@/types/reports-analytics/type";
import { MATERIAL_TYPE_OPTIONS } from "@/types/catalogue/enums";
import { StockDetailActions } from "./stock-detail-actions";
import { StockDetailView } from "./stock-detail-view";

type Params = Promise<{ id: string }>;

/** Rows in the server-rendered first page of the movement ledger. */
const LEDGER_PAGE_SIZE = 50;

/** Rows in the server-rendered first page of the batch history. */
const BATCH_PAGE_SIZE = 25;

export default async function StockDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const [stock, location, currency, locationConfig] = await Promise.all([
    getStock(id),
    getCurrentDestination(),
    getLocationCurrency(),
    getLocationConfig(),
  ]);

  // Inbound links from the product detail page, the movement report and the
  // variants table carry a *variant* id, which this stock-keyed route can't
  // fetch. Resolve it to its parent stock and bounce to the canonical URL.
  if (!stock) {
    const parent = await getStockByVariantId(id);
    if (parent) redirect(`/stock-variants/${parent.id}`);
    notFound();
  }

  const locationId = location?.id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
  const toDate = now.toISOString().split("T")[0];

  const variantIds = new Set(stock.variants.map((v) => v.id));

  // 90-day window for chart time-series.
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const chartFromDate = ninetyDaysAgo.toISOString().split("T")[0];

  // The movement ledger opens on the *whole* history — tracing a bad number
  // means walking back to whenever it went wrong, which is rarely inside the
  // last 30 days. Only the first page of the first variant is fetched here;
  // the ledger pages and filters itself from the client after that.
  const ledgerVariant =
    stock.variants.find((v) => !v.archived) ?? stock.variants[0];

  // Parallel: all data fetching
  const [
    allBalances,
    variantMovementPages,
    movementSummaries,
    allForecasts,
    allTurnover,
    allAbc,
    reorderSuggestions,
    batchArrays,
    snapshotArrays,
    auditPage,
    rsMovementSummaries,
    staff,
    initialBatchPage,
    initialConsumptionOrder,
  ] = await Promise.all([
    locationId ? getBalancesByLocation(locationId) : Promise.resolve([]),
    // One page per variant: the ledger opens on the active variant's page, the
    // Activity rail interleaves all of them into a single stock-wide feed.
    locationId
      ? Promise.all(
          stock.variants.map((v) =>
            getVariantMovementsPage({
              locationId,
              variantId: v.id,
              startDate: ALL_TIME_START,
              endDate: toDate,
              page: 0,
              size: LEDGER_PAGE_SIZE,
            }),
          ),
        )
      : Promise.resolve([] as PageResponse<StockMovement>[]),
    // All-time per-variant totals — these label the ledger's tiles and the
    // variant selector's counts, so they must span the same range the ledger
    // opens on.
    locationId
      ? Promise.all(
          stock.variants.map((v) =>
            getMovementSummaryByVariant(
              locationId,
              v.id,
              ALL_TIME_START,
              toDate,
            ),
          ),
        )
      : Promise.resolve([] as (StockMovementSummary | null)[]),
    // Scoped to this stock item: the backend narrows to its variants (and
    // keeps rows an unscoped, location-wide list would drop — a variant that
    // has run dry, or one that is comfortably above its reorder point).
    getStockoutForecast(30, id),
    getStockTurnover(id),
    getAbcAnalysis(365, id),
    getReorderSuggestions(30, 7, 14, id),
    Promise.all(stock.variants.map((v) => getBatchesByVariant(v.id))),
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
    fetchAllStaff().catch(() => []),
    // The batch panel opens on the first active variant and pages itself from
    // there; the consumption-order call backs its headline figures, which must
    // span every open batch rather than just the visible page.
    ledgerVariant
      ? getVariantBatchesPage({
          variantId: ledgerVariant.id,
          page: 0,
          size: BATCH_PAGE_SIZE,
        })
      : Promise.resolve(null as BatchPage | null),
    ledgerVariant
      ? getBatchConsumptionOrder(ledgerVariant.id)
      : Promise.resolve([] as StockBatch[]),
  ]);

  // Movement rows attribute an actor by id, but which id depends on the
  // originating service — some paths stamp the staff PK, others the auth
  // subject. Key the lookup by both so the ledger resolves either.
  const staffNames: Record<string, string> = {};
  for (const s of staff) {
    if (s.id) staffNames[s.id] = s.fullName;
    if (s.authId) staffNames[s.authId] = s.fullName;
  }

  // The ledger renders one variant at a time; hand it that variant's page.
  const ledgerIndex = ledgerVariant
    ? stock.variants.findIndex((v) => v.id === ledgerVariant.id)
    : -1;
  const initialLedgerPage: PageResponse<StockMovement> | null =
    ledgerIndex >= 0 ? (variantMovementPages[ledgerIndex] ?? null) : null;

  // Activity rail: every variant's newest entries on one rail, newest first.
  // Each page is already capped at LEDGER_PAGE_SIZE, so this is a slice of the
  // ledger whenever any variant has more entries than one page holds.
  const activityMovements = variantMovementPages
    .flatMap((p) => p.content)
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  const activityMovementsTruncated = variantMovementPages.some((p) => !p.last);

  // Balance map keyed by variant ID
  const balanceMap: Record<string, InventoryBalance> = {};
  for (const b of allBalances) {
    if (variantIds.has(b.stockVariantId)) balanceMap[b.stockVariantId] = b;
  }

  // Batches map keyed by variant ID. Feeds the activity timeline's flat list
  // and, via per-variant counts, the batch tab's pills — the batch panel itself
  // pages its own rows from the server.
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

  // Merge per-variant summaries into a single combined summary
  const movementSummary: StockMovementSummary = {
    locationId: locationId ?? "",
    startDate: ALL_TIME_START,
    endDate: toDate,
    totalMovements: movementSummaries.reduce(
      (s, ms) => s + (ms?.totalMovements ?? 0),
      0,
    ),
    totalQuantityIn: movementSummaries.reduce(
      (s, ms) => s + (ms?.totalQuantityIn ?? 0),
      0,
    ),
    totalQuantityOut: movementSummaries.reduce(
      (s, ms) => s + (ms?.totalQuantityOut ?? 0),
      0,
    ),
    netQuantityChange: movementSummaries.reduce(
      (s, ms) => s + (ms?.netQuantityChange ?? 0),
      0,
    ),
    totalCostIn: movementSummaries.reduce(
      (s, ms) => s + (ms?.totalCostIn ?? 0),
      0,
    ),
    totalCostOut: movementSummaries.reduce(
      (s, ms) => s + (ms?.totalCostOut ?? 0),
      0,
    ),
    byType: mergeBreakdowns(
      movementSummaries.filter((s): s is StockMovementSummary => s !== null),
    ),
  };

  // Already narrowed to this stock item by the `stockId` param on each call —
  // no client-side filtering needed.
  const forecasts = allForecasts;
  const turnover = allTurnover;
  const abc = allAbc;
  const reorder = reorderSuggestions;

  // Per-variant snapshot map, plus a summed-by-date series for stock-level charts.
  const variantSnapshotMap: Record<string, InventorySnapshot[]> = {};
  stock.variants.forEach((v, i) => {
    variantSnapshotMap[v.id] = snapshotArrays[i] ?? [];
  });
  const stockSnapshots = collapseSnapshots(snapshotArrays.flat());

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

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Items", href: "/stock-variants" },
          { title: stock.name },
        ]}
      />
      <PageHeader
        title={stock.name}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              stock.archived
                ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            }`}
          >
            {stock.archived ? "Archived" : "Active"}
          </span>
        }
        subtitle={
          <>
            {materialLabel} &middot; {stock.baseUnitName}
            {stock.description ? ` \u00B7 ${stock.description}` : ""}
          </>
        }
        className="flex-row items-start justify-between"
        actions={<StockDetailActions stock={stock} />}
      />

      <PageBody>
        <StockDetailView
          stock={stock}
          balanceMap={balanceMap}
          batchMap={batchMap}
          initialBatchPage={initialBatchPage}
          initialConsumptionOrder={initialConsumptionOrder}
          variantSummaryMap={variantSummaryMap}
          initialLedgerPage={initialLedgerPage}
          initialLedgerRange={{ from: "", to: "" }}
          staffNames={staffNames}
          forecasts={forecasts}
          turnover={turnover}
          abc={abc}
          reorder={reorder}
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
          activityMovements={activityMovements}
          activityMovementsTruncated={activityMovementsTruncated}
          rsSummary={rsSummary}
        />
      </PageBody>
    </PageShell>
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
    // One provisional variant makes the whole day's rollup provisional.
    existing.derived = existing.derived || r.derived;
  }
  return Array.from(byDate.values()).sort((a, b) =>
    a.snapshotDate.localeCompare(b.snapshotDate),
  );
}

function mergeRsSummaries(
  summaries: RsMovementSummary[],
): RsMovementSummary | null {
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

function mergeBreakdowns(
  summaries: StockMovementSummary[],
): MovementTypeBreakdown[] {
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
