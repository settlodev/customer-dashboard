import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/roles/columns";
import { searchRoles } from "@/lib/actions/role-actions";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Role } from "@/types/roles/type";
import NoItems from "@/components/layouts/no-items";
import { Plus } from "lucide-react";

const breadcrumbItems = [{ title: "Roles", link: "/roles" }];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const responseData = await searchRoles(q, page, pageLimit);

  const data: Role[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/roles/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Role
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {total > 0 || q !== "" ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              pageCount={pageCount}
              pageNo={page}
              searchKey="name"
              total={total}
              rowClickBasePath="/roles"
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems itemName="roles" newItemUrl="/roles/new" />
      )}
    </div>
  );
}
