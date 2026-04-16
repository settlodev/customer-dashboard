import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStockModification } from "@/lib/actions/stock-modification-actions";
import StockModificationForm from "@/components/forms/stock_modification_form";

type Params = Promise<{ id: string }>;

export default async function StockModificationPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (!isNewItem) {
    // Modifications are read-only after creation — redirect to list
    const item = await getStockModification(resolvedParams.id);
    if (!item) notFound();

    const breadcrumbItems = [
      { title: "Stock Modifications", link: "/stock-modifications" },
      { title: item.modificationNumber, link: "" },
    ];

    return (
      <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
        <div className="space-y-6">
          <BreadcrumbsNav items={breadcrumbItems} />
          <h1 className="text-2xl font-bold">{item.modificationNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {item.category} — {item.reason}
          </p>
          {/* TODO: Show modification details read-only */}
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { title: "Stock Modifications", link: "/stock-modifications" },
    { title: "New", link: "" },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl font-bold">Stock Modification</h1>
          <p className="text-sm text-muted-foreground">Record a stock adjustment</p>
        </div>
        <StockModificationForm />
      </div>
    </div>
  );
}
