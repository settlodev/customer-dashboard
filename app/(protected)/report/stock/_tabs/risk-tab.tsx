import { CircleSlash, PackagePlus, ShieldAlert } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import {
  ForecastTable,
  ReorderTable,
} from "@/components/reports/stock/risk-tables";
import {
  getReorderSuggestions,
  getStockoutForecast,
} from "@/lib/actions/inventory-analytics-actions";

interface Props {
  /** Snapshot reference date (currently unused — analytics use live balances). */
  asOf: string;
}

const fmt = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * Risk & reorder — the "what should I act on next" tab.
 *
 * Two stacked tables: stockout forecast (when each variant runs out)
 * and reorder suggestions (variants below their reorder point with
 * a recommended order qty). The KPI strip rolls up risk-level counts
 * so the operator can see scope at a glance.
 *
 * `asOf` is accepted for symmetry but the underlying analytics
 * compute against current balances + recent consumption — it can't
 * meaningfully rewind risk to a historical date.
 */
export async function RiskTab({ asOf: _asOf }: Props) {
  const [forecast, reorder] = await Promise.all([
    getStockoutForecast(),
    getReorderSuggestions(),
  ]);

  const critical = forecast.filter((f) => f.riskLevel === "CRITICAL").length;
  const high = forecast.filter((f) => f.riskLevel === "HIGH").length;
  const reorderCount = reorder.length;

  // Hard-cap the rendered rows at 1000 per table. The underlying analytics
  // endpoints already return a sensible cap, but this prevents a
  // pathological forecast from blowing the DOM if that ever drifts.
  const PAGE_LIMIT = 25;
  const forecastSlice = forecast.slice(0, 1000);
  const reorderSlice = reorder.slice(0, 1000);

  return (
    <>
      <KpiStrip cols={3}>
        <KpiCard
          icon={<ShieldAlert className="h-3 w-3" />}
          label="Critical"
          value={critical > 0 ? fmt(critical) : "—"}
          delta="Out within days"
          deltaTone={critical > 0 ? "neg" : "neutral"}
        />
        <KpiCard
          icon={<CircleSlash className="h-3 w-3" />}
          label="High risk"
          value={high > 0 ? fmt(high) : "—"}
          delta="Trending toward stockout"
          deltaTone={high > 0 ? "neg" : "neutral"}
        />
        <KpiCard
          icon={<PackagePlus className="h-3 w-3" />}
          label="Reorder now"
          value={reorderCount > 0 ? fmt(reorderCount) : "—"}
          delta="Below reorder point"
          deltaTone={reorderCount > 0 ? "neg" : "pos"}
        />
      </KpiStrip>

      <section>
        <header className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">
            Stockout forecast
          </h2>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            {fmt(forecast.length)} item{forecast.length === 1 ? "" : "s"}
          </span>
        </header>
        <ForecastTable
          data={forecastSlice}
          pageCount={Math.max(1, Math.ceil(forecastSlice.length / PAGE_LIMIT))}
          pageNo={0}
          total={forecastSlice.length}
        />
      </section>

      <section>
        <header className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">
            Reorder suggestions
          </h2>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            {fmt(reorder.length)} item{reorder.length === 1 ? "" : "s"}
          </span>
        </header>
        <ReorderTable
          data={reorderSlice}
          pageCount={Math.max(1, Math.ceil(reorderSlice.length / PAGE_LIMIT))}
          pageNo={0}
          total={reorderSlice.length}
        />
      </section>
    </>
  );
}
