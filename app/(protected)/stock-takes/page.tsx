import Link from "next/link";
import { Plus, Lock } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-take/columns";
import { getStockTakes } from "@/lib/actions/stock-take-actions";
import { softFetch } from "@/lib/list-fallback";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getStockTakeKpi } from "@/lib/actions/reports-analytics-actions";
import { StockTakeKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import type { CycleCountType, StockTakeStatus } from "@/types/stock-take/type";
import CycleCountTypeFilter from "@/components/widgets/stock-take/cycle-count-filter";

const STATUS_VALUES: StockTakeStatus[] = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "APPROVED",
  "CANCELLED",
];

const CYCLE_COUNT_VALUES: CycleCountType[] = ["FULL", "ABC_CLASS", "RANDOM", "ZONE"];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    cycleCountType?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const status = STATUS_VALUES.find((s) => s === resolvedParams.status);
  const cycleCountType = CYCLE_COUNT_VALUES.find((c) => c === resolvedParams.cycleCountType);

  const [responseData, config, location] = await Promise.all([
    softFetch(getStockTakes(page ? page - 1 : 0, pageLimit, status, cycleCountType)),
    getLocationConfig(),
    getCurrentLocation(),
  ]);

  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;
  const cycleCountingEnabled = config?.cycleCountingEnabled ?? false;

  const kpi = location?.id ? await getStockTakeKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Takes" }]} />
      <PageHeader
        title="Stock Takes"
        subtitle="Cycle counts and physical inventory reconciliation."
        actions={
          <>
            {cycleCountingEnabled && (
              <>
                <CycleCountTypeFilter />
                <Button asChild size="sm">
                  <Link href="/stock-takes/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    New Stock Take
                  </Link>
                </Button>
              </>
            )}
          </>
        }
      />

      <PageBody>
        {!cycleCountingEnabled && (
          <Alert tone="warning">
            <AlertIcon>
              <Lock className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>Cycle counting disabled</AlertTitle>
              <AlertDescription>
                Enable it in location settings before running stock takes.
              </AlertDescription>
            </AlertBody>
          </Alert>
        )}

        {!responseData ? (
          <DataLoadError itemName="stock takes" />
        ) : total > 0 || status || cycleCountType ? (
          <>
            <StockTakeKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="takeNumber"
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
          </>
        ) : cycleCountingEnabled ? (
          <NoItems newItemUrl="/stock-takes/new" itemName="stock takes" />
        ) : null}
      </PageBody>
    </PageShell>
  );
}
