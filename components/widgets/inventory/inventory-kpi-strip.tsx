import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Layers,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import type { RsInventoryDashboardSummary } from "@/types/reports-analytics/type";

type Tone = "pos" | "neg" | "neutral";

type Props = {
  /** Dashboard summary fetched server-side. Null = transport failure or
   * no scope yet — every tile renders an em-dash placeholder. */
  summary: RsInventoryDashboardSummary | null;
};

const fmtCount = (n: number) => Math.round(n).toLocaleString();

const fmtNumber = (n: number, fractionDigits = 0) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const fmtSignedPct = (
  pct: number | null,
  suffix: string,
): { text: string; tone: Tone } | undefined => {
  if (pct === null || pct === undefined) return undefined;
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const tone: Tone = rounded > 0 ? "pos" : rounded < 0 ? "neg" : "neutral";
  return { text: `${sign}${Math.abs(rounded).toFixed(1)}${suffix}`, tone };
};

const fmtSignedCount = (
  n: number,
  suffix: string,
): { text: string; tone: Tone } => {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const tone: Tone = n > 0 ? "pos" : n < 0 ? "neg" : "neutral";
  return { text: `${sign}${Math.abs(n).toLocaleString()} ${suffix}`, tone };
};

const fmtSignedDays = (
  days: number | null,
): { text: string; tone: Tone } | undefined => {
  if (days === null || days === undefined) return undefined;
  const rounded = Math.round(days * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  // Fewer days on hand = inventory turning faster → tone "pos".
  const tone: Tone = rounded < 0 ? "pos" : rounded > 0 ? "neg" : "neutral";
  return { text: `${sign}${Math.abs(rounded).toFixed(1)} d`, tone };
};

/**
 * Six-tile inventory KPI strip — shared between the stock items list, the
 * main dashboard, and the business-wide overview. The data source decides
 * scope (location vs business); this component just renders.
 */
export function InventoryKpiStrip({ summary }: Props) {
  const valueDelta = fmtSignedPct(
    summary?.totalInventoryValueWowPct ?? null,
    "% wk",
  );
  const unitsDelta = fmtSignedPct(
    summary?.unitsInStockWowPct ?? null,
    "% wk",
  );
  const skusDelta = summary
    ? fmtSignedCount(summary.activeSkusDailyDelta, "today")
    : undefined;
  const sellThroughDelta = fmtSignedPct(
    summary?.sellThroughPpDelta ?? null,
    " pts",
  );
  const daysDelta = fmtSignedDays(summary?.avgDaysOnHandDelta ?? null);
  const criticalDelta =
    summary && summary.criticalStockSkus > 0
      ? { text: `${summary.criticalStockSkus} critical`, tone: "neg" as Tone }
      : undefined;

  return (
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
  );
}
