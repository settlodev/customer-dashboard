import { Card, CardContent } from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/staff/columns";
import { searchWarehouseStaff } from "@/lib/actions/warehouse/staff-actions";

const breadcrumbItems = [{ title: "Warehouse Staff", link: "/warehouse-staff" }];

export default async function Page() {
  const data = await searchWarehouseStaff();
  const staff = data.content ?? [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />
      {staff.length > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={staff}
              searchKey="firstName"
              pageNo={data.number ?? 0}
              total={data.totalElements ?? staff.length}
              pageCount={data.totalPages ?? 1}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/warehouse-staff/new/edit" itemName="staff members" />
      )}
    </div>
  );
}
