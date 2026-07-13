import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopSellingReport } from "@/types/reports/top-selling";

/**
 * Top selling — left half of the "top selling + recent activity" row (design
 * §6). A ranked leaderboard styled to the mock's `.rank` list: rank · product
 * (with a `category · variant · N sold` sub-line beneath the name) · share bar
 * (revenue relative to the top item) · revenue. Fed by `listTopSellingProducts`.
 */

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

// Per-rank bar colours — the mock cycles primary / pos / warn / blue / purple.
const BAR_COLORS = [
  "#EB7F44",
  "hsl(var(--pos))",
  "hsl(var(--warn))",
  "#2563EB",
  "#7C3AED",
];

export function TopSellingCard({
  report,
  loading,
}: {
  report: TopSellingReport | null;
  loading?: boolean;
}) {
  const items = (report?.items ?? []).slice(0, 5);
  const currency = report?.summary.currency ?? "TZS";
  const maxRevenue = items.reduce((m, i) => Math.max(m, i.revenue), 0) || 1;

  return (
    <Card className="flex h-full flex-col p-5 shadow-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
          <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.8} />
          Top selling
        </div>
        <Link
          href="/report/top-selling"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-dark hover:text-primary"
        >
          Full report →
        </Link>
      </div>

      {loading && !report ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center font-mono text-[12px] text-muted-foreground">
          No sales in this range
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item, i) => {
            const share = Math.round((item.revenue / maxRevenue) * 100);
            // Variant sits inline after the product name — but only when it
            // actually differs (simple products echo the product name as their
            // variant, which would just be noise).
            const showVariant =
              !!item.variantName &&
              item.variantName.trim().toLowerCase() !==
                item.productName.trim().toLowerCase();
            const sub = [item.categoryName, `${fmt(item.quantitySold)} sold`]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={`${item.productId}-${item.productVariantId ?? "base"}`}
                className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
              >
                <span className="w-4 flex-none text-right font-mono text-[11px] font-semibold text-muted-2">
                  {item.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">
                    {item.productName}
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
                <div className="hidden h-[7px] w-20 flex-none overflow-hidden rounded-full bg-canvas sm:block">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${share}%`,
                      background: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                </div>
                <div className="flex-none text-right">
                  <p className="font-mono text-[12.5px] font-semibold tabular-nums text-ink">
                    {fmt(item.revenue)}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {currency}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default TopSellingCard;
