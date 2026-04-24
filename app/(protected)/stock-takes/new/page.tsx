import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import StockTakeForm from "@/components/forms/stock-take-form";
import { getLocationConfig } from "@/lib/actions/location-config-actions";

const breadcrumbItems = [
  { title: "Stock Takes", link: "/stock-takes" },
  { title: "New", link: "" },
];

export default async function NewStockTakePage() {
  const config = await getLocationConfig();
  if (!config?.cycleCountingEnabled) notFound();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />
      <div>
        <h1 className="text-2xl font-bold">New Stock Take</h1>
        <p className="text-sm text-muted-foreground">
          Draft → Start (snapshots on-hand) → record counts → Complete →
          Approve (auto-generates variance adjustments).
        </p>
      </div>
      <StockTakeForm />
    </div>
  );
}
