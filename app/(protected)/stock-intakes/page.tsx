import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-intake-record/columns";
import { searchStockIntakeRecords } from "@/lib/actions/stock-intake-record-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getStockIntakeKpi } from "@/lib/actions/reports-analytics-actions";
import { StockIntakeKpiStrip } from "@/components/widgets/inventory/stock-intake-kpi-strip";
import {
  STOCK_INTAKE_RECORD_STATUS_LABELS,
  StockIntakeRecordStatus,
} from "@/types/stock-intake-record/type";

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

  const [responseData, location] = await Promise.all([
    searchStockIntakeRecords(page ? page - 1 : 0, pageLimit, status),
    getCurrentLocation(),
  ]);
  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  const kpi = location?.id ? await getStockIntakeKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Intakes" }]} />
      <PageHeader
        title="Stock Intakes"
        subtitle="Record received goods and confirm batches into inventory."
        actions={
          <Button asChild size="sm">
            <Link href="/stock-intakes/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Record intake
            </Link>
          </Button>
        }
      />
      <PageBody>
        {total > 0 || status ? (
          <>
            <StockIntakeKpiStrip summary={kpi} />
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
          </>
        ) : (
          <NoItems newItemUrl="/stock-intakes/new" itemName="stock intakes" />
        )}
      </PageBody>
    </PageShell>
  );
}
