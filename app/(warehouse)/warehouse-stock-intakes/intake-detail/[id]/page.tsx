import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStockIntakeRecord } from "@/lib/actions/stock-intake-record-actions";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;
export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const item = await getStockIntakeRecord(id);
  if (!item) notFound();
  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 mt-12">
      <BreadcrumbsNav items={[{ title: "Stock Intake", link: "/warehouse-stock-intakes" }, { title: item.referenceNumber, link: "" }]} />
      <h1 className="text-2xl font-bold mt-4">{item.referenceNumber}</h1>
      <p className="text-sm text-muted-foreground">{item.status} — {item.totalItems} items</p>
    </div>
  );
}
