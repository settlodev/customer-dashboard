import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Coins,
  ExternalLink,
  FileText,
  Layers,
  Package,
  Scale,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  DetailTable,
  DetailTableBody,
  DetailTableHead,
  DetailTableTotals,
  DetailTd,
  DetailTh,
  EmptyState,
  PanelCard,
  RailCard,
  StatusPill,
  StatusTag,
  VList,
  VRow,
  type Tone,
} from "@/components/layouts/order-detail";
import { Money } from "@/components/widgets/money";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";
import {
  CorrectValueAction,
  type CorrectValueTarget,
} from "@/components/widgets/inventory/correct-value-action";
import StockModificationForm from "@/components/forms/stock_modification_form";
import { getStockModification } from "@/lib/actions/stock-modification-actions";
import { fetchBatchById } from "@/lib/actions/traceability-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { formatDate, formatDateTime } from "@/lib/format-datetime";
import { referenceHref } from "@/lib/stock-movement-display";
import {
  MODIFICATION_CATEGORY_OPTIONS,
  type ModificationCategory,
  type StockModification,
  type StockModificationItem,
} from "@/types/stock-modification/type";
import { REFERENCE_TYPE_LABELS } from "@/types/stock-movement/type";
import {
  BATCH_STATUS_LABELS,
  type StockBatchSummary,
} from "@/types/traceability/type";

type Params = Promise<{ id: string }>;

// Tone per category for the header pill. Anything that takes stock out of
// circulation reads as negative; a recount is a caution; a value correction
// is informational because no stock moved.
const CATEGORY_TONE: Record<ModificationCategory, Tone> = {
  DAMAGE: "neg",
  THEFT: "neg",
  EXPIRY: "neg",
  WRITE_OFF: "neg",
  PRODUCTION_LOSS: "neg",
  RECOUNT: "warn",
  CORRECTION: "info",
  OTHER: "muted",
};

const signed = (n: number, fractionDigits = 0) => {
  const text = n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
  return n > 0 ? `+${text}` : text;
};

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

// A value correction moves no stock — the backend flags it, but older
// payloads predate the flag, so fall back to the shape of the lines.
const isValueCorrection = (item: StockModification) =>
  item.valueCorrection === true ||
  ((item.items ?? []).length > 0 &&
    (item.items ?? []).every(
      (line) => Number(line.quantityChange) === 0 && line.previousUnitCost != null,
    ));

// Only these two source types are accepted by the correction schema.
const correctionSource = (
  item: StockModification,
): Pick<CorrectValueTarget, "sourceReferenceType" | "sourceReferenceId"> =>
  (item.sourceReferenceType === "STOCK_INTAKE" ||
    item.sourceReferenceType === "OPENING_STOCK") &&
  item.sourceReferenceId
    ? {
        sourceReferenceType: item.sourceReferenceType,
        sourceReferenceId: item.sourceReferenceId,
      }
    : {};

// Bounded so a very long modification can't fan out into dozens of requests.
const MAX_BATCH_LOOKUPS = 12;

async function loadBatches(
  lines: StockModificationItem[],
): Promise<Record<string, StockBatchSummary>> {
  const ids = Array.from(
    new Set(lines.map((l) => l.batchId).filter((id): id is string => !!id)),
  ).slice(0, MAX_BATCH_LOOKUPS);
  if (ids.length === 0) return {};
  const results = await Promise.all(ids.map((id) => fetchBatchById(id)));
  const out: Record<string, StockBatchSummary> = {};
  results.forEach((res, i) => {
    if (res.responseType === "success" && res.data) out[ids[i]] = res.data;
  });
  return out;
}

export default async function StockModificationPage({ params }: { params: Params }) {
  const { id } = await params;

  if (id === "new") {
    return (
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Stock Modifications", href: "/stock-modifications" },
            { title: "New" },
          ]}
        />
        <PageHeader title="Stock Modification" subtitle="Record a stock adjustment." />
        <PageBody>
          <StockModificationForm />
        </PageBody>
      </PageShell>
    );
  }

  // Modifications are read-only after creation.
  const item = await getStockModification(id);
  if (!item) notFound();

  const lines = item.items ?? [];
  const currency = item.currency || DEFAULT_CURRENCY;
  const categoryLabel =
    MODIFICATION_CATEGORY_OPTIONS.find((o) => o.value === item.category)?.label ??
    item.category;
  const valueCorrection = isValueCorrection(item);

  const batches = await loadBatches(lines);

  // ── Figures ─────────────────────────────────────────────────────────
  const unitsAdded = lines.reduce(
    (sum, l) => sum + Math.max(Number(l.quantityChange), 0),
    0,
  );
  const unitsRemoved = lines.reduce(
    (sum, l) => sum + Math.max(-Number(l.quantityChange), 0),
    0,
  );
  const netChange = unitsAdded - unitsRemoved;
  // Signed: stock leaving (damage, theft) is a write-down, stock found on a
  // recount is value added back.
  const valueImpact = lines.reduce(
    (sum, l) =>
      l.unitCost != null ? sum + Number(l.quantityChange) * Number(l.unitCost) : sum,
    0,
  );
  const onHandDelta = lines.reduce((s, l) => s + Number(l.valueDeltaOnHand ?? 0), 0);
  const consumedDelta = lines.reduce(
    (s, l) => s + Number(l.valueDeltaConsumed ?? 0),
    0,
  );
  const totalDelta = onHandDelta + consumedDelta;

  // ── Correct-value targets: one per distinct batch we could re-cost ──
  const source = correctionSource(item);
  const seen = new Set<string>();
  const targets: CorrectValueTarget[] = [];
  for (const line of lines) {
    const batch = line.batchId ? batches[line.batchId] : undefined;
    if (!batch || seen.has(batch.id)) continue;
    seen.add(batch.id);
    targets.push({
      variantId: line.stockVariantId,
      variantName: batch.stockVariantDisplayName ?? line.variantName,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      currentUnitCost: batch.unitCost ?? line.unitCost ?? 0,
      quantityOnHand: batch.quantityOnHand,
      initialQuantity: batch.initialQuantity,
      currency: batch.currency ?? currency,
      creditSideHint: line.creditSideHint ?? null,
      ...source,
    });
  }

  // Batches this document touched, for the rail — live figures when the
  // lookup succeeded, the line's own numbers otherwise.
  const batchRows = lines
    .filter((l) => l.batchId)
    .filter((l, i, arr) => arr.findIndex((x) => x.batchId === l.batchId) === i)
    .map((line) => ({ line, batch: batches[line.batchId as string] ?? null }));

  const sourceHref =
    item.sourceReferenceType && item.sourceReferenceId
      ? referenceHref(item.sourceReferenceType, item.sourceReferenceId)
      : null;
  const sourceLabel = item.sourceReferenceType
    ? REFERENCE_TYPE_LABELS[item.sourceReferenceType] ?? item.sourceReferenceType
    : null;

  const subtitle = [
    formatDateTime(item.modificationDate) ?? formatDateTime(item.createdAt),
    item.performedByName ? `by ${item.performedByName}` : null,
    plural(lines.length, "item"),
    currency,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Modifications", href: "/stock-modifications" },
          { title: item.modificationNumber },
        ]}
      />
      <PageHeader
        title={item.modificationNumber}
        subtitle={subtitle}
        titleAccessory={
          <span className="flex items-center gap-2">
            <StatusPill tone={CATEGORY_TONE[item.category] ?? "muted"} dot>
              {categoryLabel}
            </StatusPill>
            {valueCorrection && <StatusPill tone="info">Value correction</StatusPill>}
          </span>
        }
        actions={<CorrectValueAction targets={targets} />}
      />
      <PageBody>
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Package className="h-3 w-3" />}
            label="Items affected"
            value={lines.length.toLocaleString()}
          />
          {valueCorrection ? (
            <>
              <KpiCard
                icon={<Boxes className="h-3 w-3" />}
                label="On-hand value change"
                value={signed(onHandDelta, 2)}
                unit={currency}
                tooltip="Cost difference applied to the units still in stock. Posts to inventory."
              />
              <KpiCard
                icon={<Scale className="h-3 w-3" />}
                label="Variance on used stock"
                value={signed(consumedDelta, 2)}
                unit={currency}
                tooltip="Cost difference on units already sold or consumed before the correction. Posts to a cost variance expense."
              />
              <KpiCard
                icon={<Coins className="h-3 w-3" />}
                label="Total value change"
                value={signed(totalDelta, 2)}
                unit={currency}
                delta={
                  totalDelta > 0
                    ? "cost revised upward"
                    : totalDelta < 0
                      ? "cost revised downward"
                      : undefined
                }
                deltaTone={totalDelta > 0 ? "neg" : totalDelta < 0 ? "pos" : "neutral"}
              />
            </>
          ) : (
            <>
              <KpiCard
                icon={<ArrowUpRight className="h-3 w-3" />}
                label="Units added"
                value={unitsAdded.toLocaleString()}
              />
              <KpiCard
                icon={<ArrowDownRight className="h-3 w-3" />}
                label="Units removed"
                value={unitsRemoved.toLocaleString()}
              />
              <KpiCard
                icon={<Coins className="h-3 w-3" />}
                label="Stock value impact"
                value={signed(valueImpact, 2)}
                unit={currency}
                delta={
                  valueImpact < 0
                    ? "written down"
                    : valueImpact > 0
                      ? "added to stock"
                      : undefined
                }
                deltaTone={valueImpact < 0 ? "neg" : valueImpact > 0 ? "pos" : "neutral"}
                tooltip="Quantity change × unit cost across every line, in the location's currency."
              />
            </>
          )}
        </KpiStrip>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
            <RailCard icon={<ClipboardList className="h-3.5 w-3.5" />} title="Details">
              <p className="mb-3 rounded-lg border border-line bg-canvas px-3 py-2.5 text-[13px] italic leading-relaxed text-ink-2">
                &ldquo;{item.reason}&rdquo;
              </p>
              <VList>
                <VRow label="Category" value={categoryLabel} />
                <VRow
                  label="Date"
                  value={formatDateTime(item.modificationDate) ?? "—"}
                />
                {item.businessDate && (
                  <VRow label="Business day" value={formatDate(item.businessDate) ?? "—"} />
                )}
                <VRow label="Performed by" value={item.performedByName || "—"} />
                <VRow label="Currency" value={currency} />
                {sourceLabel && (
                  <VRow
                    label="Raised from"
                    value={
                      sourceHref ? (
                        <Link
                          href={sourceHref}
                          className="inline-flex items-center gap-1 text-primary-dark hover:underline dark:text-primary"
                        >
                          {sourceLabel}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        sourceLabel
                      )
                    }
                  />
                )}
              </VList>
            </RailCard>

            {batchRows.length > 0 && (
              <RailCard icon={<Layers className="h-3.5 w-3.5" />} title="Batches touched">
                <div className="flex flex-col divide-y divide-line">
                  {batchRows.map(({ line, batch }) => {
                    const batchId = line.batchId as string;
                    const number = batch?.batchNumber ?? line.batchNumber ?? batchId.slice(0, 8);
                    return (
                      <div
                        key={batchId}
                        className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/stock-batches/${batchId}`}
                            className="font-mono text-[12px] font-semibold text-ink hover:underline"
                          >
                            {number}
                          </Link>
                          <div className="truncate text-[12px] text-muted-foreground">
                            {batch?.stockVariantDisplayName ?? line.variantName}
                          </div>
                          {batch && batch.status !== "ACTIVE" && (
                            <div className="mt-1">
                              <StatusTag
                                tone={
                                  batch.status === "RECALLED"
                                    ? "neg"
                                    : batch.status === "EXPIRED"
                                      ? "warn"
                                      : "muted"
                                }
                              >
                                {BATCH_STATUS_LABELS[batch.status]}
                              </StatusTag>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[13px] font-semibold tabular-nums text-ink">
                            {batch ? batch.quantityOnHand.toLocaleString() : "—"}
                            <span className="ml-1 font-mono text-[10px] font-normal text-muted-foreground">
                              on hand
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {batch?.unitCost != null ? (
                              <>
                                <Money
                                  amount={Number(batch.unitCost)}
                                  currency={batch.currency || currency}
                                />{" "}
                                now
                              </>
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </RailCard>
            )}

            {item.notes && (
              <RailCard icon={<FileText className="h-3.5 w-3.5" />} title="Notes">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
                  {item.notes}
                </p>
              </RailCard>
            )}
          </aside>

          <main className="flex min-w-0 flex-col gap-3.5">
            <PanelCard
              icon={<Package className="h-3.5 w-3.5" />}
              title="Items affected"
              count={lines.length}
              pad0
            >
              {lines.length === 0 ? (
                <EmptyState
                  icon={<Package className="h-5 w-5" />}
                  title="No line items"
                  sub="This modification was recorded without any item lines."
                />
              ) : valueCorrection ? (
                <ValueCorrectionTable
                  lines={lines}
                  currency={currency}
                  onHandDelta={onHandDelta}
                  consumedDelta={consumedDelta}
                  totalDelta={totalDelta}
                />
              ) : (
                <QuantityTable
                  lines={lines}
                  currency={currency}
                  netChange={netChange}
                  valueImpact={valueImpact}
                />
              )}
            </PanelCard>

            <AttachmentsPanel
              entityType="STOCK_MODIFICATION"
              entityId={item.id}
              description="Claim forms, damage photos, theft reports, recount audit evidence. Max 10 MB per file."
            />
          </main>
        </div>
      </PageBody>
    </PageShell>
  );
}

// ── Items table: quantity modifications ─────────────────────────────

function ItemCell({ line }: { line: StockModificationItem }) {
  return (
    <DetailTd>
      <div className="text-[13.5px] font-semibold tracking-tight text-ink">
        {line.variantName || "—"}
      </div>
      {line.batchId && (
        <Link
          href={`/stock-batches/${line.batchId}`}
          className="mt-0.5 inline-block font-mono text-[10.5px] text-muted-foreground hover:text-ink hover:underline"
        >
          {line.batchNumber ?? line.batchId.slice(0, 8)}
        </Link>
      )}
      {line.notes && (
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">{line.notes}</div>
      )}
    </DetailTd>
  );
}

function UnitCostCell({
  line,
  currency,
}: {
  line: StockModificationItem;
  currency: string;
}) {
  const lineCurrency = line.currency || currency;
  const isForeign = !!line.originalCurrency && line.originalCurrency !== lineCurrency;
  return (
    <DetailTd align="right" dim={line.unitCost == null}>
      {line.unitCost != null ? (
        <Money amount={Number(line.unitCost)} currency={lineCurrency} />
      ) : (
        "—"
      )}
      {isForeign && (
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          was{" "}
          <Money amount={Number(line.originalUnitCost ?? 0)} currency={line.originalCurrency} />
          {line.rateUsed != null && line.rateUsed !== 1 && (
            <>
              {" "}
              @ {Number(line.rateUsed).toLocaleString(undefined, { maximumFractionDigits: 6 })}
            </>
          )}
        </div>
      )}
    </DetailTd>
  );
}

function QuantityTable({
  lines,
  currency,
  netChange,
  valueImpact,
}: {
  lines: StockModificationItem[];
  currency: string;
  netChange: number;
  valueImpact: number;
}) {
  return (
    <DetailTable>
      <DetailTableHead>
        <DetailTh>Item</DetailTh>
        <DetailTh align="right">Before</DetailTh>
        <DetailTh align="right">Change</DetailTh>
        <DetailTh align="right">After</DetailTh>
        <DetailTh align="right">Unit cost</DetailTh>
        <DetailTh align="right">Line value</DetailTh>
      </DetailTableHead>
      <DetailTableBody>
        {lines.map((line) => {
          const change = Number(line.quantityChange);
          const lineValue =
            line.unitCost != null ? change * Number(line.unitCost) : null;
          return (
            <tr key={line.id}>
              <ItemCell line={line} />
              <DetailTd align="right">
                {Number(line.previousQuantity).toLocaleString()}
              </DetailTd>
              <DetailTd
                align="right"
                className={
                  change > 0
                    ? "font-semibold text-pos"
                    : change < 0
                      ? "font-semibold text-neg"
                      : "font-medium text-muted-2"
                }
              >
                {signed(change, 4)}
              </DetailTd>
              <DetailTd align="right" strong>
                {Number(line.newQuantity).toLocaleString()}
              </DetailTd>
              <UnitCostCell line={line} currency={currency} />
              <DetailTd align="right" strong dim={lineValue == null}>
                {lineValue != null ? (
                  <Money amount={lineValue} currency={line.currency || currency} />
                ) : (
                  "—"
                )}
              </DetailTd>
            </tr>
          );
        })}
      </DetailTableBody>
      <DetailTableTotals>
        <DetailTd align="right" strong>
          Totals
        </DetailTd>
        <DetailTd />
        <DetailTd
          align="right"
          strong
          className={netChange > 0 ? "text-pos" : netChange < 0 ? "text-neg" : ""}
        >
          {signed(netChange, 4)}
        </DetailTd>
        <DetailTd />
        <DetailTd />
        <DetailTd align="right" strong>
          <Money amount={valueImpact} currency={currency} />
        </DetailTd>
      </DetailTableTotals>
    </DetailTable>
  );
}

// ── Items table: value corrections (no stock moved) ─────────────────

function ValueCorrectionTable({
  lines,
  currency,
  onHandDelta,
  consumedDelta,
  totalDelta,
}: {
  lines: StockModificationItem[];
  currency: string;
  onHandDelta: number;
  consumedDelta: number;
  totalDelta: number;
}) {
  return (
    <DetailTable>
      <DetailTableHead>
        <DetailTh>Item</DetailTh>
        <DetailTh align="right">Previous cost</DetailTh>
        <DetailTh align="right">Corrected cost</DetailTh>
        <DetailTh align="right">On hand</DetailTh>
        <DetailTh align="right">Already used</DetailTh>
        <DetailTh align="right">Total change</DetailTh>
      </DetailTableHead>
      <DetailTableBody>
        {lines.map((line) => {
          const lineCurrency = line.currency || currency;
          const onHand = Number(line.valueDeltaOnHand ?? 0);
          const used = Number(line.valueDeltaConsumed ?? 0);
          return (
            <tr key={line.id}>
              <ItemCell line={line} />
              <DetailTd align="right" dim={line.previousUnitCost == null}>
                {line.previousUnitCost != null ? (
                  <span className="line-through decoration-muted-2">
                    <Money amount={Number(line.previousUnitCost)} currency={lineCurrency} />
                  </span>
                ) : (
                  "—"
                )}
              </DetailTd>
              <DetailTd align="right" strong dim={line.unitCost == null}>
                {line.unitCost != null ? (
                  <Money amount={Number(line.unitCost)} currency={lineCurrency} />
                ) : (
                  "—"
                )}
              </DetailTd>
              <DetailTd align="right" dim={onHand === 0}>
                <Money amount={onHand} currency={lineCurrency} />
              </DetailTd>
              <DetailTd align="right" dim={used === 0}>
                <Money amount={used} currency={lineCurrency} />
              </DetailTd>
              <DetailTd align="right" strong>
                <Money amount={onHand + used} currency={lineCurrency} />
              </DetailTd>
            </tr>
          );
        })}
      </DetailTableBody>
      <DetailTableTotals>
        <DetailTd align="right" strong>
          Totals
        </DetailTd>
        <DetailTd />
        <DetailTd />
        <DetailTd align="right" strong>
          <Money amount={onHandDelta} currency={currency} />
        </DetailTd>
        <DetailTd align="right" strong>
          <Money amount={consumedDelta} currency={currency} />
        </DetailTd>
        <DetailTd align="right" strong>
          <Money amount={totalDelta} currency={currency} />
        </DetailTd>
      </DetailTableTotals>
    </DetailTable>
  );
}
