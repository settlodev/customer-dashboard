import { format, startOfYear } from "date-fns";
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
import {
  PlStatementTable,
  fmtSigned,
} from "@/components/reports/profit-loss/pl-statement-table";
import { fetchProfitAndLoss } from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const startDate =
    params.startDate ?? format(startOfYear(new Date()), "yyyy-MM-dd");
  const endDate = params.endDate ?? today;

  const location = await getCurrentLocation();
  const report = location?.id
    ? await fetchProfitAndLoss(location.id, startDate, endDate)
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
        subtitle={`From ${startDate} to ${endDate}. Revenue minus expenses from posted journals.`}
      />
      <PageBody>
        {!report ? (
          <NoItems itemName="P&L data" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<TrendingUp className="h-3 w-3" />}
                label="Gross profit"
                value={fmtSigned(report.grossProfit)}
                unit={report.currencyCode}
                deltaTone={report.grossProfit >= 0 ? "pos" : "neg"}
              />
              <KpiCard
                icon={<Activity className="h-3 w-3" />}
                label="Operating profit"
                value={fmtSigned(report.operatingProfit)}
                unit={report.currencyCode}
                deltaTone={report.operatingProfit >= 0 ? "pos" : "neg"}
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Net profit after tax"
                value={fmtSigned(report.netProfitAfterTax)}
                unit={report.currencyCode}
                deltaTone={report.netProfitAfterTax >= 0 ? "pos" : "neg"}
              />
            </KpiStrip>
            <Card>
              <CardContent className="pt-6">
                <PlStatementTable
                  sections={report.sections}
                  grossProfit={report.grossProfit}
                  operatingProfit={report.operatingProfit}
                  netProfitBeforeTax={report.netProfitBeforeTax}
                  netProfitAfterTax={report.netProfitAfterTax}
                  currencyCode={report.currencyCode}
                />
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
