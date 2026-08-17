import { endOfMonth, format, startOfMonth } from "date-fns";
import { Boxes, Coins, RotateCcw, Wallet } from "lucide-react";

import DataLoadError from "@/components/layouts/data-load-error";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { RefundsDataTable } from "@/components/tables/refunds/refunds-data-table";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { GetRefundReport } from "@/lib/actions/refund-actions";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  fmtRefundAmount,
  pluralize,
  REFUND_REASON_LABELS,
} from "@/types/reports/refunds";

type Params = {
  searchParams: Promise<{
    search?: string;
    /** `RefundReason` code from the table's filter dropdown. */
    reason?: string;
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function RefundsPage({ searchParams }: Params) {
  const resolved = await searchParams;

  // Current month by default — keeps the first load bounded instead of
  // pulling every refund the location has ever issued, same as /orders.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");
  const page = Math.max(1, Number(resolved.page) || 1);
  const limit = Math.max(1, Number(resolved.limit) || DEFAULT_PAGE_SIZE);
  const search = resolved.search?.trim() || undefined;
  // Ignore an unknown code rather than sending it on for a guaranteed
  // empty result — a stale bookmark shouldn't render a broken-looking page.
  const reasonType =
    resolved.reason && resolved.reason in REFUND_REASON_LABELS
      ? resolved.reason
      : undefined;

  const [list, currency] = await Promise.all([
    // The response's totals follow the same filters as its rows, so the KPI
    // strip always describes exactly what's in the table.
    GetRefundReport({
      startDate: from,
      endDate: to,
      page: page - 1,
      size: limit,
      search,
      reasonType,
    }).catch((e) => {
      rethrowIfBoundary(e);
      return null;
    }),
    getLocationCurrency().catch(() => "TZS"),
  ]);

  const subtitle =
    from === to
      ? `Refunds issued on ${format(new Date(from), "MMM d, yyyy")}`
      : `Refunds issued ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  const rows = list?.refunds ?? [];
  const total = list?.totalElements ?? 0;
  const refunded = list?.totalRefundedAmount ?? 0;
  const costBack = list?.totalReturnedCost ?? 0;
  const units = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const marginLost = refunded - costBack;

  // A user-supplied filter means an empty result is a *result*, not a blank
  // slate — keep the table (and its filter controls) on screen so they can
  // clear it. The default month range doesn't count as a filter.
  const hasFilters = !!search || !!reasonType || !!resolved.from || !!resolved.to;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Refunds" }]} />
      <PageHeader
        title="Refunds"
        subtitle={subtitle}
        titleAccessory={
          <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            {currency}
          </span>
        }
      />

      <PageBody>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <OrdersDateFilter from={from} to={to} />
        </div>

        {!list ? (
          <DataLoadError itemName="refunds" />
        ) : total === 0 && !hasFilters ? (
          <NoItems itemName="refunds in this period" />
        ) : (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<RotateCcw className="h-3 w-3" />}
                label="Refunds"
                value={total.toLocaleString()}
                delta={
                  hasFilters ? "Matching your filters" : "Across the period"
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Wallet className="h-3 w-3" />}
                label="Refunded"
                value={fmtRefundAmount(refunded)}
                unit={currency}
                delta={pluralize(total, "line")}
                deltaTone="neg"
              />
              <KpiCard
                icon={<Coins className="h-3 w-3" />}
                label="Cost recovered"
                value={fmtRefundAmount(costBack)}
                unit={currency}
                delta={`${fmtRefundAmount(marginLost)} margin lost`}
                deltaTone="pos"
              />
              <KpiCard
                icon={<Boxes className="h-3 w-3" />}
                label="Units on this page"
                value={units.toLocaleString()}
                delta={`Page ${page}${list.totalPages ? ` of ${list.totalPages}` : ""}`}
                deltaTone="neutral"
              />
            </KpiStrip>

            <RefundsDataTable
              data={rows}
              pageCount={list.totalPages ?? 0}
              pageNo={page - 1}
              total={total}
              defaultPageSize={limit}
            />
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
