"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Layers,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/widgets/money";
import { cn } from "@/lib/utils";
import { formatDivisibleQuantity } from "@/lib/format-divisible-quantity";
import {
  getVariantBatchesPage,
  getBatchConsumptionOrder,
} from "@/lib/actions/stock-batch-actions";
import {
  BATCH_STATUS_CONFIG,
  BATCH_STATUS_ORDER,
  type BatchPage,
  type BatchStatus,
  type StockBatch,
} from "@/types/stock-batch/type";
import type { Stock } from "@/types/stock/type";

const PAGE_SIZES = [10, 25, 50, 100] as const;

/** Batches expiring inside this window are called out as at-risk. */
const EXPIRY_WARNING_DAYS = 7;

interface Props {
  variantId: string;
  variantLabel: string;
  /** Server-rendered first page, valid for `variantId` only. */
  initialPage: BatchPage;
  /** All ACTIVE batches for `variantId`, in consumption order. */
  initialConsumptionOrder: StockBatch[];
  stock: Stock;
  currency: string;
}

const qty = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 3 });

function dateLabel(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Whole days from now until `iso`; negative once past. */
function daysUntil(iso: string, now: number): number {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}

/**
 * A variant's batches: what's open, what it's worth, what expires next, and —
 * the part a flat table can't show — the order stock will actually be drawn
 * from them.
 */
export function BatchPanel({
  variantId,
  variantLabel,
  initialPage,
  initialConsumptionOrder,
  stock,
  currency,
}: Props) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<number>(initialPage.size || 25);
  const [status, setStatus] = useState<string>("__all__");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const [data, setData] = useState<BatchPage>(initialPage);
  const [consumptionOrder, setConsumptionOrder] = useState<StockBatch[]>(
    initialConsumptionOrder,
  );
  const [loading, setLoading] = useState(false);

  // Rewind the pager when the variant changes — page 4 of a heavily-received
  // variant is out of range for a quiet one. Adjusted during render so the
  // fetch effect only ever sees the reset offset.
  const [renderedVariantId, setRenderedVariantId] = useState(variantId);
  if (renderedVariantId !== variantId) {
    setRenderedVariantId(variantId);
    setPage(0);
  }

  const pageSig = `${variantId}|${status}|${page}|${size}`;
  const orderSig = variantId;
  const lastPageSig = useRef(pageSig);
  const lastOrderSig = useRef(orderSig);

  useEffect(() => {
    if (pageSig === lastPageSig.current) return;
    lastPageSig.current = pageSig;
    let cancelled = false;
    setLoading(true);
    getVariantBatchesPage({
      variantId,
      status: status === "__all__" ? undefined : status,
      page,
      size,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSig]);

  useEffect(() => {
    if (orderSig === lastOrderSig.current) return;
    lastOrderSig.current = orderSig;
    let cancelled = false;
    getBatchConsumptionOrder(variantId).then((res) => {
      if (!cancelled) setConsumptionOrder(res);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSig]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onSizeChange = useCallback((next: string) => {
    setSize(Number(next));
    setPage(0);
  }, []);

  const onStatusChange = useCallback((next: string) => {
    setStatus(next);
    setPage(0);
  }, []);

  // Consumption position keyed by batch id — 1 = the batch the next sale draws
  // from. Only ACTIVE batches appear, so depleted/expired rows get no rank.
  const rankById = useMemo(() => {
    const m = new Map<string, number>();
    consumptionOrder.forEach((b, i) => m.set(b.id, i + 1));
    return m;
  }, [consumptionOrder]);

  // Headline figures span every open batch, not just the visible page — that's
  // why they come from the consumption-order fetch rather than `data.content`.
  const now = Date.now();
  const summary = useMemo(() => {
    let onHand = 0;
    let value = 0;
    let expiringSoon = 0;
    for (const b of consumptionOrder) {
      onHand += Number(b.quantityOnHand ?? 0);
      value += Number(b.quantityOnHand ?? 0) * Number(b.unitCost ?? 0);
      if (b.expiryDate) {
        const d = daysUntil(b.expiryDate, now);
        if (d >= 0 && d <= EXPIRY_WARNING_DAYS) expiringSoon += 1;
      }
    }
    return { open: consumptionOrder.length, onHand, value, expiringSoon };
  }, [consumptionOrder, now]);

  const nextBatch = consumptionOrder[0] ?? null;

  const totalPages = Math.max(data.totalPages, 1);
  const firstIndex = data.totalElements === 0 ? 0 : page * size + 1;
  const lastIndex = Math.min((page + 1) * size, data.totalElements);

  return (
    <div className="space-y-6">
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Layers className="h-3 w-3" />}
          label="Open batches"
          value={summary.open.toLocaleString()}
          delta={`${variantLabel}`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Boxes className="h-3 w-3" />}
          label="Qty in batches"
          value={qty(summary.onHand)}
          unit={stock.baseUnitName}
        />
        <KpiCard
          icon={<DollarSign className="h-3 w-3" />}
          label="Batch value"
          value={summary.value.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
        />
        <KpiCard
          icon={<Clock className="h-3 w-3" />}
          label="Expiring soon"
          value={summary.expiringSoon.toLocaleString()}
          delta={
            summary.expiringSoon > 0
              ? `Within ${EXPIRY_WARNING_DAYS} days`
              : undefined
          }
          deltaTone={summary.expiringSoon > 0 ? "neg" : "neutral"}
        />
      </KpiStrip>

      {/* What the next sale actually draws from — the ordering a flat,
          date-sorted table hides. */}
      {nextBatch && (
        <Card className="shadow-none">
          <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-[12.5px]">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Next to consume
            </span>
            <Link
              href={`/stock-batches/${nextBatch.id}`}
              className="font-medium text-primary hover:underline"
            >
              {nextBatch.batchNumber}
            </Link>
            <span className="text-muted-foreground">
              {qty(nextBatch.quantityOnHand)} {stock.baseUnitName} on hand
            </span>
            {nextBatch.expiryDate ? (
              <span className="text-muted-foreground">
                · expires {dateLabel(nextBatch.expiryDate)}
              </span>
            ) : (
              <span className="text-muted-foreground">· no expiry</span>
            )}
            {consumptionOrder.length > 1 && (
              <span className="text-muted-foreground">
                · then {consumptionOrder[1].batchNumber}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">
              Batch history
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                every batch ever received for this variant
              </span>
            </h3>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-8 w-[190px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {BATCH_STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {BATCH_STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative max-h-[560px] overflow-auto rounded-md border">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-[28px]" />
                  <TableHead>Batch #</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Unit cost</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      {status === "__all__"
                        ? "No batches recorded for this variant. Batches are created when stock is received via GRN."
                        : `No ${BATCH_STATUS_CONFIG[status as BatchStatus].label.toLowerCase()} batches for this variant.`}
                    </TableCell>
                  </TableRow>
                )}
                {data.content.map((b) => {
                  const cfg = BATCH_STATUS_CONFIG[b.status];
                  const rank = rankById.get(b.id);
                  const isOpen = expanded.has(b.id);
                  const days = b.expiryDate
                    ? daysUntil(b.expiryDate, now)
                    : null;
                  const isExpired = days != null && days < 0;
                  const isExpiringSoon =
                    days != null && days >= 0 && days <= EXPIRY_WARNING_DAYS;
                  const value =
                    Number(b.quantityOnHand ?? 0) * Number(b.unitCost ?? 0);
                  const consumed =
                    b.initialQuantity > 0
                      ? ((b.initialQuantity - b.quantityOnHand) /
                          b.initialQuantity) *
                        100
                      : 0;

                  return (
                    <Fragment key={b.id}>
                      <TableRow
                        className={cn(
                          isExpired && "bg-red-50/50 dark:bg-red-950/10",
                          !isExpired &&
                            isExpiringSoon &&
                            "bg-amber-50/50 dark:bg-amber-950/10",
                        )}
                      >
                        <TableCell className="pr-0 align-top">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(b.id)}
                            aria-expanded={isOpen}
                            aria-label={
                              isOpen ? "Hide batch detail" : "Show batch detail"
                            }
                            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <ChevronRight
                              className={cn(
                                "h-3.5 w-3.5 transition-transform",
                                isOpen && "rotate-90",
                              )}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/stock-batches/${b.id}`}
                            className="hover:underline"
                          >
                            {b.batchNumber}
                          </Link>
                          {rank != null && (
                            <span
                              className={cn(
                                "ml-1.5 rounded px-1 py-0.5 font-mono text-[9.5px] font-medium",
                                rank === 1
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                              title={
                                rank === 1
                                  ? "The next sale draws from this batch"
                                  : `Position ${rank} in consumption order`
                              }
                            >
                              {rank === 1 ? "next" : `#${rank}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {b.expiryDate ? (
                            <span
                              className={cn(
                                isExpired &&
                                  "font-medium text-red-600 dark:text-red-400",
                                !isExpired &&
                                  isExpiringSoon &&
                                  "font-medium text-amber-600 dark:text-amber-400",
                              )}
                            >
                              {dateLabel(b.expiryDate)}
                              {isExpired && (
                                <span className="block text-[10px]">
                                  expired
                                </span>
                              )}
                              {isExpiringSoon && (
                                <span className="block text-[10px]">
                                  {days}d left
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              No expiry
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatDivisibleQuantity(b.quantityOnHand, {
                            baseUnitName: stock.baseUnitName,
                            divisibleUnitRatio: b.divisibleUnitRatio,
                            divisibleUnitName: b.divisibleUnitName,
                          })}
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            {consumed.toFixed(0)}% used
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                          {dateLabel(b.receivedDate)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {b.unitCost != null ? (
                            <Money
                              amount={b.unitCost}
                              currency={b.currency || currency}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {value > 0 ? (
                            <Money
                              amount={value}
                              currency={b.currency || currency}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                              cfg.bgColor,
                              cfg.color,
                            )}
                          >
                            {cfg.label}
                          </span>
                        </TableCell>
                      </TableRow>

                      {isOpen && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="p-0">
                            <BatchDetail
                              batch={b}
                              rank={rank}
                              currency={currency}
                              stock={stock}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {data.totalElements === 0
                ? "No batches"
                : `Showing ${firstIndex.toLocaleString()}–${lastIndex.toLocaleString()} of ${data.totalElements.toLocaleString()} batches`}
              {status !== "__all__" && (
                <span>
                  {" "}
                  ·{" "}
                  {BATCH_STATUS_CONFIG[
                    status as BatchStatus
                  ].label.toLowerCase()}{" "}
                  only
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Select value={String(size)} onValueChange={onSizeChange}>
                <SelectTrigger className="h-8 w-[110px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="whitespace-nowrap font-mono text-[11.5px] text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Batch detail ────────────────────────────────────────────────────

function DetailField({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-[12px] text-foreground",
          mono && "font-mono text-[11px]",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

const shortId = (id: string) => (id.length > 8 ? `${id.slice(0, 8)}…` : id);

/**
 * The fields the row can't carry: where the batch came from, what it originally
 * cost in the supplier's own currency, and how much of it is left.
 */
function BatchDetail({
  batch,
  rank,
  currency,
  stock,
}: {
  batch: StockBatch;
  rank: number | undefined;
  currency: string;
  stock: Stock;
}) {
  const cur = batch.currency || currency;
  const consumedQty = batch.initialQuantity - batch.quantityOnHand;
  const fxDiffers =
    batch.originalCurrency != null && batch.originalCurrency !== cur;

  return (
    <div className="border-y border-line bg-surface px-4 py-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Batch">
          <Link
            href={`/stock-batches/${batch.id}`}
            className="text-primary hover:underline"
          >
            {batch.batchNumber}
          </Link>
        </DetailField>

        <DetailField label="Supplier reference">
          {batch.supplierBatchReference || "Not recorded"}
        </DetailField>

        <DetailField label="Received via">
          {batch.grnId ? (
            <Link
              href={`/goods-received/${batch.grnId}`}
              className="text-primary hover:underline"
            >
              GRN {shortId(batch.grnId)}
            </Link>
          ) : (
            "No GRN — created by adjustment or opening stock"
          )}
        </DetailField>

        <DetailField label="Consumption position">
          {rank != null
            ? rank === 1
              ? "Next to be consumed"
              : `#${rank} in queue`
            : "Not in queue (not an open batch)"}
        </DetailField>

        <DetailField label="Received">
          {dateLabel(batch.receivedDate)}
        </DetailField>

        <DetailField label="Expiry">{dateLabel(batch.expiryDate)}</DetailField>

        <DetailField label="Initial → remaining" mono>
          {qty(batch.initialQuantity)} → {qty(batch.quantityOnHand)}{" "}
          {batch.unitAbbreviation || stock.baseUnitName}
        </DetailField>

        <DetailField label="Consumed" mono>
          {qty(consumedQty)} {batch.unitAbbreviation || stock.baseUnitName}
        </DetailField>

        <DetailField label="Unit cost">
          {batch.unitCost != null ? (
            <Money amount={batch.unitCost} currency={cur} />
          ) : (
            "—"
          )}
        </DetailField>

        {fxDiffers && (
          <DetailField label="Supplier price">
            {batch.originalUnitCost != null ? (
              <>
                <Money
                  amount={batch.originalUnitCost}
                  currency={batch.originalCurrency!}
                />
                {batch.rateUsed != null && batch.rateUsed !== 1 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    @{" "}
                    {batch.rateUsed.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </span>
                )}
              </>
            ) : (
              "—"
            )}
          </DetailField>
        )}

        {batch.notes && (
          <div className="col-span-2 min-w-0 sm:col-span-3 lg:col-span-4">
            <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Notes
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-[12px]">
              {batch.notes}
            </dd>
          </div>
        )}

        <DetailField label="Batch id" mono>
          {batch.id}
        </DetailField>
      </dl>
    </div>
  );
}
