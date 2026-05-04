import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/staff/columns";
import { fetchStaffPage, searchStaffByName } from "@/lib/actions/staff-actions";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Staff } from "@/types/staff";
import NoItems from "@/components/layouts/no-items";

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
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Staff" }]} />
      <PageHeader
        title="Staff"
        subtitle="Manage staff members for this location."
        actions={
          <Button asChild size="sm">
            <Link href="/staff/new/edit">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        }
      />
      <PageBody>
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
      </PageBody>
    </PageShell>
  );
}
