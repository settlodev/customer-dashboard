import { Activity, TrendingUp, CircleDollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { PlMonthlyTable } from "@/components/reports/profit-loss/pl-monthly-table";
import { PlPeriodControl } from "@/components/reports/profit-loss/pl-period-control";
import {
  PlStatementTable,
  fmtSigned,
} from "@/components/reports/profit-loss/pl-statement-table";
import {
  fetchMonthlyProfitAndLoss,
  fetchProfitAndLoss,
} from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import {
  formatPlRangeLabel,
  resolvePlRange,
  resolvePlView,
  toMonthRange,
} from "@/lib/pl-period";

/**
 * Profit & Loss. URL-driven: `view` picks the single-period statement or
 * the month-by-month table, `from`/`to` bound the window. With no params
 * the page opens on the current month; "This year" is one click away.
 */
export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const view = resolvePlView(params.view);
  const { from, to } = resolvePlRange(params, now);

  const location = await getCurrentLocation();

  const [statement, monthly] = await Promise.all([
    location?.id && view === "statement"
      ? fetchProfitAndLoss(location.id, from, to)
      : Promise.resolve(null),
    location?.id && view === "monthly"
      ? (() => {
          const { fromMonth, toMonth } = toMonthRange(from, to);
          return fetchMonthlyProfitAndLoss(location.id, fromMonth, toMonth);
        })()
      : Promise.resolve(null),
  ]);

  const report = view === "monthly" ? monthly : statement;
  const kpis = report
    ? view === "monthly" && monthly
      ? {
          gross: monthly.grossProfit.total,
          operating: monthly.operatingProfit.total,
          net: monthly.netProfitAfterTax.total,
          currency: monthly.currencyCode,
        }
      : statement
        ? {
            gross: statement.grossProfit,
            operating: statement.operatingProfit,
            net: statement.netProfitAfterTax,
            currency: statement.currencyCode,
          }
        : null
    : null;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Profit & Loss" },
        ]}
      />
      <PageHeader
        title="Profit & loss"
        subtitle={`${formatPlRangeLabel(from, to, now)}. Revenue minus expenses from posted journals.`}
        actions={<PlPeriodControl view={view} from={from} to={to} />}
      />
      <PageBody>
        {!report || !kpis ? (
          <NoItems itemName="P&L data" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<TrendingUp className="h-3 w-3" />}
                label="Gross profit"
                value={fmtSigned(kpis.gross)}
                unit={kpis.currency}
                deltaTone={kpis.gross >= 0 ? "pos" : "neg"}
              />
              <KpiCard
                icon={<Activity className="h-3 w-3" />}
                label="Operating profit"
                value={fmtSigned(kpis.operating)}
                unit={kpis.currency}
                deltaTone={kpis.operating >= 0 ? "pos" : "neg"}
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Net profit after tax"
                value={fmtSigned(kpis.net)}
                unit={kpis.currency}
                deltaTone={kpis.net >= 0 ? "pos" : "neg"}
              />
            </KpiStrip>
            <Card>
              <CardContent className="pt-6">
                {view === "monthly" && monthly ? (
                  <PlMonthlyTable report={monthly} />
                ) : statement ? (
                  <PlStatementTable
                    sections={statement.sections}
                    grossProfit={statement.grossProfit}
                    operatingProfit={statement.operatingProfit}
                    netProfitBeforeTax={statement.netProfitBeforeTax}
                    netProfitAfterTax={statement.netProfitAfterTax}
                    currencyCode={statement.currencyCode}
                  />
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
