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
import { columns } from "@/components/tables/brand/column";
import { searchBrand } from "@/lib/actions/brand-actions";
import { Brand } from "@/types/brand/type";
import { Plus } from "lucide-react";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);
  const status = parseListStatus(resolvedSearchParams.status);

  const responseData = await searchBrand(q, page, pageLimit);

  const data: Brand[] = responseData.content.filter((b) =>
    status === "archived" ? b.archivedAt != null : b.archivedAt == null,
  );
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Brands" }]} />
      <PageHeader
        title="Brands"
        subtitle="Manufacturers and labels stocked by this business."
        actions={
          <Button asChild>
            <Link href="/brands/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Brand
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/brands" value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={data}
                searchKey="name"
                pageNo={page}
                total={total}
                pageCount={pageCount}
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems newItemUrl="/brands/new" itemName="brands" />
        )}
      </PageBody>
    </PageShell>
  );
}

export default Page;
