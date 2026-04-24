import Link from "next/link";
import { Plus } from "lucide-react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-intake-record/columns";
import { searchStockIntakeRecords } from "@/lib/actions/stock-intake-record-actions";
import {
  STOCK_INTAKE_RECORD_STATUS_LABELS,
  StockIntakeRecordStatus,
} from "@/types/stock-intake-record/type";

const breadcrumbItems = [{ title: "Stock Intakes", link: "/stock-intakes" }];

const STATUS_VALUES: StockIntakeRecordStatus[] = ["DRAFT", "CONFIRMED", "CANCELLED"];

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

  const responseData = await searchStockIntakeRecords(
    page ? page - 1 : 0,
    pageLimit,
    status,
  );
  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/stock-intakes/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Record intake
          </Link>
        </Button>
      </div>

      {total > 0 || status ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="referenceNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              disableArchive
              filterKey="status"
              filterOptions={STATUS_VALUES.map((s) => ({
                value: s,
                label: STOCK_INTAKE_RECORD_STATUS_LABELS[s],
              }))}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/stock-intakes/new" itemName="stock intakes" />
      )}
    </div>
  );
}
