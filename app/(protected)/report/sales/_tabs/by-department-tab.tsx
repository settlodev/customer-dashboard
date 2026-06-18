import { Building2, DollarSign, Package, TrendingUp } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { SalesByDepartmentTable } from "@/components/reports/sales/by-department-table";
import type { DepartmentSalesRow } from "@/components/tables/reports/sales-by-department/columns";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getItemSalesSummary } from "@/lib/actions/item-sales-actions";
import { fetchAllProducts } from "@/lib/actions/product-actions";

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
 * Sales by department — item sales are aggregated per product, then fanned
 * out to the distinct set of departments each product's categories roll up
 * to (departments live on categories, and a product can span several). A
 * product whose categories land in two departments contributes to both; two
 * categories in the same department count it once. Attribution is done here
 * against the product list (capped at 200) since the Reports Service has no
 * department rollup. Rows drill into each department's detail Sales tab.
 *
 * KPI money totals use the true location summary (not the fanned-out rows),
 * so they reflect actual sales; the per-department rows can sum to more than
 * that — see the note under the strip.
 */
export async function ByDepartmentTab({ from, to, search, page, limit }: Props) {
  const [location, currency] = await Promise.all([
    getCurrentLocation().catch(() => null),
    getLocationCurrency().catch(() => "TZS"),
  ]);

  const [summary, products] = await Promise.all([
    location?.id
      ? getItemSalesSummary(location.id, from, to)
      : Promise.resolve(null),
    fetchAllProducts().catch(() => []),
  ]);

  // Aggregate item sales by product.
  const byProduct = new Map<
    string,
    { qty: number; gross: number; net: number; profit: number }
  >();
  for (const it of summary?.items ?? []) {
    const cur = byProduct.get(it.productId) ?? {
      qty: 0,
      gross: 0,
      net: 0,
      profit: 0,
    };
    cur.qty += it.quantitySold;
    cur.gross += it.grossSales;
    cur.net += it.netSales;
    cur.profit += it.grossProfit;
    byProduct.set(it.productId, cur);
  }

  // Fan each product's sales out to the distinct departments of its
  // categories.
  const byDept = new Map<
    string,
    {
      id: string;
      name: string;
      products: Set<string>;
      qty: number;
      gross: number;
      net: number;
      profit: number;
    }
  >();
  for (const p of products) {
    const s = byProduct.get(p.id);
    if (!s) continue;
    // Distinct departments this product rolls up to (dedupe by id; prefer a
    // resolved name).
    const depts = new Map<string, string | null>();
    for (const c of p.categories ?? []) {
      if (!c.departmentId) continue;
      const existing = depts.get(c.departmentId);
      if (!depts.has(c.departmentId) || (!existing && c.departmentName)) {
        depts.set(c.departmentId, c.departmentName ?? null);
      }
    }
    for (const [deptId, deptName] of depts) {
      const cur = byDept.get(deptId) ?? {
        id: deptId,
        name: deptName ?? "Unnamed department",
        products: new Set<string>(),
        qty: 0,
        gross: 0,
        net: 0,
        profit: 0,
      };
      if (deptName && cur.name === "Unnamed department") cur.name = deptName;
      cur.products.add(p.id);
      cur.qty += s.qty;
      cur.gross += s.gross;
      cur.net += s.net;
      cur.profit += s.profit;
      byDept.set(deptId, cur);
    }
  }

  const rows: DepartmentSalesRow[] = [...byDept.values()]
    .map((d) => ({
      id: d.id,
      name: d.name,
      products: d.products.size,
      qty: d.qty,
      gross: d.gross,
      net: d.net,
      profit: d.profit,
    }))
    .sort((a, b) => b.net - a.net);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q))
    : rows;
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const startIdx = (page - 1) * limit;
  const pageData = filtered.slice(startIdx, startIdx + limit);

  if (rows.length === 0 && q === "") {
    return <NoItems itemName="department sales for this period" />;
  }

  const trueQty = summary?.totalQuantitySold ?? 0;
  const trueGross = summary?.totalGrossSales ?? 0;
  const trueNet = summary?.totalNetSales ?? 0;
  const trueProfit = summary?.totalGrossProfit ?? 0;
  const margin = trueNet > 0 ? (trueProfit / trueNet) * 100 : 0;

  return (
    <div className="space-y-6">
      <KpiStrip cols={5}>
        <KpiCard
          icon={<Building2 className="h-3 w-3" />}
          label="Departments"
          value={rows.length.toLocaleString()}
        />
        <KpiCard
          icon={<Package className="h-3 w-3" />}
          label="Qty sold"
          value={trueQty > 0 ? trueQty.toLocaleString() : "—"}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Gross"
          value={trueGross > 0 ? formatMoney(trueGross) : "—"}
          unit={trueGross > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Net"
          value={trueNet > 0 ? formatMoney(trueNet) : "—"}
          unit={trueNet > 0 ? currency : undefined}
        />
        <KpiCard
          icon={<TrendingUp className="h-3 w-3" />}
          label="Gross profit"
          value={trueProfit !== 0 ? formatMoney(trueProfit) : "—"}
          unit={trueProfit !== 0 ? currency : undefined}
          delta={trueNet > 0 ? `${margin.toFixed(1)}% margin` : undefined}
          deltaTone={trueProfit >= 0 ? "pos" : "neg"}
        />
      </KpiStrip>

      <p className="text-[11.5px] text-muted-foreground">
        A product whose categories span multiple departments counts toward
        each, so department totals can exceed the overall net above.
      </p>

      <SalesByDepartmentTable
        data={pageData}
        pageCount={pageCount}
        pageNo={page - 1}
        total={total}
        currency={currency}
      />
    </div>
  );
}
