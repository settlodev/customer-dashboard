import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock/column";
import {
  getStocks,
  getStockCounts,
  type StockView,
} from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import { getInventoryDashboardSummary } from "@/lib/actions/reports-analytics-actions";
import type { StockWithBalance } from "@/types/stock/type";
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

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { filter = "active" } = await searchParams;
  const view: StockView =
    filter === "archived" || filter === "draft" || filter === "all"
      ? filter
      : "active";

  // One backend call returns the rows for the selected tab; a separate
  // counts endpoint feeds every tab badge in a single round-trip — no
  // client-side row filtering and no fetching tabs the merchant didn't
  // open.
  const [rows, counts, location] = await Promise.all([
    getStocks(view),
    getStockCounts(),
    getCurrentLocation(),
  ]);

  const [balances, summary] = location?.id
    ? await Promise.all([
        getBalancesByLocation(location.id),
        getInventoryDashboardSummary(location.id, "TZS"),
      ])
    : [[], null as RsInventoryDashboardSummary | null];

  // Build a variant→balance lookup
  const balanceMap = new Map(balances.map((b) => [b.stockVariantId, b]));

  // Enrich stocks with aggregated balance data
  const enrich = (stock: typeof rows[number]): StockWithBalance => {
    let totalQuantity = 0;
    let totalValue = 0;
    let lowStock = false;
    let outOfStock = false;

    for (const variant of stock.variants) {
      const bal = balanceMap.get(variant.id);
      if (bal) {
        totalQuantity += bal.quantityOnHand;
        totalValue += bal.quantityOnHand * (bal.averageCost ?? 0);
        if (bal.lowStock) lowStock = true;
        if (bal.outOfStock) outOfStock = true;
      }
    }

    return { ...stock, totalQuantity, totalValue, lowStock, outOfStock };
  };

  const filtered: StockWithBalance[] = rows.map(enrich);

  const tabs = [
    { key: "active", label: "Active", count: counts.active, href: "/stock-variants" },
    { key: "draft", label: "Drafts", count: counts.draft, href: "/stock-variants?filter=draft" },
    { key: "archived", label: "Archived", count: counts.archived, href: "/stock-variants?filter=archived" },
    { key: "all", label: "All", count: counts.all, href: "/stock-variants?filter=all" },
  ];


  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Items" }]} />
      <PageHeader
        title="Stock Items"
        subtitle="Inventory across this location · last sync moments ago"
        actions={<StockVariantsHeaderActions />}
      />

      <PageBody>
        {filtered.length > 0 && <InventoryKpiStrip summary={summary} />}

        {/* Filter tabs — design's `.tabs` pill (matches Active/Archived
            on the products list). */}
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

        {filtered.length > 0 ? (
          <DataTable
            columns={columns}
            data={filtered}
            searchKey="name"
            pageNo={0}
            total={filtered.length}
            pageCount={1}
            rowClickBasePath="/stock-variants"
          />
        ) : (
          <NoItems newItemUrl="/stock-variants/new" itemName="stock items" />
        )}
      </PageBody>
    </PageShell>
  );
}
