import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { getLpos } from "@/lib/actions/procurement-actions";

export default async function Page() {
  const data = await getLpos(0, 20);
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={[{ title: "Purchase Orders", link: "/purchases" }]} />
      <Card><CardContent className="px-2 sm:px-6 pt-6">
        <p className="text-sm text-muted-foreground">{data.totalElements} purchase orders</p>
      </CardContent></Card>
    </div>
  );
}
