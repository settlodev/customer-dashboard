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
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { creditColumns } from "@/components/tables/reports/credit/column";
import { creditReport } from "@/lib/actions/order-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { CreditReportExport } from "@/components/reports/credit/credit-report-export";
import { ReceiptIcon } from "lucide-react";

type Params = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
  }>;
};

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

export default async function CreditReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const from = resolved.from ?? thirtyDaysAgo;
  const to = resolved.to ?? today;
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;

  // creditReport takes Date objects; widen to whole days so the last
  // day's evening trade is included.
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59`);

  const [creditData, location] = await Promise.all([
    creditReport(start, end).catch(() => null),
    getCurrentLocation().catch(() => null),
  ]);

  const subtitle = creditData
    ? `${format(new Date(creditData.startDate), "MMM d")} – ${format(new Date(creditData.endDate), "MMM d, yyyy")}`
    : "Select a date range to generate a report";

  const orders = (creditData?.unpaidOrders ?? []).map((o) => ({
    ...o,
    id: o.orderId,
  }));
  const total = orders.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const startIdx = (page - 1) * limit;
  const pageData = orders.slice(startIdx, startIdx + limit);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Credit report" },
        ]}
      />
      <PageHeader
        title="Credit report"
        subtitle={subtitle}
        actions={
          <CreditReportExport
            creditData={creditData}
            location={location ?? null}
          />
        }
      />

      <PageBody>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <OrdersDateFilter from={from} to={to} />
        </div>

        <KpiStrip cols={3}>
          <KpiCard
            icon={<ReceiptIcon className="h-3 w-3" />}
            label="Total unpaid orders"
            value={(creditData?.total ?? 0).toLocaleString()}
            delta="orders"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<ReceiptIcon className="h-3 w-3" />}
            label="Total unpaid amount"
            value={fmt(creditData?.totalUnpaidAmount ?? 0)}
            unit="TZS"
            deltaTone="neg"
          />
          <KpiCard
            icon={<ReceiptIcon className="h-3 w-3" />}
            label="Total paid amount"
            value={fmt(creditData?.totalPaidAmount ?? 0)}
            unit="TZS"
            deltaTone="pos"
          />
        </KpiStrip>

        <Card>
          <CardContent className="px-2 pt-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Unpaid orders — {total.toLocaleString()}
              </p>
            </div>
            <DataTable
              columns={creditColumns}
              data={pageData}
              searchKey="orderNumber"
              pageNo={page - 1}
              total={total}
              pageCount={pageCount}
              rowClickBasePath="/orders"
            />
          </CardContent>
        </Card>
      </PageBody>
    </PageShell>
  );
}
