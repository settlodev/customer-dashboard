import { Card, CardContent } from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock/column";
import { getStocks } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import type { StockWithBalance } from "@/types/stock/type";

const breadcrumbItems = [{ title: "Stock Items", link: "/warehouse-stock-variants" }];

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
    .map((s) => {
      let totalQuantity = 0;
      let totalValue = 0;
      let lowStock = false;
      let outOfStock = false;
      for (const v of s.variants) {
        const bal = balanceMap.get(v.id);
        if (bal) {
          totalQuantity += bal.quantityOnHand;
          totalValue += bal.quantityOnHand * (bal.averageCost ?? 0);
          if (bal.lowStock) lowStock = true;
          if (bal.outOfStock) outOfStock = true;
        }
      }
      return { ...s, totalQuantity, totalValue, lowStock, outOfStock };
    });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />
      {active.length > 0 ? (
        <Card><CardContent className="px-2 sm:px-6 pt-6">
          <DataTable columns={columns} data={active} searchKey="name" pageNo={0} total={active.length} pageCount={1} />
        </CardContent></Card>
      ) : (
        <NoItems newItemUrl="/warehouse-stock-variants/new" itemName="stock items" />
      )}
    </div>
  );
}
