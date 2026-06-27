import { CheckCircle2, CircleDollarSign, Clock } from "lucide-react";

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

export async function ByStatusTab({ from, to, locationId }: Props) {
  const report: ExpenseSummaryReport | null = locationId
    ? await fetchExpenseSummary(locationId, from, to).catch(() => null)
    : null;

  if (!report || report.totalExpenseCount === 0) {
    return <NoItems itemName="expenses in this window" />;
  }

  const paidShare =
    report.totalExpenseAmount > 0
      ? (report.totalPaidAmount / report.totalExpenseAmount) * 100
      : 0;
  const unpaidShare = 100 - paidShare;

  return (
    <div className="space-y-6">
      <KpiStrip cols={3}>
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Total expenses"
          value={fmt(report.totalExpenseAmount)}
          unit={report.currencyCode}
          delta={`${report.totalExpenseCount} entries`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-3 w-3" />}
          label="Paid"
          value={fmt(report.totalPaidAmount)}
          unit={report.currencyCode}
          delta={`${paidShare.toFixed(1)}% of total`}
          deltaTone="pos"
        />
        <KpiCard
          icon={<Clock className="h-3 w-3" />}
          label="Unpaid"
          value={fmt(report.totalUnpaidAmount)}
          unit={report.currencyCode}
          delta={`${unpaidShare.toFixed(1)}% of total`}
          deltaTone={report.totalUnpaidAmount > 0 ? "neg" : "pos"}
        />
      </KpiStrip>

      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <h3 className="mb-4 text-lg font-medium">Payment status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-emerald-600">Paid</span>
              <span className="font-mono tabular-nums">
                {fmt(report.totalPaidAmount)} {report.currencyCode} ·{" "}
                {paidShare.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${paidShare}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-amber-600">Unpaid</span>
              <span className="font-mono tabular-nums">
                {fmt(report.totalUnpaidAmount)} {report.currencyCode} ·{" "}
                {unpaidShare.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
