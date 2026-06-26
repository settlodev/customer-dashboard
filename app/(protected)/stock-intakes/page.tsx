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
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-intake-record/columns";
import { searchStockIntakeRecords } from "@/lib/actions/stock-intake-record-actions";
import { softFetch } from "@/lib/list-fallback";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getStockIntakeKpi } from "@/lib/actions/reports-analytics-actions";
import { StockIntakeKpiStrip } from "@/components/widgets/inventory/stock-intake-kpi-strip";
import {
  INTAKE_PAYMENT_TERMS_LABELS,
  IntakePaymentTerms,
  STOCK_INTAKE_RECORD_STATUS_LABELS,
  StockIntakeRecordStatus,
} from "@/types/stock-intake-record/type";

const STATUS_VALUES: StockIntakeRecordStatus[] = ["DRAFT", "CONFIRMED", "CANCELLED"];
const PAYMENT_TERMS_VALUES: IntakePaymentTerms[] = ["CREDIT", "CASH", "BANK"];

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
    softFetch(searchStockIntakeRecords(page ? page - 1 : 0, pageLimit, status)),
    getCurrentLocation(),
  ]);
  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const kpi = location?.id ? await getStockIntakeKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Intakes" }]} />
      <PageHeader
        title="Stock Intakes"
        subtitle="Record received goods and confirm batches into inventory."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/stock-intakes/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Record intake
              </Link>
            </Button>
          </>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="stock intakes" />
        ) : total > 0 || status ? (
          <>
            <StockIntakeKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="referenceNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              defaultPageSize={pageLimit}
              disableArchive
              filterKey="status"
              filterOptions={STATUS_VALUES.map((s) => ({
                value: s,
                label: STOCK_INTAKE_RECORD_STATUS_LABELS[s],
              }))}
              extraFilters={[
                {
                  key: "paymentTerms",
                  label: "Payment terms",
                  options: PAYMENT_TERMS_VALUES.map((v) => ({
                    value: v,
                    label: INTAKE_PAYMENT_TERMS_LABELS[v],
                  })),
                },
              ]}
            />
          </>
        ) : (
          <NoItems newItemUrl="/stock-intakes/new" itemName="stock intakes" />
        )}
      </PageBody>
    </PageShell>
  );
}
