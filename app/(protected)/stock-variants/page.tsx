import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock/column";
import { getStocks } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import type { StockWithBalance } from "@/types/stock/type";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { Plus } from "lucide-react";

const breadcrumbItems = [{ title: "Stock Items", link: "/stock-variants" }];

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
  const balanceMap = new Map(
    balances.map((b) => [b.stockVariantId, b]),
  );

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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/stock-variants/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Stock
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="inline-flex items-center gap-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === tab.key
                ? "bg-background shadow-sm font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
          </Link>
        ))}
      </div>

      {filtered.length > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={filtered}
              searchKey="name"
              pageNo={0}
              total={filtered.length}
              pageCount={1}
              rowClickBasePath="/stock-variants"
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/stock-variants/new" itemName="stock items" />
      )}
    </div>
  );
}
