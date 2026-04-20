import Link from "next/link";
import { Plus } from "lucide-react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/grn/columns";
import { getGrns } from "@/lib/actions/grn-actions";

const breadcrumbItems = [{ title: "Goods Received", link: "/goods-received" }];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;

  const responseData = await getGrns(page ? page - 1 : 0, pageLimit);
  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/goods-received/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New GRN
          </Link>
        </Button>
      </div>

      {total > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="grnNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              disableArchive
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/goods-received/new" itemName="goods received notes" />
      )}
    </div>
  );
}
