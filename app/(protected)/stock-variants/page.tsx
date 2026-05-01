import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock/column";
import { getStocks } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import { getInventoryDashboardSummary } from "@/lib/actions/reports-analytics-actions";
import type { StockWithBalance } from "@/types/stock/type";
import type { RsInventoryDashboardSummary } from "@/types/reports-analytics/type";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Boxes,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Layers,
  RefreshCw,
} from "lucide-react";
import { StockVariantsHeaderActions } from "@/components/widgets/inventory/stock-variants-header-actions";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { filter = "active" } = await searchParams;

  const [stocks, location] = await Promise.all([
    getStocks(),
    getCurrentLocation(),
  ]);

  const [balances, summary] = location?.id
    ? await Promise.all([
        getBalancesByLocation(location.id),
        getInventoryDashboardSummary(location.id, "TZS"),
      ])
    : [[], null as RsInventoryDashboardSummary | null];

  // Build a variant→balance lookup
  const balanceMap = new Map(balances.map((b) => [b.stockVariantId, b]));

  // Enrich stocks with aggregated balance data
  const enriched: StockWithBalance[] = stocks.map((stock) => {
    let totalQuantity = 0;
    let totalValue = 0;
    let lowStock = false;
    let outOfStock = false;

    for (const variant of stock.variants) {
      const bal = balanceMap.get(variant.id);
      if (bal) {
        totalQuantity += bal.quantityOnHand;
        totalValue += bal.quantityOnHand * (bal.averageCost ?? 0);
        if (bal.lowStock) lowStock = true;
        if (bal.outOfStock) outOfStock = true;
      }
    }

    return { ...stock, totalQuantity, totalValue, lowStock, outOfStock };
  });

  const activeCount = enriched.filter((s) => !s.archived).length;
  const archivedCount = enriched.filter((s) => s.archived).length;

  const filtered =
    filter === "archived"
      ? enriched.filter((s) => s.archived)
      : filter === "all"
        ? enriched
        : enriched.filter((s) => !s.archived);

  const tabs = [
    { key: "active", label: "Active", count: activeCount, href: "/stock-variants" },
    { key: "archived", label: "Archived", count: archivedCount, href: "/stock-variants?filter=archived" },
    { key: "all", label: "All", count: enriched.length, href: "/stock-variants?filter=all" },
  ];

  // ── KPI tile derivations ─────────────────────────────────────────
  // The endpoint returns null deltas when the comparison snapshot
  // doesn't exist yet (e.g. fresh location); we let those slots stay
  // empty rather than rendering a misleading 0.
  const fmtCount = (n: number) => Math.round(n).toLocaleString();
  const fmtNumber = (n: number, fractionDigits = 0) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  const fmtSignedPct = (
    pct: number | null,
    suffix: string,
  ): { text: string; tone: "pos" | "neg" | "neutral" } | undefined => {
    if (pct === null || pct === undefined) return undefined;
    const rounded = Math.round(pct * 10) / 10;
    const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
    const tone = rounded > 0 ? "pos" : rounded < 0 ? "neg" : "neutral";
    return { text: `${sign}${Math.abs(rounded).toFixed(1)}${suffix}`, tone };
  };
  const fmtSignedCount = (
    n: number,
    suffix: string,
  ): { text: string; tone: "pos" | "neg" | "neutral" } => {
    const sign = n > 0 ? "+" : n < 0 ? "−" : "";
    const tone = n > 0 ? "pos" : n < 0 ? "neg" : "neutral";
    return { text: `${sign}${Math.abs(n).toLocaleString()} ${suffix}`, tone };
  };
  const fmtSignedDays = (
    days: number | null,
  ): { text: string; tone: "pos" | "neg" | "neutral" } | undefined => {
    if (days === null || days === undefined) return undefined;
    const rounded = Math.round(days * 10) / 10;
    const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
    // Fewer days on hand = inventory turning faster → tone "pos".
    const tone = rounded < 0 ? "pos" : rounded > 0 ? "neg" : "neutral";
    return { text: `${sign}${Math.abs(rounded).toFixed(1)} d`, tone };
  };

  const valueDelta = fmtSignedPct(summary?.totalInventoryValueWowPct ?? null, "% wk");
  const unitsDelta = fmtSignedPct(summary?.unitsInStockWowPct ?? null, "% wk");
  const skusDelta = summary
    ? fmtSignedCount(summary.activeSkusDailyDelta, "today")
    : undefined;
  const sellThroughDelta = fmtSignedPct(summary?.sellThroughPpDelta ?? null, " pts");
  const daysDelta = fmtSignedDays(summary?.avgDaysOnHandDelta ?? null);
  const criticalDelta =
    summary && summary.criticalStockSkus > 0
      ? { text: `${summary.criticalStockSkus} critical`, tone: "neg" as const }
      : undefined;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Items" }]} />
      <PageHeader
        title="Stock Items"
        subtitle="Inventory across this location · last sync moments ago"
        actions={<StockVariantsHeaderActions />}
      />

      <PageBody>
        {/* ── Summary KPIs ─────────────────────────────────────────
            Live from the Reports Service inventory dashboard endpoint.
            Current values come from fact_inventory_current (real-time);
            week-over-week and 30-day deltas come from the daily snapshot
            fact table — null until at least one snapshot exists. */}
        <KpiStrip cols={6}>
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Total inventory value"
            value={summary ? fmtCount(summary.totalInventoryValue) : "—"}
            unit={summary?.totalInventoryCurrency ?? "TZS"}
            delta={valueDelta?.text}
            deltaTone={valueDelta?.tone ?? "neutral"}
            spark={summary?.sparklines?.totalInventoryValue}
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Active SKUs"
            value={summary ? fmtCount(summary.activeSkus) : "—"}
            delta={skusDelta?.text}
            deltaTone={skusDelta?.tone ?? "neutral"}
            spark={summary?.sparklines?.activeSkus}
          />
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Units in stock"
            value={summary ? fmtCount(summary.unitsInStock) : "—"}
            delta={unitsDelta?.text}
            deltaTone={unitsDelta?.tone ?? "neutral"}
            spark={summary?.sparklines?.unitsInStock}
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Low-stock alerts"
            value={summary ? fmtCount(summary.lowStockSkus) : "—"}
            unit="SKUs"
            delta={criticalDelta?.text}
            deltaTone={criticalDelta?.tone ?? "neutral"}
            spark={summary?.sparklines?.lowStockSkus}
          />
          <KpiCard
            icon={<TrendingUp className="h-3 w-3" />}
            label="Sell-through (30d)"
            value={
              summary?.sellThroughPct != null
                ? fmtNumber(summary.sellThroughPct, 1)
                : "—"
            }
            unit="%"
            delta={sellThroughDelta?.text}
            deltaTone={sellThroughDelta?.tone ?? "neutral"}
            spark={summary?.sparklines?.sellThroughPct}
          />
          <KpiCard
            icon={<RefreshCw className="h-3 w-3" />}
            label="Avg. days on hand"
            value={
              summary?.avgDaysOnHand != null
                ? fmtNumber(summary.avgDaysOnHand, 1)
                : "—"
            }
            unit="days"
            delta={daysDelta?.text}
            deltaTone={daysDelta?.tone ?? "neutral"}
            spark={summary?.sparklines?.avgDaysOnHand}
          />
        </KpiStrip>

        {/* Filter tabs — design's `.tabs` pill (matches Active/Archived
            on the products list). */}
        <div
          role="tablist"
          className="inline-flex w-fit items-center gap-0.5 rounded-md border border-line bg-card p-[3px]"
        >
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                role="tab"
                aria-selected={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  active
                    ? "bg-canvas text-ink"
                    : "text-ink-3 hover:text-ink",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-[3px] px-1.5 font-mono text-[10.5px] tracking-[0.02em]",
                    active
                      ? "border border-line bg-card text-ink-3"
                      : "bg-canvas text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {filtered.length > 0 ? (
          <DataTable
            columns={columns}
            data={filtered}
            searchKey="name"
            pageNo={0}
            total={filtered.length}
            pageCount={1}
            rowClickBasePath="/stock-variants"
          />
        ) : (
          <NoItems newItemUrl="/stock-variants/new" itemName="stock items" />
        )}
      </PageBody>
    </PageShell>
  );
}
