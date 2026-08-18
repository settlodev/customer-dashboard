import { format } from "date-fns";
import { PackageOpen } from "lucide-react";

import { requireReportsReadAll } from "@/lib/auth-utils";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { StockReportDateFilter } from "@/components/reports/stock/stock-report-date-filter";
import { StockMovementReport } from "@/components/reports/stock/stock-movement-report";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getStockMovementReport } from "@/lib/actions/stock-movement-report-actions";
import { thisMonthRange } from "@/lib/date-range";
import { STOCK_LENS_KEYS, type StockLens } from "@/lib/reports/stock-movement";

const DEFAULT_LIMIT = 15;
const PAGE_SIZES = [15, 25, 50];

type Params = {
  searchParams: Promise<{
    asOf?: string;
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
    search?: string;
    lens?: string;
    sort?: string;
  }>;
};

/**
 * Stock report — a paginated per-item movement ledger.
 *
 * All filtering / search / sort / pagination happens on the Inventory Service
 * now: this page reads the URL query, fetches a single page + the KPI summary,
 * and hands them to the client table (which just navigates the URL). Default
 * window is the current month (overridable), Closing follows the "as of" date.
 */
export default async function StockReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const asOf = resolved.asOf ?? today;
  const month = thisMonthRange(now);
  const from = resolved.from ?? month.from;
  const to = resolved.to ?? month.to;

  const page = Math.max(1, Number(resolved.page) || 1);
  const limit = PAGE_SIZES.includes(Number(resolved.limit))
    ? Number(resolved.limit)
    : DEFAULT_LIMIT;
  const search = resolved.search ?? "";
  const lens: StockLens = STOCK_LENS_KEYS.includes(resolved.lens as StockLens)
    ? (resolved.lens as StockLens)
    : "all";
  const sort = resolved.sort ?? "closing,desc";

  const [currency, report] = await Promise.all([
    getLocationCurrency(),
    getStockMovementReport({
      from,
      to,
      asOf,
      page: page - 1,
      size: limit,
      search: search || undefined,
      lens,
      sort,
    }),
  ]);

  const rangeLabel =
    from === to
      ? format(new Date(from), "MMM d, yyyy")
      : `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  const closingSub =
    asOf >= today
      ? "on hand now"
      : `as of ${format(new Date(asOf), "MMM d, yyyy")}`;

  // Genuinely empty (no data at all), not just a filtered-out search/lens.
  const noData = report.totalElements === 0 && !search && lens === "all";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Stock" }, { title: "Movement report" }]}
      />
      <PageHeader
        title="Stock report"
        subtitle={`Movement · ${rangeLabel}`}
        actions={<StockReportDateFilter asOf={asOf} from={from} to={to} />}
      />

      <PageBody>
        {noData ? (
          <EmptyMovement />
        ) : (
          <StockMovementReport
            summary={report.summary}
            rows={report.content}
            currency={currency}
            closingSub={closingSub}
            from={from}
            to={to}
            asOf={asOf}
            search={search}
            lens={lens}
            sort={sort}
            page={page}
            limit={limit}
            pageSizes={PAGE_SIZES}
            totalElements={report.totalElements}
            totalPages={report.totalPages}
          />
        )}
      </PageBody>
    </PageShell>
  );
}

/**
 * Shown when the period has no per-item movement to report. The ledger is
 * sourced from end-of-day snapshots, written when a business day is closed.
 */
function EmptyMovement() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-card px-6 py-20 text-center shadow-sm">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-2">
        <PackageOpen className="h-6 w-6" strokeWidth={1.4} />
      </div>
      <h2 className="text-[15px] font-semibold text-ink">
        No movement for this period
      </h2>
      <p className="max-w-md text-[13px] text-muted-foreground">
        Stock movement is recorded from end-of-day snapshots. Once a business
        day in this range has been closed, every item&apos;s opening, in, out,
        and closing figures show up here. Try widening the period or closing the
        current day.
      </p>
    </div>
  );
}
