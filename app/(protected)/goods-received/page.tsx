import Link from "next/link";
import { Plus } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/grn/columns";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { getGrns } from "@/lib/actions/grn-actions";
import { getCurrentDestination } from "@/lib/actions/context";
import { getGrnKpi } from "@/lib/actions/reports-analytics-actions";
import { GrnKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import { softFetch } from "@/lib/list-fallback";
import { GRN_STATUS_LABELS, GrnStatus } from "@/types/grn/type";

const GRN_STATUS_VALUES: GrnStatus[] = [
  "DRAFT",
  "INSPECTION_HOLD",
  "RECEIVED",
  "CANCELLED",
];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    from?: string;
    to?: string;
    status?: string;
    search?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const from = resolvedParams.from;
  const to = resolvedParams.to;
  const status = GRN_STATUS_VALUES.find((s) => s === resolvedParams.status);
  const search = resolvedParams.search?.trim() || undefined;
  // A live filter must keep the toolbar on screen even when it returns zero
  // rows — otherwise the user lands on the empty state with no way to clear it.
  const hasFilters = Boolean(from || to || status || search);

  const [responseData, location] = await Promise.all([
    softFetch(
      getGrns({
        page: page ? page - 1 : 0,
        size: pageLimit,
        from,
        to,
        status,
        search,
      }),
    ),
    getCurrentDestination(),
  ]);
  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const kpi = location?.id ? await getGrnKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Goods Received" }]} />
      <PageHeader
        title="Goods Received"
        subtitle="Receipt notes against purchase orders — verify, accept, and post stock."
        actions={
          <Button asChild size="sm">
            <Link href="/goods-received/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New GRN
            </Link>
          </Button>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="goods received notes" />
        ) : total > 0 || hasFilters ? (
          <>
            <GrnKpiStrip summary={kpi} />
            <OrdersDateFilter from={from ?? ""} to={to ?? ""} allowClear />
            <DataTable
              columns={columns}
              data={data}
              searchKey="grnNumber"
              searchPlaceholder="Search GRN number or supplier…"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              defaultPageSize={pageLimit}
              disableArchive
              filterKey="status"
              filterOptions={GRN_STATUS_VALUES.map((s) => ({
                value: s,
                label: GRN_STATUS_LABELS[s],
              }))}
              manualFilter
            />
          </>
        ) : (
          <NoItems
            newItemUrl="/goods-received/new"
            itemName="goods received notes"
          />
        )}
      </PageBody>
    </PageShell>
  );
}
