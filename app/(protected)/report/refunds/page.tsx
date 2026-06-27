import { format, subDays } from "date-fns";

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
import { RotateCcwIcon, ShoppingCart, Wallet } from "lucide-react";

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
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;

  // GetRefundReport takes ISO datetime strings; widen the range to whole
  // days so the last day's evening trade is included.
  const start = new Date(`${from}T00:00:00`).toISOString();
  const end = new Date(`${to}T23:59:59`).toISOString();

  const report = await GetRefundReport(start, end).catch(() => null);

  const subtitle =
    from === to
      ? `Refunds on ${format(new Date(from), "MMM d, yyyy")}`
      : `Refunds ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  const items = (report?.refundedItems ?? []).map((item, index) => ({
    ...item,
    id: String(index),
  }));

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const startIdx = (page - 1) * limit;
  const pageData = items.slice(startIdx, startIdx + limit);

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
                value={report.totalRefunds.toLocaleString()}
                delta="transactions"
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Wallet className="h-3 w-3" />}
                label="Total refunded amount"
                value={formatCurrency(report.totalRefundsAmount)}
                unit="TZS"
                deltaTone="neg"
              />
              <KpiCard
                icon={<ShoppingCart className="h-3 w-3" />}
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
                  data={pageData}
                  searchKey="orderItemName"
                  pageNo={page - 1}
                  total={total}
                  pageCount={pageCount}
                />
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
