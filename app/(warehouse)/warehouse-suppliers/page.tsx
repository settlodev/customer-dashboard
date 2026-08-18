import { Card, CardContent } from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";

export default async function Page() {
  const data = await fetchAllSuppliers();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={[{ title: "Suppliers", link: "/warehouse-suppliers" }]} />
      <Card><CardContent className="px-2 sm:px-6 pt-6">
        <p className="text-sm text-muted-foreground">{data.length} suppliers</p>
      </CardContent></Card>
    </div>
  );
}
