import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import StockIntakeForm from "@/components/forms/stock_intake_form";

const breadcrumbItems = [
  { title: "Stock Intakes", link: "/stock-intakes" },
  { title: "New", link: "" },
];

export default function NewStockIntakePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />
      <div>
        <h1 className="text-2xl font-bold">Record stock intake</h1>
        <p className="text-sm text-muted-foreground">
          Capture stock quantities, costs, and batches. Intakes are created as a draft — confirm to post movements and update inventory.
        </p>
      </div>
      <StockIntakeForm />
    </div>
  );
}
