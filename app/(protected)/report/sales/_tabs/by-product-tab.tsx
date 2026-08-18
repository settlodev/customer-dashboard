import { CircleDollarSign, Layers, Package, Receipt, TrendingUp } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { TopSellingSortToggle } from "@/components/reports/top-selling/top-selling-sort-toggle";
import { TopSellingTable } from "@/components/reports/top-selling/top-selling-table";
import { listTopSellingProducts } from "@/lib/actions/product-actions";
import {
  type TopSellingItem,
  type TopSellingSortBy,
} from "@/types/reports/top-selling";

const DEFAULT_LIMIT = 100;

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

const matchesSearch = (item: TopSellingItem, q: string): boolean => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    item.productName.toLowerCase().includes(needle) ||
    (item.variantName ?? "").toLowerCase().includes(needle) ||
    (item.categoryName ?? "").toLowerCase().includes(needle)
  );
};

interface Props {
  from: string;
  to: string;
  search: string;
  page: number;
  limit: number;
  sortBy: TopSellingSortBy;
}

/**
 * Sales by product — the top-selling leaderboard, scoped to the hub's
 * shared date range. Rows drill into each product's detail Sales tab.
 * Mirrors the standalone /report/top-selling page so the two stay in sync.
 */
export async function ByProductTab({
  from,
  to,
  search,
  page,
  limit,
  sortBy,
}: Props) {
  const report = await listTopSellingProducts({
    fromDate: from,
    toDate: to,
    sortBy,
    limit: DEFAULT_LIMIT,
  }).catch(() => null);

  const items = report?.items ?? [];
  const currency = report?.summary.currency ?? "TZS";
  const filtered = items.filter((item) => matchesSearch(item, search));
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const startIdx = (page - 1) * limit;
  const pageData = filtered.slice(startIdx, startIdx + limit);

  if (items.length === 0 && search === "") {
    return <NoItems itemName="product sales for this period" />;
  }

  // Summary is aggregated server-side across the whole period, so KPIs
  // stay stable as the user searches/paginates.
  const summary = report?.summary;
  const top = report?.items?.[0] ?? null;
  const revenue = summary?.totalRevenue ?? 0;
  const itemsSold = summary?.totalQuantitySold ?? 0;
  const grossProfit = summary?.totalGrossProfit ?? 0;
  const avgMargin = summary?.averageMargin;
  const uniqueProducts = summary?.uniqueProductCount ?? 0;
  const uniqueCategories = summary?.uniqueCategoryCount ?? 0;
  const totalOrders = summary?.totalOrdersCount ?? 0;

  return (
    <div className="space-y-6">
      <KpiStrip cols={5}>
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Revenue"
          value={revenue > 0 ? formatMoney(revenue) : "—"}
          unit={currency}
          delta={
            totalOrders > 0
              ? `${totalOrders.toLocaleString()} order${totalOrders === 1 ? "" : "s"}`
              : undefined
          }
        />
        <KpiCard
          icon={<Package className="h-3 w-3" />}
          label="Items sold"
          value={itemsSold > 0 ? itemsSold.toLocaleString() : "—"}
          delta={
            top
              ? `Leader: ${top.productName}${top.variantName ? ` · ${top.variantName}` : ""}`
              : undefined
          }
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label={grossProfit >= 0 ? "Gross profit" : "Gross loss"}
          value={grossProfit !== 0 ? formatMoney(Math.abs(grossProfit)) : "—"}
          unit={currency}
          delta={
            avgMargin !== null && avgMargin !== undefined
              ? `${avgMargin.toFixed(1)}% avg margin`
              : "Margin —"
          }
          deltaTone={grossProfit >= 0 ? "pos" : "neg"}
        />
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Tax collected"
          value={
            summary?.totalTaxAmount && summary.totalTaxAmount > 0
              ? formatMoney(summary.totalTaxAmount)
              : "—"
          }
          unit={
            summary?.totalTaxAmount && summary.totalTaxAmount > 0
              ? currency
              : undefined
          }
        />
        <KpiCard
          icon={<Layers className="h-3 w-3" />}
          label="Unique products"
          value={uniqueProducts > 0 ? uniqueProducts.toLocaleString() : "—"}
          delta={
            uniqueCategories > 0
              ? `Across ${uniqueCategories.toLocaleString()} categor${uniqueCategories === 1 ? "y" : "ies"}`
              : undefined
          }
        />
      </KpiStrip>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          Rank by
        </span>
        <TopSellingSortToggle active={sortBy} />
      </div>

      <TopSellingTable
        data={pageData}
        pageCount={pageCount}
        pageNo={page - 1}
        total={total}
        currency={currency}
        rowClickQuery={`?tab=sales&from=${from}&to=${to}`}
        hideAveragePrice
      />
    </div>
  );
}
