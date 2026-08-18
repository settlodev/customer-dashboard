import Link from "next/link";
import { PackagePlus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReorderSuggestion } from "@/types/inventory-analytics/type";

/**
 * Reorder soon — left half of the "reorder + Settlo credit" row (design §8).
 * Lists the stock variants closest to running out, from `getReorderSuggestions`:
 * name (+ variant), a velocity / days-left sub-line, the quantity on hand, and
 * an urgency tag. (Settlo credit — the row's right half — is intentionally not
 * built yet, so this stands alone full-width for now.)
 */

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

type Urgency = "out" | "critical" | "low" | "soon";

function urgencyOf(item: ReorderSuggestion): Urgency {
  if (item.currentAvailableQuantity <= 0) return "out";
  if (item.daysOfStockRemaining <= 3) return "critical";
  if (item.currentAvailableQuantity <= item.reorderPoint) return "low";
  return "soon";
}

const TAG: Record<Urgency, { label: string; cls: string }> = {
  // `bg-ink` inverts to near-white in dark mode, so pair it with `text-canvas`
  // (which inverts too) to stay high-contrast in both themes.
  out: { label: "Out", cls: "bg-ink text-canvas" },
  critical: { label: "Critical", cls: "bg-neg-tint text-neg" },
  low: { label: "Low", cls: "bg-warn-tint text-warn" },
  soon: {
    label: "Reorder soon",
    cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

export function ReorderSoonCard({ items }: { items: ReorderSuggestion[] }) {
  const rows = items.slice(0, 5);

  return (
    <Card className="flex h-full flex-col p-5 shadow-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
          <PackagePlus className="h-4 w-4 text-primary" strokeWidth={1.8} />
          Reorder soon
        </div>
        <Link
          href="/purchase-orders"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-dark hover:text-primary"
        >
          Purchase order →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center font-mono text-[12px] text-muted-foreground">
          Nothing needs reordering
        </p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((item) => {
            const tag = TAG[urgencyOf(item)];
            const showVariant =
              !!item.variantName &&
              item.variantName.trim().toLowerCase() !==
                item.stockName.trim().toLowerCase();
            const weekly = Math.round((item.avgDailyConsumption ?? 0) * 7);
            const daysLeft = Math.max(
              0,
              Math.round(item.daysOfStockRemaining ?? 0),
            );
            const sub =
              weekly > 0
                ? `Sells ≈ ${fmt(weekly)}/wk · ${daysLeft}d left`
                : `Reorder point ${fmt(item.reorderPoint)}`;
            return (
              <li
                key={item.stockVariantId}
                className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">
                    {item.stockName}
                    {showVariant && (
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {item.variantName}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground">
                    {sub}
                  </p>
                </div>
                <span className="min-w-[28px] flex-none text-right font-mono text-[13px] font-semibold tabular-nums text-ink">
                  {fmt(item.currentAvailableQuantity)}
                </span>
                <span
                  className={cn(
                    "inline-flex flex-none items-center whitespace-nowrap rounded-md px-2 py-[3px] font-mono text-[9.5px] font-semibold tracking-[0.03em]",
                    tag.cls,
                  )}
                >
                  {tag.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default ReorderSoonCard;
