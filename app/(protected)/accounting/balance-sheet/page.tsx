import { format } from "date-fns";
import { Scale, ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { fetchBalanceSheet } from "@/lib/actions/accounting-reports-actions";
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
              <th className="px-4 py-2.5 text-right">Balance</th>
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
                <tr
                  key={r.accountId ?? r.code}
                  className="hover:bg-gray-50/50"
                >
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

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ asOfDate?: string }>;
}) {
  const params = await searchParams;
  const asOf = params.asOfDate ?? format(new Date(), "yyyy-MM-dd");
  const location = await getCurrentLocation();
  const report = location?.id ? await fetchBalanceSheet(location.id, asOf) : null;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Balance sheet" },
        ]}
      />
      <PageHeader
        title="Balance sheet"
        subtitle={`As of ${asOf}. Assets = Liabilities + Equity (incl. retained earnings).`}
      />
      <PageBody>
        {!report ? (
          <NoItems itemName="balance sheet data" />
        ) : (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<Scale className="h-3 w-3" />}
                label="Total assets"
                value={fmt(report.totalAssets)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={<Scale className="h-3 w-3" />}
                label="Total liabilities"
                value={fmt(report.totalLiabilities)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={<TrendingUp className="h-3 w-3" />}
                label="Total equity"
                value={fmt(report.totalEquity)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={
                  report.balanced ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : (
                    <ShieldAlert className="h-3 w-3" />
                  )
                }
                label="Balanced"
                value={report.balanced ? "Yes" : "No"}
                deltaTone={report.balanced ? "pos" : "neg"}
              />
            </KpiStrip>
            <Card>
              <CardContent className="space-y-6 pt-6">
                <Section
                  title="Assets"
                  rows={report.assets}
                  total={report.totalAssets}
                  currency={report.currencyCode}
                />
                <Section
                  title="Liabilities"
                  rows={report.liabilities}
                  total={report.totalLiabilities}
                  currency={report.currencyCode}
                />
                <Section
                  title="Equity"
                  rows={report.equity}
                  total={report.totalEquity}
                  currency={report.currencyCode}
                />
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
