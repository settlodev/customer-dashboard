"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Clock,
  Coins,
  CreditCard,
  History,
  Info,
  Hash,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  Sparkles,
  StickyNote,
  Tag,
  Timer,
  Undo2,
  User,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FulfillmentStatus,
  FULFILLMENT_STATUS_LABELS,
  OrderDetail,
  OrderDetailItem,
  OrderDetailTimelineEvent,
  OrderSource,
  OrderStatus,
  OrderType,
  ORDER_SOURCE_LABELS,
  ORDER_TYPE_LABELS,
} from "@/types/orders/type";

// The redesign ("Workspace" direction) keeps a persistent money-summary
// rail on the left — net total / profitability / ledger — while the order's
// detail lives behind segmented drill-down tabs on the right. Tabs reuse the
// dashboard's date-filter pill control so they read as one system.

type TabKey = "overview" | "items" | "payments" | "timeline";

// ─── formatting ──────────────────────────────────────────────────────

const formatNumber = (value: number | null | undefined, fractionDigits = 0) => {
  if (value === null || value === undefined) return "—";
  return Intl.NumberFormat("en", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

// `dateStyle` + `timeStyle` together insert a locale connector ("at") whose
// wording differs between the Node (SSR) and browser ICU builds, which trips
// React hydration. Format the date and time parts explicitly and join them
// ourselves so the server and client always emit the same string.
const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${DATE_FMT.format(date)}, ${TIME_FMT.format(date)}`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FMT.format(date);
};

const titleCase = (s?: string | null) =>
  s
    ? s
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

const clamp = (n: number) => Math.max(0, Math.min(100, n));

const totalRefunded = (o: OrderDetail) =>
  (o.refunds ?? []).reduce((sum, r) => sum + (r.refundAmount ?? 0), 0);

const sumItemsNet = (o: OrderDetail) =>
  (o.items ?? []).reduce((sum, it) => sum + (it.netAmount ?? 0), 0);

const typeLabel = (o: OrderDetail) =>
  ORDER_TYPE_LABELS[(o.orderType ?? "").toUpperCase() as OrderType] ??
  titleCase(o.orderType) ??
  titleCase(o.servingType);

const sourceLabel = (o: OrderDetail) =>
  ORDER_SOURCE_LABELS[(o.orderSource ?? "").toUpperCase() as OrderSource] ??
  titleCase(o.orderSource) ??
  titleCase(o.platformType);

const fulfillmentLabel = (o: OrderDetail) =>
  FULFILLMENT_STATUS_LABELS[
    (o.fulfillmentStatus ?? "").toUpperCase() as FulfillmentStatus
  ] ?? titleCase(o.fulfillmentStatus);

// ─── tones ───────────────────────────────────────────────────────────

type Tone = "pos" | "neg" | "warn" | "info" | "muted";

// Semantic chip colours. pos/neg/warn map onto the dashboard's status
// tokens (theme-aware); "info" is the design's blue for open / in-progress
// states — it follows the same convention the orders list already uses.
const CHIP: Record<Tone, string> = {
  pos: "bg-pos-tint text-pos",
  neg: "bg-neg-tint text-neg",
  warn: "bg-warn-tint text-warn",
  info: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  muted: "bg-canvas text-ink-3",
};

// Fixed hues for chips rendered on the always-dark money hero, where the
// translucent tint classes above would wash out.
const TONE_HEX: Record<Tone, string> = {
  pos: "#12B981",
  warn: "#E0A43B",
  neg: "#EF7457",
  info: "#5B9BFF",
  muted: "rgba(255,255,255,0.5)",
};

const paymentToneOf = (p?: string | null): Tone => {
  switch ((p ?? "").toUpperCase()) {
    case "PAID":
      return "pos";
    case "PARTIAL":
      return "warn";
    case "NOT_PAID":
      return "neg";
    default:
      return "muted";
  }
};

const paymentLabelOf = (o: OrderDetail): string | null => {
  if (o.orderStatus === OrderStatus.CANCELLED) return "Voided";
  switch ((o.paymentStatus ?? "").toUpperCase()) {
    case "PAID":
      return "Paid";
    case "PARTIAL":
      return "Partly paid";
    case "NOT_PAID":
      return "Unpaid";
    default:
      return titleCase(o.paymentStatus);
  }
};

const paymentToneForOrder = (o: OrderDetail): Tone =>
  o.orderStatus === OrderStatus.CANCELLED
    ? "muted"
    : paymentToneOf(o.paymentStatus);

const FULFILLMENT_TONE: Record<string, Tone> = {
  COMPLETED: "pos",
  SERVED: "pos",
  READY: "pos",
  DELIVERED: "pos",
  PICKED_UP: "pos",
  CONFIRMED: "pos",
  PREPARING: "warn",
  AWAITING_PICKUP: "warn",
  PENDING_PAYMENT: "warn",
  IN_TRANSIT: "info",
  DRAFT: "muted",
};
const fulfillmentToneOf = (f?: string | null): Tone =>
  FULFILLMENT_TONE[(f ?? "").toUpperCase()] ?? "muted";

const prepToneOf = (p?: string | null): Tone => {
  switch ((p ?? "").toUpperCase()) {
    case "SERVED":
    case "COMPLETED":
    case "READY":
    case "DONE":
      return "pos";
    case "PREPARING":
    case "IN_PROGRESS":
      return "warn";
    case "VOIDED":
    case "CANCELLED":
      return "neg";
    default:
      return "muted";
  }
};

const txnToneOf = (s?: string | null): Tone => {
  const v = (s ?? "").toUpperCase();
  if (["PAID", "CONFIRMED", "SUCCESS", "COMPLETED", "APPROVED"].includes(v))
    return "pos";
  if (["FAILED", "DECLINED", "REVERSED", "CANCELLED", "REFUNDED"].includes(v))
    return "neg";
  if (["PENDING", "PROCESSING"].includes(v)) return "warn";
  return "muted";
};

// ─── primitives ──────────────────────────────────────────────────────

function StatusPill({
  tone,
  dot,
  children,
}: {
  tone: Tone;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none",
        CHIP[tone],
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

function StatusTag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em]",
        CHIP[tone],
      )}
    >
      {children}
    </span>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-primary/10 text-primary-dark dark:text-primary">
      {children}
    </span>
  );
}

function CountChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-3">
      {children}
    </span>
  );
}

function RailCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3.5 flex items-center gap-2.5">
        <IconChip>{icon}</IconChip>
        <span className="text-[13.5px] font-semibold tracking-tight text-ink">
          {title}
        </span>
      </div>
      {children}
    </Card>
  );
}

function PanelCard({
  icon,
  title,
  count,
  flush,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-2.5 px-5 pt-4",
          flush ? "pb-3" : "pb-0",
        )}
      >
        <IconChip>{icon}</IconChip>
        <span className="text-[14px] font-semibold tracking-tight text-ink">
          {title}
        </span>
        {count != null && <CountChip>{count}</CountChip>}
      </div>
      <div className={flush ? "" : "px-5 pb-5 pt-3.5"}>{children}</div>
    </Card>
  );
}

// ─── money rail ──────────────────────────────────────────────────────

function MoneyHero({
  order,
  currency,
}: {
  order: OrderDetail;
  currency: string;
}) {
  const cancelled = order.orderStatus === OrderStatus.CANCELLED;
  const net = order.netAmount ?? order.grossAmount ?? 0;
  const paid = order.paidAmount ?? 0;
  const unpaid = order.unpaidAmount ?? 0;
  const hasDue = !cancelled && unpaid > 0;
  const pct = net > 0 ? clamp((paid / net) * 100) : cancelled ? 0 : 100;

  const label = cancelled
    ? "Order total"
    : hasDue
      ? "Balance due"
      : "Net total";
  const big = cancelled ? "0" : hasDue ? formatNumber(unpaid) : formatNumber(net);
  const payLabel = paymentLabelOf(order);
  const payTone = paymentToneForOrder(order);

  return (
    // Permanently dark accent card (fixed colours in both themes — like the
    // marketing footer), so the order's headline number always pops.
    <div
      className="relative overflow-hidden rounded-xl border border-[#0C2523] p-5 text-white shadow-sm"
      style={{ background: "radial-gradient(120% 140% at 85% 0%, #173B39, #0C2523)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 80% at 92% -5%, rgba(235,127,68,0.16), transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/60">
            {label}
          </div>
          {payLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: TONE_HEX[payTone] }}
              />
              {payLabel}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2 text-[40px] font-bold leading-none tracking-[-0.035em]">
          {big}
          <span className="font-mono text-[15px] font-semibold tracking-[0.02em] text-white/60">
            {currency}
          </span>
        </div>

        {cancelled ? (
          <div className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-semibold">
            <span className="font-medium text-white/60">Voided value</span>
            <span className="tabular-nums">
              {formatNumber(sumItemsNet(order))} {currency}
            </span>
          </div>
        ) : (
          <>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: hasDue ? "#E0A43B" : "#12B981",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10.5px] text-white/70">
              <span className="font-semibold text-white">
                Paid {formatNumber(paid)}
              </span>
              <span className="font-semibold text-white">
                {hasDue ? `Due ${formatNumber(unpaid)}` : "Settled in full"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProfitSplit({ order }: { order: OrderDetail }) {
  const cost = order.totalCostPrice ?? 0;
  const profit = order.grossProfit ?? 0;
  const net = order.netAmount ?? 0;

  if (!cost || !net) {
    return (
      <p className="py-1 font-mono text-[11.5px] text-muted-foreground">
        No profit recorded —{" "}
        {order.orderStatus === OrderStatus.CANCELLED
          ? "order cancelled"
          : "awaiting settlement"}
        .
      </p>
    );
  }

  const base = cost + profit;
  const costPct = clamp(base > 0 ? (cost / base) * 100 : 0);
  const profitPct = clamp(100 - costPct);
  const margin = order.profitMargin;
  const refunded = totalRefunded(order);

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2.5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Cost vs profit{refunded > 0 ? " · after refund" : ""}
        </span>
        {margin != null && (
          <span
            className={cn(
              "text-[13px] font-bold tabular-nums",
              margin >= 0 ? "text-pos" : "text-neg",
            )}
          >
            {formatNumber(margin, 1)}% margin
          </span>
        )}
      </div>
      <div className="flex h-[26px] overflow-hidden rounded-md bg-canvas">
        <span
          className="flex items-center overflow-hidden whitespace-nowrap px-2.5 font-mono text-[10.5px] font-semibold text-white"
          style={{ width: `${costPct}%`, background: "#8A8A85" }}
        >
          Cost
        </span>
        <span
          className="flex items-center overflow-hidden whitespace-nowrap px-2.5 font-mono text-[10.5px] font-semibold text-white"
          style={{ width: `${profitPct}%`, background: "#0E8B5F" }}
        >
          Profit
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendItem color="#8A8A85" label="Cost" value={formatNumber(cost)} />
        <LegendItem
          color="#0E8B5F"
          label="Gross profit"
          value={formatNumber(profit)}
        />
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-ink-3">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
        style={{ background: color }}
      />
      {label}{" "}
      <b className="font-semibold tabular-nums text-ink">{value}</b>
    </div>
  );
}

function LRow({
  label,
  value,
  tone,
  strong,
  dim,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "pos" | "neg";
  strong?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-2.5 text-[13px]",
        strong
          ? "mt-0.5 border-t border-line-2 pt-3"
          : "border-b border-dashed border-line last:border-b-0",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-2",
          dim ? "text-muted-2" : strong ? "font-semibold text-ink" : "text-ink-3",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums font-semibold",
          strong && "text-[16px] font-bold",
          tone === "pos"
            ? "text-pos"
            : tone === "neg"
              ? "text-neg"
              : dim
                ? "font-medium text-muted-2"
                : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Ledger({ order }: { order: OrderDetail }) {
  const discount = order.discountAmount ?? 0;
  const tax = order.taxAmount ?? 0;
  const charges = order.customerChargesTotal ?? 0;
  const tip = order.totalTipAmount ?? 0;
  const paid = order.paidAmount ?? 0;
  const unpaid = order.unpaidAmount ?? 0;
  const refunded = totalRefunded(order);

  return (
    <div className="flex flex-col">
      <LRow label="Gross" value={formatNumber(order.grossAmount)} />
      <LRow
        label="Discount"
        value={discount > 0 ? `−${formatNumber(discount)}` : "—"}
        dim={discount === 0}
      />
      <LRow label="Tax" value={tax > 0 ? formatNumber(tax) : "—"} dim={tax === 0} />
      {charges > 0 && (
        <LRow label="Customer charges" value={formatNumber(charges)} />
      )}
      {tip > 0 && <LRow label="Tip" value={formatNumber(tip)} />}
      <LRow label="Net total" value={formatNumber(order.netAmount)} strong />
      <LRow
        label="Paid"
        value={paid > 0 ? formatNumber(paid) : "—"}
        tone={paid > 0 ? "pos" : undefined}
        dim={paid === 0}
      />
      <LRow
        label="Unpaid"
        value={unpaid > 0 ? formatNumber(unpaid) : "—"}
        tone={unpaid > 0 ? "neg" : undefined}
        dim={unpaid === 0}
      />
      {refunded > 0 && (
        <LRow label="Refunded" value={`−${formatNumber(refunded)}`} tone="neg" />
      )}
      {refunded > 0 && (
        <LRow
          label="Net received"
          value={formatNumber(Math.max(0, paid - refunded))}
          strong
        />
      )}
    </div>
  );
}

// ─── segmented tabs (reuses the date-filter pill control) ────────────

function SegTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: { id: TabKey; label: string; icon: typeof Receipt; count?: number }[];
  active: TabKey;
  onSelect: (id: TabKey) => void;
}) {
  return (
    <div className="overflow-x-auto pb-0.5">
      <div
        role="tablist"
        className="inline-flex items-center gap-0.5 rounded-[10px] border border-line-2 bg-card p-[3px]"
      >
        {tabs.map((tb) => {
          const on = active === tb.id;
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onSelect(tb.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                on
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", on ? "opacity-100" : "opacity-70")} />
              {tb.label}
              {tb.count != null && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none",
                    on ? "bg-white/20 text-white" : "bg-canvas text-ink-3",
                  )}
                >
                  {tb.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── facts grid ──────────────────────────────────────────────────────

type Fact = {
  label: string;
  icon?: React.ReactNode;
  value?: React.ReactNode;
  mono?: boolean;
  empty?: boolean;
  badge?: React.ReactNode;
};

const isBlank = (v: unknown) =>
  v == null || (typeof v === "string" && v.trim() === "");

function fact(
  label: string,
  value: React.ReactNode,
  icon?: React.ReactNode,
  opts?: { mono?: boolean },
): Fact {
  const empty = isBlank(value);
  return {
    label,
    icon,
    value: empty ? "—" : value,
    mono: !!opts?.mono && !empty,
    empty,
  };
}

function FactGrid({ rows, cols }: { rows: Fact[]; cols: 1 | 2 }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line",
        cols === 2 && "sm:grid-cols-2",
      )}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex min-h-[52px] items-center justify-between gap-3 bg-card px-4 py-3"
        >
          <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {r.icon && <span className="opacity-70">{r.icon}</span>}
            {r.label}
          </span>
          {r.badge ? (
            r.badge
          ) : (
            <span
              className={cn(
                "min-w-0 break-words text-right text-[13px] font-semibold tracking-tight",
                r.mono && "font-mono text-[11.5px] font-medium",
                r.empty ? "font-medium text-muted-2" : "text-ink",
              )}
            >
              {r.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── tables + empty state ────────────────────────────────────────────

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-line bg-canvas px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground",
        right ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-11 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-canvas text-muted-2">
        {icon}
      </span>
      <div className="text-[14px] font-semibold text-ink-2">{title}</div>
      {sub && <p className="max-w-[34ch] text-[12.5px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ItemsTable({
  rows,
  muted,
  voided,
}: {
  rows: OrderDetailItem[];
  muted?: boolean;
  voided?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <Th>Item</Th>
            <Th right>Qty</Th>
            <Th right>Unit</Th>
            <Th right>Discount</Th>
            <Th right>Tax</Th>
            <Th right>Net</Th>
            <Th>Prep</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((it) => {
            const isVoid =
              voided || (it.preparationStatus ?? "").toUpperCase() === "VOIDED";
            const hasDiscount = !!it.discountAmount && it.discountAmount > 0;
            const hasTax = !!it.taxAmount && it.taxAmount > 0;
            const taxNote = [
              it.taxRate ? `${formatNumber(it.taxRate)}%` : null,
              it.taxTypeCode || null,
              it.taxInclusive === true
                ? "incl."
                : it.taxInclusive === false
                  ? "excl."
                  : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <tr key={it.id as string} className={cn(muted && "text-muted-foreground")}>
                <td className="px-3.5 py-3.5 align-top">
                  <div
                    className={cn(
                      "text-[13.5px] font-semibold tracking-tight",
                      isVoid
                        ? "text-muted-2 line-through decoration-muted-2"
                        : "text-ink",
                    )}
                  >
                    {it.name}
                  </div>
                  {it.staffName && (
                    <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                      by {it.staffName}
                    </div>
                  )}
                  {it.specialInstructions && (
                    <div className="mt-0.5 text-[11px] italic text-muted-foreground">
                      {it.specialInstructions}
                    </div>
                  )}
                </td>
                <td className="px-3.5 py-3.5 text-right align-top font-semibold tabular-nums">
                  {formatNumber(it.quantity)}
                </td>
                <td className="px-3.5 py-3.5 text-right align-top font-semibold tabular-nums">
                  {formatNumber(it.unitPrice)}
                </td>
                <td
                  className={cn(
                    "px-3.5 py-3.5 text-right align-top tabular-nums",
                    hasDiscount ? "font-semibold text-ink" : "font-medium text-muted-2",
                  )}
                >
                  {hasDiscount ? `−${formatNumber(it.discountAmount)}` : "—"}
                </td>
                <td className="px-3.5 py-3.5 text-right align-top">
                  {hasTax ? (
                    <div className="flex flex-col items-end">
                      <span className="font-semibold tabular-nums text-ink">
                        {formatNumber(it.taxAmount)}
                      </span>
                      {taxNote && (
                        <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {taxNote}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="font-medium text-muted-2">—</span>
                  )}
                </td>
                <td className="px-3.5 py-3.5 text-right align-top font-semibold tabular-nums text-ink">
                  {formatNumber(it.netAmount)}
                </td>
                <td className="px-3.5 py-3.5 align-top">
                  {it.preparationStatus ? (
                    <StatusTag tone={prepToneOf(it.preparationStatus)}>
                      {titleCase(it.preparationStatus)}
                    </StatusTag>
                  ) : (
                    <span className="text-muted-2">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TxnTable({ order }: { order: OrderDetail }) {
  const txs = order.transactions ?? [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <Th>Method</Th>
            <Th right>Amount</Th>
            <Th right>Tip</Th>
            <Th>Status</Th>
            <Th right>When</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {txs.map((tx) => {
            const neg = tx.amount < 0;
            return (
              <tr key={tx.id as string}>
                <td className="px-3.5 py-3.5">
                  <div className="font-semibold text-ink">
                    {tx.paymentMethodName ?? "—"}
                  </div>
                  {neg && (
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      Refund
                    </div>
                  )}
                </td>
                <td
                  className={cn(
                    "px-3.5 py-3.5 text-right font-semibold tabular-nums",
                    neg ? "text-neg" : "text-ink",
                  )}
                >
                  {neg
                    ? `−${formatNumber(Math.abs(tx.amount))}`
                    : formatNumber(tx.amount)}
                </td>
                <td className="px-3.5 py-3.5 text-right font-medium tabular-nums text-muted-2">
                  {tx.tipAmount && tx.tipAmount > 0 ? formatNumber(tx.tipAmount) : "—"}
                </td>
                <td className="px-3.5 py-3.5">
                  {tx.status ? (
                    <StatusTag tone={txnToneOf(tx.status)}>{tx.status}</StatusTag>
                  ) : (
                    <span className="text-muted-2">—</span>
                  )}
                </td>
                <td className="px-3.5 py-3.5 text-right font-mono text-[11px] font-medium text-muted-foreground">
                  {formatDateTime(tx.createdAt) ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RefundsList({
  order,
  currency,
}: {
  order: OrderDetail;
  currency: string;
}) {
  const refunds = order.refunds ?? [];
  const items = order.items ?? [];
  return (
    <div className="flex flex-col gap-3.5">
      {refunds.map((r) => {
        const item = items.find((i) => i.id === r.orderItemId);
        const itemLabel = item
          ? `${item.name}${r.quantity ? ` × ${formatNumber(r.quantity)}` : ""}`
          : r.quantity
            ? `${formatNumber(r.quantity)} item(s)`
            : null;
        const facts: Fact[] = [
          fact("Item", itemLabel, <Package className="h-3 w-3" />),
          fact(
            "Quantity",
            r.quantity != null ? formatNumber(r.quantity) : null,
            <Hash className="h-3 w-3" />,
          ),
          fact("When", formatDateTime(r.createdAt), <Clock className="h-3 w-3" />, {
            mono: true,
          }),
          fact("Reason", r.reason, <Info className="h-3 w-3" />),
        ];
        return (
          <div
            key={r.id as string}
            className="rounded-xl border border-line bg-canvas p-5"
          >
            <div className="flex items-center justify-between gap-3.5">
              <div className="flex items-baseline gap-2 text-[26px] font-bold tracking-[-0.03em] text-neg">
                −{formatNumber(r.refundAmount)}
                <span className="font-mono text-[13px] font-semibold text-muted-foreground">
                  {currency}
                </span>
              </div>
              <StatusTag tone="neg">Refunded</StatusTag>
            </div>
            <div className="mt-3.5">
              <FactGrid rows={facts} cols={2} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Timeline({ events }: { events: OrderDetailTimelineEvent[] }) {
  // Newest-first so the latest action is at the top of the rail.
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return (
    <div className="flex flex-col">
      {sorted.map((e, i) => {
        const neg = /CANCEL|REFUND|VOID/i.test(e.event);
        const last = i === sorted.length - 1;
        return (
          <div
            key={`${e.event}-${e.timestamp}-${i}`}
            className="grid grid-cols-[auto_1fr] gap-3.5 pb-5 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-card",
                  neg ? "bg-neg" : "bg-primary",
                )}
              />
              {!last && <span className="mt-1 w-0.5 flex-1 bg-line-2" />}
            </div>
            <div className="pb-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <b className="text-[13.5px] font-semibold tracking-tight text-ink">
                  {humanizeEvent(e.event)}
                </b>
                <time className="font-mono text-[10.5px] text-muted-foreground">
                  {formatDateTime(e.timestamp) ?? e.timestamp}
                </time>
              </div>
              {e.message && (
                <div className="mt-1 text-[12.5px] text-ink-3">{e.message}</div>
              )}
              {e.performedByName && (
                <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                  by {e.performedByName}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── tab panels ──────────────────────────────────────────────────────

function OverviewPanel({ order }: { order: OrderDetail }) {
  const fulfil = fulfillmentLabel(order);
  const closed = formatDateTime(order.closedDate);

  const orderFacts: Fact[] = [
    fact("Order #", order.orderNumber, <ClipboardList className="h-3 w-3" />, {
      mono: true,
    }),
    fact("Type", typeLabel(order), <Sparkles className="h-3 w-3" />),
    fact("Source", sourceLabel(order), <MapPin className="h-3 w-3" />),
    fulfil
      ? {
          label: "Fulfillment",
          icon: <Activity className="h-3 w-3" />,
          badge: (
            <StatusPill tone={fulfillmentToneOf(order.fulfillmentStatus)}>
              {fulfil}
            </StatusPill>
          ),
        }
      : fact("Fulfillment", null, <Activity className="h-3 w-3" />),
    fact("Business date", formatDate(order.businessDate), <CalendarDays className="h-3 w-3" />),
    fact("Opened", formatDateTime(order.openedDate), <Clock className="h-3 w-3" />, {
      mono: true,
    }),
    {
      label: "Duration",
      icon: <Timer className="h-3 w-3" />,
      value: (
        <LiveDuration startedAt={order.openedDate} endedAt={order.closedDate} />
      ),
    },
    closed
      ? fact("Closed", closed, <Clock className="h-3 w-3" />, { mono: true })
      : { label: "Closed", icon: <Clock className="h-3 w-3" />, value: "Not closed", empty: true },
  ];

  const peopleFacts: Fact[] = [
    fact("Started by", order.startedBy?.name, <User className="h-3 w-3" />),
    fact("Assigned to", order.assignedTo?.name, <User className="h-3 w-3" />),
    fact("Closed by", order.finishedBy?.name, <User className="h-3 w-3" />),
    fact("Customer", order.customer?.name ?? "Walk-in", <Users className="h-3 w-3" />),
    fact("Phone", order.customer?.phone, <Phone className="h-3 w-3" />, {
      mono: true,
    }),
    fact("Email", order.customer?.email, <Mail className="h-3 w-3" />, {
      mono: true,
    }),
  ];

  return (
    <div className="space-y-3.5">
      <PanelCard icon={<Receipt className="h-3.5 w-3.5" />} title="Order details">
        <FactGrid rows={orderFacts} cols={2} />
        {order.slug && (
          <div className="mt-3 flex items-center gap-2 font-mono text-[10.5px] text-muted-2">
            <Tag className="h-3 w-3" />
            {order.slug}
          </div>
        )}
      </PanelCard>

      <PanelCard icon={<Users className="h-3.5 w-3.5" />} title="People & customer">
        <FactGrid rows={peopleFacts} cols={2} />
      </PanelCard>

      {order.notes && (
        <PanelCard icon={<StickyNote className="h-3.5 w-3.5" />} title="Notes">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
            {order.notes}
          </p>
        </PanelCard>
      )}
    </div>
  );
}

function ItemsPanel({ order }: { order: OrderDetail }) {
  const items = order.items ?? [];
  const removed = order.removedItems ?? [];
  const cancelled = order.orderStatus === OrderStatus.CANCELLED;

  return (
    <div className="space-y-3.5">
      <PanelCard
        icon={<Package className="h-3.5 w-3.5" />}
        title="Items"
        count={items.length}
        flush={items.length > 0}
      >
        {items.length ? (
          <ItemsTable rows={items} voided={cancelled} />
        ) : (
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title="No items"
            sub="No items were recorded on this order."
          />
        )}
      </PanelCard>

      {removed.length > 0 && (
        <PanelCard
          icon={<Undo2 className="h-3.5 w-3.5" />}
          title="Removed items"
          count={removed.length}
          flush
        >
          <ItemsTable rows={removed} muted voided />
        </PanelCard>
      )}
    </div>
  );
}

function PaymentsPanel({
  order,
  currency,
}: {
  order: OrderDetail;
  currency: string;
}) {
  const txs = order.transactions ?? [];
  const refunds = order.refunds ?? [];

  return (
    <div className="space-y-3.5">
      <PanelCard
        icon={<CreditCard className="h-3.5 w-3.5" />}
        title="Transactions"
        count={txs.length || undefined}
        flush={txs.length > 0}
      >
        {txs.length ? (
          <TxnTable order={order} />
        ) : (
          <EmptyState
            icon={<CreditCard className="h-5 w-5" />}
            title="No payments yet"
            sub="This order is still open — payments will appear here once taken."
          />
        )}
      </PanelCard>

      <PanelCard
        icon={<Undo2 className="h-3.5 w-3.5" />}
        title="Refunds"
        count={refunds.length || undefined}
      >
        {refunds.length ? (
          <RefundsList order={order} currency={currency} />
        ) : (
          <EmptyState
            icon={<Undo2 className="h-5 w-5" />}
            title="No refunds issued"
            sub="Nothing has been refunded on this order."
          />
        )}
      </PanelCard>
    </div>
  );
}

function TimelinePanel({ order }: { order: OrderDetail }) {
  const events = order.timeline ?? [];
  return (
    <PanelCard
      icon={<History className="h-3.5 w-3.5" />}
      title="Timeline"
      count={events.length || undefined}
    >
      {events.length ? (
        <Timeline events={events} />
      ) : (
        <EmptyState
          icon={<History className="h-5 w-5" />}
          title="No timeline yet"
          sub="No events have been recorded for this order yet."
        />
      )}
    </PanelCard>
  );
}

// ─── shell ───────────────────────────────────────────────────────────

export function OrderDetailView({
  order,
  currency = "TZS",
}: {
  order: OrderDetail;
  currency?: string;
}) {
  const [tab, setTab] = useState<TabKey>("overview");

  const paymentEntries =
    (order.transactions?.length ?? 0) + (order.refunds?.length ?? 0);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Receipt },
    {
      id: "items" as const,
      label: "Items",
      icon: Package,
      count: order.itemCount || order.items?.length || undefined,
    },
    {
      id: "payments" as const,
      label: "Payments",
      icon: CreditCard,
      count: paymentEntries || undefined,
    },
    {
      id: "timeline" as const,
      label: "Timeline",
      icon: History,
      count: order.timeline?.length || undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
        <MoneyHero order={order} currency={currency} />
        <RailCard icon={<Sparkles className="h-3.5 w-3.5" />} title="Profitability">
          <ProfitSplit order={order} />
        </RailCard>
        <RailCard icon={<Coins className="h-3.5 w-3.5" />} title="Money breakdown">
          <Ledger order={order} />
        </RailCard>
      </aside>

      <main className="flex min-w-0 flex-col gap-3.5">
        <SegTabs tabs={tabs} active={tab} onSelect={setTab} />
        <div>
          {tab === "overview" && <OverviewPanel order={order} />}
          {tab === "items" && <ItemsPanel order={order} />}
          {tab === "payments" && (
            <PaymentsPanel order={order} currency={currency} />
          )}
          {tab === "timeline" && <TimelinePanel order={order} />}
        </div>
      </main>
    </div>
  );
}

// ─── live duration + event humanizer ─────────────────────────────────

const HUMANIZED_EVENTS: Record<string, string> = {
  ORDER_OPEN: "Order opened",
  ORDER_OPENED: "Order opened",
  ORDER_CLOSE: "Order closed",
  ORDER_CLOSED: "Order closed",
  ORDER_CANCEL: "Order cancelled",
  ORDER_CANCELLED: "Order cancelled",
  ORDER_REOPEN: "Order reopened",
  ORDER_REOPENED: "Order reopened",
  ORDER_ITEM_ADD: "Item added",
  ORDER_ITEM_ADDED: "Item added",
  ORDER_ITEM_REMOVE: "Item removed",
  ORDER_ITEM_VOIDED: "Item voided",
  ORDER_ITEM_REFUND: "Item refunded",
  ORDER_DISCOUNT_APPLIED: "Discount applied",
  ORDER_DISCOUNT_REMOVED: "Discount removed",
  ORDER_TRANSACTION_ADD: "Payment added",
  ORDER_TRANSACTION_ADDED: "Payment added",
  ORDER_LOCKED: "Order locked",
  ORDER_UNLOCKED: "Order unlocked",
  ORDER_TRANSFER: "Order transferred",
  ORDER_TRANSFERRED: "Order transferred",
  ORDER_ASSIGNED: "Order assigned",
};

function humanizeEvent(event: string): string {
  return (
    HUMANIZED_EVENTS[event] ??
    event
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase())
  );
}

function LiveDuration({
  startedAt,
  endedAt,
}: {
  startedAt: string;
  endedAt?: string | null;
}) {
  const startMs = new Date(startedAt).getTime();
  const endMs = endedAt ? new Date(endedAt).getTime() : null;
  const frozen = endMs != null && !Number.isNaN(endMs);

  // Closed orders have a fixed elapsed (deterministic on both server and
  // client). Open orders depend on `Date.now()`, which differs between SSR
  // and the browser — so we seed `null` (identical on both) and only start
  // ticking after mount, in the effect, to avoid a hydration mismatch.
  const [elapsed, setElapsed] = useState<number | null>(() =>
    frozen && !Number.isNaN(startMs)
      ? Math.max(0, Math.floor(((endMs as number) - startMs) / 1000))
      : null,
  );

  useEffect(() => {
    if (frozen || Number.isNaN(startMs)) return;
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMs, endMs, frozen]);

  if (Number.isNaN(startMs)) return <>—</>;
  if (elapsed == null)
    return <span className="tabular-nums text-muted-2">Live</span>;
  return <span className="tabular-nums">{formatElapsed(elapsed)}</span>;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}hr ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
