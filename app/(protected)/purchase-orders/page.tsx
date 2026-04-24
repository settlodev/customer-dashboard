import Link from "next/link";
import { Plus } from "lucide-react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns, LpoRow } from "@/components/tables/lpo/columns";
import { getLpos } from "@/lib/actions/lpo-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { LpoStatus } from "@/types/lpo/type";

const breadcrumbItems = [{ title: "Purchase Orders", link: "/purchase-orders" }];

const STATUS_VALUES: LpoStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
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
    getLpos(page ? page - 1 : 0, pageLimit, status),
    fetchAllSuppliers(),
  ]);

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const data: LpoRow[] = (responseData.content ?? []).map((l) => ({
    ...l,
    supplierName: supplierMap[l.supplierId] ?? null,
  }));
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/purchase-orders/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Purchase Order
          </Link>
        </Button>
      </div>

      {total > 0 || status ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="lpoNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              disableArchive
              filterKey="status"
              filterOptions={STATUS_VALUES.map((s) => ({ value: s, label: s.replace("_", " ") }))}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/purchase-orders/new" itemName="purchase orders" />
      )}
    </div>
  );
}
