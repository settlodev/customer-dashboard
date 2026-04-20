"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { RsMovementTypeBreakdown } from "@/types/reports-analytics/type";
import { MOVEMENT_TYPE_LABELS } from "@/types/stock-movement/type";

/**
 * Chart-ready row computed from a daily snapshot. We expose *signed* flows
 * (outflows negative) so the stacked bar reads like a P&L — positive bars
 * push the closing qty up, negative bars pull it down.
 */
interface ChartRow {
  date: string;
  label: string;
  closingQuantity: number;
  closingValue: number;
  purchase: number;
  transferIn: number;
  returns: number;
  sales: number;
  transferOut: number;
  adjustment: number;
  damage: number;
  recipeUsage: number;
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toRows(snapshots: InventorySnapshot[]): ChartRow[] {
  return snapshots
    .slice()
    .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
    .map((s) => ({
      date: s.snapshotDate,
      label: formatShort(s.snapshotDate),
      closingQuantity: Number(s.closingQuantity ?? 0),
      closingValue: Number(s.closingValue ?? 0),
      purchase: Number(s.purchaseQuantity ?? 0),
      transferIn: Number(s.transferInQuantity ?? 0),
      returns: Number(s.returnQuantity ?? 0),
      sales: -Math.abs(Number(s.saleQuantity ?? 0)),
      transferOut: -Math.abs(Number(s.transferOutQuantity ?? 0)),
      adjustment: Number(s.adjustmentQuantity ?? 0),
      damage: -Math.abs(Number(s.damageQuantity ?? 0)),
      recipeUsage: -Math.abs(Number(s.recipeUsageQuantity ?? 0)),
    }));
}

export function QtyOnHandChart({ snapshots }: { snapshots: InventorySnapshot[] }) {
  const rows = useMemo(() => toRows(snapshots), [snapshots]);

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Qty on hand over time
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                formatter={(v: number) => v.toLocaleString()}
                labelClassName="text-xs font-medium"
              />
              <Line
                type="monotone"
                dataKey="closingQuantity"
                stroke="#EB7F44"
                strokeWidth={2}
                dot={false}
                name="Closing qty"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function StockValueChart({
  snapshots,
  currency,
}: {
  snapshots: InventorySnapshot[];
  currency: string;
}) {
  const rows = useMemo(() => toRows(snapshots), [snapshots]);

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Stock value ({currency}) over time
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v) => Math.round(Number(v)).toLocaleString()}
              />
              <Tooltip
                formatter={(v: number) => v.toLocaleString()}
                labelClassName="text-xs font-medium"
              />
              <Area
                type="monotone"
                dataKey="closingValue"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#valueGradient)"
                name="Closing value"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function MovementMixChart({ snapshots }: { snapshots: InventorySnapshot[] }) {
  const rows = useMemo(() => toRows(snapshots), [snapshots]);

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Daily movement mix
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                formatter={(v: number) => Math.abs(Number(v)).toLocaleString()}
                labelClassName="text-xs font-medium"
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="purchase" stackId="flow" fill="#16a34a" name="Purchase" />
              <Bar dataKey="transferIn" stackId="flow" fill="#0ea5e9" name="Transfer in" />
              <Bar dataKey="returns" stackId="flow" fill="#65a30d" name="Return" />
              <Bar dataKey="adjustment" stackId="flow" fill="#a855f7" name="Adjustment" />
              <Bar dataKey="sales" stackId="flow" fill="#dc2626" name="Sale" />
              <Bar dataKey="transferOut" stackId="flow" fill="#f97316" name="Transfer out" />
              <Bar dataKey="damage" stackId="flow" fill="#b91c1c" name="Damage" />
              <Bar dataKey="recipeUsage" stackId="flow" fill="#be185d" name="Recipe use" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function MovementTypeBreakdownChart({
  breakdown,
}: {
  breakdown: RsMovementTypeBreakdown[];
}) {
  const rows = useMemo(
    () =>
      [...breakdown]
        .map((b) => ({
          type: MOVEMENT_TYPE_LABELS[b.movementType as keyof typeof MOVEMENT_TYPE_LABELS] ?? b.movementType,
          quantity: Math.abs(Number(b.totalQuantity ?? 0)),
          count: b.count,
        }))
        .sort((a, b) => b.quantity - a.quantity),
    [breakdown],
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Movement volume by type
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip formatter={(v: number) => v.toLocaleString()} labelClassName="text-xs font-medium" />
              <Bar dataKey="quantity" fill="#EB7F44" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">
      No data for the selected range.
    </div>
  );
}
