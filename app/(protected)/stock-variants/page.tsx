import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock/column";
import {
  searchStocks,
  getStockCounts,
  type StockView,
} from "@/lib/actions/stock-actions";
import { getCurrentDestination } from "@/lib/actions/context";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import { getInventoryDashboardSummary } from "@/lib/actions/reports-analytics-actions";
import type { StockWithBalance } from "@/types/stock/type";
import { rollUpBalances } from "@/lib/stock-balance";
import type { RsInventoryDashboardSummary } from "@/types/reports-analytics/type";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { InventoryKpiStrip } from "@/components/widgets/inventory/inventory-kpi-strip";
import { StockVariantsHeaderActions } from "@/components/widgets/inventory/stock-variants-header-actions";
import { StockCategoryFilter } from "@/components/widgets/inventory/stock-category-filter";
import { fetchAllStockCategories } from "@/lib/actions/stock-category-actions";

type Props = {
  searchParams: Promise<{
    filter?: string;
    search?: string;
    page?: string;
    limit?: string;
    category?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = sp.filter ?? "active";
  const view: StockView =
    filter === "archived" || filter === "draft" || filter === "all"
      ? filter
      : "active";
  const q = sp.search || "";
  const page = Number(sp.page) || 0;
  const pageLimit = Number(sp.limit);

  // Backend-paginated + searched (one page of stock items per request) so the
  // table pager works and search spans name / variant name / SKU / barcode /
  // serial. A separate counts endpoint feeds every tab badge in one round-trip.
  // Active destination (location OR store). getCurrentLocation() is null in
  // store mode, which would blank a store's balances + KPI; the stock list /
  // counts already follow the X-Location-Id header (the active destination).
  const categoryId = sp.category || undefined;

  const [responseData, counts, destination, stockCategories] = await Promise.all([
    searchStocks(q, page, pageLimit, view, categoryId),
    getStockCounts(),
    getCurrentDestination(),
    fetchAllStockCategories(),
  ]);

  const [balances, summary] = destination?.id
    ? await Promise.all([
        getBalancesByLocation(destination.id),
        getInventoryDashboardSummary(destination.id, "TZS"),
      ])
    : [[], null as RsInventoryDashboardSummary | null];

  // Build a variant→balance lookup
  const balanceMap = new Map(balances.map((b) => [b.stockVariantId, b]));

  // Enrich the current page's stocks with aggregated balance data
  const filtered: StockWithBalance[] = responseData.content.map((stock) =>
    rollUpBalances(stock, balanceMap),
  );
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  // Carry the category filter across tab switches, or picking a tab would
  // silently drop it. Counts stay whole-view totals — /stocks/counts takes no
  // category, and the badges answer "how many drafts do I have", not "how many
  // drafts in this category".
  const withCategory = (base: string) =>
    categoryId
      ? `${base}${base.includes("?") ? "&" : "?"}category=${categoryId}`
      : base;

  const tabs = [
    { key: "active", label: "Active", count: counts.active, href: withCategory("/stock-variants") },
    { key: "draft", label: "Drafts", count: counts.draft, href: withCategory("/stock-variants?filter=draft") },
    { key: "archived", label: "Archived", count: counts.archived, href: withCategory("/stock-variants?filter=archived") },
    { key: "all", label: "All", count: counts.all, href: withCategory("/stock-variants?filter=all") },
  ];


  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Items" }]} />
      <PageHeader
        title="Stock Items"
        subtitle="Inventory across this location · last sync moments ago"
        actions={
          <div className="flex items-center gap-2">
            <StockVariantsHeaderActions />
          </div>
        }
      />

      <PageBody>
        {total > 0 && <InventoryKpiStrip summary={summary} />}

        {/* Filter tabs — design's `.tabs` pill (matches Active/Archived
            on the products list) — with the category filter alongside. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          className="inline-flex w-fit items-center gap-0.5 rounded-md border border-line bg-card p-[3px]"
        >
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                role="tab"
                aria-selected={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  active
                    ? "bg-canvas text-ink"
                    : "text-ink-3 hover:text-ink",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-[3px] px-1.5 font-mono text-[10.5px] tracking-[0.02em]",
                    active
                      ? "border border-line bg-card text-ink-3"
                      : "bg-canvas text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

          {stockCategories.length > 0 && (
            <StockCategoryFilter categories={stockCategories} />
          )}
        </div>

        {total > 0 || q !== "" || categoryId ? (
          <DataTable
            columns={columns}
            data={filtered}
            searchKey="name"
            searchPlaceholder="Search by name, variant, SKU, barcode, or serial…"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            rowClickBasePath="/stock-variants"
          />
        ) : (
          <NoItems newItemUrl="/stock-variants/new" itemName="stock items" />
        )}
      </PageBody>
    </PageShell>
  );
}
