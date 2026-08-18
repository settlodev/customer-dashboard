import { AlertTriangle, Boxes, Layers, Truck } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import type { RsStockIntakeKpi } from "@/types/reports-analytics/type";

type Tone = "pos" | "neg" | "neutral";

type Props = {
  summary: RsStockIntakeKpi | null;
};

const fmtCount = (n: number | null | undefined) =>
  n != null ? Math.round(n).toLocaleString() : "—";

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
): { text: string; tone: Tone } | undefined => {
  if (pct == null) return undefined;
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const tone: Tone = rounded > 0 ? "pos" : rounded < 0 ? "neg" : "neutral";
  return { text: `${sign}${Math.abs(rounded).toFixed(1)}${suffix}`, tone };
};

/**
 * KPI strip for /stock-intakes. 4 tiles, server-rendered from the
 * Reports Service `/stock-intakes/summary` response.
 */
export function StockIntakeKpiStrip({ summary }: Props) {
  const intakesDelta = fmtSignedCount(summary?.intakesWeekDelta ?? null, "wk");
  const unitsDelta = fmtSignedPct(summary?.unitsReceivedWowPct ?? null, "% wk");
  const awaitingDelta =
    summary && summary.awaitingOver24h > 0
      ? { text: `${summary.awaitingOver24h} over 24h`, tone: "neg" as Tone }
      : undefined;
  const varianceDelta =
    summary && summary.varianceFlags > 0
      ? { text: "needs review", tone: "neg" as Tone }
      : undefined;

  return (
    <KpiStrip cols={4}>
      <KpiCard
        icon={<Layers className="h-3 w-3" />}
        label="Intakes (30d)"
        value={fmtCount(summary?.intakesCount)}
        delta={intakesDelta?.text}
        deltaTone={intakesDelta?.tone ?? "neutral"}
        spark={summary?.intakesSparkline}
      />
      <KpiCard
        icon={<Boxes className="h-3 w-3" />}
        label="Units received"
        value={fmtCount(summary?.unitsReceived)}
        delta={unitsDelta?.text}
        deltaTone={unitsDelta?.tone ?? "neutral"}
        spark={summary?.unitsSparkline}
      />
      <KpiCard
        icon={<Truck className="h-3 w-3" />}
        label="Awaiting confirmation"
        value={fmtCount(summary?.awaitingConfirmation)}
        unit="drafts"
        delta={awaitingDelta?.text}
        deltaTone={awaitingDelta?.tone ?? "neutral"}
      />
      <KpiCard
        icon={<AlertTriangle className="h-3 w-3" />}
        label="Variance flags"
        value={fmtCount(summary?.varianceFlags)}
        delta={varianceDelta?.text}
        deltaTone={varianceDelta?.tone ?? "neutral"}
      />
    </KpiStrip>
  );
}
