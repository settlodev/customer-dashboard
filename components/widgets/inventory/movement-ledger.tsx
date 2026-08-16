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
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Loader2,
  ScanLine,
  ShieldCheck,
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
import { DateRangeSegmented } from "@/components/filters/date-range-segmented";
import { Money } from "@/components/widgets/money";
import { cn } from "@/lib/utils";
import {
  getVariantMovementsPage,
  getMovementSummaryByVariant,
  getLedgerDiscrepancies,
} from "@/lib/actions/stock-movement-actions";
import {
  dayLabel,
  localDayKey,
  movementTypeLabel,
  qty,
  referenceHref,
  humaniseReasonCode,
  referenceIdentity,
  shortId,
  signedQty,
  signedQuantity,
  timeLabel,
} from "@/lib/stock-movement-display";
import {
  ALL_TIME_START,
  DISCREPANCY_KIND_LABELS,
  MOVEMENT_TYPE_LABELS,
  type LedgerDiscrepancy,
  type MovementType,
  type PageResponse,
  type StockMovement,
  type StockMovementSummary,
} from "@/types/stock-movement/type";

const PAGE_SIZES = [25, 50, 100, 200] as const;

/** Balances are decimals; compare with a tolerance rather than `!==`. */
const EPS = 1e-6;

export interface LedgerRange {
  /** yyyy-MM-dd, or "" for all time. */
  from: string;
  /** yyyy-MM-dd, or "" for all time. */
  to: string;
}

interface Props {
  locationId: string;
  variantId: string;
  variantLabel: string;
  /** Server-rendered first page. Only valid for `variantId`/`initialRange`. */
  initialPage: PageResponse<StockMovement>;
  initialSummary: StockMovementSummary | null;
  initialRange: LedgerRange;
  currency: string;
  /** Actor id → display name, keyed by both staff id and auth id. */
  staffNames: Record<string, string>;
}

interface LedgerRow {
  movement: StockMovement;
  signed: number;
  /** `previousBalance + signed − newBalance`; non-null only when it doesn't reconcile. */
  mathDelta: number | null;
  /**
   * Difference between this row's opening balance and the closing balance of
   * the entry written immediately before it. Non-null only when the chain is
   * broken — i.e. stock changed without a movement being recorded.
   */
  chainGap: number | null;
  /** Backend never captured before/after balances for this row (pre-V021). */
  untracked: boolean;
  negative: boolean;
}

/**
 * Grades each entry on the page.
 *
 * Two independent checks:
 *  - *row math* — does `before + qty` actually equal `after`?
 *  - *chain continuity* — does this entry open where its predecessor closed?
 *
 * The chain check is what surfaces stock that moved without a movement being
 * written. It reads `previousClosingBalance`, which the backend chains in
 * commit order, rather than looking at the neighbouring row. Those are not the
 * same entry whenever a row's business time back-dates its write — a stock
 * modification carrying an operator's date, a GRN's received date, a bill
 * opened long before it was closed. Comparing against the neighbour reported
 * every such row as an unexplained change, in equal-and-opposite pairs that
 * netted to zero over each day because nothing was actually missing.
 *
 * Since the backend computes it before applying any type filter, the check
 * survives filtering too — a hidden row still holds its place in the chain.
 */
function analyse(movements: StockMovement[]): LedgerRow[] {
  return movements.map((m) => {
    const signed = signedQuantity(m);
    const prev = m.previousBalance;
    const next = m.newBalance;
    const untracked = prev == null || next == null;

    let mathDelta: number | null = null;
    if (!untracked) {
      const delta = prev + signed - next;
      if (Math.abs(delta) > EPS) mathDelta = delta;
    }

    // Null on the range's first entry — nothing precedes it to check against.
    let chainGap: number | null = null;
    if (prev != null && m.previousClosingBalance != null) {
      const gap = prev - m.previousClosingBalance;
      if (Math.abs(gap) > EPS) chainGap = gap;
    }

    return {
      movement: m,
      signed,
      mathDelta,
      chainGap,
      untracked,
      negative: next != null && next < 0,
    };
  });
}

/**
 * The stock item's movement ledger — every entry for one variant, paged from
 * the Reports Service, with a balance trail and integrity flags so a bad
 * number can be traced back to the entry that introduced it.
 */
export function MovementLedger({
  locationId,
  variantId,
  variantLabel,
  initialPage,
  initialSummary,
  initialRange,
  currency,
  staffNames,
}: Props) {
  const [range, setRange] = useState<LedgerRange>(initialRange);
  const [movementType, setMovementType] = useState<string>("__all__");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<number>(initialPage.size || 50);
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [discrepancies, setDiscrepancies] = useState<LedgerDiscrepancy[]>([]);
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const [data, setData] = useState<PageResponse<StockMovement>>(initialPage);
  const [summary, setSummary] = useState<StockMovementSummary | null>(
    initialSummary,
  );
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Switching variant must rewind the pager — page 7 of a busy variant is out
  // of range for a quiet one. Adjusting during render (rather than in an
  // effect) keeps the fetch effects below from firing once for the stale
  // offset and again for the reset one.
  const [renderedVariantId, setRenderedVariantId] = useState(variantId);
  if (renderedVariantId !== variantId) {
    setRenderedVariantId(variantId);
    setPage(0);
  }

  const startDate = range.from || ALL_TIME_START;
  const endDate = range.to || undefined;
  const typeParam = movementType === "__all__" ? undefined : movementType;

  // Signatures let the effects reuse the server-rendered first page instead of
  // immediately refetching it on mount.
  const pageSig = `${variantId}|${startDate}|${endDate ?? ""}|${typeParam ?? ""}|${page}|${size}`;
  const summarySig = `${variantId}|${startDate}|${endDate ?? ""}`;
  const lastPageSig = useRef(pageSig);
  const lastSummarySig = useRef(summarySig);

  useEffect(() => {
    if (pageSig === lastPageSig.current) return;
    lastPageSig.current = pageSig;
    let cancelled = false;
    setLoading(true);
    getVariantMovementsPage({
      locationId,
      variantId,
      startDate,
      endDate,
      movementType: typeParam,
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
    // `pageSig` encodes every input this query depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSig]);

  useEffect(() => {
    if (summarySig === lastSummarySig.current) return;
    lastSummarySig.current = summarySig;
    let cancelled = false;
    setSummaryLoading(true);
    getMovementSummaryByVariant(locationId, variantId, startDate, endDate)
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summarySig]);

  // Whole-range integrity scan. Runs server-side over every entry, not just the
  // page on screen — a break hundreds of entries back is the whole point.
  // Deliberately keyed on the range, not the page: paging must not re-scan.
  useEffect(() => {
    let cancelled = false;
    setScanning(true);
    getLedgerDiscrepancies({ locationId, variantId, startDate, endDate })
      .then((res) => {
        if (!cancelled) setDiscrepancies(res);
      })
      .finally(() => {
        if (!cancelled) setScanning(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summarySig]);

  // Any filter change invalidates the current page offset.
  const onRangeChange = useCallback((next: LedgerRange) => {
    setRange(next);
    setPage(0);
  }, []);
  const onTypeChange = useCallback((next: string) => {
    setMovementType(next);
    setPage(0);
  }, []);
  const onSizeChange = useCallback((next: string) => {
    setSize(Number(next));
    setPage(0);
  }, []);

  const rows = useMemo(() => analyse(data.content), [data.content]);

  const anomalyCount = useMemo(
    () =>
      rows.filter(
        (r) => r.mathDelta != null || r.chainGap != null || r.negative,
      ).length,
    [rows],
  );

  const visibleRows = useMemo(
    () =>
      anomaliesOnly
        ? rows.filter(
            (r) => r.mathDelta != null || r.chainGap != null || r.negative,
          )
        : rows,
    [rows, anomaliesOnly],
  );

  const totalPages = Math.max(data.totalPages, 1);
  const firstIndex = data.totalElements === 0 ? 0 : page * size + 1;
  const lastIndex = Math.min((page + 1) * size, data.totalElements);
  const rangeIsAllTime = !range.from && !range.to;
  const periodLabel = rangeIsAllTime ? "all time" : "period";

  return (
    <div className="space-y-6">
      {/* ── Period totals — follow the ledger's own range, not a fixed window ── */}
      <div
        className={cn("transition-opacity", summaryLoading && "opacity-50")}
        aria-busy={summaryLoading}
      >
        <KpiStrip cols={5}>
          <KpiCard
            icon={<ArrowDownRight className="h-3 w-3" />}
            label={`Qty in (${periodLabel})`}
            value={`+${qty(Math.abs(summary?.totalQuantityIn ?? 0))}`}
            delta={`${variantLabel} · incoming`}
            deltaTone="pos"
          />
          <KpiCard
            icon={<ArrowUpRight className="h-3 w-3" />}
            label={`Qty out (${periodLabel})`}
            value={`−${qty(Math.abs(summary?.totalQuantityOut ?? 0))}`}
            delta={`${variantLabel} · outgoing`}
            deltaTone="neg"
          />
          <KpiCard
            icon={<Activity className="h-3 w-3" />}
            label="Net change"
            value={signedQty(summary?.netQuantityChange ?? 0)}
            delta={`${(summary?.totalMovements ?? 0).toLocaleString()} entries`}
            deltaTone={
              (summary?.netQuantityChange ?? 0) > 0
                ? "pos"
                : (summary?.netQuantityChange ?? 0) < 0
                  ? "neg"
                  : "neutral"
            }
          />
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Cost in"
            value={(summary?.totalCostIn ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            unit={currency}
            deltaTone="pos"
          />
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Cost out"
            value={(summary?.totalCostOut ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            unit={currency}
            deltaTone="neg"
          />
        </KpiStrip>
      </div>

      <BalanceTrail rows={rows} />

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* ── Filter bar ─────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DateRangeSegmented
              from={range.from}
              to={range.to}
              onChange={onRangeChange}
              allowClear
              allLabel="All time"
              label="Period"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select value={movementType} onValueChange={onTypeChange}>
                <SelectTrigger className="h-8 w-[170px] text-[12.5px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All movement types</SelectItem>
                  {(Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[]).map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {MOVEMENT_TYPE_LABELS[t]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setAnomaliesOnly((v) => !v)}
                disabled={anomalyCount === 0}
                title="Show only the flagged entries on this page"
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-medium transition-colors",
                  anomaliesOnly
                    ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                    : "border-line text-muted-foreground hover:text-foreground",
                  anomalyCount === 0 && "cursor-not-allowed opacity-50",
                )}
              >
                <ScanLine className="h-3.5 w-3.5" />
                On this page
                <span className="font-mono text-[10.5px]">{anomalyCount}</span>
              </button>
            </div>
          </div>

          {/* ── Whole-history integrity scan ───────────────────────── */}
          <IntegrityReport
            discrepancies={discrepancies}
            scanning={scanning}
            rangeIsAllTime={rangeIsAllTime}
          />

          {/* ── Ledger ─────────────────────────────────────────────── */}
          <div className="relative rounded-md border overflow-auto max-h-[640px]">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-[28px]" />
                  <TableHead className="w-[92px]">Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      {anomaliesOnly
                        ? "No flagged entries on this page."
                        : "No movements recorded for this variant in the selected period."}
                    </TableCell>
                  </TableRow>
                )}
                {visibleRows.map((row, i) => {
                  const m = row.movement;
                  const isIn = row.signed >= 0;
                  const showDayHeader =
                    !anomaliesOnly &&
                    (i === 0 ||
                      localDayKey(m.occurredAt) !==
                        localDayKey(visibleRows[i - 1].movement.occurredAt));
                  const totalCostDisplay =
                    m.totalCostAbs ??
                    (m.totalCost != null ? Math.abs(m.totalCost) : null);
                  const typeLabel = movementTypeLabel(m, row.signed);
                  const ref = referenceIdentity(m);
                  const sourceHref =
                    m.referenceType && m.referenceId
                      ? referenceHref(m.referenceType, m.referenceId)
                      : null;
                  const isOpen = expanded.has(m.movementId);
                  const sourceContent = (
                    <>
                      <span>{ref.typeLabel}</span>
                      {ref.identity && (
                        <span
                          className={cn(
                            "ml-1.5 font-mono text-[11px] font-normal",
                            ref.isFallbackId
                              ? "text-muted-foreground/70"
                              : "text-muted-foreground",
                          )}
                          title={
                            ref.isFallbackId
                              ? `No document number was recorded for this entry. Reference id: ${m.referenceId}`
                              : undefined
                          }
                        >
                          {ref.identity}
                        </span>
                      )}
                    </>
                  );

                  return (
                    <Fragment key={m.movementId}>
                      {showDayHeader && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={9}
                            className="bg-surface py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                          >
                            {dayLabel(m.occurredAt)}
                          </TableCell>
                        </TableRow>
                      )}

                      <TableRow
                        className={cn(
                          row.mathDelta != null &&
                            "bg-red-50/60 dark:bg-red-950/20",
                        )}
                      >
                        <TableCell className="pr-0 align-top">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(m.movementId)}
                            aria-expanded={isOpen}
                            aria-label={
                              isOpen ? "Hide entry detail" : "Show entry detail"
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
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {timeLabel(m.occurredAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {sourceHref ? (
                            <Link href={sourceHref} className="hover:underline">
                              {sourceContent}
                            </Link>
                          ) : (
                            sourceContent
                          )}
                          {(m.reasonCode || m.reasonNote) && (
                            <span
                              className="ml-1.5 inline-flex max-w-[220px] items-center truncate rounded bg-muted px-1 py-0.5 align-middle text-[10px] font-normal text-muted-foreground"
                              title={m.reasonNote ?? undefined}
                            >
                              {m.reasonCode
                                ? humaniseReasonCode(m.reasonCode)
                                : m.reasonNote}
                            </span>
                          )}
                          {row.mathDelta != null && (
                            <span
                              className="ml-1.5 inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              title={`before + qty = ${qty(
                                (m.previousBalance ?? 0) + row.signed,
                              )}, but this entry recorded ${qty(m.newBalance ?? 0)}`}
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                              off by {signedQty(row.mathDelta)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                              isIn
                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                            )}
                          >
                            {typeLabel}
                          </span>
                        </TableCell>
                        {/* Before → Qty → After. Both balances are backend values
                            captured at write-time; never recomputed here, since a
                            page is only a slice of the ledger. */}
                        <TableCell
                          className={cn(
                            "whitespace-nowrap text-right",
                            m.previousBalance != null && m.previousBalance < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {m.previousBalance != null ? (
                            qty(m.previousBalance)
                          ) : (
                            <span title="This entry predates before/after balance capture, so it can't be chain-checked.">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            isIn
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400",
                          )}
                        >
                          {signedQty(row.signed)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "whitespace-nowrap text-right font-medium",
                            row.negative && "text-red-600 dark:text-red-400",
                          )}
                        >
                          {m.newBalance != null ? qty(m.newBalance) : "—"}
                          {row.untracked && (
                            <span className="block text-[9.5px] font-normal text-muted-foreground">
                              not captured
                            </span>
                          )}
                          {row.negative && (
                            <span className="block text-[9.5px] font-normal">
                              negative stock
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {m.unitCost != null ? (
                            <Money
                              amount={m.unitCost}
                              currency={m.currency || currency}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {totalCostDisplay != null &&
                          totalCostDisplay !== 0 ? (
                            <Money
                              amount={totalCostDisplay}
                              currency={m.currency || currency}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>

                      {isOpen && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={9} className="p-0">
                            <EntryDetail
                              row={row}
                              typeLabel={typeLabel}
                              reference={ref}
                              href={sourceHref}
                              currency={currency}
                              staffNames={staffNames}
                            />
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Chain break: this entry opened somewhere other than
                          where the entry written before it closed. That entry
                          is not necessarily the one rendered below — the ledger
                          reads in business time, the chain runs in write order,
                          and a back-dated entry sits in a different place. */}
                      {row.chainGap != null && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={9} className="p-0">
                            <div className="flex items-center gap-2 border-y border-dashed border-amber-400 bg-amber-50/70 px-3 py-1.5 text-[11px] text-amber-800 dark:border-amber-700 dark:bg-amber-950/25 dark:text-amber-300">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>
                                Unexplained change of{" "}
                                <strong className="font-semibold">
                                  {signedQty(row.chainGap)}
                                </strong>{" "}
                                here — the entry written before this one closed
                                at {qty(m.previousClosingBalance ?? 0)}, but
                                this one opened at{" "}
                                {qty(m.previousBalance ?? 0)}.
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── Pager ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {data.totalElements === 0
                ? "No entries"
                : `Showing ${firstIndex.toLocaleString()}–${lastIndex.toLocaleString()} of ${data.totalElements.toLocaleString()} entries`}
              {anomaliesOnly && anomalyCount > 0 && (
                <span> · filtered to {visibleRows.length} flagged</span>
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

// ── Integrity report ────────────────────────────────────────────────

/**
 * The whole-history integrity scan.
 *
 * The per-page checks can only see what's loaded, so a break hundreds of
 * entries back stayed invisible unless you happened to page onto it. This runs
 * server-side across every entry in the range and lists each point where the
 * ledger stops adding up, newest first — the shortlist to work through when a
 * quantity is wrong.
 */
function IntegrityReport({
  discrepancies,
  scanning,
  rangeIsAllTime,
}: {
  discrepancies: LedgerDiscrepancy[];
  scanning: boolean;
  rangeIsAllTime: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (scanning && discrepancies.length === 0) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking the whole {rangeIsAllTime ? "history" : "period"} for gaps…
      </p>
    );
  }

  if (discrepancies.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
        <span>
          This variant&apos;s ledger reconciles end to end
          {rangeIsAllTime ? "" : " over the selected period"} — every entry
          opens where the one before it closed. A wrong quantity here
          didn&apos;t come from a missing movement.
        </span>
      </div>
    );
  }

  const shown = expanded ? discrepancies : discrepancies.slice(0, 3);

  return (
    <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <div className="flex items-start gap-2 text-xs">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <strong className="font-semibold">
            {discrepancies.length}{" "}
            {discrepancies.length === 1 ? "point" : "points"}
          </strong>{" "}
          in this variant&apos;s{" "}
          {rangeIsAllTime ? "whole history" : "selected period"} where the
          ledger stops adding up. Entries written at the same instant can order
          arbitrarily, which shows up as a gap that cancels itself out on the
          next row — those are noise.
        </span>
      </div>

      <ul className="space-y-1">
        {shown.map((d) => (
          <li
            key={`${d.movementId}-${d.kind}`}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-amber-200/70 pt-1 text-[11px] first:border-t-0 first:pt-0 dark:border-amber-900/60"
          >
            <span className="font-mono text-[10.5px] opacity-80">
              {dayLabel(d.occurredAt)} {timeLabel(d.occurredAt)}
            </span>
            <span className="font-semibold">
              {DISCREPANCY_KIND_LABELS[d.kind] ?? d.kind}
            </span>
            <span className="font-semibold">{signedQty(d.delta)}</span>
            <span className="opacity-80">
              {d.kind === "CHAIN_BREAK"
                ? `entry written before this one closed at ${qty(d.previousClosingBalance)}, this one opened at ${qty(d.previousBalance)}`
                : `${qty(d.previousBalance)} ${signedQty(d.quantity)} should close at ${qty(d.previousBalance + d.quantity)}, but recorded ${qty(d.newBalance)}`}
            </span>
            {d.referenceNumber && (
              <span className="font-mono text-[10.5px] opacity-70">
                {d.referenceNumber}
              </span>
            )}
          </li>
        ))}
      </ul>

      {discrepancies.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-medium underline underline-offset-2"
        >
          {expanded ? "Show fewer" : `Show all ${discrepancies.length}`}
        </button>
      )}
    </div>
  );
}

// ── Entry detail ────────────────────────────────────────────────────

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

function fullTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}, ${d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

/**
 * Everything the eight ledger columns can't carry. The movement record already
 * travels with cost-basis deltas, batch attribution, unit metadata and three
 * separate timestamps — all of which matter when reconstructing what an entry
 * actually did, and none of which fit in a row.
 */
function EntryDetail({
  row,
  typeLabel,
  reference,
  href,
  currency,
  staffNames,
}: {
  row: LedgerRow;
  typeLabel: string;
  reference: ReturnType<typeof referenceIdentity>;
  href: string | null;
  currency: string;
  staffNames: Record<string, string>;
}) {
  const m = row.movement;
  const cur = m.currency || currency;
  const actorName = m.userId ? staffNames[m.userId] : undefined;
  const avgCostMoved =
    m.previousAverageCost != null &&
    m.newAverageCost != null &&
    Math.abs(m.newAverageCost - m.previousAverageCost) > EPS;

  // occurredAt is when it happened; eventTime is when analytics received it. A
  // wide gap means the event was replayed or backfilled — which is exactly the
  // kind of thing that makes a ledger look wrong.
  const occurred = new Date(m.occurredAt).getTime();
  const landed = new Date(m.eventTime).getTime();
  const lagMs =
    Number.isFinite(occurred) && Number.isFinite(landed)
      ? landed - occurred
      : 0;
  const lagIsNotable = Math.abs(lagMs) > 60 * 60 * 1000;

  return (
    <div className="border-y border-line bg-surface px-4 py-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Movement">
          {typeLabel}
          <span className="ml-1.5 text-muted-foreground">
            ({signedQty(row.signed)} {m.unitAbbreviation || m.unitName})
          </span>
        </DetailField>

        <DetailField label="Source document">
          {href ? (
            <Link href={href} className="text-primary hover:underline">
              {reference.typeLabel}
              {reference.identity ? ` · ${reference.identity}` : ""}
            </Link>
          ) : (
            <>
              {reference.typeLabel}
              {reference.identity ? ` · ${reference.identity}` : ""}
            </>
          )}
          {reference.isFallbackId && (
            <span className="ml-1 text-[10px] text-muted-foreground">
              (no doc number recorded)
            </span>
          )}
        </DetailField>

        {m.refundId && (
          <DetailField label="Refund" mono>
            <Link
              href={`/refunds/${m.refundId}`}
              className="text-primary hover:underline"
            >
              {shortId(m.refundId)}
            </Link>
          </DetailField>
        )}

        {(m.reasonCode || m.reasonNote) && (
          <DetailField label="Reason">
            {m.reasonCode && humaniseReasonCode(m.reasonCode)}
            {m.reasonCode && m.reasonNote && " · "}
            {m.reasonNote && (
              <span
                className={m.reasonCode ? "text-muted-foreground" : undefined}
              >
                {m.reasonNote}
              </span>
            )}
          </DetailField>
        )}

        <DetailField label="Recorded by" mono={!!m.userId && !actorName}>
          {m.userId ? (
            (actorName ?? shortId(m.userId))
          ) : (
            <span className="text-muted-foreground">
              Not recorded
              <span className="ml-1 text-[10px]">
                (not captured on this path)
              </span>
            </span>
          )}
        </DetailField>

        <DetailField label="Item">
          {m.stockName}
          {m.variantName ? ` · ${m.variantName}` : ""}
        </DetailField>

        <DetailField label="Occurred at">
          {fullTimestamp(m.occurredAt)}
        </DetailField>

        <DetailField label="Business day">{m.businessDate}</DetailField>

        <DetailField label="Recorded into reports">
          {fullTimestamp(m.eventTime)}
          {lagIsNotable && (
            <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">
              (backfilled)
            </span>
          )}
        </DetailField>

        <DetailField label="Base quantity" mono>
          {qty(m.baseQuantity)}
          {m.divisibleUnitName ? ` ${m.divisibleUnitName}` : ""}
        </DetailField>

        <DetailField label="Balance before → after" mono>
          {m.previousBalance != null ? qty(m.previousBalance) : "—"}
          {" → "}
          {m.newBalance != null ? qty(m.newBalance) : "—"}
        </DetailField>

        <DetailField label="Avg cost before → after">
          {m.previousAverageCost != null ? (
            <Money amount={m.previousAverageCost} currency={cur} />
          ) : (
            "—"
          )}
          {" → "}
          {m.newAverageCost != null ? (
            <Money amount={m.newAverageCost} currency={cur} />
          ) : (
            "—"
          )}
          {avgCostMoved && (
            <span className="ml-1 text-[10px] text-muted-foreground">
              (cost basis moved)
            </span>
          )}
        </DetailField>

        {m.priorBatchId && (
          <DetailField label="Batch" mono>
            <Link
              href={`/stock-batches/${m.priorBatchId}`}
              className="text-primary hover:underline"
            >
              {shortId(m.priorBatchId)}
            </Link>
          </DetailField>
        )}

        <DetailField label="Entry id" mono>
          {m.movementId}
        </DetailField>
      </dl>
    </div>
  );
}

// ── Balance trail ───────────────────────────────────────────────────

interface TrailPoint {
  idx: number;
  label: string;
  balance: number;
  flagged: boolean;
}

/**
 * Step chart of the closing balance across the entries on screen, oldest to
 * newest. A ledger reads as numbers; the shape of the line is what makes a
 * sudden drop or an impossible spike obvious at a glance. Flagged entries get
 * a red marker so you can jump straight to the row below.
 */
function BalanceTrail({ rows }: { rows: LedgerRow[] }) {
  const points = useMemo<TrailPoint[]>(() => {
    // `rows` is newest-first; a trail reads left-to-right in time order.
    const asc = [...rows].reverse();
    return asc
      .map((r, idx) => ({
        idx,
        label: `${dayLabel(r.movement.occurredAt)} ${timeLabel(r.movement.occurredAt)}`,
        balance: r.movement.newBalance ?? Number.NaN,
        flagged: r.mathDelta != null || r.chainGap != null || r.negative,
      }))
      .filter((p) => Number.isFinite(p.balance));
  }, [rows]);

  const flagged = useMemo(() => points.filter((p) => p.flagged), [points]);

  if (points.length < 2) return null;

  return (
    <Card className="shadow-none">
      <CardContent className="pt-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Balance trail · entries on this page
          </h3>
          {flagged.length > 0 && (
            <span className="text-[11px] text-red-600 dark:text-red-400">
              {flagged.length} flagged
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={points}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="idx"
              type="number"
              domain={[0, points.length - 1]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => points[Number(v)]?.label ?? ""}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v) => Number(v).toLocaleString()}
            />
            <Tooltip
              formatter={(value) => [Number(value).toLocaleString(), "Balance"]}
              labelFormatter={(v) => points[Number(v)]?.label ?? ""}
              labelClassName="text-xs font-medium"
            />
            {/* Zero line makes negative stock unmistakable. */}
            <Line
              type="stepAfter"
              dataKey="balance"
              stroke="#EB7F44"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Balance"
            />
            {flagged.map((p) => (
              <ReferenceDot
                key={p.idx}
                x={p.idx}
                y={p.balance}
                r={4}
                fill="#dc2626"
                stroke="#fff"
                strokeWidth={1.5}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
