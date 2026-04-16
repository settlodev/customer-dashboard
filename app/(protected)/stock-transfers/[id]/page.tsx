import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStockTransfer } from "@/lib/actions/stock-transfer-actions";
import StockTransferForm from "@/components/forms/stock_transfer_form";

type Params = Promise<{ id: string }>;

export default async function StockTransferPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (!isNewItem) {
    const item = await getStockTransfer(resolvedParams.id);
    if (!item) notFound();

    return (
      <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
        <div className="space-y-6">
          <BreadcrumbsNav items={[
            { title: "Stock Transfers", link: "/stock-transfers" },
            { title: item.transferNumber, link: "" },
          ]} />
          <h1 className="text-2xl font-bold">{item.transferNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {item.sourceLocationName} &rarr; {item.destinationLocationName} — {item.status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={[
              { title: "Stock Transfers", link: "/stock-transfers" },
              { title: "New", link: "" },
            ]} />
          </div>
          <h1 className="text-2xl font-bold">New Stock Transfer</h1>
          <p className="text-sm text-muted-foreground">Transfer stock between locations</p>
        </div>
        <StockTransferForm />
      </div>
    </div>
  );
}
