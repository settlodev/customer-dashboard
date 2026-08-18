import { CircleDollarSign, Receipt, TrendingDown, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { fetchExpenseSummary } from "@/lib/actions/accounting-reports-actions";
import type { ExpenseSummaryReport } from "@/types/reports/type";

interface Props {
  from: string;
  to: string;
  locationId?: string;
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export async function ByCategoryTab({ from, to, locationId }: Props) {
  const report: ExpenseSummaryReport | null = locationId
    ? await fetchExpenseSummary(locationId, from, to).catch(() => null)
    : null;

  if (!report || report.totalExpenseCount === 0) {
    return <NoItems itemName="expenses in this window" />;
  }

  return (
    <div className="space-y-6">
      <KpiStrip cols={4}>
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Total expenses"
          value={fmt(report.totalExpenseAmount)}
          unit={report.currencyCode}
          delta={`${report.totalExpenseCount} entries`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Wallet className="h-3 w-3" />}
          label="Paid"
          value={fmt(report.totalPaidAmount)}
          unit={report.currencyCode}
          deltaTone="pos"
        />
        <KpiCard
          icon={<TrendingDown className="h-3 w-3" />}
          label="Unpaid"
          value={fmt(report.totalUnpaidAmount)}
          unit={report.currencyCode}
          deltaTone={report.totalUnpaidAmount > 0 ? "neg" : "pos"}
        />
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Categories"
          value={String(report.categorySummaries.length)}
        />
      </KpiStrip>

      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <h3 className="mb-4 text-lg font-medium">By category</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Count</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.categorySummaries.map((c) => (
                  <tr
                    key={c.categoryId ?? "uncategorized"}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 font-medium">{c.categoryName}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {c.expenseCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {fmt(c.amount)} {report.currencyCode}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {c.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
