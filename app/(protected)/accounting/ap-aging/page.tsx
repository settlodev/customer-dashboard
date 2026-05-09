import { format } from "date-fns";
import { CalendarClock, CircleDollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { fetchApAging } from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default async function ApAgingPage({
  searchParams,
}: {
  searchParams: Promise<{ asOfDate?: string }>;
}) {
  const params = await searchParams;
  const asOf = params.asOfDate ?? format(new Date(), "yyyy-MM-dd");
  const location = await getCurrentLocation();
  const report = location?.id ? await fetchApAging(location.id, asOf) : null;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "AP aging" },
        ]}
      />
      <PageHeader
        title="AP aging"
        subtitle={`As of ${asOf}. Outstanding vendor balances bucketed by days overdue.`}
      />
      <PageBody>
        {!report || report.totalOutstanding === 0 ? (
          <NoItems itemName="open accounts payable" />
        ) : (
          <>
            <KpiStrip cols={5}>
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Total outstanding"
                value={fmt(report.totalOutstanding)}
                unit={report.currencyCode}
                deltaTone="neg"
              />
              <KpiCard
                icon={<CalendarClock className="h-3 w-3" />}
                label="Current"
                value={fmt(report.current)}
                unit={report.currencyCode}
                deltaTone="pos"
              />
              <KpiCard
                icon={<CalendarClock className="h-3 w-3" />}
                label="1–30"
                value={fmt(report.days30)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={<CalendarClock className="h-3 w-3" />}
                label="31–60"
                value={fmt(report.days60)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={<CalendarClock className="h-3 w-3" />}
                label="60+"
                value={fmt(report.days90 + report.days90Plus)}
                unit={report.currencyCode}
                deltaTone="neg"
              />
            </KpiStrip>
            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3 text-right">Open</th>
                        <th className="px-4 py-3 text-right">Current</th>
                        <th className="px-4 py-3 text-right">1–30</th>
                        <th className="px-4 py-3 text-right">31–60</th>
                        <th className="px-4 py-3 text-right">61–90</th>
                        <th className="px-4 py-3 text-right">90+</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.vendors.map((v) => (
                        <tr key={v.vendorId ?? "no-vendor"}>
                          <td className="px-4 py-3 font-medium">
                            {v.vendorName}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {v.openExpenseCount}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(v.current)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(v.days30)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(v.days60)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(v.days90)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-red-600">
                            {fmt(v.days90Plus)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                            {fmt(v.totalOutstanding)}
                          </td>
                        </tr>
                      ))}
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
