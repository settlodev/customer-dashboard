import { Building2, DollarSign, Package, TrendingUp } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { SalesByDepartmentTable } from "@/components/reports/sales/by-department-table";
import type { DepartmentSalesRow } from "@/components/tables/reports/sales-by-department/columns";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getDepartmentSalesRollup } from "@/lib/actions/department-sales-actions";

const UNASSIGNED = "__unassigned__";

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

interface Props {
  from: string;
  to: string;
}

/**
 * Sales by department. The Reports Service aggregates `fact_order_items` by
 * department in ClickHouse and returns one row per department, so this tab
 * never loads individual line items — it stays fast and correct no matter how
 * many products a location has. Each sold item belongs to exactly one
 * department (its sale-time department), so the rows reconcile to the location
 * totals. Rows drill into the department detail Sales tab.
 */
export async function ByDepartmentTab({ from, to }: Props) {
  const [rollup, currency] = await Promise.all([
    getDepartmentSalesRollup(from, to),
    getLocationCurrency().catch(() => "TZS"),
  ]);

  const rows: DepartmentSalesRow[] = rollup.map((d) => ({
    id: d.departmentId ?? UNASSIGNED,
    name:
      d.departmentName ?? (d.departmentId ? "Unnamed department" : "Unassigned"),
    products: d.products,
    qty: d.quantitySold,
    gross: d.grossSales,
    net: d.netSales,
    profit: d.grossProfit,
  }));

  if (rows.length === 0) {
    return <NoItems itemName="department sales for this period" />;
  }

  // Single attribution → the rows sum to the location totals for the period.
  const deptCount = rows.filter((r) => r.id !== UNASSIGNED).length;
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalGross = rows.reduce((s, r) => s + r.gross, 0);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const margin = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;
  const hasUnassigned = rows.some((r) => r.id === UNASSIGNED);

  return (
    <div className="space-y-6">
      <KpiStrip cols={5}>
        <KpiCard
          icon={<Building2 className="h-3 w-3" />}
          label="Departments"
          value={deptCount.toLocaleString()}
        />
        <KpiCard
          icon={<Package className="h-3 w-3" />}
          label="Qty sold"
          value={totalQty > 0 ? totalQty.toLocaleString() : "—"}
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

      {hasUnassigned && (
        <p className="text-[11.5px] text-muted-foreground">
          “Unassigned” groups items sold without a department.
        </p>
      )}

      <SalesByDepartmentTable data={rows} currency={currency} />
    </div>
  );
}
