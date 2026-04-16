import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import StockIntakeForm from "@/components/forms/stock_intake_form";

type Params = Promise<{ id: string }>;
export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const isNew = id === "new";
  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 mt-12">
      <BreadcrumbsNav items={[{ title: "Stock Intake", link: "/warehouse-stock-intakes" }, { title: isNew ? "New" : "Detail", link: "" }]} />
      <h1 className="text-2xl font-bold mt-4">{isNew ? "Record Opening Stock" : "Intake Detail"}</h1>
      {isNew && <div className="mt-4"><StockIntakeForm /></div>}
    </div>
  );
}
