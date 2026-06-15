import { CloudOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/admin/shared/section-card";
import { MetricCell, MetricGrid } from "@/components/admin/shared/metric-cell";
import { compactNumber, formatDate, formatInt } from "@/components/admin/shared/format";
import type { PackageDateRange } from "@/types/admin/billing";
import type {
  PlatformAccounts,
  PlatformOrders,
  PlatformStockMovement,
} from "@/types/admin/platform-metrics";

/**
 * OperationsBand — the period-filtered "operations" row on the admin dashboard:
 * platform-wide orders (count + value), accounts created, and stock movement
 * (in / out). Driven by the page's calendar filter; each card fault-isolates so
 * one failing Reports metric shows a "couldn't load" tile, not a broken row.
 */

export interface OperationMetric<T> {
  value: T | null;
  /** Same metric over the comparison window, for period-over-period deltas. */
  prev: T | null;
  error: boolean;
}

export interface OperationsData {
  orders: OperationMetric<PlatformOrders>;
  accounts: OperationMetric<PlatformAccounts>;
  stock: OperationMetric<PlatformStockMovement>;
}

type DeltaTone = "up" | "down" | "flat";
type Delta = { value: string; tone: DeltaTone };

const DELTA_TONE: Record<DeltaTone, string> = {
  up: "bg-pos-tint text-pos",
  down: "bg-neg-tint text-neg",
  flat: "bg-black/[0.04] text-ink-3 dark:bg-white/[0.06]",
};
const DELTA_GLYPH: Record<DeltaTone, string> = { up: "▲", down: "▼", flat: "→" };

function pctDelta(cur: number, prev: number | null | undefined): Delta | null {
  if (prev === null || prev === undefined || prev <= 0) return null;
  const d = ((cur - prev) / prev) * 100;
  if (!Number.isFinite(d)) return null;
  return { value: `${Math.abs(d).toFixed(1)}%`, tone: d >= 0 ? "up" : "down" };
}

function DeltaChip({ delta }: { delta: Delta | null }) {
  if (!delta) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-[2px] font-mono text-[10.5px] font-semibold tabular-nums",
        DELTA_TONE[delta.tone],
      )}
    >
      <span className="text-[8px] leading-none">{DELTA_GLYPH[delta.tone]}</span>
      {delta.value}
      <span className="font-normal text-muted-foreground"> vs prev</span>
    </span>
  );
}

function OpCard({
  title,
  subtitle,
  error,
  children,
}: {
  title: string;
  subtitle: string;
  error: boolean;
  children: React.ReactNode;
}) {
  return (
    <SectionCard title={title} subtitle={subtitle}>
      {error ? (
        <div className="flex min-h-[92px] flex-col items-center justify-center gap-1.5 text-center">
          <CloudOff className="h-5 w-5 text-muted-2" />
          <p className="text-[12.5px] font-semibold text-ink-2">Couldn&apos;t load</p>
          <p className="max-w-[240px] font-mono text-[10.5px] leading-relaxed text-muted-2">
            The Reports Service didn&apos;t return this metric.
          </p>
        </div>
      ) : (
        children
      )}
    </SectionCard>
  );
}

export function OperationsBand({
  data,
  range,
}: {
  data: OperationsData;
  range: PackageDateRange;
}) {
  const sub = `${formatDate(range.from)} – ${formatDate(range.to)}`;
  const days = Math.max(
    1,
    Math.round(
      (Date.parse(`${range.to}T00:00:00Z`) -
        Date.parse(`${range.from}T00:00:00Z`)) /
        86_400_000,
    ) + 1,
  );
  const orders = data.orders.value;
  const ordersPrev = data.orders.prev;
  const accounts = data.accounts.value;
  const accountsPrev = data.accounts.prev;
  const stock = data.stock.value;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          Operations
        </h2>
        <span className="font-mono text-[11px] text-muted-2">· {sub}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <OpCard title="Orders" subtitle="Across all businesses" error={data.orders.error}>
          <MetricGrid cols={2}>
            <MetricCell
              label="Orders"
              value={orders ? formatInt(orders.totalOrders) : "—"}
              sub={
                <DeltaChip
                  delta={orders ? pctDelta(orders.totalOrders, ordersPrev?.totalOrders) : null}
                />
              }
            />
            <MetricCell
              label="Value"
              currency="TZS"
              value={orders ? compactNumber(orders.grossSales) : "—"}
              sub={
                <DeltaChip
                  delta={orders ? pctDelta(orders.grossSales, ordersPrev?.grossSales) : null}
                />
              }
            />
          </MetricGrid>
        </OpCard>

        <OpCard title="Accounts created" subtitle="New sign-ups" error={data.accounts.error}>
          <MetricGrid cols={2}>
            <MetricCell
              label="Created"
              value={accounts ? formatInt(accounts.accountsCreated) : "—"}
              sub={
                <DeltaChip
                  delta={
                    accounts
                      ? pctDelta(accounts.accountsCreated, accountsPrev?.accountsCreated)
                      : null
                  }
                />
              }
            />
            <MetricCell
              label="Per day"
              value={
                accounts
                  ? (accounts.accountsCreated / days).toFixed(
                      accounts.accountsCreated / days >= 10 ? 0 : 1,
                    )
                  : "—"
              }
              sub="avg / day"
            />
          </MetricGrid>
        </OpCard>

        <OpCard title="Stock movement" subtitle="Inventory in / out" error={data.stock.error}>
          <MetricGrid cols={2}>
            <MetricCell
              label="In"
              value={stock ? formatInt(stock.qtyIn) : "—"}
              sub={stock ? `TZS ${compactNumber(stock.costIn)}` : undefined}
              subTone="pos"
            />
            <MetricCell
              label="Out"
              value={stock ? formatInt(stock.qtyOut) : "—"}
              sub={stock ? `TZS ${compactNumber(stock.costOut)}` : undefined}
            />
          </MetricGrid>
        </OpCard>
      </div>
    </section>
  );
}
