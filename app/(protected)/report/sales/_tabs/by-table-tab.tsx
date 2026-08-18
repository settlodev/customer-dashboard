import { DollarSign, ShoppingCart, TrendingUp, Utensils } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { SalesByTableTable } from "@/components/reports/sales/by-table-table";
import type { TableSalesRow } from "@/components/tables/reports/sales-by-table/columns";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { getSalesByTable } from "@/lib/actions/table-sales-actions";

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
 * Sales by table — served by the Reports Service by-table rollup (closed
 * orders grouped by table_id). The rollup returns table ids + money; we
 * join the OMS tables list for names/codes. Rows drill into each table's
 * detail Sales tab.
 */
export async function ByTableTab({ from, to, search, page, limit }: Props) {
  const [report, tables, currency] = await Promise.all([
    getSalesByTable(from, to).catch(() => null),
    fetchAllTables().catch(() => []),
    getLocationCurrency().catch(() => "TZS"),
  ]);

  const tableMap = new Map(tables.map((t) => [String(t.id), t]));

  const rows: TableSalesRow[] = (report?.tables ?? []).map((r) => {
    const t = tableMap.get(String(r.tableId));
    return {
      id: r.tableId,
      name: t?.name ?? `Table ${String(r.tableId).slice(0, 8)}`,
      code: t?.code ?? null,
      orders: r.orders ?? 0,
      gross: r.gross ?? 0,
      net: r.net ?? 0,
      profit: r.grossProfit ?? 0,
    };
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.code ?? "").toLowerCase().includes(q),
      )
    : rows;

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const startIdx = (page - 1) * limit;
  const pageData = filtered.slice(startIdx, startIdx + limit);

  if (rows.length === 0 && q === "") {
    return (
      <NoItems
        itemName={
          tables.length === 0
            ? "tables for this location"
            : "table sales for this period"
        }
      />
    );
  }

  const totalOrders = report?.totalOrders ?? 0;
  const totalGross = report?.totalGross ?? 0;
  const totalNet = report?.totalNet ?? 0;
  const totalProfit = report?.totalGrossProfit ?? 0;
  const margin = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;

  return (
    <div className="space-y-6">
      <KpiStrip cols={5}>
        <KpiCard
          icon={<Utensils className="h-3 w-3" />}
          label="Tables sold"
          value={rows.length.toLocaleString()}
        />
        <KpiCard
          icon={<ShoppingCart className="h-3 w-3" />}
          label="Orders"
          value={totalOrders > 0 ? totalOrders.toLocaleString() : "—"}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Gross"
          value={totalGross > 0 ? formatMoney(totalGross) : "—"}
          unit={totalGross > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Net"
          value={totalNet > 0 ? formatMoney(totalNet) : "—"}
          unit={totalNet > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross profit"
          value={totalProfit !== 0 ? formatMoney(totalProfit) : "—"}
          unit={totalProfit !== 0 ? currency : undefined}
          delta={totalNet > 0 ? `${margin.toFixed(1)}% margin` : undefined}
          deltaTone={totalProfit >= 0 ? "pos" : "neg"}
        />
      </KpiStrip>

      <SalesByTableTable
        data={pageData}
        pageCount={pageCount}
        pageNo={page - 1}
        total={total}
        currency={currency}
      />
    </div>
  );
}
