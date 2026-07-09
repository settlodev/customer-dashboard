import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { requireReportsReadAll } from "@/lib/auth-utils";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { TaxReportPeriodToggle } from "@/components/reports/tax/tax-report-period-toggle";
import { TaxReportBreakdownToggle } from "@/components/reports/tax/tax-report-breakdown-toggle";
import { TaxReportTable } from "@/components/reports/tax/tax-report-table";
import { getTaxReport } from "@/lib/actions/tax-report-actions";
import type { TaxReportBreakdown, TaxReportPeriod } from "@/types/reports/tax";

type Params = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    period?: string;
    breakdown?: string;
  }>;
};

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

export default async function TaxReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");
  const period: TaxReportPeriod = resolved.period === "month" ? "month" : "day";
  const breakdown: TaxReportBreakdown =
    resolved.breakdown === "product" ? "product" : "taxCode";

  const report = await getTaxReport(from, to, period, breakdown);

  const subtitle =
    from === to
      ? `Tax on ${format(new Date(from), "MMM d, yyyy")}`
      : `Tax ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  const multiCurrency = report.totalsByCurrency.length > 1;
  const hasData = report.rows.length > 0;

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs items={[{ title: "Tax" }]} />
      <PageHeader title="Tax report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TaxReportPeriodToggle active={period} />
            <TaxReportBreakdownToggle active={breakdown} />
          </div>
          <OrdersDateFilter from={from} to={to} />
        </div>

        {hasData ? (
          <>
            {multiCurrency ? (
              <KpiStrip
                cols={
                  Math.min(report.totalsByCurrency.length, 6) as 2 | 3 | 4 | 5 | 6
                }
              >
                {report.totalsByCurrency.map((c) => (
                  <KpiCard
                    key={c.currency}
                    label={`Tax collected (${c.currency})`}
                    value={formatMoney(c.taxAmount)}
                    unit={c.currency}
                    delta={`${formatMoney(c.taxableAmount)} taxable`}
                    deltaTone="neutral"
                  />
                ))}
              </KpiStrip>
            ) : (
              <KpiStrip cols={2}>
                <KpiCard
                  label="Tax collected"
                  value={
                    report.totalTaxAmount !== null
                      ? formatMoney(report.totalTaxAmount)
                      : "—"
                  }
                  unit={report.totalsByCurrency[0]?.currency}
                />
                <KpiCard
                  label="Taxable amount"
                  value={
                    report.totalTaxableAmount !== null
                      ? formatMoney(report.totalTaxableAmount)
                      : "—"
                  }
                  unit={report.totalsByCurrency[0]?.currency}
                />
              </KpiStrip>
            )}

            <TaxReportTable
              data={report.rows}
              breakdown={breakdown}
              multiCurrency={multiCurrency}
            />
          </>
        ) : (
          <NoItems itemName="taxed sales for this period" />
        )}
      </PageBody>
    </PageShell>
  );
}
