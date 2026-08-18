import {
  AlertTriangle,
  DollarSign,
  Package,
  PercentSquare,
} from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import type { RsProductsKpi } from "@/types/reports-analytics/type";

type Tone = "pos" | "neg" | "neutral";

type Props = {
  /** Catalog summary fetched server-side. Null = transport failure or no
   * scope yet — every tile renders an em-dash placeholder. */
  summary: RsProductsKpi | null;
};

const fmtCount = (n: number | null | undefined) =>
  n != null ? Math.round(n).toLocaleString() : "—";

const fmt1dp = (n: number | null | undefined) =>
  n != null
    ? n.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : "—";

const fmtSignedCount = (
  n: number | null | undefined,
  suffix: string,
): { text: string; tone: Tone } | undefined => {
  if (n == null) return undefined;
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const tone: Tone = n > 0 ? "pos" : n < 0 ? "neg" : "neutral";
  return { text: `${sign}${Math.abs(n).toLocaleString()} ${suffix}`, tone };
};

const fmtSignedPct = (
  pct: number | null | undefined,
  suffix: string,
  posIsGood = true,
): { text: string; tone: Tone } | undefined => {
  if (pct == null) return undefined;
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const isPos = rounded > 0;
  const tone: Tone =
    rounded === 0 ? "neutral" : isPos === posIsGood ? "pos" : "neg";
  return { text: `${sign}${Math.abs(rounded).toFixed(1)}${suffix}`, tone };
};

/**
 * Four-tile KPI strip for the products list page. Surfaces catalog size,
 * stock health, and commercial performance side-by-side so the merchant
 * can read the state of their menu in one glance.
 */
export function ProductsKpiStrip({ summary }: Props) {
  const productsDelta = fmtSignedCount(
    summary?.productsWeekDelta ?? null,
    "wk",
  );
  const stockHealthDelta =
    summary && summary.lowStockVariants > 0
      ? {
          text: `${summary.lowStockVariants.toLocaleString()} low stock`,
          tone: "neg" as Tone,
        }
      : undefined;
  const salesDelta = fmtSignedPct(summary?.salesWowPct ?? null, "% wk");
  const marginDelta = fmtSignedPct(summary?.marginDelta ?? null, " pts");

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<Package className="h-3 w-3" />}
        label="Active products"
        value={fmtCount(summary?.activeProducts)}
        delta={productsDelta?.text}
        deltaTone={productsDelta?.tone ?? "neutral"}
        spark={summary?.productsSparkline}
      />
      <KpiCard
        icon={<AlertTriangle className="h-3 w-3" />}
        label="Out of stock"
        value={fmtCount(summary?.outOfStockVariants)}
        unit="variants"
        delta={stockHealthDelta?.text}
        deltaTone={stockHealthDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<DollarSign className="h-3 w-3" />}
        label="Sales (30d)"
        value={fmtCount(summary?.sales30d)}
        unit={summary?.salesCurrency ?? "TZS"}
        delta={salesDelta?.text}
        deltaTone={salesDelta?.tone ?? "neutral"}
        spark={summary?.salesSparkline}
      />
      <KpiCard
        icon={<PercentSquare className="h-3 w-3" />}
        label="Avg margin (30d)"
        value={fmt1dp(summary?.avgMarginPct)}
        unit={summary?.avgMarginPct != null ? "%" : undefined}
        delta={marginDelta?.text}
        deltaTone={marginDelta?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}
