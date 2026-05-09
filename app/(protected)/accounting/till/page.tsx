import { CheckCircle2, Coins, Hourglass } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { listTillReconciliations } from "@/lib/actions/till-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import {
  TILL_STATUS_LABELS,
  TILL_STATUS_TONES,
} from "@/types/till/type";

const fmt = (n: number, c: string) =>
  `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;

export default async function TillPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 0;
  const size = Number(params.limit) || 20;

  const location = await getCurrentLocation();
  const response = location?.id
    ? await listTillReconciliations(location.id, page, size)
    : null;
  const data = response?.content ?? [];
  const total = response?.totalElements ?? 0;

  const submittedCount = data.filter((r) => r.status === "SUBMITTED").length;
  const approvedCount = data.filter((r) => r.status === "APPROVED").length;
  const totalVariance = data.reduce(
    (s, r) => s + Math.abs(r.variance ?? 0),
    0,
  );

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Accounting" }, { title: "Till reconciliation" }]}
      />
      <PageHeader
        title="Till reconciliation"
        subtitle="End-of-day cash counts vs expected — variance posts to the GL on approval."
      />
      <PageBody>
        {data.length === 0 ? (
          <NoItems itemName="till reconciliations" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<Hourglass className="h-3 w-3" />}
                label="Awaiting approval"
                value={String(submittedCount)}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CheckCircle2 className="h-3 w-3" />}
                label="Approved on page"
                value={String(approvedCount)}
                deltaTone="pos"
              />
              <KpiCard
                icon={<Coins className="h-3 w-3" />}
                label="Total |variance|"
                value={fmt(totalVariance, data[0]?.currency ?? "")}
                deltaTone={totalVariance > 0 ? "neg" : "pos"}
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-3">Business date</th>
                        <th className="px-4 py-3">Session</th>
                        <th className="px-4 py-3 text-right">Expected</th>
                        <th className="px-4 py-3 text-right">Counted</th>
                        <th className="px-4 py-3 text-right">Variance</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-xs">
                            {new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                            }).format(new Date(r.businessDate))}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {r.daySessionId.slice(0, 8)}…
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(r.expectedCash, r.currency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(r.countedCash, r.currency)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono tabular-nums font-medium ${
                              r.variance === 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {r.variance > 0 ? "+" : ""}
                            {fmt(r.variance, r.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TILL_STATUS_TONES[r.status]}`}
                            >
                              {TILL_STATUS_LABELS[r.status]}
                            </span>
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
