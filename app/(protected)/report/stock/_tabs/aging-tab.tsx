import { addDays, format } from "date-fns";
import { CircleSlash, Clock, Hourglass, Skull } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import {
  ExpiredBatchesTable,
  ExpiringBatchesTable,
} from "@/components/reports/stock/batch-expiry-tables";
import { DeadStockTable } from "@/components/reports/stock/dead-stock-table";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import {
  getDeadStock,
  getStockAging,
} from "@/lib/actions/inventory-analytics-actions";
import {
  getExpiredBatches,
  getExpiringBatches,
} from "@/lib/actions/stock-batch-actions";

interface Props {
  /** Snapshot reference date (analytics use live balances; param kept for symmetry). */
  asOf: string;
}

const EXPIRY_WINDOW_DAYS = 7;
const PAGE_LIMIT = 25;
const EXPIRED_FETCH_SIZE = 200;

const fmt = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

const tiedUpValue = (batches: { quantityOnHand: number; unitCost: number | null }[]) =>
  batches.reduce((sum, b) => sum + b.quantityOnHand * (b.unitCost ?? 0), 0);

/**
 * Aging & expiry — "what's been sitting too long, or is about to go bad?"
 *
 * Four stacked sections:
 *   1. Aging buckets (0-30 / 30-60 / 60-90 / 90+ days since receipt)
 *   2. Expiring soon — ACTIVE batches with expiry within the next
 *      {@link EXPIRY_WINDOW_DAYS} days (matches the inventory service's
 *      BATCH_EXPIRY_APPROACHING scheduler horizon).
 *   3. Expired — EXPIRED batches still holding inventory, sorted by
 *      most-recently-expired first. Capped at {@link EXPIRED_FETCH_SIZE}
 *      rows; a dedicated detail page can paginate further if needed.
 *   4. Dead stock — variants with no movement in 30+ days.
 *
 * All four come from existing inventory endpoints. The shared client
 * pagination URL params (`?page`/`?limit`) drive every table on this
 * tab in lock-step — switching pages advances each table to its own
 * page N. Both expiring & expired sections are bounded to keep the
 * payload modest; the per-tab cap is enough for monitoring while the
 * granular drill-downs live in inventory pages elsewhere.
 */
export async function AgingTab({ asOf: _asOf }: Props) {
  const expiryHorizon = format(addDays(new Date(), EXPIRY_WINDOW_DAYS), "yyyy-MM-dd");

  const [currency, aging, deadStock, expiring, expired] = await Promise.all([
    getLocationCurrency(),
    getStockAging(),
    getDeadStock(30),
    getExpiringBatches(expiryHorizon),
    getExpiredBatches(0, EXPIRED_FETCH_SIZE),
  ]);

  const hasAging = aging && aging.buckets && aging.buckets.length > 0;
  const deadValue = deadStock.reduce((sum, d) => sum + (d.totalValue ?? 0), 0);
  // StockAging only carries per-bucket figures, so totals are derived here
  // rather than relying on a service-level rollup field.
  const agedTotals = (aging?.buckets ?? []).reduce(
    (acc, b) => ({
      value: acc.value + (b.totalValue ?? 0),
      items: acc.items + (b.itemCount ?? 0),
    }),
    { value: 0, items: 0 },
  );
  const expiringValue = tiedUpValue(expiring);
  const expiredValue = tiedUpValue(expired);

  const nothingToShow =
    !hasAging &&
    deadStock.length === 0 &&
    expiring.length === 0 &&
    expired.length === 0;
  if (nothingToShow) {
    return <NoItems itemName="aging or expiry records" />;
  }

  return (
    <>
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Clock className="h-3 w-3" />}
          label="Aged value"
          value={agedTotals.value > 0 ? fmt(agedTotals.value) : "—"}
          unit={currency}
          delta={`${fmt(agedTotals.items)} batch${agedTotals.items === 1 ? "" : "es"}`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Hourglass className="h-3 w-3" />}
          label="Expiring soon"
          value={expiring.length > 0 ? fmt(expiring.length) : "—"}
          unit={expiring.length > 0 ? currency : undefined}
          delta={
            expiring.length > 0
              ? `${fmt(expiringValue)} tied up · ${EXPIRY_WINDOW_DAYS} days`
              : `None in next ${EXPIRY_WINDOW_DAYS} days`
          }
          deltaTone={expiring.length > 0 ? "neg" : "pos"}
        />
        <KpiCard
          icon={<CircleSlash className="h-3 w-3" />}
          label="Expired"
          value={expired.length > 0 ? fmt(expired.length) : "—"}
          unit={expired.length > 0 ? currency : undefined}
          delta={
            expired.length > 0
              ? `${fmt(expiredValue)} lost value`
              : "Clean"
          }
          deltaTone={expired.length > 0 ? "neg" : "pos"}
        />
        <KpiCard
          icon={<Skull className="h-3 w-3" />}
          label="Dead stock"
          value={deadStock.length > 0 ? fmt(deadStock.length) : "—"}
          unit={deadStock.length > 0 ? currency : undefined}
          delta={
            deadStock.length > 0
              ? `${fmt(deadValue)} tied up · 30d idle`
              : "Moving well"
          }
          deltaTone={deadStock.length > 0 ? "neg" : "pos"}
        />
      </KpiStrip>

      {hasAging && (
        <section>
          <header className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Aging buckets
            </h2>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              By days since receipt
            </span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {aging.buckets.map((bucket) => (
              <Card key={bucket.range}>
                <CardContent className="p-4">
                  <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    {bucket.range}
                  </div>
                  <div className="text-[22px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
                    {fmt(bucket.totalQuantity)}
                  </div>
                  <div className="mt-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {fmt(bucket.totalValue)} {currency}
                  </div>
                  <div className="mt-2 text-[11.5px] text-muted-foreground">
                    {fmt(bucket.itemCount)} batch
                    {bucket.itemCount === 1 ? "" : "es"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {expiring.length > 0 && (
        <section>
          <header className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Expiring within {EXPIRY_WINDOW_DAYS} days
            </h2>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              {fmt(expiring.length)} batch{expiring.length === 1 ? "" : "es"}
            </span>
          </header>
          <ExpiringBatchesTable
            data={expiring}
            pageCount={Math.max(1, Math.ceil(expiring.length / PAGE_LIMIT))}
            pageNo={0}
            total={expiring.length}
            currency={currency}
          />
        </section>
      )}

      {expired.length > 0 && (
        <section>
          <header className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Expired
            </h2>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              {expired.length >= EXPIRED_FETCH_SIZE
                ? `Showing latest ${fmt(EXPIRED_FETCH_SIZE)}`
                : `${fmt(expired.length)} batch${expired.length === 1 ? "" : "es"}`}
            </span>
          </header>
          <ExpiredBatchesTable
            data={expired}
            pageCount={Math.max(1, Math.ceil(expired.length / PAGE_LIMIT))}
            pageNo={0}
            total={expired.length}
            currency={currency}
          />
        </section>
      )}

      {deadStock.length > 0 && (
        <section>
          <header className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Dead stock
            </h2>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              {fmt(deadStock.length)} item{deadStock.length === 1 ? "" : "s"}
            </span>
          </header>
          <DeadStockTable
            data={deadStock}
            pageCount={Math.max(1, Math.ceil(deadStock.length / PAGE_LIMIT))}
            pageNo={0}
            total={deadStock.length}
            currency={currency}
          />
        </section>
      )}
    </>
  );
}
