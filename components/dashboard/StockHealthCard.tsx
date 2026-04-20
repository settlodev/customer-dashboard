"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Clock,
  DollarSign,
  PackageMinus,
  PackageX,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Money } from "@/components/widgets/money";
import { getStockHealthSummary } from "@/lib/actions/stock-health-actions";
import type { StockHealthSummary } from "@/types/stock-health/type";

/**
 * Compact location-wide stock health strip for the main dashboard. Pulls the
 * same signals as /report/stock but summarised — total value, risk counts,
 * dead stock — and links through to the full report.
 */
export default function StockHealthCard() {
  const [data, setData] = useState<StockHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getStockHealthSummary()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Stock health
        </CardTitle>
        <Link
          href="/report/stock"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Full report
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[70px] rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Tile icon={<Boxes className="h-4 w-4" />} label="Active SKUs" value={data.activeSkus.toLocaleString()} />
            <Tile
              icon={<DollarSign className="h-4 w-4" />}
              label="Stock value"
              value={<Money amount={data.totalValue} currency={data.currency} />}
            />
            <Tile
              icon={<PackageMinus className="h-4 w-4" />}
              label="Low stock"
              value={data.lowStockCount.toLocaleString()}
              tone={data.lowStockCount > 0 ? "amber" : undefined}
            />
            <Tile
              icon={<PackageX className="h-4 w-4" />}
              label="Out of stock"
              value={data.outOfStockCount.toLocaleString()}
              tone={data.outOfStockCount > 0 ? "red" : undefined}
            />
            <Tile
              icon={<ShieldAlert className="h-4 w-4" />}
              label="At risk"
              value={data.criticalRiskCount.toLocaleString()}
              subtitle="critical + high"
              tone={data.criticalRiskCount > 0 ? "red" : undefined}
            />
            <Tile
              icon={<Clock className="h-4 w-4" />}
              label="Dead stock"
              value={data.deadStockCount.toLocaleString()}
              subtitle="30+ days idle"
              tone={data.deadStockCount > 0 ? "slate" : undefined}
            />
          </div>
        )}

        {data && data.reorderAlerts.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {data.reorderAlerts.length} item{data.reorderAlerts.length === 1 ? "" : "s"} below reorder point
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 line-clamp-1">
                  {data.reorderAlerts.slice(0, 3).map((r) => r.variantName).join(" · ")}
                  {data.reorderAlerts.length > 3 && ` · +${data.reorderAlerts.length - 3} more`}
                </p>
              </div>
              <Link
                href="/report/stock?tab=risk"
                className="text-[11px] font-medium text-amber-800 hover:underline whitespace-nowrap"
              >
                Review
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Tile({
  icon,
  label,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  tone?: "amber" | "red" | "slate";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-600 dark:text-red-400"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "slate"
          ? "text-gray-700 dark:text-gray-300"
          : "text-gray-900 dark:text-gray-100";
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg font-semibold leading-tight ${toneClass}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
