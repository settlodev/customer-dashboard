import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { searchShift } from "@/lib/actions/shift-actions";
import { softFetch } from "@/lib/list-fallback";
import { columns } from "@/components/tables/shift/column";

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

  const responseData = await softFetch(searchShift(q, page, pageLimit));

  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Shifts" }]} />
      <PageHeader
        title="Shifts"
        subtitle="Manage shifts in your business location."
        actions={
          <Button asChild size="sm">
            <Link href="/shifts/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Shift
            </Link>
          </Button>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="shifts" />
        ) : total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <DataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                pageNo={page}
                searchKey="name"
                total={total}
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems itemName="Shift" newItemUrl="/shifts/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
