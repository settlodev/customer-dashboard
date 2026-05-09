import { ArrowDownToLine, ArrowUpFromLine, Coins } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { listCashMovements } from "@/lib/actions/till-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

const fmt = (n: number, c: string) =>
  `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;

export default async function CashMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const params = await searchParams;

  const location = await getCurrentLocation();
  const movements = location?.id
    ? await listCashMovements(location.id, params.sessionId)
    : [];

  const payIns = movements.filter((m) => m.movementType === "PAY_IN");
  const payOuts = movements.filter((m) => m.movementType === "PAY_OUT");
  const sumPayIn = payIns.reduce((s, m) => s + m.amount, 0);
  const sumPayOut = payOuts.reduce((s, m) => s + m.amount, 0);
  const currency = movements[0]?.currency ?? "";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Accounting" }, { title: "Cash movements" }]}
      />
      <PageHeader
        title="Cash movements"
        subtitle="Operator pay-ins and pay-outs against the till. Feeds expected-cash for till reconciliation."
      />
      <PageBody>
        {movements.length === 0 ? (
          <NoItems
            itemName={
              params.sessionId
                ? "cash movements for this session"
                : "cash movements"
            }
          />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<ArrowDownToLine className="h-3 w-3" />}
                label="Total pay-ins"
                value={fmt(sumPayIn, currency)}
                delta={`${payIns.length} entries`}
                deltaTone="pos"
              />
              <KpiCard
                icon={<ArrowUpFromLine className="h-3 w-3" />}
                label="Total pay-outs"
                value={fmt(sumPayOut, currency)}
                delta={`${payOuts.length} entries`}
                deltaTone="neg"
              />
              <KpiCard
                icon={<Coins className="h-3 w-3" />}
                label="Net delta"
                value={fmt(sumPayIn - sumPayOut, currency)}
                deltaTone={sumPayIn - sumPayOut >= 0 ? "pos" : "neg"}
              />
            </KpiStrip>
            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-xs">
                            {new Date(m.occurredAt).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                m.movementType === "PAY_IN"
                                  ? "bg-green-50 text-green-700"
                                  : m.movementType === "PAY_OUT"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {m.movementType.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(m.amount, m.currency)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.reference ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.notes ?? "—"}
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
