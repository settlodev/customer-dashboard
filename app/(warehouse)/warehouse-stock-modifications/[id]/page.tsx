import { ApiResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StockModification } from "@/types/stock-modification/type";
import { getStockModified } from "@/lib/actions/stock-modification-actions";
import StockModificationForm from "@/components/forms/stock_modification_form";
import { getStockModifiedInWarehouse } from "@/lib/actions/warehouse/stock-modification-actions";
import WarehouseStockModificationForm from "@/components/forms/warehouse/stock_modification_form";

type Params = Promise<{ stockVariant: string; id: string }>;
export default async function StockModificationPage({
  params,
}: {
  params: Params;
}) {
  const paramsData = await params;
  const { stockVariant, id } = paramsData;
  const isNewItem = id === "new";
  let item: ApiResponse<StockModification> | null = null;

  if (!isNewItem) {
    try {
      item = await getStockModifiedInWarehouse(
        id as UUID,
        stockVariant as UUID,
      );
      if (item.totalElements == 0) notFound();
    } catch (error) {
      console.log(error);

      throw new Error("Failed to load stock modification details");
    }
  }

  const breadCrumbItems = [
    { title: "Stock Modification", link: "/stock-modifications" },
    { title: isNewItem ? "New" : item?.content[0].id || "Edit", link: "" },
  ];

  return (
    <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
      <div className={`flex items-center justify-between mb-2`}>
        <div className={`relative flex-1 `}>
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
      </div>
      <StockModificationCard isNewItem={isNewItem} item={item?.content[0]} />
    </div>
  );
}

const StockModificationCard = ({
  isNewItem,
  item,
}: {
  isNewItem: boolean;
  item: StockModification | null | undefined;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{isNewItem ? "Modify Stock Item" : ""}</CardTitle>
      <CardDescription>
        {isNewItem ? "Modify stock item for your business location" : ""}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <WarehouseStockModificationForm item={item} />
    </CardContent>
  </Card>
);
