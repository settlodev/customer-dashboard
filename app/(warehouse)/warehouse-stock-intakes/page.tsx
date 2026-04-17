import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { searchStockIntakeRecords } from "@/lib/actions/stock-intake-record-actions";
import { Plus } from "lucide-react";

export default async function Page() {
  const data = await searchStockIntakeRecords(0, 20);
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex justify-between"><BreadcrumbsNav items={[{ title: "Stock Intake", link: "/warehouse-stock-intakes" }]} />
        <Button asChild><Link href="/warehouse-stock-intakes/new"><Plus className="mr-1.5 h-4 w-4" />Record Stock</Link></Button>
      </div>
      {data.totalElements > 0 ? (
        <Card><CardContent className="px-2 sm:px-6 pt-6"><p className="text-sm text-muted-foreground">{data.totalElements} records</p></CardContent></Card>
      ) : (<NoItems newItemUrl="/warehouse-stock-intakes/new" itemName="stock intakes" />)}
    </div>
  );
}
