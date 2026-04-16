import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";

export default async function Page() {
  const warehouse = await getCurrentWarehouse();
  return (
    <div className="flex-1 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={[{ title: "Warehouse Dashboard", link: "/warehouse" }]} />
      <h1 className="text-2xl font-bold mt-4">{warehouse?.name || "Warehouse"}</h1>
      <p className="text-sm text-muted-foreground mt-2">Warehouse overview and reports coming soon.</p>
    </div>
  );
}
