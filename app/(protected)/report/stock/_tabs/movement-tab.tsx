import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Sigma,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import {
  MovementMixChart,
  MovementTypeBreakdownChart,
} from "@/components/widgets/inventory/stock-item-charts";
import { getCurrentDestination } from "@/lib/actions/context";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getLocationSnapshotRange } from "@/lib/actions/inventory-snapshot-actions";
import { getLocationMovementSummary } from "@/lib/actions/reports-analytics-actions";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";

interface Props {
  from: string;
  to: string;
}

const fmt = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * Movement — what flowed through inventory in the period.
 *
 * KPI strip: in, out, net change, movement count. Mix chart shows
 * cumulative qty over time split by direction; the breakdown chart
 * shows the per-type slice (sales, intakes, transfers, adjustments,
 * damages, returns, recipe usage). Both come from existing analytics
 * endpoints — no day-session coupling.
 */
export async function MovementTab({ from, to }: Props) {
  // Follow the active destination (location OR store), not just the location —
  // in store mode getCurrentLocation() is null, which would blank the report.
  const destination = await getCurrentDestination();
  const locationId = destination?.id ?? null;

  const [currency, summary, snapshots] = await Promise.all([
    getLocationCurrency(),
    locationId
      ? getLocationMovementSummary(locationId, from, to)
      : Promise.resolve(null),
    getLocationSnapshotRange(from, to),
  ]);

  const hasMovement =
    !!summary && (summary.totalQuantityIn > 0 || summary.totalQuantityOut > 0);

  if (!hasMovement) {
    return <NoItems itemName="movement" />;
  }

  const collapsed = collapseSnapshots(snapshots);

  return (
    <>
      <KpiStrip cols={4}>
        <KpiCard
          icon={<ArrowDownToLine className="h-3 w-3" />}
          label="Quantity in"
          value={summary.totalQuantityIn > 0 ? fmt(summary.totalQuantityIn) : "—"}
          delta={`${fmt(summary.totalCostIn)} ${currency} cost`}
          deltaTone="pos"
        />
        <KpiCard
          icon={<ArrowUpFromLine className="h-3 w-3" />}
          label="Quantity out"
          value={summary.totalQuantityOut > 0 ? fmt(summary.totalQuantityOut) : "—"}
          delta={`${fmt(summary.totalCostOut)} ${currency} cost`}
          deltaTone="neg"
        />
        <KpiCard
          icon={<Repeat className="h-3 w-3" />}
          label="Net change"
          value={fmt(summary.netQuantityChange)}
          delta="In − Out"
          deltaTone={summary.netQuantityChange >= 0 ? "pos" : "neg"}
        />
        <KpiCard
          icon={<Sigma className="h-3 w-3" />}
          label="Movements"
          value={summary.totalMovements > 0 ? fmt(summary.totalMovements) : "—"}
          delta="Distinct events"
          deltaTone="neutral"
        />
      </KpiStrip>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <header className="mb-3">
              <h3 className="text-[13px] font-semibold tracking-tight text-ink">
                Daily mix
              </h3>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                Quantity in vs out
              </p>
            </header>
            <MovementMixChart snapshots={collapsed} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <header className="mb-3">
              <h3 className="text-[13px] font-semibold tracking-tight text-ink">
                By movement type
              </h3>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                Sales · intakes · transfers · adjustments · damages · returns
              </p>
            </header>
            <MovementTypeBreakdownChart breakdown={summary.byType} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function collapseSnapshots(rows: InventorySnapshot[]): InventorySnapshot[] {
  const byDate = new Map<string, InventorySnapshot>();
  for (const r of rows) {
    const existing = byDate.get(r.snapshotDate);
    if (!existing) {
      byDate.set(r.snapshotDate, { ...r });
      continue;
    }
    existing.openingQuantity += Number(r.openingQuantity ?? 0);
    existing.closingQuantity += Number(r.closingQuantity ?? 0);
    existing.openingValue += Number(r.openingValue ?? 0);
    existing.closingValue += Number(r.closingValue ?? 0);
    existing.purchaseQuantity += Number(r.purchaseQuantity ?? 0);
    existing.saleQuantity += Number(r.saleQuantity ?? 0);
    existing.transferInQuantity += Number(r.transferInQuantity ?? 0);
    existing.transferOutQuantity += Number(r.transferOutQuantity ?? 0);
    existing.adjustmentQuantity += Number(r.adjustmentQuantity ?? 0);
    existing.damageQuantity += Number(r.damageQuantity ?? 0);
    existing.returnQuantity += Number(r.returnQuantity ?? 0);
    existing.recipeUsageQuantity += Number(r.recipeUsageQuantity ?? 0);
    existing.openingBalanceQuantity += Number(r.openingBalanceQuantity ?? 0);
    existing.reservedQuantity += Number(r.reservedQuantity ?? 0);
    existing.inTransitQuantity += Number(r.inTransitQuantity ?? 0);
  }
  return Array.from(byDate.values()).sort((a, b) =>
    a.snapshotDate.localeCompare(b.snapshotDate),
  );
}
