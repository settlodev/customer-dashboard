import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  ShoppingCart,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { Card, CardContent } from "@/components/ui/card";
import type { StaffSummaryReport } from "@/types/staff";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

interface Props {
  report: StaffSummaryReport | null;
}

export function OverviewTab({ report }: Props) {
  const rows = report?.staffReports ?? [];

  if (rows.length === 0) {
    return <NoItems itemName="staff sales for this period" />;
  }

  const totals = rows.reduce(
    (acc, s) => ({
      orders: acc.orders + s.totalOrdersCompleted,
      items: acc.items + s.totalItemsSold,
      gross: acc.gross + s.totalGrossAmount,
      net: acc.net + s.totalNetAmount,
      profit: acc.profit + s.totalGrossProfit,
    }),
    { orders: 0, items: 0, gross: 0, net: 0, profit: 0 },
  );
  const margin = totals.net > 0 ? (totals.profit / totals.net) * 100 : 0;

  const topPerformer = [...rows].sort(
    (a, b) => b.totalGrossProfit - a.totalGrossProfit,
  )[0];

  const top5 = [...rows]
    .sort((a, b) => b.totalGrossAmount - a.totalGrossAmount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <KpiStrip cols={5}>
        <KpiCard
          icon={<Users className="h-3 w-3" />}
          label="Staff"
          value={rows.length.toLocaleString()}
        />
        <KpiCard
          icon={<ShoppingCart className="h-3 w-3" />}
          label="Orders"
          value={totals.orders > 0 ? totals.orders.toLocaleString() : "—"}
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross"
          value={totals.gross > 0 ? fmt(totals.gross) : "—"}
          unit="TZS"
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Net"
          value={totals.net > 0 ? fmt(totals.net) : "—"}
          unit="TZS"
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross profit"
          value={totals.profit !== 0 ? fmt(totals.profit) : "—"}
          unit="TZS"
          delta={totals.net > 0 ? `${margin.toFixed(1)}% margin` : undefined}
          deltaTone={totals.profit >= 0 ? "pos" : "neg"}
        />
      </KpiStrip>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Top performer
            </p>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{topPerformer.name}</p>
                <p className="text-xs text-muted-foreground">
                  Highest gross profit
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: "Orders", value: topPerformer.totalOrdersCompleted },
                { label: "Items sold", value: topPerformer.totalItemsSold },
                {
                  label: "Gross amount",
                  value: `TZS ${fmt(topPerformer.totalGrossAmount)}`,
                },
                {
                  label: "Gross profit",
                  value: `TZS ${fmt(topPerformer.totalGrossProfit)}`,
                  className: "font-medium text-green-600",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b py-1.5 last:border-0"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`tabular-nums ${row.className ?? ""}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href={`?tab=staff&search=${encodeURIComponent(topPerformer.name)}`}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View in details <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Top 5 by gross amount
            </p>
            <Link
              href="?tab=staff"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {[
                    "Name",
                    "Orders",
                    "Items",
                    "Gross amount",
                    "Gross profit",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground ${
                        i > 0 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {top5.map((staff) => (
                  <tr key={staff.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{staff.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {staff.totalOrdersCompleted}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {staff.totalItemsSold}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      TZS {fmt(staff.totalGrossAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-green-600">
                      TZS {fmt(staff.totalGrossProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
