import { notFound } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStock } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import { getMovementsByVariant } from "@/lib/actions/stock-movement-actions";
import {
  getStockoutForecast,
  getStockTurnover,
  getAbcAnalysis,
  getMovementSummary,
} from "@/lib/actions/inventory-analytics-actions";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type { StockMovement } from "@/types/stock-movement/type";
import type {
  StockoutForecastItem,
  StockTurnoverItem,
  AbcAnalysisItem,
  MovementTypeSummary,
} from "@/types/inventory-analytics/type";
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
  const [stock, location] = await Promise.all([
    getStock(id),
    getCurrentLocation(),
  ]);

  if (!stock) notFound();

  const locationId = location?.id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
  const toDate = now.toISOString().split("T")[0];

  // Parallel: all analytics + balances + movements
  const [
    allBalances,
    movementArrays,
    allForecasts,
    allTurnover,
    allAbc,
    movementSummary,
  ] = await Promise.all([
    locationId ? getBalancesByLocation(locationId) : Promise.resolve([]),
    Promise.all(
      stock.variants.map((v) =>
        locationId
          ? getMovementsByVariant(locationId, v.id)
          : Promise.resolve([] as StockMovement[]),
      ),
    ),
    getStockoutForecast(),
    getStockTurnover(),
    getAbcAnalysis(),
    getMovementSummary(fromDate, toDate),
  ]);

  // Filter to this stock's variants
  const variantIds = new Set(stock.variants.map((v) => v.id));

  const balanceMap: Record<string, InventoryBalance> = {};
  for (const b of allBalances) {
    if (variantIds.has(b.stockVariantId)) balanceMap[b.stockVariantId] = b;
  }

  const movements = movementArrays
    .flat()
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

  const forecasts = allForecasts.filter((f) =>
    variantIds.has(f.stockVariantId),
  );
  const turnover = allTurnover.filter((t) =>
    variantIds.has(t.stockVariantId),
  );
  const abc = allAbc.filter((a) => variantIds.has(a.stockVariantId));

  // Aggregates
  let totalQty = 0;
  let totalValue = 0;
  for (const v of stock.variants) {
    const b = balanceMap[v.id];
    if (b) {
      totalQty += b.quantityOnHand;
      totalValue += b.quantityOnHand * (b.averageCost ?? 0);
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
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4">
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
        movements={movements}
        forecasts={forecasts}
        turnover={turnover}
        abc={abc}
        movementSummary={movementSummary}
        totalQty={totalQty}
        totalValue={totalValue}
        worstRisk={worstRisk}
        avgTurnover={avgTurnover}
      />
    </div>
  );
}
