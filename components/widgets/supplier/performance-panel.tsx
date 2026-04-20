"use client";

import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock,
  PackageCheck,
  PackageX,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierPerformance } from "@/types/supplier-performance/type";

interface Props {
  metrics: SupplierPerformance[];
  /** Friendly label mapping for location IDs, if the parent can provide it. */
  locationLabels?: Record<string, string>;
}

/**
 * Read-only performance tiles + per-location table. The backend aggregates
 * across LPOs/GRNs/returns; this panel just renders whatever rows come back.
 */
export function SupplierPerformancePanel({ metrics, locationLabels }: Props) {
  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No performance data yet. Metrics populate once this supplier has
            received LPOs and GRNs against them.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totals = metrics.reduce(
    (acc, m) => {
      acc.totalOrders += m.totalOrders;
      acc.totalGrns += m.totalGrns;
      acc.totalOrderedQty += m.totalOrderedQty;
      acc.totalReceivedQty += m.totalReceivedQty;
      acc.totalReturnedQty += m.totalReturnedQty;
      return acc;
    },
    {
      totalOrders: 0,
      totalGrns: 0,
      totalOrderedQty: 0,
      totalReceivedQty: 0,
      totalReturnedQty: 0,
    },
  );

  const weighted = (picker: (m: SupplierPerformance) => number | null): number | null => {
    let sum = 0;
    let weight = 0;
    for (const m of metrics) {
      const v = picker(m);
      if (v == null) continue;
      const w = m.totalOrders > 0 ? m.totalOrders : 1;
      sum += v * w;
      weight += w;
    }
    if (weight === 0) return null;
    return sum / weight;
  };

  const avgLead = weighted((m) => m.avgLeadTimeDays);
  const fillRate = weighted((m) => m.fillRate);
  const quality = weighted((m) => m.qualityScore);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Tile
          icon={<PackageCheck className="h-4 w-4" />}
          label="Orders"
          value={totals.totalOrders.toLocaleString()}
        />
        <Tile
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="GRNs"
          value={totals.totalGrns.toLocaleString()}
        />
        <Tile
          icon={<Clock className="h-4 w-4" />}
          label="Lead time"
          value={avgLead != null ? `${avgLead.toFixed(1)} d` : "\u2014"}
          subtitle="weighted avg"
        />
        <Tile
          icon={<TrendingUp className="h-4 w-4" />}
          label="Fill rate"
          value={fillRate != null ? `${(fillRate * 100).toFixed(1)}%` : "\u2014"}
          tone={fillRate != null && fillRate >= 0.95 ? "green" : "default"}
        />
        <Tile
          icon={<Activity className="h-4 w-4" />}
          label="Quality"
          value={quality != null ? `${(quality * 100).toFixed(1)}%` : "\u2014"}
          tone={quality != null && quality >= 0.98 ? "green" : "default"}
        />
        <Tile
          icon={<PackageX className="h-4 w-4" />}
          label="Returned"
          value={totals.totalReturnedQty.toLocaleString()}
          tone={totals.totalReturnedQty > 0 ? "red" : "default"}
        />
      </div>

      {metrics.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Per-location breakdown
            </h3>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">GRNs</TableHead>
                    <TableHead className="text-right">Lead time</TableHead>
                    <TableHead className="text-right">Fill rate</TableHead>
                    <TableHead className="text-right">Quality</TableHead>
                    <TableHead>Last order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">
                        {m.locationId
                          ? (locationLabels?.[m.locationId] ?? m.locationId.slice(0, 8))
                          : "All locations"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {m.totalOrders.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {m.totalGrns.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {m.avgLeadTimeDays != null
                          ? `${m.avgLeadTimeDays.toFixed(1)}d`
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {m.fillRate != null
                          ? `${(m.fillRate * 100).toFixed(1)}%`
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {m.qualityScore != null
                          ? `${(m.qualityScore * 100).toFixed(1)}%`
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.lastOrderDate
                          ? new Date(m.lastOrderDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  subtitle,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  tone?: "default" | "green" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "red"
        ? "text-red-600 dark:text-red-400"
        : "text-gray-900 dark:text-gray-100";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
