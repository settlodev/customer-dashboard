import { Card, CardContent } from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock/column";
import { getStocks } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import type { StockWithBalance } from "@/types/stock/type";
import { rollUpBalances } from "@/lib/stock-balance";

export default async function Page() {
  const [stocks, location] = await Promise.all([
    getStocks(),
    getCurrentLocation(),
  ]);

  const balances = location?.id
    ? await getBalancesByLocation(location.id)
    : [];

  const balanceMap = new Map(balances.map((b) => [b.stockVariantId, b]));

  const active: StockWithBalance[] = stocks
    .filter((s) => !s.archived)
    .map((s) => rollUpBalances(s, balanceMap));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex items-center justify-between gap-2">
        <BreadcrumbsNav items={[{ title: "Stocks", link: "/warehouse-stocks" }]} />
      </div>
      {active.length > 0 ? (
        <Card><CardContent className="px-2 sm:px-6 pt-6">
          <DataTable columns={columns} data={active} searchKey="name" pageNo={0} total={active.length} pageCount={1} />
        </CardContent></Card>
      ) : (<NoItems newItemUrl="/warehouse-stocks/new" itemName="stocks" />)}
    </div>
  );
}
