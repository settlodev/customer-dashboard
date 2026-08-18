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
 * Sales by department. The Reports Service aggregates from the CURRENT catalog
 * dimension in ClickHouse (a product is attributed to every department its
 * categories roll up to), so this never loads line items and never drops a
 * sale to "Unassigned" once products are synced. KPI money uses the true
 * location totals — the per-department rows multi-attribute, so they can sum to
 * more than net (see the note). Rows drill into the department detail Sales tab.
 */
export async function ByDepartmentTab({ from, to }: Props) {
  const [rollup, currency] = await Promise.all([
    getDepartmentSalesRollup(from, to),
    getLocationCurrency().catch(() => "TZS"),
  ]);

  const rows: DepartmentSalesRow[] = rollup.departments.map((d) => ({
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

  const deptCount = rows.filter((r) => r.id !== UNASSIGNED).length;
  const { quantitySold, grossSales, netSales, grossProfit } = rollup.totals;
  const margin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

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
          value={quantitySold > 0 ? quantitySold.toLocaleString() : "—"}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Gross"
          value={grossSales > 0 ? formatMoney(grossSales) : "—"}
          unit={grossSales > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Net"
          value={netSales > 0 ? formatMoney(netSales) : "—"}
          unit={netSales > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross profit"
          value={grossProfit !== 0 ? formatMoney(grossProfit) : "—"}
          unit={grossProfit !== 0 ? currency : undefined}
          delta={netSales > 0 ? `${margin.toFixed(1)}% margin` : undefined}
          deltaTone={grossProfit >= 0 ? "pos" : "neg"}
        />
      </KpiStrip>

      <p className="text-[11.5px] text-muted-foreground">
        A product whose categories span multiple departments counts toward each,
        so department totals can exceed the overall net above.
      </p>

      <SalesByDepartmentTable data={rows} currency={currency} />
    </div>
  );
}
