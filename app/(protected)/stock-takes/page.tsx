import Link from "next/link";
import { Plus, Lock } from "lucide-react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-take/columns";
import { getStockTakes } from "@/lib/actions/stock-take-actions";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import type { CycleCountType, StockTakeStatus } from "@/types/stock-take/type";
import CycleCountTypeFilter from "@/components/widgets/stock-take/cycle-count-filter";

const breadcrumbItems = [{ title: "Stock Takes", link: "/stock-takes" }];

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

  const [responseData, config] = await Promise.all([
    getStockTakes(page ? page - 1 : 0, pageLimit, status, cycleCountType),
    getLocationConfig(),
  ]);

  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;
  const cycleCountingEnabled = config?.cycleCountingEnabled ?? false;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <div className="flex items-center gap-2">
          {cycleCountingEnabled && <CycleCountTypeFilter />}
          {cycleCountingEnabled && (
            <Button asChild>
              <Link href="/stock-takes/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Stock Take
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!cycleCountingEnabled && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Cycle counting is disabled for this location. Enable it in location
            settings before running stock takes.
          </span>
        </div>
      )}

      {total > 0 || status || cycleCountType ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
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
          </CardContent>
        </Card>
      ) : cycleCountingEnabled ? (
        <NoItems newItemUrl="/stock-takes/new" itemName="stock takes" />
      ) : null}
    </div>
  );
}
