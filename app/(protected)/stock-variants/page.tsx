import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock/column";
import { getStocks } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import type { StockWithBalance } from "@/types/stock/type";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Boxes,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Layers,
  RefreshCw,
} from "lucide-react";
import { StockVariantsHeaderActions } from "@/components/widgets/inventory/stock-variants-header-actions";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { filter = "active" } = await searchParams;

  const [stocks, location] = await Promise.all([
    getStocks(),
    getCurrentLocation(),
  ]);

  const balances = location?.id
    ? await getBalancesByLocation(location.id)
    : [];

  // Build a variant→balance lookup
  const balanceMap = new Map(balances.map((b) => [b.stockVariantId, b]));

  // Enrich stocks with aggregated balance data
  const enriched: StockWithBalance[] = stocks.map((stock) => {
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
  });

  const activeCount = enriched.filter((s) => !s.archived).length;
  const archivedCount = enriched.filter((s) => s.archived).length;

  const filtered =
    filter === "archived"
      ? enriched.filter((s) => s.archived)
      : filter === "all"
        ? enriched
        : enriched.filter((s) => !s.archived);

  const tabs = [
    { key: "active", label: "Active", count: activeCount, href: "/stock-variants" },
    { key: "archived", label: "Archived", count: archivedCount, href: "/stock-variants?filter=archived" },
    { key: "all", label: "All", count: enriched.length, href: "/stock-variants?filter=all" },
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
        {/* ── Summary KPIs ─────────────────────────────────────────
            Dummy values today — wire to real aggregates later when
            the inventory analytics endpoint exposes them. The shape
            stays stable, so the only churn at that point is the JSX
            values. */}
        <KpiStrip cols={6}>
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Total inventory value"
            value="714,232,919"
            unit="TZS"
            delta="+4.2% wk"
            deltaTone="pos"
            spark={[40, 42, 48, 45, 52, 58, 62, 64]}
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Active SKUs"
            value="12,847"
            delta="+38 today"
            deltaTone="pos"
            spark={[100, 102, 110, 108, 118, 122, 125, 128]}
          />
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Units in stock"
            value="48,290"
            delta="−1.1% wk"
            deltaTone="neg"
            spark={[60, 58, 55, 56, 52, 50, 48, 48]}
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Low-stock alerts"
            value="14"
            unit="SKUs"
            delta="3 critical"
            deltaTone="neg"
            spark={[8, 10, 9, 12, 11, 13, 14, 14]}
          />
          <KpiCard
            icon={<TrendingUp className="h-3 w-3" />}
            label="Sell-through (30d)"
            value="68.4"
            unit="%"
            delta="+2.8 pts"
            deltaTone="pos"
            spark={[55, 58, 60, 62, 64, 66, 67, 68]}
          />
          <KpiCard
            icon={<RefreshCw className="h-3 w-3" />}
            label="Avg. days on hand"
            value="22.6"
            unit="days"
            delta="−1.4 d"
            deltaTone="pos"
            spark={[28, 27, 26, 25, 24, 23, 23, 22.6]}
          />
        </KpiStrip>

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
