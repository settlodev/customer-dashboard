"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Ban,
  Boxes,
  CalendarClock,
  ChefHat,
  ClipboardCheck,
  Flag,
  History,
  Layers,
  PackageMinus,
  PackagePlus,
  PencilLine,
  Recycle,
  Scale,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
  Undo2,
  User,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { Money } from "@/components/widgets/money";
import { cn } from "@/lib/utils";
import {
  dateLabel,
  dayLabel,
  localDayKey,
  movementTypeLabel,
  parseTimestamp,
  qty,
  referenceHref,
  referenceIdentity,
  shortId,
  signedQty,
  signedQuantity,
  timeLabel,
} from "@/lib/stock-movement-display";
import type { Stock } from "@/types/stock/type";
import type { StockBatch } from "@/types/stock-batch/type";
import type { AuditLogEntry } from "@/types/audit-log/type";
import { AUDIT_ACTION_LABELS } from "@/types/audit-log/type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { MovementType, StockMovement } from "@/types/stock-movement/type";

// ── Event model ─────────────────────────────────────────────────────

type Tone = "pos" | "neg" | "warn" | "info" | "muted";

/** Filter lanes. Every event belongs to exactly one. */
type Lane = "movement" | "batch" | "alert" | "admin";

interface ActivityEvent {
  id: string;
  /** ISO instant, or a bare `yyyy-MM-dd` for date-only sources. */
  at: string;
  lane: Lane;
  tone: Tone;
  icon: LucideIcon;
  title: string;
  /** Variant the event belongs to. Omitted for stock-wide events. */
  scope?: string | null;
  source?: { label: string; href: string | null } | null;
  actor?: string | null;
  note?: string | null;
  /** Signed quantity, rendered on the right of the row. */
  quantity?: number | null;
  unit?: string | null;
  balance?: { before: number | null; after: number | null } | null;
  money?: { amount: number; currency: string; label: string } | null;
  chips?: string[];
}

const LANES: { key: Lane | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "movement", label: "Stock moves" },
  { key: "batch", label: "Batches" },
  { key: "alert", label: "Alerts" },
  { key: "admin", label: "Edits & admin" },
];

const TONE_CHIP: Record<Tone, string> = {
  pos: "bg-pos-tint text-pos",
  neg: "bg-neg-tint text-neg",
  warn: "bg-warn-tint text-warn",
  info: "bg-primary/10 text-primary",
  muted: "bg-surface text-muted-foreground",
};

const MOVEMENT_ICONS: Record<MovementType, LucideIcon> = {
  PURCHASE: PackagePlus,
  SALE: ShoppingCart,
  TRANSFER_IN: Truck,
  TRANSFER_OUT: Truck,
  RETURN: Undo2,
  ADJUSTMENT: ClipboardCheck,
  DAMAGE: Ban,
  RECIPE_USAGE: ChefHat,
  OPENING_BALANCE: Flag,
  WASTE: Trash2,
  CONTAINER_RETURN_IN: Recycle,
  CONTAINER_RETURN_OUT: Recycle,
  PACKAGING_CONSUMED: PackageMinus,
};

const AUDIT_ICONS: Record<string, LucideIcon> = {
  CREATE: Sparkles,
  UPDATE: PencilLine,
  DELETE: Trash2,
  SOFT_DELETE: Trash2,
  ARCHIVE: Archive,
  UNARCHIVE: Archive,
  RECEIVE: PackagePlus,
  CONFIRM: ClipboardCheck,
  APPROVE: ClipboardCheck,
  CANCEL: Ban,
  REJECT: Ban,
};

/** Loss-shaped movements read as warnings even though they're just outflows. */
const LOSS_TYPES: MovementType[] = ["DAMAGE", "WASTE"];

function movementTone(m: StockMovement, signed: number): Tone {
  if (LOSS_TYPES.includes(m.movementType)) return "warn";
  if (signed > 0) return "pos";
  if (signed < 0) return "neg";
  return "muted";
}

// ── Event construction ──────────────────────────────────────────────

interface BuildInput {
  stock: Stock;
  movements: StockMovement[];
  batches: StockBatch[];
  auditEntries: AuditLogEntry[];
  snapshots: InventorySnapshot[];
  staffNames: Record<string, string>;
  currency: string;
  multiVariant: boolean;
}

/** Two events landing this close together describe the same act. */
const SAME_ACT_MS = 60 * 1000;

function movementEvents({
  movements,
  staffNames,
  currency,
  multiVariant,
}: BuildInput): ActivityEvent[] {
  return movements.map((m) => {
    const signed = signedQuantity(m);
    const ref = referenceIdentity(m);
    const href =
      m.referenceType && m.referenceId
        ? referenceHref(m.referenceType, m.referenceId)
        : null;
    const totalCost =
      m.totalCostAbs ?? (m.totalCost != null ? Math.abs(m.totalCost) : null);
    const chips: string[] = [];
    if (m.newBalance != null && m.newBalance < 0) chips.push("negative stock");
    if (
      m.previousAverageCost != null &&
      m.newAverageCost != null &&
      Math.abs(m.newAverageCost - m.previousAverageCost) > 1e-6
    ) {
      chips.push("cost basis moved");
    }

    return {
      id: `mv-${m.movementId}`,
      at: m.occurredAt,
      lane: "movement" as const,
      tone: movementTone(m, signed),
      icon: MOVEMENT_ICONS[m.movementType] ?? Activity,
      title: movementTypeLabel(m, signed),
      scope: multiVariant ? m.variantName : null,
      source: {
        label: ref.identity
          ? `${ref.typeLabel} · ${ref.identity}`
          : ref.typeLabel,
        href,
      },
      actor: m.userId ? (staffNames[m.userId] ?? shortId(m.userId)) : null,
      quantity: signed,
      unit: m.unitAbbreviation || m.unitName,
      balance: {
        before: m.previousBalance ?? null,
        after: m.newBalance ?? null,
      },
      money:
        totalCost != null && totalCost !== 0
          ? {
              amount: totalCost,
              currency: m.currency || currency,
              label: "value",
            }
          : null,
      chips,
    };
  });
}

function batchEvents({
  batches,
  currency,
  multiVariant,
}: BuildInput): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const now = Date.now();

  for (const b of batches) {
    events.push({
      id: `batch-in-${b.id}`,
      at: b.receivedDate,
      lane: "batch",
      tone: "pos",
      icon: Layers,
      title: `Batch ${b.batchNumber} received`,
      scope: multiVariant ? b.variantName : null,
      source: {
        label: b.grnId ? "Goods received note" : "Batch record",
        href: b.grnId ? `/goods-received/${b.grnId}` : `/stock-batches/${b.id}`,
      },
      quantity: b.initialQuantity,
      unit: b.unitAbbreviation || b.unitName,
      money:
        b.unitCost != null
          ? {
              amount: b.unitCost,
              currency: b.currency || currency,
              label: "unit cost",
            }
          : null,
      note: b.notes,
      chips: [
        b.supplierBatchReference
          ? `supplier ref ${b.supplierBatchReference}`
          : null,
        b.expiryDate ? `expires ${dateLabel(b.expiryDate)}` : "no expiry",
        b.originalCurrency && b.originalCurrency !== (b.currency || currency)
          ? `invoiced in ${b.originalCurrency}`
          : null,
      ].filter((c): c is string => c !== null),
    });

    // Expiry only becomes an *event* once the date has passed; anything still
    // ahead of us is surfaced by the upcoming-expiry callout instead.
    if (b.expiryDate && parseTimestamp(b.expiryDate).getTime() <= now) {
      events.push({
        id: `batch-exp-${b.id}`,
        at: b.expiryDate,
        lane: "alert",
        tone: "neg",
        icon: CalendarClock,
        title: `Batch ${b.batchNumber} expired`,
        scope: multiVariant ? b.variantName : null,
        source: { label: "Batch record", href: `/stock-batches/${b.id}` },
        quantity: b.quantityOnHand > 0 ? b.quantityOnHand : null,
        unit: b.unitAbbreviation || b.unitName,
        note:
          b.quantityOnHand > 0
            ? "Stock from this batch is still on hand — write it off or dispose of it."
            : null,
      });
    }

    if (b.status === "RECALLED") {
      events.push({
        id: `batch-recall-${b.id}`,
        at: b.updatedAt,
        lane: "alert",
        tone: "warn",
        icon: AlertTriangle,
        title: `Batch ${b.batchNumber} recalled`,
        scope: multiVariant ? b.variantName : null,
        source: { label: "Batch record", href: `/stock-batches/${b.id}` },
        quantity: b.quantityOnHand > 0 ? b.quantityOnHand : null,
        unit: b.unitAbbreviation || b.unitName,
      });
    }

    if (b.status === "DEPLETED") {
      events.push({
        id: `batch-out-${b.id}`,
        at: b.updatedAt,
        lane: "batch",
        tone: "muted",
        icon: Layers,
        title: `Batch ${b.batchNumber} depleted`,
        scope: multiVariant ? b.variantName : null,
        source: { label: "Batch record", href: `/stock-batches/${b.id}` },
        note: `All ${qty(b.initialQuantity)} ${b.unitAbbreviation || b.unitName} received on this batch have been consumed.`,
      });
    }
  }

  return events;
}

function auditEvents({
  auditEntries,
  staffNames,
}: BuildInput): ActivityEvent[] {
  return auditEntries.map((entry) => ({
    id: `audit-${entry.id}`,
    at: entry.createdAt,
    lane: "admin" as const,
    tone:
      entry.action === "DELETE" || entry.action === "SOFT_DELETE"
        ? "neg"
        : entry.action === "ARCHIVE"
          ? "warn"
          : "info",
    icon: AUDIT_ICONS[entry.action] ?? History,
    title: `${AUDIT_ACTION_LABELS[entry.action] ?? entry.action} · ${entry.entityType.toLowerCase()}`,
    actor:
      entry.staffName ??
      (entry.userId ? staffNames[entry.userId] : null) ??
      null,
    note: entry.details,
    chips: entry.ipAddress ? [entry.ipAddress] : undefined,
  }));
}

/**
 * Creation of the stock item and of each variant. The audit log records these
 * too on newer installs, so anything already covered there is skipped rather
 * than shown twice.
 */
function lifecycleEvents({ stock, auditEntries }: BuildInput): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const created = new Date(stock.createdAt).getTime();
  const auditHasCreate = auditEntries.some(
    (e) =>
      e.action === "CREATE" &&
      Math.abs(new Date(e.createdAt).getTime() - created) < SAME_ACT_MS,
  );

  if (!auditHasCreate && Number.isFinite(created)) {
    events.push({
      id: `life-stock-${stock.id}`,
      at: stock.createdAt,
      lane: "admin",
      tone: "info",
      icon: Sparkles,
      title: "Stock item created",
      note: `${stock.variants.length} variant${stock.variants.length === 1 ? "" : "s"} · tracked in ${stock.baseUnitName}`,
    });
  }

  for (const v of stock.variants) {
    const at = new Date(v.createdAt).getTime();
    // Variants born with the parent are part of "stock item created".
    if (!Number.isFinite(at) || at - created < SAME_ACT_MS) continue;
    events.push({
      id: `life-variant-${v.id}`,
      at: v.createdAt,
      lane: "admin",
      tone: "info",
      icon: Boxes,
      title: `Variant added — ${v.displayName}`,
      note: [
        v.sku ? `SKU ${v.sku}` : null,
        v.barcode ? `barcode ${v.barcode}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      chips: [
        v.isDefault ? "default" : null,
        v.serialTracked ? "serial tracked" : null,
        v.archived ? "archived" : null,
      ].filter((c): c is string => c !== null),
    });
  }

  return events;
}

/**
 * Stock-state changes read off the daily snapshots: the days this item ran dry,
 * came back, or closed negative. None of these are written as movements, so
 * without this pass the timeline never shows *that* the item was unsellable —
 * only the individual sales that got it there.
 */
function stateEvents({ snapshots }: BuildInput): ActivityEvent[] {
  const asc = [...snapshots].sort((a, b) =>
    a.snapshotDate.localeCompare(b.snapshotDate),
  );
  const events: ActivityEvent[] = [];

  for (let i = 1; i < asc.length; i++) {
    const prev = asc[i - 1];
    const cur = asc[i];

    if (prev.closingQuantity > 0 && cur.closingQuantity <= 0) {
      events.push({
        id: `state-out-${cur.snapshotDate}`,
        at: cur.snapshotDate,
        lane: "alert",
        tone: "neg",
        icon: AlertTriangle,
        title: "Ran out of stock",
        note: `Closed the day at ${qty(cur.closingQuantity)} after opening at ${qty(cur.openingQuantity)}.`,
      });
    } else if (prev.closingQuantity <= 0 && cur.closingQuantity > 0) {
      events.push({
        id: `state-in-${cur.snapshotDate}`,
        at: cur.snapshotDate,
        lane: "alert",
        tone: "pos",
        icon: PackagePlus,
        title: "Back in stock",
        note: `Closed the day at ${qty(cur.closingQuantity)}.`,
      });
    }

    if (cur.closingQuantity < 0 && prev.closingQuantity >= 0) {
      events.push({
        id: `state-neg-${cur.snapshotDate}`,
        at: cur.snapshotDate,
        lane: "alert",
        tone: "warn",
        icon: Scale,
        title: "Balance went negative",
        note: `The day closed at ${qty(cur.closingQuantity)} — stock was sold or consumed that was never received.`,
      });
    }
  }

  return events;
}

function buildEvents(input: BuildInput): ActivityEvent[] {
  return [
    ...movementEvents(input),
    ...batchEvents(input),
    ...auditEvents(input),
    ...lifecycleEvents(input),
    ...stateEvents(input),
  ].sort(
    (a, b) => parseTimestamp(b.at).getTime() - parseTimestamp(a.at).getTime(),
  );
}

// ── Component ───────────────────────────────────────────────────────

interface Props {
  stock: Stock;
  /** Recent movements merged across every variant, newest-first. */
  movements: StockMovement[];
  /** True when `movements` is only the newest slice of a longer ledger. */
  movementsTruncated: boolean;
  batches: StockBatch[];
  auditEntries: AuditLogEntry[];
  /** Stock-level daily snapshots (last ~90 days). */
  snapshots: InventorySnapshot[];
  staffNames: Record<string, string>;
  currency: string;
  /** Jumps to the Movements tab for the full, paged ledger. */
  onOpenLedger?: () => void;
}

const PAGE_STEP = 40;

export function StockActivityTimeline({
  stock,
  movements,
  movementsTruncated,
  batches,
  auditEntries,
  snapshots,
  staffNames,
  currency,
  onOpenLedger,
}: Props) {
  const [lane, setLane] = useState<Lane | "all">("all");
  const [limit, setLimit] = useState(PAGE_STEP);

  const multiVariant = stock.variants.length > 1;

  const events = useMemo(
    () =>
      buildEvents({
        stock,
        movements,
        batches,
        auditEntries,
        snapshots,
        staffNames,
        currency,
        multiVariant,
      }),
    [
      stock,
      movements,
      batches,
      auditEntries,
      snapshots,
      staffNames,
      currency,
      multiVariant,
    ],
  );

  const laneCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    for (const e of events) counts[e.lane] = (counts[e.lane] ?? 0) + 1;
    return counts;
  }, [events]);

  const filtered = useMemo(
    () => (lane === "all" ? events : events.filter((e) => e.lane === lane)),
    [events, lane],
  );

  const visible = filtered.slice(0, limit);

  // Day buckets, in the same newest-first order as the rail itself.
  const groups = useMemo(() => {
    const out: { key: string; label: string; events: ActivityEvent[] }[] = [];
    for (const e of visible) {
      const key = localDayKey(e.at);
      const last = out[out.length - 1];
      if (last && last.key === key) last.events.push(e);
      else out.push({ key, label: dayLabel(e.at), events: [e] });
    }
    return out;
  }, [visible]);

  const lastMovement = movements[0] ?? null;
  const lastReceipt = useMemo(
    () =>
      [...batches].sort(
        (a, b) =>
          parseTimestamp(b.receivedDate).getTime() -
          parseTimestamp(a.receivedDate).getTime(),
      )[0] ?? null,
    [batches],
  );
  const lastCount = useMemo(
    () =>
      movements.find(
        (m) =>
          m.movementType === "ADJUSTMENT" || m.referenceType === "ADJUSTMENT",
      ) ?? null,
    [movements],
  );
  const lastEdit = auditEntries[0] ?? null;

  const upcomingExpiries = useMemo(() => {
    const now = Date.now();
    const horizon = now + 30 * 86400000;
    return batches
      .filter(
        (b) =>
          b.quantityOnHand > 0 &&
          b.expiryDate != null &&
          parseTimestamp(b.expiryDate).getTime() > now &&
          parseTimestamp(b.expiryDate).getTime() <= horizon,
      )
      .sort(
        (a, b) =>
          parseTimestamp(a.expiryDate!).getTime() -
          parseTimestamp(b.expiryDate!).getTime(),
      );
  }, [batches]);

  return (
    <div className="space-y-4">
      {/* ── Last-seen strip — the four questions asked of any stock item ── */}
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Activity className="h-3 w-3" />}
          label="Last movement"
          value={lastMovement ? dateLabel(lastMovement.occurredAt) : "—"}
          delta={
            lastMovement
              ? movementTypeLabel(lastMovement, signedQuantity(lastMovement))
              : "No movements recorded"
          }
          deltaTone="neutral"
        />
        <KpiCard
          icon={<PackagePlus className="h-3 w-3" />}
          label="Last received"
          value={lastReceipt ? dateLabel(lastReceipt.receivedDate) : "—"}
          delta={
            lastReceipt
              ? `Batch ${lastReceipt.batchNumber}`
              : "No batches received"
          }
          deltaTone="neutral"
        />
        <KpiCard
          icon={<ClipboardCheck className="h-3 w-3" />}
          label="Last counted"
          value={lastCount ? dateLabel(lastCount.occurredAt) : "—"}
          delta={
            lastCount
              ? `${signedQty(signedQuantity(lastCount))} ${lastCount.unitAbbreviation || ""}`.trim()
              : "Never counted"
          }
          deltaTone={
            lastCount
              ? signedQuantity(lastCount) >= 0
                ? "pos"
                : "neg"
              : "neutral"
          }
        />
        <KpiCard
          icon={<PencilLine className="h-3 w-3" />}
          label="Last edited"
          value={lastEdit ? dateLabel(lastEdit.createdAt) : "—"}
          delta={
            lastEdit
              ? `${AUDIT_ACTION_LABELS[lastEdit.action] ?? lastEdit.action}${
                  lastEdit.staffName ? ` by ${lastEdit.staffName}` : ""
                }`
              : "No recorded edits"
          }
          deltaTone="neutral"
        />
      </KpiStrip>

      {/* ── Expiries still ahead — future-dated, so they can't sit on a rail
              that reads backwards from today. ─────────────────────────── */}
      {upcomingExpiries.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/25">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-amber-800 dark:text-amber-300">
            <CalendarClock className="h-3.5 w-3.5" />
            {upcomingExpiries.length} batch
            {upcomingExpiries.length === 1 ? "" : "es"} expiring in the next 30
            days
          </div>
          <ul className="mt-2 space-y-1">
            {upcomingExpiries.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-baseline gap-x-2 text-[12px] text-amber-900 dark:text-amber-200/90"
              >
                <Link
                  href={`/stock-batches/${b.id}`}
                  className="font-medium hover:underline"
                >
                  {b.batchNumber}
                </Link>
                <span className="font-mono text-[11px]">
                  {qty(b.quantityOnHand)} {b.unitAbbreviation || b.unitName}
                </span>
                <span className="opacity-80">
                  expires {dateLabel(b.expiryDate!)}
                </span>
                {multiVariant && (
                  <span className="opacity-70">· {b.variantName}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* ── Lane filter ──────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
              {LANES.map((l) => {
                const count = laneCounts[l.key] ?? 0;
                const isActive = lane === l.key;
                return (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => {
                      setLane(l.key);
                      setLimit(PAGE_STEP);
                    }}
                    disabled={count === 0 && l.key !== "all"}
                    className={cn(
                      "whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                      isActive
                        ? "bg-background font-medium text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                      count === 0 && l.key !== "all" && "opacity-40",
                    )}
                  >
                    {l.label}
                    <span className="ml-1.5 font-mono text-[10px] opacity-70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            {onOpenLedger && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={onOpenLedger}
              >
                Open full ledger
              </Button>
            )}
          </div>

          {movementsTruncated && lane !== "admin" && (
            <p className="text-[11px] text-muted-foreground">
              Movements on this rail are the most recent{" "}
              {movements.length.toLocaleString()} entries across all variants.
              The Movements tab holds the complete, filterable ledger with
              balance checks.
            </p>
          )}

          {/* ── Rail ─────────────────────────────────────────────────── */}
          {visible.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {events.length === 0
                  ? "Nothing has happened to this stock item yet. Receipts, sales, counts, batch changes and edits all land here."
                  : "No events in this lane."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.key}>
                  <div className="mb-3 flex items-baseline gap-2 border-b border-line pb-1.5">
                    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {g.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted-2">
                      {g.events.length}{" "}
                      {g.events.length === 1 ? "event" : "events"}
                    </span>
                    <DayNet events={g.events} />
                  </div>
                  <div className="flex flex-col">
                    {g.events.map((e, i) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        last={i === g.events.length - 1}
                        currency={currency}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length > visible.length && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLimit((n) => n + PAGE_STEP)}
              >
                Show older
                <span className="ml-1.5 font-mono text-[10.5px] text-muted-foreground">
                  {(filtered.length - visible.length).toLocaleString()} more
                </span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Net quantity moved on a day — the one number a day header can carry. */
function DayNet({ events }: { events: ActivityEvent[] }) {
  const net = events
    .filter((e) => e.lane === "movement" && e.quantity != null)
    .reduce((s, e) => s + (e.quantity ?? 0), 0);
  if (net === 0) return null;
  return (
    <span
      className={cn(
        "ml-auto font-mono text-[10.5px] font-semibold",
        net > 0 ? "text-pos" : "text-neg",
      )}
    >
      net {signedQty(net)}
    </span>
  );
}

function EventRow({
  event: e,
  last,
  currency,
}: {
  event: ActivityEvent;
  last: boolean;
  currency: string;
}) {
  const Icon = e.icon;
  const time = timeLabel(e.at);
  const hasBalance =
    e.balance != null && (e.balance.before != null || e.balance.after != null);

  return (
    <div className="grid grid-cols-[auto_1fr] gap-3.5 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full ring-4 ring-card",
            TONE_CHIP[e.tone],
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        {!last && <span className="mt-1 w-0.5 flex-1 bg-line-2" />}
      </div>

      <div className="min-w-0 pb-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <b className="text-[13.5px] font-semibold tracking-tight text-ink">
              {e.title}
            </b>
            {e.scope && (
              <span className="text-[11.5px] text-ink-3">{e.scope}</span>
            )}
            {time && (
              <time className="font-mono text-[10.5px] text-muted-foreground">
                {time}
              </time>
            )}
          </div>
          {e.quantity != null && (
            <span
              className={cn(
                "whitespace-nowrap font-mono text-[12.5px] font-semibold",
                e.quantity > 0
                  ? "text-pos"
                  : e.quantity < 0
                    ? "text-neg"
                    : "text-ink-3",
              )}
            >
              {signedQty(e.quantity)}
              {e.unit ? ` ${e.unit}` : ""}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-3">
          {e.source &&
            (e.source.href ? (
              <Link
                href={e.source.href}
                className="text-primary hover:underline"
              >
                {e.source.label}
              </Link>
            ) : (
              <span>{e.source.label}</span>
            ))}
          {hasBalance && (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              bal {e.balance!.before != null ? qty(e.balance!.before) : "—"} →{" "}
              {e.balance!.after != null ? qty(e.balance!.after) : "—"}
            </span>
          )}
          {e.money && (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {e.money.label}{" "}
              <Money
                amount={e.money.amount}
                currency={e.money.currency || currency}
              />
            </span>
          )}
          {e.actor && (
            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-muted-foreground">
              <User className="h-3 w-3" />
              {e.actor}
            </span>
          )}
        </div>

        {e.note && (
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[12px] text-ink-3">
            {e.note}
          </p>
        )}

        {e.chips && e.chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {e.chips.map((c) => (
              <span
                key={c}
                className="rounded bg-surface px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
