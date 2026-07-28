import { format } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { requireReportsReadAll } from "@/lib/auth-utils";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/refunds/report-column";
import { GetRefundReport } from "@/lib/actions/refund-actions";
import { Coins, RotateCcwIcon, Wallet } from "lucide-react";

type Params = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
  }>;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);

export default async function RefundReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  const today = format(new Date(), "yyyy-MM-dd");
  const from = resolved.from ?? today;
  const to = resolved.to ?? today;
  const page = Math.max(1, Number(resolved.page) || 1);
  const limit = Math.max(1, Number(resolved.limit) || 10);

  // Server-paginated: the Reports service slices the rows (backend `page` is
  // 0-indexed) and returns range-wide summary totals, so the KPI strip stays
  // constant across pages and the table never truncates at the backend's
  // default page size.
  const report = await GetRefundReport({
    startDate: from,
    endDate: to,
    page: page - 1,
    size: limit,
  }).catch(() => null);

  const rows = report?.refunds ?? [];
  const total = report?.totalElements ?? 0;
  const pageCount = report?.totalPages ?? 0;

  const subtitle =
    from === to
      ? `Refunds on ${format(new Date(from), "MMM d, yyyy")}`
      : `Refunds ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Refund report" },
        ]}
      />
      <PageHeader title="Refund report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <OrdersDateFilter from={from} to={to} />
        </div>

        {!report || total === 0 ? (
          <NoItems itemName="refunds in this period" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<RotateCcwIcon className="h-3 w-3" />}
                label="Total refunds"
                value={report.totalRefundCount.toLocaleString()}
                delta="transactions"
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Wallet className="h-3 w-3" />}
                label="Total refunded amount"
                value={formatCurrency(report.totalRefundedAmount)}
                unit="TZS"
                deltaTone="neg"
              />
              <KpiCard
                icon={<Coins className="h-3 w-3" />}
                label="Total returned cost"
                value={formatCurrency(report.totalReturnedCost)}
                unit="TZS"
                deltaTone="neutral"
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Refunded items — {total.toLocaleString()}
                  </p>
                </div>
                <DataTable
                  columns={columns}
                  data={rows}
                  searchKey="orderItemName"
                  hideSearch
                  pageNo={page - 1}
                  total={total}
                  pageCount={pageCount}
                  defaultPageSize={limit}
                />
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
