import { DollarSign, Package, Tag, TrendingUp } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { SalesByCategoryTable } from "@/components/reports/sales/by-category-table";
import type { CategorySalesRow } from "@/components/tables/reports/sales-by-category/columns";
import { getCategorySalesRollup } from "@/lib/actions/category-sales-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

interface Props {
  from: string;
  to: string;
}

/**
 * Sales by category. The Reports Service aggregates from the CURRENT catalog
 * taxonomy (`dim_product.categories`) in ClickHouse — uncapped, so every
 * product's categories are covered no matter how large the catalogue. KPI
 * money uses the true location totals; the per-category rows multi-attribute
 * (a product in N categories counts toward all N), so they can sum to more
 * than net (see the note). Rows drill into each category's detail Sales tab.
 */
export async function ByCategoryTab({ from, to }: Props) {
  const [rollup, currency] = await Promise.all([
    getCategorySalesRollup(from, to),
    getLocationCurrency().catch(() => "TZS"),
  ]);

  const rows: CategorySalesRow[] = rollup.categories.map((c) => ({
    id: c.categoryId ?? "",
    name: c.categoryName ?? "Unnamed category",
    products: c.products,
    qty: c.quantitySold,
    gross: c.grossSales,
    net: c.netSales,
    profit: c.grossProfit,
  }));

  if (rows.length === 0) {
    return <NoItems itemName="category sales for this period" />;
  }

  const { quantitySold, grossSales, netSales, grossProfit } = rollup.totals;
  const margin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  return (
    <div className="space-y-6">
      <KpiStrip cols={5}>
        <KpiCard
          icon={<Tag className="h-3 w-3" />}
          label="Categories"
          value={rows.length.toLocaleString()}
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
        A product in multiple categories counts toward each, so category totals
        can exceed the overall net above.
      </p>

      <SalesByCategoryTable data={rows} currency={currency} />
    </div>
  );
}
