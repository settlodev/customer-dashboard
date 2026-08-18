import { Boxes, PackageMinus, Undo2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { MovementTypeBreakdownChart } from "@/components/widgets/inventory/stock-item-charts";
import { getCurrentDestination } from "@/lib/actions/context";
import { getLocationMovementSummary } from "@/lib/actions/reports-analytics-actions";
import type { RsMovementTypeBreakdown } from "@/types/reports-analytics/type";

interface Props {
  from: string;
  to: string;
}

// The three packaging-specific movement types this tab cares about — every
// other type in the summary (sales, transfers, adjustments, ...) is out of
// scope for the packaging report.
const PACKAGING_MOVEMENT_TYPES = [
  "CONTAINER_RETURN_IN",
  "CONTAINER_RETURN_OUT",
  "PACKAGING_CONSUMED",
] as const;

const fmt = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

const qtyFor = (rows: RsMovementTypeBreakdown[], type: string) =>
  Math.abs(
    Number(rows.find((r) => r.movementType === type)?.totalQuantity ?? 0),
  );

/**
 * Flow — container movement for the period: empties coming back from
 * customers, empties handed back upstream to a supplier, and one-way
 * packaging consumed outright. Reuses the same stock-movement summary
 * endpoint as the stock report's Movement tab, filtered down to the
 * three packaging movement types.
 */
export async function FlowTab({ from, to }: Props) {
  // Follow the active destination (location OR store), not just the location —
  // in store mode getCurrentLocation() is null, which would blank the report.
  const destination = await getCurrentDestination();
  const locationId = destination?.id ?? null;

  const summary = locationId
    ? await getLocationMovementSummary(locationId, from, to)
    : null;

  const packagingRows = (summary?.byType ?? []).filter((row) =>
    PACKAGING_MOVEMENT_TYPES.includes(
      row.movementType as (typeof PACKAGING_MOVEMENT_TYPES)[number],
    ),
  );

  if (packagingRows.length === 0) {
    return <NoItems itemName="packaging movements" />;
  }

  const returned = qtyFor(packagingRows, "CONTAINER_RETURN_IN");
  const handedBack = qtyFor(packagingRows, "CONTAINER_RETURN_OUT");
  const consumed = qtyFor(packagingRows, "PACKAGING_CONSUMED");

  return (
    <>
      <KpiStrip cols={3}>
        <KpiCard
          icon={<Undo2 className="h-3 w-3" />}
          label="Empties returned"
          value={returned > 0 ? fmt(returned) : "—"}
          delta="Returned by customers"
          deltaTone="pos"
        />
        <KpiCard
          icon={<Boxes className="h-3 w-3" />}
          label="Handed back"
          value={handedBack > 0 ? fmt(handedBack) : "—"}
          delta="Returned to supplier"
          deltaTone="neg"
        />
        <KpiCard
          icon={<PackageMinus className="h-3 w-3" />}
          label="Consumed"
          value={consumed > 0 ? fmt(consumed) : "—"}
          delta="One-way packaging used"
          deltaTone="neg"
        />
      </KpiStrip>

      <Card>
        <CardContent className="p-4">
          <header className="mb-3">
            <h3 className="text-[13px] font-semibold tracking-tight text-ink">
              By movement type
            </h3>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              Empties returned · handed back · consumed
            </p>
          </header>
          <MovementTypeBreakdownChart breakdown={packagingRows} />
        </CardContent>
      </Card>
    </>
  );
}
