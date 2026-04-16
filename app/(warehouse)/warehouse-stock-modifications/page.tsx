import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-modification/column";
import { searchStockModifications } from "@/lib/actions/stock-modification-actions";
import { Plus } from "lucide-react";

export default async function Page() {
  const data = await searchStockModifications(0, 20);
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex justify-between"><BreadcrumbsNav items={[{ title: "Stock Modifications", link: "/warehouse-stock-modifications" }]} />
        <Button asChild><Link href="/warehouse-stock-modifications/new"><Plus className="mr-1.5 h-4 w-4" />Modify Stock</Link></Button>
      </div>
      {data.totalElements > 0 ? (
        <Card><CardContent className="px-2 sm:px-6 pt-6">
          <DataTable columns={columns} data={data.content} searchKey="modificationNumber" pageNo={0} total={data.totalElements} pageCount={data.totalPages} />
        </CardContent></Card>
      ) : (<NoItems newItemUrl="/warehouse-stock-modifications/new" itemName="stock modifications" />)}
    </div>
  );
}
