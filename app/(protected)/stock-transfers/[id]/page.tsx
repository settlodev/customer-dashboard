import { ApiResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { StockTransfer } from "@/types/stock-transfer/type";
import { getStockTransferred } from "@/lib/actions/stock-transfer-actions";
import StockTransferForm from "@/components/forms/stock_transfer_form";

type Params = Promise<{ stockVariant: string; id: string }>;

export default async function StockTransferPage({
  params,
}: {
  params: Params;
}) {
  const { stockVariant, id } = await params;
  const isNewItem = id === "new";
  let item: ApiResponse<StockTransfer> | null = null;

  if (!isNewItem) {
    try {
      item = await getStockTransferred(id as UUID, stockVariant as UUID);
      if (item.totalElements == 0) notFound();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load stock transfer details");
    }
  }

  const breadcrumbItems = [
    { title: "Stock Transfers", link: "/stock-transfers" },
    { title: isNewItem ? "New" : "Edit", link: "" },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6 max-w-[900px] mx-auto">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Transfer Stock" : "Edit Transfer"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Transfer stock between locations and track inventory movements
          </p>
        </div>

        <StockTransferForm item={isNewItem ? null : item?.content[0]} />
      </div>
    </div>
  );
}
