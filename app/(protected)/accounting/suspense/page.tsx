import { format, subDays } from "date-fns";
import { CircleAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { getSuspenseReport } from "@/lib/actions/suspense-reconciliation-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function SuspensePage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const startDate =
    params.startDate ?? format(subDays(new Date(), 7), "yyyy-MM-dd");
  const endDate = params.endDate ?? today;

  const location = await getCurrentLocation();
  const report = location?.id
    ? await getSuspenseReport(location.id, startDate, endDate)
    : null;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Accounting" },
          { title: "Suspense reconciliation" },
        ]}
      />
      <PageHeader
        title="Suspense reconciliation"
        subtitle={`From ${startDate} to ${endDate}. Postings that fell into the unmapped-payments suspense account.`}
      />
      <PageBody>
        {!report || report.lines.length === 0 ? (
          <NoItems itemName="suspense entries — clean" />
        ) : (
          <>
            <KpiStrip cols={2}>
              <KpiCard
                icon={<CircleAlert className="h-3 w-3" />}
                label="Total in suspense"
                value={fmt(report.totalSuspenseAmount)}
                deltaTone="neg"
              />
              <KpiCard
                icon={<CircleAlert className="h-3 w-3" />}
                label="Lines"
                value={String(report.lines.length)}
              />
            </KpiStrip>
            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <p className="mb-4 text-sm text-muted-foreground">
                  Each line below is an unmapped payment posting. Resolve by
                  adding a Payment-Method → Account mapping in{" "}
                  <a
                    href="/settings?tab=accounting"
                    className="text-primary hover:underline"
                  >
                    Settings → Accounting mappings
                  </a>
                  .
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Entry</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.lines.map((l) => (
                        <tr key={`${l.journalEntryId}-${l.entryNumber}`}>
                          <td className="px-4 py-3 font-mono text-xs">
                            {new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                            }).format(new Date(l.entryDate))}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {l.entryNumber}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] uppercase text-muted-foreground">
                            {l.sourceType ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {l.reference ?? "—"}
                          </td>
                          <td className="px-4 py-3">{l.description ?? "—"}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(l.amount)}
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
