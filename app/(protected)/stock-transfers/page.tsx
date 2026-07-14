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
import { getColumns } from "@/components/tables/stock-transfer/column";
import { searchStockTransfers } from "@/lib/actions/stock-transfer-actions";
import { softFetch } from "@/lib/list-fallback";
import { getCurrentDestination } from "@/lib/actions/context";
import { getStockTransferKpi } from "@/lib/actions/reports-analytics-actions";
import { StockTransferKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import type { TransferStatus } from "@/types/stock-transfer/type";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "Partially Received", value: "PARTIALLY_RECEIVED" },
  { label: "Received", value: "RECEIVED" },
  { label: "Declined", value: "DECLINED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const TABS = [
  { key: "outgoing", label: "Outgoing" },
  { key: "incoming", label: "Incoming" },
] as const;

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    direction?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const direction =
    resolvedParams.direction === "incoming" ? "incoming" : "outgoing";
  const status = (resolvedParams.status || undefined) as
    | TransferStatus
    | undefined;

  const [responseData, location] = await Promise.all([
    softFetch(
      searchStockTransfers(page ? page - 1 : 0, pageLimit, direction, status),
    ),
    getCurrentDestination(),
  ]);

  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const kpi = location?.id ? await getStockTransferKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Transfers" }]} />
      <PageHeader
        title="Stock Transfers"
        subtitle="Move stock between locations, stores, and warehouses."
        actions={
          <Button asChild size="sm">
            <Link href="/stock-transfers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Transfer
            </Link>
          </Button>
        }
      />
      <PageBody>
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {TABS.map((tab) => {
            const params = new URLSearchParams();
            params.set("direction", tab.key);
            if (status) params.set("status", status);
            const active = direction === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/stock-transfers?${params.toString()}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-ink shadow-sm"
                    : "text-muted-foreground hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {!responseData ? (
          <DataLoadError itemName="stock transfers" />
        ) : total > 0 || status ? (
          <>
            <StockTransferKpiStrip summary={kpi} />
            <DataTable
              columns={getColumns({ activeDestinationId: location?.id ?? null })}
              data={data}
              searchKey="transferNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              defaultPageSize={pageLimit}
              filterKey="status"
              filterOptions={STATUS_OPTIONS}
              manualFilter
              rowClickBasePath="/stock-transfers"
            />
          </>
        ) : direction === "outgoing" ? (
          <NoItems newItemUrl="/stock-transfers/new" itemName="stock transfers" />
        ) : (
          <NoItems itemName="incoming transfers" />
        )}
      </PageBody>
    </PageShell>
  );
}
