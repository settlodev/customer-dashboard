import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStock } from "@/lib/actions/stock-actions";
import StockForm from "@/components/forms/stock_form";

type Params = Promise<{ id: string }>;
export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const isNew = id === "new";
  const item = isNew ? null : await getStock(id);
  if (!isNew && !item) notFound();

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 mt-12">
      <BreadcrumbsNav items={[{ title: "Stock Items", link: "/warehouse-stock-variants" }, { title: isNew ? "New" : item?.name || "Edit", link: "" }]} />
      <h1 className="text-2xl font-bold mt-4">{isNew ? "Add Stock" : "Edit Stock"}</h1>
      <div className="mt-4"><StockForm item={item} /></div>
    </div>
  );
}
