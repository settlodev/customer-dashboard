import { format } from "date-fns";
import { Scale, ShieldAlert, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { fetchTrialBalance } from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ asOfDate?: string }>;
}) {
  const params = await searchParams;
  const asOf = params.asOfDate ?? format(new Date(), "yyyy-MM-dd");
  const location = await getCurrentLocation();
  const report = location?.id ? await fetchTrialBalance(location.id, asOf) : null;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Trial balance" },
        ]}
      />
      <PageHeader
        title="Trial balance"
        subtitle={`As of ${asOf}. Sum of debits and credits per account from posted journal entries.`}
      />
      <PageBody>
        {!report ? (
          <NoItems itemName="trial balance data" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<Scale className="h-3 w-3" />}
                label="Total debits"
                value={fmt(report.totalDebit)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={<Scale className="h-3 w-3" />}
                label="Total credits"
                value={fmt(report.totalCredit)}
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
              <CardContent className="px-2 pt-6 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Account</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Debit</th>
                        <th className="px-4 py-3 text-right">Credit</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.rows.map((r) => (
                        <tr key={r.accountId ?? r.code} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                          <td className="px-4 py-3">{r.name}</td>
                          <td className="px-4 py-3 font-mono text-[11px] uppercase text-muted-foreground">
                            {r.accountType}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {r.debit > 0 ? fmt(r.debit) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {r.credit > 0 ? fmt(r.credit) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                            {fmt(r.balance)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50/60 font-medium">
                        <td className="px-4 py-3" colSpan={3}>Totals</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {fmt(report.totalDebit)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {fmt(report.totalCredit)}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
