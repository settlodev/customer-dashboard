import { CircleDollarSign, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { listArBalances } from "@/lib/actions/customer-ar-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import {
  AGING_BUCKET_LABELS,
  AGING_BUCKET_TONES,
} from "@/types/customer-ar/type";

interface SearchParams {
  page?: string;
  limit?: string;
  minOutstanding?: string;
}

export default async function DebtorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 0;
  const size = Number(params.limit) || 20;
  const minOutstanding = Number(params.minOutstanding) || 0;

  const location = await getCurrentLocation();
  const response = location?.id
    ? await listArBalances(location.id, minOutstanding, page, size)
    : null;

  const data = response?.content ?? [];
  const total = response?.totalElements ?? 0;

  const totalOutstanding = data.reduce(
    (s, c) => s + (c.outstandingBalance ?? 0),
    0,
  );
  const overdue = data.filter(
    (c) => c.agingBucket !== "CURRENT" && c.outstandingBalance > 0,
  ).length;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Debtors" }]} />
      <PageHeader
        title="Debtors"
        subtitle="Customer A/R — outstanding charges per location, aged."
      />
      <PageBody>
        {data.length === 0 ? (
          <NoItems itemName="customer balances" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Total outstanding"
                value={fmt(totalOutstanding)}
                unit={data[0]?.currency ?? ""}
                deltaTone="neg"
              />
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Customers with balance"
                value={String(total)}
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Overdue (on page)"
                value={String(overdue)}
                deltaTone={overdue > 0 ? "neg" : "pos"}
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3 text-right">Outstanding</th>
                        <th className="px-4 py-3 text-right">Orders</th>
                        <th className="px-4 py-3">Oldest unsettled</th>
                        <th className="px-4 py-3">Aging</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.map((c) => (
                        <tr key={c.customerId} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-xs">
                            {c.customerName ?? c.customerId.slice(0, 8) + "…"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                            {fmt(c.outstandingBalance)} {c.currency}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {c.outstandingOrderCount}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {c.oldestUnsettledAt
                              ? new Intl.DateTimeFormat("en", {
                                  dateStyle: "medium",
                                }).format(new Date(c.oldestUnsettledAt))
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${AGING_BUCKET_TONES[c.agingBucket]}`}
                            >
                              {AGING_BUCKET_LABELS[c.agingBucket]}
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
