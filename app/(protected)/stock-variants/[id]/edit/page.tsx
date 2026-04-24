import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStock } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import StockForm from "@/components/forms/stock_form";

type Params = Promise<{ id: string }>;

export default async function EditStockPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const stock = await getStock(id);
  if (!stock) notFound();

  const location = await getCurrentLocation();
  const allBalances = location?.id
    ? await getBalancesByLocation(location.id)
    : [];

  const variantIds = new Set(stock.variants.map((v) => v.id));
  const balances: Record<
    string,
    { quantityOnHand: number; averageCost: number | null }
  > = {};
  for (const b of allBalances) {
    if (variantIds.has(b.stockVariantId)) {
      balances[b.stockVariantId] = {
        quantityOnHand: b.quantityOnHand,
        averageCost: b.averageCost,
      };
    }
  }

  const breadcrumbItems = [
    { title: "Stock Items", link: "/stock-variants" },
    { title: stock.name, link: `/stock-variants/${id}` },
    { title: "Edit", link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Edit Stock Item
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update stock details and variants
        </p>
      </div>
      <StockForm item={stock} balances={balances} />
    </div>
  );
}
