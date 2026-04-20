import Link from "next/link";
import { Plus } from "lucide-react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns, SupplierReturnRow } from "@/components/tables/supplier-return/columns";
import { getSupplierReturns } from "@/lib/actions/supplier-return-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { SupplierReturnStatus } from "@/types/supplier-return/type";

const breadcrumbItems = [{ title: "Supplier Returns", link: "/supplier-returns" }];

const STATUS_VALUES: SupplierReturnStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const status = STATUS_VALUES.find((s) => s === resolvedParams.status);

  const [responseData, suppliers] = await Promise.all([
    getSupplierReturns(page ? page - 1 : 0, pageLimit, status),
    fetchAllSuppliers(),
  ]);
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const data: SupplierReturnRow[] = (responseData.content ?? []).map((r) => ({
    ...r,
    supplierName: supplierMap[r.supplierId] ?? null,
  }));
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/supplier-returns/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Return
          </Link>
        </Button>
      </div>

      {total > 0 || status ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="returnNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              disableArchive
              filterKey="status"
              filterOptions={STATUS_VALUES.map((s) => ({
                value: s,
                label: s.replace(/_/g, " "),
              }))}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/supplier-returns/new" itemName="supplier returns" />
      )}
    </div>
  );
}
