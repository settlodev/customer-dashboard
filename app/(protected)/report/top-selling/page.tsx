import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  CircleDollarSign,
  Layers,
  Package,
  TrendingUp,
} from "lucide-react";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { TopSellingSortToggle } from "@/components/reports/top-selling/top-selling-sort-toggle";
import { TopSellingTable } from "@/components/reports/top-selling/top-selling-table";
import { listTopSellingProducts } from "@/lib/actions/product-actions";
import {
  TOP_SELLING_SORT_LABELS,
  type TopSellingItem,
  type TopSellingSortBy,
} from "@/types/reports/top-selling";

const DEFAULT_LIMIT = 100;
const VALID_SORTS: TopSellingSortBy[] = ["revenue", "quantity", "profit"];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    sort?: string;
    from?: string;
    to?: string;
  }>;
};

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

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;
  const sortParam = resolved.sort ?? "";
  const sortBy: TopSellingSortBy = VALID_SORTS.includes(
    sortParam as TopSellingSortBy,
  )
    ? (sortParam as TopSellingSortBy)
    : "revenue";

  // Default to current month — keeps the first paint scoped, matching
  // every other reporting screen.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const report = await listTopSellingProducts({
    fromDate: from,
    toDate: to,
    sortBy,
    limit: DEFAULT_LIMIT,
  }).catch(() => null);

  const items = report?.items ?? [];
  const currency = report?.summary.currency ?? "TZS";
  const filtered = items.filter((item) => matchesSearch(item, q));
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  const hasAny = items.length > 0;
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters =
    q !== "" || sortParam !== "" || !isDefaultRange;

  const subtitle =
    from === to
      ? `Top performers on ${format(new Date(from), "MMM d, yyyy")}`
      : `Top performers ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Top selling" }]} />
      <PageHeader
        title="Top selling products"
        subtitle={subtitle}
        titleAccessory={
          <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            {TOP_SELLING_SORT_LABELS[sortBy]}
          </span>
        }
      />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TopSellingSortToggle active={sortBy} />
          <OrdersDateFilter from={from} to={to} />
        </div>

        {hasAny || hasFilters ? (
          <ReportBody
            report={report}
            pageData={pageData}
            pageCount={pageCount}
            pageNo={page - 1}
            total={total}
            currency={currency}
          />
        ) : (
          <NoItems itemName="top selling products" />
        )}
      </PageBody>
    </PageShell>
  );
}

function ReportBody({
  report,
  pageData,
  pageCount,
  pageNo,
  total,
  currency,
}: {
  report: Awaited<ReturnType<typeof listTopSellingProducts>>;
  pageData: TopSellingItem[];
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
}) {
  // The summary is server-side aggregated across the whole period, so
  // KPIs don't shimmy when the user types into the search box.
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
    <>
      <KpiStrip cols={4}>
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
          deltaTone="neutral"
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
          deltaTone="neutral"
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
          icon={<Layers className="h-3 w-3" />}
          label="Unique products"
          value={uniqueProducts > 0 ? uniqueProducts.toLocaleString() : "—"}
          delta={
            uniqueCategories > 0
              ? `Across ${uniqueCategories.toLocaleString()} categor${uniqueCategories === 1 ? "y" : "ies"}`
              : undefined
          }
          deltaTone="neutral"
        />
      </KpiStrip>

      <TopSellingTable
        data={pageData}
        pageCount={pageCount}
        pageNo={pageNo}
        total={total}
        currency={currency}
      />
    </>
  );
}
