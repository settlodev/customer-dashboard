"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Period segmented control in the dashboard header (7D / 30D / 90D / 12M).
 * Presentational for now — the analytics endpoints aren't range-aware yet,
 * so selecting a period only updates the local highlight. Wire it to the
 * data fetch when the backend supports windowed metrics.
 */

const PERIODS = ["7D", "30D", "90D", "12M"] as const;

export function DashboardPeriodToggle() {
  const [active, setActive] = useState<(typeof PERIODS)[number]>("30D");
  return (
    <div className="inline-flex gap-0.5 rounded-[10px] border border-line bg-card p-[3px]">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setActive(p)}
          className={cn(
            "rounded-[7px] px-3 py-1.5 font-mono text-[12.5px] font-medium transition-colors",
            active === p
              ? "bg-ink text-white"
              : "text-ink-3 hover:text-ink",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/** "All systems operational" health pill shown beside the period toggle. */
export function SystemsStatusPill() {
  return (
    <span className="inline-flex h-[34px] items-center gap-2 rounded-full bg-pos-tint px-3 text-[12.5px] font-semibold text-pos">
      <span className="h-[7px] w-[7px] rounded-full bg-pos shadow-[0_0_0_3px_hsl(var(--pos)/0.18)]" />
      All systems operational
    </span>
  );
}
