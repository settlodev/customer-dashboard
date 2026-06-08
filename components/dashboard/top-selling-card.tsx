import Link from "next/link";
import { ArrowUpRight, Crown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopSellingReport } from "@/types/reports/top-selling";

/**
 * Compact top-selling leaderboard for the dashboard. Fed by the same
 * reports endpoint as /report/top-selling (`listTopSellingProducts`), so it
 * shows real data where the old overview-embedded list came back empty.
 * Shows the top 5 by revenue and links through to the full report.
 */

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

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
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            <Crown className="h-3 w-3" />
            Top selling
          </div>
          <Link
            href="/report/top-selling"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
          >
            Full report
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {loading && !report ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center font-mono text-[12px] text-muted-foreground">
            No sales in this range
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const share = Math.round((item.revenue / maxRevenue) * 100);
              return (
                <li
                  key={`${item.productId}-${item.productVariantId ?? "base"}`}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[11px] font-semibold tabular-nums text-ink">
                    {item.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.productName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/80"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                        {fmt(item.quantitySold)} sold
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-ink">
                      {fmt(item.revenue)}
                    </p>
                    <p className="font-mono text-[10.5px] text-muted-foreground">
                      {currency}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default TopSellingCard;
