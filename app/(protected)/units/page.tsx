import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/units/column";
import { UnitOfMeasure } from "@/types/unit/type";
import { getUnits } from "@/lib/actions/unit-actions";

const breadcrumbItems = [{ title: "Units", link: "/units" }];

export default async function Page() {
  const data: UnitOfMeasure[] = await getUnits();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex items-center justify-between mb-2">
        <BreadcrumbsNav items={breadcrumbItems} />
      </div>

      {data.length > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="name"
              pageNo={0}
              total={data.length}
              pageCount={1}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="h-[calc(100vh-240px)] border border-dashed rounded-xl">
          <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
            <h1 className="text-lg font-bold">No units found</h1>
            <p className="text-sm text-muted-foreground">Units of measure will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
