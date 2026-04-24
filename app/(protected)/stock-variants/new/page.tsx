import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import StockForm from "@/components/forms/stock_form";

const breadcrumbItems = [
  { title: "Stock Items", link: "/stock-variants" },
  { title: "New", link: "" },
];

export default function NewStockPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Add Stock Item
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a new stock item to track inventory
        </p>
      </div>
      <StockForm item={null} />
    </div>
  );
}
