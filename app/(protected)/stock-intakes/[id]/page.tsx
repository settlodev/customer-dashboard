import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Boxes, DollarSign, MapPin } from "lucide-react";
import {
  getStockIntakeRecord,
} from "@/lib/actions/stock-intake-record-actions";
import {
  INTAKE_PAYMENT_TERMS_LABELS,
  STOCK_INTAKE_RECORD_STATUS_LABELS,
  StockIntakeRecordItem,
  StockIntakeRecordStatus,
} from "@/types/stock-intake-record/type";
import StockIntakeRecordActions from "@/components/widgets/stock-intake-record-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { Money } from "@/components/widgets/money";
import StockIntakeItemsTable from "@/components/widgets/stock-intake/items-table";
import { getBatchesByVariant } from "@/lib/actions/stock-batch-actions";
import { searchStockModifications } from "@/lib/actions/stock-modification-actions";
import type { StockBatch } from "@/types/stock-batch/type";

type Params = Promise<{ id: string }>;

const STATUS_BADGE: Record<StockIntakeRecordStatus, "warn" | "pos" | "neg"> = {
  DRAFT: "warn",
  CONFIRMED: "pos",
  CANCELLED: "neg",
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default async function StockIntakePage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const item = await getStockIntakeRecord(resolvedParams.id);
  if (!item) notFound();

  const currency = item.currency || DEFAULT_CURRENCY;
  const hasForeignLine = item.items?.some(
    (line) =>
      line.originalCurrency &&
      line.originalCurrency !== (line.currency || currency),
  );
  const hasSerialLine = item.items?.some(
    (line) => line.serialNumbers && line.serialNumbers.length > 0,
  );

  // Batches only exist once an intake is confirmed — a "Correct value" action
  // and its corrections history are only meaningful past that point.
  const isConfirmed = item.status === "CONFIRMED";

  const [batchDataByBatchId, corrections] = await Promise.all([
    isConfirmed
      ? loadBatchDataForItems(item.items)
      : Promise.resolve({} as Record<string, StockBatch>),
    isConfirmed
      ? searchStockModifications(0, 50, undefined, {
          sourceReferenceType: "STOCK_INTAKE",
          sourceReferenceId: item.id,
        })
      : Promise.resolve(null),
  ]);

  // batchId -> most recent corrected unit cost (newest-last so the final
  // correction wins). The intake document itself is never rewritten —
  // StockIntakeItem.unitCost keeps the originally recorded value forever —
  // so this is what lets the items table show the up-to-date effective cost
  // alongside the frozen original.
  const effectiveCostByBatch: Record<string, number> = {};
  for (const correction of corrections?.content ?? []) {
    for (const line of correction.items ?? []) {
      if (line.batchId && line.unitCost != null) {
        effectiveCostByBatch[line.batchId] = line.unitCost;
      }
    }
  }

  // Resolved 1:1 from how this intake was paid — matches the backend's own
  // CreditSideHintResolver for STOCK_INTAKE-sourced batches (payment terms
  // CASH/BANK map directly, anything else falls back to CREDIT/A-P).
  const creditSideHint: "CREDIT" | "CASH" | "BANK" =
    item.paymentTerms === "CASH" || item.paymentTerms === "BANK"
      ? item.paymentTerms
      : "CREDIT";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Intakes", href: "/stock-intakes" },
          { title: item.referenceNumber },
        ]}
      />
      <PageHeader
        title={item.referenceNumber}
        subtitle={item.notes ?? undefined}
        titleAccessory={
          <Badge variant={STATUS_BADGE[item.status]}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {STOCK_INTAKE_RECORD_STATUS_LABELS[item.status]}
          </Badge>
        }
        actions={
          item.status === "DRAFT" ? <StockIntakeRecordActions id={item.id} /> : undefined
        }
      />

      <PageBody>
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Building2 className="h-3 w-3" />}
            label="Supplier"
            value={item.supplierName ?? "—"}
            delta={item.supplierReference ? `Ref ${item.supplierReference}` : undefined}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Items"
            value={item.totalItems.toLocaleString()}
            delta={`${Number(item.totalQuantity ?? 0).toLocaleString()} total qty`}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Total value"
            value={Number(item.totalValue ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            unit={currency}
          />
          <KpiCard
            icon={<MapPin className="h-3 w-3" />}
            label="Location"
            value={item.locationName ?? "—"}
            delta={item.locationType}
            deltaTone="neutral"
          />
        </KpiStrip>

      {/* Dates + terms panel */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Ordered</p>
            <p className="mt-1">{formatDate(item.orderedDate) || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Received</p>
            <p className="mt-1">{formatDate(item.receivedDate) || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Created</p>
            <p className="mt-1">{formatDateTime(item.createdAt) || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Confirmed</p>
            <p className="mt-1">
              {item.confirmedAt ? formatDateTime(item.confirmedAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Payment</p>
            <p className="mt-1">
              {item.paymentTerms
                ? INTAKE_PAYMENT_TERMS_LABELS[item.paymentTerms]
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Items table */}
      {item.items && item.items.length > 0 && (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-lg font-medium">Stock items</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Settlement currency:</span>
                <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">
                  {currency}
                </span>
              </div>
            </div>
            <StockIntakeItemsTable
              intakeId={item.id}
              items={item.items}
              currency={currency}
              hasForeignLine={!!hasForeignLine}
              hasSerialLine={!!hasSerialLine}
              showCorrectAction={isConfirmed}
              batchDataByBatchId={batchDataByBatchId}
              effectiveCostByBatch={effectiveCostByBatch}
              creditSideHint={creditSideHint}
            />
          </CardContent>
        </Card>
      )}

      {/* Value corrections history */}
      {corrections && corrections.content.length > 0 && (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <h3 className="text-lg font-medium mb-4">Value corrections</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                      Cost change
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                      On hand
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                      Already used
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {corrections.content.flatMap((correction) =>
                    (correction.items ?? []).map((line, idx) => (
                      <tr
                        key={`${correction.id}-${idx}`}
                        className="hover:bg-gray-50/50 align-top"
                      >
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTime(correction.modificationDate) || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {line.batchNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {line.previousUnitCost != null && line.unitCost != null ? (
                            <span className="flex flex-col items-end">
                              <span className="text-muted-foreground line-through text-xs">
                                <Money
                                  amount={line.previousUnitCost}
                                  currency={correction.currency ?? currency}
                                />
                              </span>
                              <span>
                                <Money
                                  amount={line.unitCost}
                                  currency={correction.currency ?? currency}
                                />
                              </span>
                            </span>
                          ) : (
                            <Money amount={line.unitCost} currency={correction.currency ?? currency} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money
                            amount={line.valueDeltaOnHand ?? 0}
                            currency={correction.currency ?? currency}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money
                            amount={line.valueDeltaConsumed ?? 0}
                            currency={correction.currency ?? currency}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-700">{correction.reason}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {correction.performedByName || "—"}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </PageBody>
    </PageShell>
  );
}

/**
 * Batch snapshot (qty on hand, initial qty, current cost) for every item
 * line that already has a minted batch — the "Correct value" modal needs
 * these fields and StockIntakeItemResponse doesn't carry them. There is no
 * single-batch-by-id getter today, so this fetches per unique variant (the
 * batch listing endpoint is variant-scoped) and indexes the results by id.
 */
async function loadBatchDataForItems(
  items: StockIntakeRecordItem[],
): Promise<Record<string, StockBatch>> {
  const variantIds = Array.from(
    new Set(items.filter((line) => line.batchId).map((line) => line.stockVariantId)),
  );
  if (variantIds.length === 0) return {};

  const results = await Promise.all(variantIds.map((id) => getBatchesByVariant(id)));
  const map: Record<string, StockBatch> = {};
  for (const batch of results.flat()) {
    map[batch.id] = batch;
  }
  return map;
}
