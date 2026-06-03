import { DollarSign, Package, Tag, TrendingUp } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { SalesByCategoryTable } from "@/components/reports/sales/by-category-table";
import type { CategorySalesRow } from "@/components/tables/reports/sales-by-category/columns";
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
 * Sales by category — item sales are aggregated per product, then fanned
 * out to every category each product belongs to (a product in N categories
 * contributes to all N). The Reports Service read-model only carries a
 * product's department, so true multi-category attribution is done here
 * against the product list (capped at 200, matching the categories list).
 * Rows drill into each category's detail Sales tab.
 *
 * KPI money totals use the true location summary (not the fanned-out rows),
 * so they reflect actual sales; the per-category rows intentionally sum to
 * more than that — see the note under the strip.
 */
export async function ByCategoryTab({ from, to, search, page, limit }: Props) {
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

  // Fan each product's sales out to all its categories.
  const byCat = new Map<
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
    for (const c of p.categories ?? []) {
      const cur = byCat.get(c.id) ?? {
        id: c.id,
        name: c.name,
        products: new Set<string>(),
        qty: 0,
        gross: 0,
        net: 0,
        profit: 0,
      };
      cur.products.add(p.id);
      cur.qty += s.qty;
      cur.gross += s.gross;
      cur.net += s.net;
      cur.profit += s.profit;
      byCat.set(c.id, cur);
    }
  }

  const rows: CategorySalesRow[] = [...byCat.values()]
    .map((c) => ({
      id: c.id,
      name: c.name,
      products: c.products.size,
      qty: c.qty,
      gross: c.gross,
      net: c.net,
      profit: c.profit,
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
    return <NoItems itemName="category sales for this period" />;
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
          icon={<Tag className="h-3 w-3" />}
          label="Categories"
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
        A product in multiple categories counts toward each, so category
        totals can exceed the overall net above.
      </p>

      <SalesByCategoryTable
        data={pageData}
        pageCount={pageCount}
        pageNo={page - 1}
        total={total}
        currency={currency}
      />
    </div>
  );
}
