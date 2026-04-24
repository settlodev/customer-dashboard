import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/staff/columns";
import { fetchStaffPage, searchStaffByName } from "@/lib/actions/staff-actions";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Staff } from "@/types/staff";
import NoItems from "@/components/layouts/no-items";
import { Plus } from "lucide-react";

const breadcrumbItems = [{ title: "Staff", link: "/staff" }];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search?.trim() ?? "";
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit) || 20;

  let data: Staff[];
  let total: number;
  let pageCount: number;

  if (q) {
    // Backend /search returns a flat list — paginate client-side.
    const results = await searchStaffByName(q);
    data = results;
    total = results.length;
    pageCount = 1;
  } else {
    const response = await fetchStaffPage(page, pageLimit);
    data = response.content ?? [];
    total = response.totalElements ?? data.length;
    pageCount = response.totalPages ?? 1;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/staff/new/edit">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        </div>
      </div>

      {total > 0 || q !== "" ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              pageCount={pageCount}
              pageNo={page}
              searchKey="firstName"
              total={total}
              rowClickBasePath="/staff"
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems itemName="staff" newItemUrl="/staff/new/edit" />
      )}
    </div>
  );
}
