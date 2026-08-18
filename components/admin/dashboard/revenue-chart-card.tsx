"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/admin/shared/section-card";
import { AreaTrendChart } from "@/components/admin/shared/area-trend-chart";
import { compactNumber } from "@/components/admin/shared/format";
import { RevenueSeries, RevenueSeriesKey } from "@/types/admin/dashboard";

interface RevenueChartCardProps {
  series: RevenueSeries[];
  stub?: boolean;
}

export function RevenueChartCard({ series, stub }: RevenueChartCardProps) {
  const [activeKey, setActiveKey] = useState<RevenueSeriesKey>(
    series[0]?.key ?? "mrr",
  );
  const active = series.find((s) => s.key === activeKey) ?? series[0];
  if (!active) return null;

  const isCurrency = active.valueKind === "currency";
  const formatValue = (v: number) =>
    isCurrency ? compactNumber(v) : Math.round(v).toLocaleString();

  return (
    <SectionCard
      title="Recurring revenue"
      subtitle={`Last 12 months · ${active.label}`}
      stub={stub}
      action={
        <div className="inline-flex gap-0.5 rounded-lg border border-line bg-canvas p-0.5">
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors",
                s.key === activeKey
                  ? "bg-card text-ink shadow-card-2"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-1 flex items-baseline gap-3">
        <div className="text-[30px] font-bold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {active.currency && (
            <span className="mr-1 text-[15px] font-semibold text-ink-3">
              {active.currency}
            </span>
          )}
          {active.headlineValue}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] font-mono text-[12px] font-semibold",
            active.delta.tone === "up"
              ? "bg-pos-tint text-pos"
              : active.delta.tone === "down"
                ? "bg-neg-tint text-neg"
                : "bg-black/[0.04] text-ink-3",
          )}
        >
          <span className="text-[9px] leading-none">
            {active.delta.tone === "up" ? "▲" : active.delta.tone === "down" ? "▼" : "→"}
          </span>
          {active.delta.value}
        </span>
      </div>
      <p className="mb-3.5 font-mono text-[11.5px] text-muted-foreground">
        {active.caption}
      </p>

      <AreaTrendChart
        data={active.points}
        gradientId={`rev-${active.key}`}
        valueFormatter={formatValue}
        tooltipLabel={active.label}
      />
    </SectionCard>
  );
}
