import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getOpeningStock } from "@/lib/actions/opening-stock-actions";
import StockIntakeForm from "@/components/forms/stock_intake_form";

type Params = Promise<{ id: string }>;

export default async function StockIntakePage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (!isNewItem) {
    const item = await getOpeningStock(resolvedParams.id);
    if (!item) notFound();

    return (
      <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
        <div className="space-y-6">
          <BreadcrumbsNav items={[
            { title: "Stock Intake", link: "/stock-intakes" },
            { title: item.referenceNumber, link: "" },
          ]} />
          <h1 className="text-2xl font-bold">{item.referenceNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {item.totalItems} items &middot; Total value: {item.totalValue.toLocaleString()} &middot; {item.status}
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
              { title: "Stock Intake", link: "/stock-intakes" },
              { title: "New", link: "" },
            ]} />
          </div>
          <h1 className="text-2xl font-bold">Record Opening Stock</h1>
          <p className="text-sm text-muted-foreground">Add initial stock quantities and costs</p>
        </div>
        <StockIntakeForm />
      </div>
    </div>
  );
}
