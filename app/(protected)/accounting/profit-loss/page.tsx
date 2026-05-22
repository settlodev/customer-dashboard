import { format, startOfYear } from "date-fns";
import { TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { fetchProfitAndLoss } from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import type { AccountBalanceRow } from "@/types/reports/type";

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Section({
  title,
  rows,
  total,
  currency,
}: {
  title: string;
  rows: AccountBalanceRow[];
  total: number;
  currency: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Account</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-4 text-center text-xs text-muted-foreground"
                >
                  No activity
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.accountId ?? r.code} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-2.5">{r.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {fmt(r.balance)}
                  </td>
                </tr>
              ))
            )}
            <tr className="border-t bg-gray-50/60 font-medium">
              <td colSpan={2} className="px-4 py-2.5">
                Total {title.toLowerCase()}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                {fmt(total)} {currency}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  // const startDate =
  //   params.startDate ?? format(subDays(new Date(), 30), "yyyy-MM-dd");
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
        title="Profit \ loss"
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
                label="Revenue"
                value={fmt(report.totalRevenue)}
                unit={report.currencyCode}
                deltaTone="pos"
              />
              <KpiCard
                icon={<TrendingDown className="h-3 w-3" />}
                label="Expenses"
                value={fmt(report.totalExpenses)}
                unit={report.currencyCode}
                deltaTone="neg"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Net income"
                value={fmt(report.netIncome)}
                unit={report.currencyCode}
                deltaTone={report.netIncome >= 0 ? "pos" : "neg"}
              />
            </KpiStrip>
            <Card>
              <CardContent className="space-y-6 pt-6">
                <Section
                  title="Revenue"
                  rows={report.revenue}
                  total={report.totalRevenue}
                  currency={report.currencyCode}
                />
                <Section
                  title="Expenses"
                  rows={report.expenses}
                  total={report.totalExpenses}
                  currency={report.currencyCode}
                />
                <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
                  <span className="text-base font-semibold">Net income</span>
                  <span
                    className={`font-mono tabular-nums text-lg font-semibold ${
                      report.netIncome >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {fmt(report.netIncome)} {report.currencyCode}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
