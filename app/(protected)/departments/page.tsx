import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { StatusTabs } from "@/components/layouts/status-tabs";
import { parseListStatus } from "@/components/layouts/list-status";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/department/columns";
import { searchDepartment } from "@/lib/actions/department-actions";
import { Plus } from "lucide-react";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);
  const status = parseListStatus(resolvedSearchParams.status);

  const responseData = await searchDepartment(q, page, pageLimit);

  // Departments don't carry an `archivedAt` timestamp; the
  // `active` boolean acts as the soft-delete proxy. Treat
  // inactive rows as "archived" so the toggle still works the
  // same way as the rest of the inventory section.
  const data = responseData.content.filter((d) =>
    status === "archived" ? !d.active : d.active,
  );
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Departments" }]} />
      <PageHeader
        title="Departments"
        subtitle="Top-level grouping above categories."
        actions={
          <Button asChild>
            <Link href="/departments/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Department
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/departments" value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                pageNo={page}
                searchKey="name"
                total={total}
                rowClickBasePath="/departments"
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems itemName="departments" newItemUrl="/departments/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
