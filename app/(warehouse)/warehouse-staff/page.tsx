import { Card, CardContent } from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/staff/columns";
import { searchWarehouseStaff } from "@/lib/actions/warehouse/staff-actions";
import type { StaffListEnriched } from "@/types/staff";

const breadcrumbItems = [{ title: "Warehouse Staff", link: "/warehouse-staff" }];

export default async function Page() {
  const data = await searchWarehouseStaff();
  const staff = data.content ?? [];

  // The shared staff columns expect the enriched envelope. The
  // warehouse staff endpoint returns plain Staff records (no
  // gamification or loyalty roll-up), so wrap each row in an empty
  // envelope and reuse the same UI.
  const rows: Array<StaffListEnriched & { id: string }> = staff.map((s) => ({
    id: s.id,
    staff: s,
    gamificationSummary: null as unknown as StaffListEnriched["gamificationSummary"],
    loyaltyPoints: 0,
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />
      {rows.length > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={rows}
              searchKey="firstName"
              pageNo={data.number ?? 0}
              total={data.totalElements ?? rows.length}
              pageCount={data.totalPages ?? 1}
              rowClickBasePath="/staff"
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/staff/new" itemName="staff members" />
      )}
    </div>
  );
}
