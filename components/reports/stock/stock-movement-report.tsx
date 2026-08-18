"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUp,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Package,
  PackageSearch,
  Search,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  buildBreakdownEntries,
  buildItemLabel,
  fmtCost,
  fmtQty,
  STOCK_LENSES,
  type MovementBreakdownEntry,
  type StockLens,
} from "@/lib/reports/stock-movement";
import type {
  StockMovementReportRow,
  StockMovementReportSummary,
  StockStatus,
} from "@/types/stock-movement-report/type";
import { StockMovementExportButton } from "./stock-movement-export-button";

type SortKey = "name" | "opening" | "in" | "out" | "net" | "closing" | "value";

const STATUS_PILL: Record<StockStatus, string> = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  low: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  out: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  dead: "border border-line bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<StockStatus, string> = {
  ok: "OK",
  low: "Low",
  out: "Out",
  dead: "Dead",
};

const FLOW_COLOR: Record<string, string> = {
  purchase: "bg-emerald-500",
  transferIn: "bg-sky-500",
  return: "bg-lime-500",
  openingBalance: "bg-zinc-400",
  adjustment: "bg-violet-500",
  sale: "bg-rose-500",
  transferOut: "bg-orange-500",
  damage: "bg-red-700",
  recipeUsage: "bg-pink-600",
  other: "bg-zinc-400",
};

const dateTimeFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});
const clockFmt = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatLastMovement(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never";
  return `${dateTimeFmt.format(d)} · ${clockFmt.format(d)}`;
}

interface Props {
  summary: StockMovementReportSummary;
  rows: StockMovementReportRow[];
  currency: string;
  closingSub: string;
  /** URL state (all filtering happens server-side). */
  from: string;
  to: string;
  asOf: string;
  search: string;
  lens: StockLens;
  sort: string; // "<col>,<dir>"
  page: number; // 1-based
  limit: number;
  pageSizes: number[];
  totalElements: number;
  totalPages: number;
}

/**
 * Stock movement report — server-driven. The backend paginates / searches /
 * filters / sorts; this component just reflects the current page + summary and
 * navigates the URL on every interaction. Row expansion stays local.
 */
export function StockMovementReport({
  summary,
  rows,
  currency,
  closingSub,
  from,
  to,
  asOf,
  search,
  lens,
  sort,
  page,
  limit,
  pageSizes,
  totalElements,
  totalPages,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(search);
  const [open, setOpen] = useState<Set<string>>(new Set());

  // Keep the input in sync when the URL changes elsewhere (filter reset, etc.).
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounce typing → URL (which triggers a server refetch).
  useEffect(() => {
    if (searchInput === search) return;
    const handle = setTimeout(() => {
      const qs = new URLSearchParams(searchParams?.toString() ?? "");
      if (searchInput.trim()) qs.set("search", searchInput.trim());
      else qs.delete("search");
      qs.delete("page");
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput, search, searchParams, router, pathname]);

  const setParams = (next: Record<string, string | null>) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") qs.delete(k);
      else qs.set(k, v);
    }
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  const [sortCol, sortDir] = ((): [SortKey, "asc" | "desc"] => {
    const [c, d] = (sort || "closing,desc").split(",");
    return [(c as SortKey) || "closing", d === "asc" ? "asc" : "desc"];
  })();

  const onLens = (key: StockLens) => {
    setOpen(new Set());
    setParams({ lens: key === "all" ? null : key, page: null });
  };

  const onSort = (key: SortKey) => {
    const dir =
      key === sortCol ? (sortDir === "asc" ? "desc" : "asc") : key === "name" ? "asc" : "desc";
    setParams({ sort: `${key},${dir}`, page: null });
  };

  const onPage = (next: number) =>
    setParams({ page: next <= 1 ? null : String(next) });

  const toggleRow = (id: string) => {
    setOpen((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const attention = summary.low + summary.out + summary.dead;
  const start = totalElements === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalElements);
  const currentPage = Math.min(page, Math.max(totalPages, 1));

  return (
    <div className="space-y-4">
      {/* ── Stat strip ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-line bg-line">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-7">
          <Stat
            label="Opening"
            value={fmtQty(summary.totalOpening)}
            unit="u"
            sub={`${fmtQty(summary.all)} items tracked`}
          />
          <Stat
            icon={<ArrowDownToLine className="h-3 w-3" />}
            label="Quantity in"
            value={summary.totalIn > 0 ? `+${fmtQty(summary.totalIn)}` : "—"}
            valueTone="pos"
            sub="purchases + returns"
            subTone="pos"
          />
          <Stat
            icon={<ArrowUpFromLine className="h-3 w-3" />}
            label="Quantity out"
            value={summary.totalOut > 0 ? `−${fmtQty(summary.totalOut)}` : "—"}
            valueTone="neg"
            sub="sales + damage"
            subTone="neg"
          />
          <Stat
            label="Closing"
            value={fmtQty(summary.totalClosing)}
            unit="u"
            sub={closingSub}
          />
          <Stat
            icon={<Truck className="h-3 w-3" />}
            label="In transit"
            value={summary.totalInTransit > 0 ? fmtQty(summary.totalInTransit) : "—"}
            unit={summary.totalInTransit > 0 ? "u" : undefined}
            sub="dispatched, not yet received"
          />
          <Stat
            label="Closing value"
            value={fmtQty(summary.totalValue)}
            unit={currency}
            sub="at avg cost"
          />
          <Stat
            label="Needs attention"
            value={fmtQty(attention)}
            sub={`${summary.low} low · ${summary.out} out · ${summary.dead} dead`}
            subTone="warn"
          />
        </div>
      </div>

      {/* ── Report card ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            Stock movement
            <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">
              {fmtQty(totalElements)} items
            </span>
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-line bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 sm:w-60">
              <Search className="h-4 w-4 flex-shrink-0 text-muted-2" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search item or brand…"
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-2"
              />
            </label>
            <StockMovementExportButton
              from={from}
              to={to}
              asOf={asOf}
              search={search}
              lens={lens}
              sort={sort}
              currency={currency}
              total={totalElements}
            />
          </div>
        </div>

        {/* lens chips */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-canvas px-4 py-3">
          {STOCK_LENSES.map((def) => {
            const active = lens === def.key;
            const count = summary[def.key] ?? 0;
            return (
              <button
                key={def.key}
                type="button"
                onClick={() => onLens(def.key)}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-[12.5px] font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-line bg-card text-muted-foreground hover:border-muted-2 hover:text-ink",
                )}
              >
                {def.label}
                <span
                  className={cn(
                    "rounded px-1.5 py-px font-mono text-[10.5px] font-semibold",
                    active
                      ? "bg-white/20 text-primary-foreground"
                      : def.tone === "warn"
                        ? "bg-muted text-amber-600 dark:text-amber-500"
                        : def.tone === "neg"
                          ? "bg-muted text-rose-600 dark:text-rose-400"
                          : "bg-muted text-muted-foreground",
                  )}
                >
                  {fmtQty(count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="w-8" />
                <SortableTh label="Item" sortKey="name" activeKey={sortCol} dir={sortDir} onSort={onSort} />
                <SortableTh label="Opening" sortKey="opening" activeKey={sortCol} dir={sortDir} onSort={onSort} align="right" />
                <SortableTh label="In" sortKey="in" activeKey={sortCol} dir={sortDir} onSort={onSort} align="right" />
                <SortableTh label="Out" sortKey="out" activeKey={sortCol} dir={sortDir} onSort={onSort} align="right" />
                <SortableTh label="Net" sortKey="net" activeKey={sortCol} dir={sortDir} onSort={onSort} align="right" />
                <SortableTh label="Closing" sortKey="closing" activeKey={sortCol} dir={sortDir} onSort={onSort} align="right" />
                <SortableTh label="Value" sortKey="value" activeKey={sortCol} dir={sortDir} onSort={onSort} align="right" />
                <th className="whitespace-nowrap px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                      <PackageSearch className="h-9 w-9 text-muted-2" strokeWidth={1.4} />
                      <p className="text-[15px] font-medium text-ink">No items match</p>
                      <p className="text-[13px] text-muted-foreground">
                        Try a different lens or clear your search.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <MovementRow
                    key={row.variantId}
                    row={row}
                    currency={currency}
                    open={open.has(row.variantId)}
                    onToggle={() => toggleRow(row.variantId)}
                  />
                ))
              )}
            </tbody>
            {totalElements > 0 && (
              <tfoot>
                <tr className="border-t-2 border-line-2 bg-muted/60 font-semibold">
                  <td />
                  <td className="px-4 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">
                    Totals · {fmtQty(totalElements)} items
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] text-ink">
                    {fmtQty(summary.totalOpening)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] text-pos">
                    +{fmtQty(summary.totalIn)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] text-neg">
                    −{fmtQty(summary.totalOut)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3.5 text-right font-mono text-[13px]",
                      summary.totalNet >= 0 ? "text-pos" : "text-neg",
                    )}
                  >
                    {summary.totalNet >= 0 ? "+" : "−"}
                    {fmtQty(Math.abs(summary.totalNet))}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] text-ink">
                    {fmtQty(summary.totalClosing)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] text-ink">
                    {fmtQty(summary.totalValue)}{" "}
                    <span className="font-mono text-[9.5px] font-medium text-muted-foreground">
                      {currency}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* footer / pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line p-4">
          <span className="font-mono text-[11.5px] text-muted-foreground">
            Showing {start}–{end} of {fmtQty(totalElements)}
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-mono text-[11.5px] text-muted-foreground">
              Rows:
              <select
                value={limit}
                onChange={(e) =>
                  setParams({ limit: e.target.value, page: null })
                }
                className="h-8 rounded-lg border border-line bg-card px-2 font-mono text-[12px] outline-none"
              >
                {pageSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <PagerButton label="First page" disabled={currentPage <= 1} onClick={() => onPage(1)}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </PagerButton>
              <PagerButton label="Previous page" disabled={currentPage <= 1} onClick={() => onPage(currentPage - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </PagerButton>
              <span className="px-2 font-mono text-[12px] text-ink-2">
                {currentPage} / {Math.max(totalPages, 1)}
              </span>
              <PagerButton label="Next page" disabled={currentPage >= totalPages} onClick={() => onPage(currentPage + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </PagerButton>
              <PagerButton label="Last page" disabled={currentPage >= totalPages} onClick={() => onPage(totalPages)}>
                <ChevronsRight className="h-3.5 w-3.5" />
              </PagerButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Stat tile
// ─────────────────────────────────────────────────────────────────────

type Tone = "pos" | "neg" | "warn" | "neutral";

const TONE_TEXT: Record<Tone, string> = {
  pos: "text-pos",
  neg: "text-neg",
  warn: "text-amber-600 dark:text-amber-500",
  neutral: "text-muted-foreground",
};

function Stat({
  icon,
  label,
  value,
  unit,
  valueTone = "neutral",
  sub,
  subTone = "neutral",
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  unit?: string;
  valueTone?: Tone;
  sub: string;
  subTone?: Tone;
}) {
  return (
    <div className="bg-card px-4 py-3.5">
      <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {icon && <span className="text-muted-2">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "mt-1.5 flex items-baseline gap-1 text-[21px] font-bold leading-none tracking-[-0.02em] tabular-nums",
          valueTone === "neutral" ? "text-ink" : TONE_TEXT[valueTone],
        )}
      >
        <span>{value}</span>
        {unit && (
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      <div className={cn("mt-1.5 font-mono text-[10.5px]", TONE_TEXT[subTone])}>
        {sub}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sortable header cell
// ─────────────────────────────────────────────────────────────────────

function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]",
        align === "right" ? "text-right" : "text-left",
        active ? "text-ink-2" : "text-muted-foreground",
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-ink-2",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        {!active ? (
          <ChevronsUpDown className="h-3 w-3 text-muted-2" />
        ) : dir === "asc" ? (
          <ArrowUp className="h-3 w-3 text-primary" />
        ) : (
          <ArrowDown className="h-3 w-3 text-primary" />
        )}
      </button>
    </th>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pager button
// ─────────────────────────────────────────────────────────────────────

function PagerButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-card text-muted-foreground transition-colors hover:border-muted-2 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Table row + expandable drawer
// ─────────────────────────────────────────────────────────────────────

function MovementRow({
  row,
  currency,
  open,
  onToggle,
}: {
  row: StockMovementReportRow;
  currency: string;
  open: boolean;
  onToggle: () => void;
}) {
  const netClass =
    row.net > 0 ? "text-pos" : row.net < 0 ? "text-neg" : "text-muted-2";
  const netText =
    row.net === 0
      ? "0"
      : `${row.net > 0 ? "+" : "−"}${fmtQty(Math.abs(row.net))}`;

  return (
    <>
      <tr
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "cursor-pointer border-b border-line transition-colors",
          open ? "bg-primary/5" : "hover:bg-canvas",
        )}
      >
        <td className="pl-4">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-muted-2 transition-transform",
              open && "rotate-90 text-primary",
            )}
          />
        </td>
        <td className="py-3 pr-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-muted-2">
              <Package className="h-4 w-4" strokeWidth={1.4} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold tracking-tight text-ink">
                {buildItemLabel(row.stockName, row.variantName)}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink">
          {fmtQty(row.opening)}
        </td>
        <td
          className={cn(
            "px-4 py-3 text-right font-mono text-[13px] tabular-nums",
            row.qtyIn > 0 ? "text-pos" : "text-muted-2",
          )}
        >
          {row.qtyIn > 0 ? `+${fmtQty(row.qtyIn)}` : "—"}
        </td>
        <td
          className={cn(
            "px-4 py-3 text-right font-mono text-[13px] tabular-nums",
            row.qtyOut > 0 ? "text-neg" : "text-muted-2",
          )}
        >
          {row.qtyOut > 0 ? `−${fmtQty(row.qtyOut)}` : "—"}
        </td>
        <td className={cn("px-4 py-3 text-right font-mono text-[13px] tabular-nums", netClass)}>
          {netText}
        </td>
        <td className="px-4 py-3 text-right font-mono text-[13px] font-semibold tabular-nums text-ink">
          {fmtQty(row.closing)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-ink">
          {row.avgCost > 0 ? (
            <>
              {fmtQty(row.value)}
              <span className="mt-0.5 block text-[10.5px] font-normal text-muted-foreground">
                {currency} · {fmtCost(row.avgCost)} avg
              </span>
            </>
          ) : (
            <span className="text-muted-2">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <span
            className={cn(
              "inline-flex h-[22px] items-center rounded-md px-2 font-mono text-[10.5px] font-semibold",
              STATUS_PILL[row.status],
            )}
          >
            {STATUS_LABEL[row.status]}
          </span>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-line bg-surface">
          <td colSpan={9} className="p-0">
            <MovementDrawer row={row} currency={currency} />
          </td>
        </tr>
      )}
    </>
  );
}

function MovementDrawer({
  row,
  currency,
}: {
  row: StockMovementReportRow;
  currency: string;
}) {
  const breakdown = buildBreakdownEntries(row.breakdown, row.opening, row.closing);
  const max = Math.max(1, ...breakdown.map((b) => Math.abs(b.quantity)));

  return (
    <div className="grid grid-cols-2">
      <div className="p-5">
        <div className="mb-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Movement breakdown · this period
        </div>
        {breakdown.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground">
            No movements in this period.
          </p>
        ) : (
          <div className="space-y-2.5">
            {breakdown.map((entry) => (
              <BreakdownBar key={entry.key} entry={entry} max={max} />
            ))}
          </div>
        )}
      </div>

      <div className="border-l border-line p-5">
        <div className="mb-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Position &amp; risk
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
          <Fact label="Available" value={fmtQty(row.available)} unit="u" />
          <Fact
            label="Reserved"
            value={row.reserved > 0 ? fmtQty(row.reserved) : "—"}
            unit={row.reserved > 0 ? "u" : undefined}
            tone={row.reserved > 0 ? "warn" : undefined}
          />
          <Fact
            label="In transit"
            value={row.inTransit > 0 ? fmtQty(row.inTransit) : "—"}
            unit={row.inTransit > 0 ? "u" : undefined}
          />
          <Fact label="Avg cost" value={fmtCost(row.avgCost)} unit={currency} />
          <Fact
            label="Reorder point"
            value={row.reorderPoint != null ? fmtQty(row.reorderPoint) : "—"}
            unit={row.reorderPoint != null ? "u" : undefined}
          />
          <Fact
            label="Daily use"
            value={row.dailyUse != null ? fmtCost(row.dailyUse) : "—"}
            unit={row.dailyUse != null ? "/day" : undefined}
          />
          <Fact
            label="Days of cover"
            value={
              row.status === "out"
                ? "0"
                : row.daysOfCover != null
                  ? fmtQty(row.daysOfCover)
                  : "—"
            }
            unit={row.daysOfCover != null ? "days" : undefined}
            tone={row.daysOfCover != null && row.daysOfCover <= 14 ? "warn" : undefined}
          />
          <Fact
            label="Days idle"
            value={row.daysIdle && row.daysIdle > 0 ? fmtQty(row.daysIdle) : "—"}
            unit={row.daysIdle && row.daysIdle > 0 ? "days" : undefined}
            tone={row.daysIdle != null && row.daysIdle >= 30 ? "neg" : undefined}
          />
          <Fact
            label="Last movement"
            value={formatLastMovement(row.lastMovementAt)}
            small
          />
        </div>
        <div className="mt-4 border-t border-dashed border-line pt-4">
          <Link
            href={`/stock-variants/${row.variantId}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12px] font-semibold text-card transition-colors hover:bg-primary"
          >
            View item
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function BreakdownBar({
  entry,
  max,
}: {
  entry: MovementBreakdownEntry;
  max: number;
}) {
  const qty = Math.abs(entry.quantity);
  const color = FLOW_COLOR[entry.key] ?? "bg-zinc-400";
  const width = Math.max(6, (qty / max) * 100);
  return (
    <div className="grid grid-cols-[120px_1fr_72px] items-center gap-3">
      <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink-2">
        <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-sm", color)} />
        <span className="truncate">{entry.label}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-line-2">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${width}%` }} />
      </div>
      <div
        className={cn(
          "text-right font-mono text-[12.5px] font-semibold tabular-nums",
          entry.quantity >= 0 ? "text-pos" : "text-neg",
        )}
      >
        {entry.quantity >= 0 ? "+" : "−"}
        {fmtQty(qty)}
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  unit,
  tone,
  small,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "warn" | "neg";
  small?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-semibold tracking-tight",
          small ? "text-[12.5px]" : "text-[14px]",
          tone === "warn"
            ? "text-amber-600 dark:text-amber-500"
            : tone === "neg"
              ? "text-neg"
              : "text-ink",
        )}
      >
        {value}
        {unit && (
          <span className="ml-1 font-mono text-[10.5px] font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
