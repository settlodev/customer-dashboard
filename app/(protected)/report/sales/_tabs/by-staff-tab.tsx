import { DollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { SalesByStaffTable } from "@/components/reports/sales/by-staff-table";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { staffReport } from "@/lib/actions/staff-actions";

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

interface Props {
  from: string;
  to: string;
  search: string;
  page: number;
  limit: number;
}

/**
 * Sales by staff — leaderboard of who sold what over the period. Rows link
 * to each staff member's detail Sales tab. Summary KPIs are aggregated
 * across the full (unfiltered) dataset so they don't shift while the user
 * searches or paginates.
 */
export async function ByStaffTab({ from, to, search, page, limit }: Props) {
  // staffReport takes Date objects; widen the range to whole days so the
  // last day's evening trade is included.
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59`);

  const [report, currency] = await Promise.all([
    staffReport(start, end).catch(() => null),
    getLocationCurrency().catch(() => "TZS"),
  ]);

  const rows = report?.staffReports ?? [];
  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q))
    : rows;

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const startIdx = (page - 1) * limit;
  const pageData = filtered.slice(startIdx, startIdx + limit);

  const totals = rows.reduce(
    (a, s) => ({
      orders: a.orders + s.totalOrdersCompleted,
      items: a.items + s.totalItemsSold,
      gross: a.gross + s.totalGrossAmount,
      net: a.net + s.totalNetAmount,
      profit: a.profit + s.totalGrossProfit,
    }),
    { orders: 0, items: 0, gross: 0, net: 0, profit: 0 },
  );
  const margin = totals.net > 0 ? (totals.profit / totals.net) * 100 : 0;

  if (rows.length === 0 && q === "") {
    return <NoItems itemName="staff sales for this period" />;
  }

  return (
    <div className="space-y-6">
      <KpiStrip cols={6}>
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
          icon={<Package className="h-3 w-3" />}
          label="Items sold"
          value={totals.items > 0 ? totals.items.toLocaleString() : "—"}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Gross"
          value={totals.gross > 0 ? formatMoney(totals.gross) : "—"}
          unit={totals.gross > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Net"
          value={totals.net > 0 ? formatMoney(totals.net) : "—"}
          unit={totals.net > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross profit"
          value={totals.profit !== 0 ? formatMoney(totals.profit) : "—"}
          unit={totals.profit !== 0 ? currency : undefined}
          delta={totals.net > 0 ? `${margin.toFixed(1)}% margin` : undefined}
          deltaTone={totals.profit >= 0 ? "pos" : "neg"}
        />
      </KpiStrip>

      <SalesByStaffTable
        data={pageData}
        pageCount={pageCount}
        pageNo={page - 1}
        total={total}
        currency={currency}
      />
    </div>
  );
}
