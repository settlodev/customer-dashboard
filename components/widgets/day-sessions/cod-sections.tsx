/**
 * Close-of-Day dashboard — presentational bento sections.
 *
 * Server components (no client state): every section takes already-
 * fetched data + the staff roster + a resolved currency and renders one
 * card from the "Settlo Close of Day Dashboard" design. The interactive
 * cash-up table lives separately in `cash-up-reconciliation-card.tsx`.
 *
 * Styling maps the design's CSS variables onto the app's semantic
 * tokens 1:1 (bg-card / border-line / text-ink / text-pos …), so light
 * and dark mode both come for free. The few colours with no token
 * (payment-mix ramp, the blue "Held" tag) are inlined as literals.
 */

import * as React from "react";
import {
  BarChart3,
  Banknote,
  Coins,
  Gift,
  HandCoins,
  LayoutGrid,
  Receipt,
  Undo2,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Staff } from "@/types/staff";
import type { DaySessionReport } from "@/lib/actions/day-session-list-actions";
import {
  CANCELLATION_REASON_LABELS,
  type CancellationReason,
  VOID_REASON_LABELS,
  type DaySessionRefundsResponse,
  type DaySessionVoidsResponse,
} from "@/types/orders/type";
import type {
  DaySessionEarlierSettlement,
  DaySessionExpensePayment,
  DaySessionExpensesSummary,
} from "@/types/expense/type";
import type { DaySessionPrepaymentsSummary } from "@/types/customer-prepayments/type";
import { PaginatedRows } from "@/components/widgets/day-sessions/paginated-rows";
import {
  fmt,
  isCashMethod,
  paymentMethodLabel,
  pmColor,
  shortId,
  staffName,
  fmtShortDay,
  fmtTime,
} from "@/lib/day-sessions/cod-format";

// Shared meta-line classes (mono muted labels with a bolder inline value).
const META = "font-mono text-[10.5px] text-muted-foreground";
const METAB = "font-semibold text-ink-3";

const TEXT_TONE: Record<"pos" | "neg" | "warn", string> = {
  pos: "text-pos",
  neg: "text-neg",
  warn: "text-warn",
};

// ─────────────────────────────────────────────────────────────────────
// CodCard — the white bento card with a title row (icon + title on the
// left, an optional sub-label or custom node on the right).
// ─────────────────────────────────────────────────────────────────────

export function CodCard({
  title,
  icon,
  sub,
  right,
  id,
  className,
  children,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mb-3.5 rounded-xl border border-line bg-card p-[18px] last:mb-0",
        className,
      )}
    >
      <div className="mb-[15px] flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
          {icon && (
            <span className="inline-flex text-primary [&>svg]:h-[17px] [&>svg]:w-[17px]">
              {icon}
            </span>
          )}
          <span className="truncate">{title}</span>
        </div>
        {right ??
          (sub ? (
            <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.02em] text-muted-foreground">
              {sub}
            </span>
          ) : null)}
      </div>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────────────

export function StaffAvatar({
  initials,
  color,
  className,
}: {
  initials: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px] font-semibold text-white",
        className,
      )}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}

const TAG_TONE: Record<string, string> = {
  void: "bg-neg-tint text-neg",
  cancel: "bg-warn-tint text-warn",
  held: "bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#7FA6FF]",
  applied: "bg-pos-tint text-pos",
  paid: "bg-pos-tint text-pos",
  unpaid: "bg-warn-tint text-warn",
};

export function Tag({
  tone,
  children,
}: {
  tone: keyof typeof TAG_TONE | string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] px-[7px] py-0.5 font-mono text-[9.5px] font-semibold tracking-[0.03em]",
        TAG_TONE[tone] ?? "bg-canvas text-ink-3",
      )}
    >
      {children}
    </span>
  );
}

/**
 * A single record row: title + tag, optional reason, meta line, an
 * optional `details` block (a nested breakdown — e.g. the payments that
 * settled an expense), and an optional amount (rows that deliberately
 * carry no money figure — cancellations, voids — omit it).
 */
function RecordRow({
  title,
  tag,
  reason,
  meta,
  details,
  amount,
  currency,
}: {
  title: React.ReactNode;
  tag?: React.ReactNode;
  reason?: React.ReactNode;
  meta?: React.ReactNode;
  details?: React.ReactNode;
  amount?: number | null;
  currency?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold tracking-[-0.01em] text-ink">
          {title}
          {tag}
        </div>
        {reason ? <div className="mt-[3px] text-[12px] text-ink-3">{reason}</div> : null}
        {meta ? (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-[3px]">{meta}</div>
        ) : null}
        {details}
      </div>
      {amount != null ? (
        <div className="shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-ink">
          {fmt(amount)}
          <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
            {currency}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** The bold split/total footer under a record list. */
function RecFoot({ split, total }: { split: string; total: number }) {
  return (
    <div className="mt-3.5 flex items-center justify-between gap-3 border-t-2 border-line-2 pt-[13px]">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
        {split}
      </span>
      <span className="font-mono text-[14px] font-bold tabular-nums text-ink">
        {fmt(total)}
      </span>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-[13px] text-muted-foreground">{children}</p>;
}

// ─────────────────────────────────────────────────────────────────────
// Session meta strip (Opened / Closed / Closed by / Verified by / Float)
// ─────────────────────────────────────────────────────────────────────

interface MetaCell {
  label: string;
  /** Simple value + sub. */
  value?: React.ReactNode;
  /** Or a person chip (avatar + name). */
  who?: { name: string; initials: string; color: string } | null;
  sub?: React.ReactNode;
}

export function SessionMetaStrip({ cells }: { cells: MetaCell[] }) {
  return (
    <div className="mb-3.5 flex flex-wrap overflow-hidden rounded-xl border border-line bg-card">
      {cells.map((c, i) => (
        <div
          key={i}
          className="min-w-[150px] flex-1 border-r border-line px-[18px] py-3 last:border-r-0"
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {c.label}
          </div>
          {c.who ? (
            <div className="mt-[5px] flex items-center gap-2">
              <StaffAvatar initials={c.who.initials} color={c.who.color} />
              <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink">
                {c.who.name}
              </span>
            </div>
          ) : (
            <div className="mt-1.5 text-[14px] font-semibold tracking-[-0.01em] text-ink">
              {c.value ?? "—"}
            </div>
          )}
          {c.sub ? (
            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {c.sub}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sales breakdown — 2-col metric grid
// ─────────────────────────────────────────────────────────────────────

function MCell({
  label,
  value,
  sub,
  valueTone,
  subTone,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueTone?: "pos" | "neg" | "warn";
  subTone?: "pos" | "neg" | "warn";
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border px-[13px] py-3",
        accent ? "border-primary/25 bg-primary/[0.06]" : "border-line bg-canvas",
      )}
    >
      <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 text-[18px] font-bold tracking-[-0.02em] tabular-nums",
          valueTone ? TEXT_TONE[valueTone] : "text-ink",
        )}
      >
        {value}
      </div>
      {sub ? (
        <div
          className={cn(
            "mt-1 font-mono text-[10px]",
            subTone ? TEXT_TONE[subTone] : "text-muted-foreground",
          )}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export function SalesBreakdown({
  report,
  currency,
}: {
  report: DaySessionReport;
  currency: string;
}) {
  const s = report.sales;
  // Comps are inside s.net (a comped bill closes as paid), so both the
  // "collected" cell and the margin work off the comp-free figure — which is
  // what grossProfit is struck on. Older share snapshots only carry net.
  const netCollected = s.netCollected ?? s.net;
  const margin =
    netCollected > 0
      ? Math.round(((report.grossProfit ?? 0) / netCollected) * 100)
      : null;

  return (
    <CodCard title="Sales breakdown" icon={<Coins />} sub={currency}>
      <div className="grid grid-cols-2 gap-[9px]">
        <MCell
          label="Gross sales"
          value={fmt(s.gross)}
          sub={`${fmt(report.orderCount)} orders`}
        />
        <MCell
          label="Discounts"
          value={`−${fmt(s.discounts)}`}
          valueTone="warn"
          sub={s.discountCount ? `${fmt(s.discountCount)} applied` : undefined}
        />
        {report.complimentaryAmount != null && report.complimentaryAmount > 0 ? (
          <MCell
            label="In-house / comps"
            value={`−${fmt(report.complimentaryAmount)}`}
            valueTone="warn"
            sub={
              report.complimentaryCount
                ? `${fmt(report.complimentaryCount)} order${report.complimentaryCount === 1 ? "" : "s"}`
                : undefined
            }
          />
        ) : null}
        <MCell
          label="Net sales"
          value={fmt(netCollected)}
          sub="collected"
          accent
        />
        <MCell
          label="Tips"
          value={fmt(s.tips)}
          sub={s.tips > 0 ? "card + cash" : undefined}
        />
        <MCell label="COGS" value={`−${fmt(report.cogs)}`} />
        <MCell
          label="Refunds"
          value={`−${fmt(report.refunds.amount)}`}
          valueTone="neg"
          sub={
            report.refunds.count > 0
              ? `${report.refunds.count} refund${report.refunds.count === 1 ? "" : "s"}`
              : undefined
          }
          subTone={report.refunds.count > 0 ? "neg" : undefined}
        />
        <MCell
          label="Gross profit"
          value={fmt(report.grossProfit)}
          sub={margin != null ? `${margin}% margin` : undefined}
          subTone="pos"
          accent
        />
      </div>
    </CodCard>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Payment mix — share of net sales
// ─────────────────────────────────────────────────────────────────────

export function PaymentMix({ report }: { report: DaySessionReport }) {
  const methods = [...report.paymentsByMethod].sort(
    (a, b) => (b.amount ?? 0) - (a.amount ?? 0),
  );
  const total = methods.reduce((sum, m) => sum + (m.amount ?? 0), 0) || 1;

  return (
    <CodCard title="Payment mix" icon={<BarChart3 />} sub="Share of net sales">
      {methods.length === 0 ? (
        <EmptyRow>No payments recorded yet.</EmptyRow>
      ) : (
        <div className="flex flex-col gap-0.5">
          {methods.map((m, i) => {
            const pct = ((m.amount ?? 0) / total) * 100;
            const color = pmColor(i);
            return (
              <div
                key={m.paymentMethodId}
                className="flex items-center gap-3.5 border-b border-line py-[9px] last:border-0"
              >
                <div className="flex w-[104px] shrink-0 items-center gap-2 text-[13px] font-semibold tracking-[-0.01em] text-ink">
                  <span
                    className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                    style={{ background: color }}
                  />
                  <span className="truncate">{m.paymentMethodName}</span>
                </div>
                <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <div className="shrink-0 text-right font-mono text-[12.5px] font-semibold tabular-nums text-ink">
                  {fmt(m.amount)}
                  <span className="mt-px block text-[10px] font-normal text-muted-foreground">
                    {pct.toFixed(1)}% · {m.count} txns
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CodCard>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Department mix — share of item net sales per department snapshot.
// The page only renders this when the session sold under more than one
// department; a one-row breakdown adds nothing.
// ─────────────────────────────────────────────────────────────────────

export function DepartmentMix({ report }: { report: DaySessionReport }) {
  const departments = report.salesByDepartment ?? [];
  const total = departments.reduce((sum, d) => sum + (d.net ?? 0), 0) || 1;

  return (
    <CodCard
      title="Sales by department"
      icon={<LayoutGrid />}
      sub="Share of item net sales"
    >
      {departments.length === 0 ? (
        <EmptyRow>No item sales recorded yet.</EmptyRow>
      ) : (
        <div className="flex flex-col gap-0.5">
          {departments.map((d, i) => {
            const pct = ((d.net ?? 0) / total) * 100;
            const color = pmColor(i);
            return (
              <div
                key={d.departmentId ?? "unassigned"}
                className="flex items-center gap-3.5 border-b border-line py-[9px] last:border-0"
              >
                <div className="flex w-[104px] shrink-0 items-center gap-2 text-[13px] font-semibold tracking-[-0.01em] text-ink">
                  <span
                    className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                    style={{ background: color }}
                  />
                  <span
                    className={cn("truncate", !d.departmentName && "text-ink-3")}
                  >
                    {d.departmentName ?? "Unassigned"}
                  </span>
                </div>
                <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <div className="shrink-0 text-right font-mono text-[12.5px] font-semibold tabular-nums text-ink">
                  {fmt(d.net)}
                  <span className="mt-px block text-[10px] font-normal text-muted-foreground">
                    {pct.toFixed(1)}% · {fmtQty(d.quantity)} items
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CodCard>
  );
}

// ─────────────────────────────────────────────────────────────────────
// In-house / comps — comp'd orders with their items and who was
// responsible (the staff that processed the complimentary settlement,
// falling back to the order's owner).
// ─────────────────────────────────────────────────────────────────────

/** Quantities keep fractions ("2.5") unlike money's integer `fmt`. */
const fmtQty = (q?: number | null): string =>
  (q ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function ComplimentaryList({
  report,
  currency,
}: {
  report: DaySessionReport;
  currency: string;
}) {
  const comps = report.complimentaryDetails ?? [];

  return (
    <CodCard
      title="In-house / comps"
      icon={<Gift />}
      sub={`${comps.length} order${comps.length === 1 ? "" : "s"}`}
    >
      {comps.length === 0 ? (
        <EmptyRow>No complimentary orders this session.</EmptyRow>
      ) : (
        <>
          {comps.map((c) => {
            const who = c.staffName || c.orderStaffName || null;
            const items = c.items
              .map((it) => `${fmtQty(it.quantity)}× ${it.itemName}`)
              .join(", ");
            return (
              <RecordRow
                key={c.orderId}
                title={<>#{c.orderNumber || shortId(c.orderId)}</>}
                tag={<Tag tone="cancel">COMP</Tag>}
                reason={items || undefined}
                meta={
                  <>
                    {who ? (
                      <span className={META}>
                        By <span className={METAB}>{who}</span>
                      </span>
                    ) : null}
                    {c.compedAt ? (
                      <span className={META}>{fmtTime(c.compedAt)}</span>
                    ) : null}
                  </>
                }
                amount={c.amount}
                currency={currency}
              />
            );
          })}
          <RecFoot
            split={`${comps.length} order${comps.length === 1 ? "" : "s"} on the house`}
            total={
              report.complimentaryAmount ??
              comps.reduce((sum, c) => sum + (c.amount ?? 0), 0)
            }
          />
        </>
      )}
    </CodCard>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cancellations & voids
// ─────────────────────────────────────────────────────────────────────

export function CancellationsVoids({
  voids,
  report,
  roster,
}: {
  voids: DaySessionVoidsResponse | null;
  report: DaySessionReport | null;
  roster: Map<string, Staff>;
}) {
  const items = voids?.items ?? [];
  const cancelledOrders = voids?.cancelledOrders ?? [];
  const cancelledCount = report?.voids?.cancelledOrderCount ?? 0;
  const sub =
    report?.voids != null
      ? `${report.voids.voidedItemCount} voided · ${cancelledCount} cancelled`
      : `${items.length} item${items.length === 1 ? "" : "s"}`;

  // A clean session — nothing voided, nothing cancelled, by either the
  // detail rows or the report's own counters — hides the card. `voids ==
  // null` (the read failed) still renders its message.
  const nothingRecorded =
    items.length === 0 &&
    cancelledOrders.length === 0 &&
    cancelledCount === 0 &&
    (report?.voids?.voidedItemCount ?? 0) === 0;
  if (voids && nothingRecorded) return null;

  return (
    <CodCard title="Cancellations & voids" icon={<XCircle />} sub={sub}>
      {voids == null ? (
        <EmptyRow>Void detail is unavailable for this session.</EmptyRow>
      ) : (
        <>
          {items.length > 0 ? (
            <div className="flex flex-col">
              {items.map((v) => (
                <RecordRow
                  key={`${v.orderId}:${v.orderItemId}`}
                  title={
                    <>
                      #{v.orderNumber} · {v.itemName}
                      {v.quantity ? ` ×${v.quantity}` : ""}
                    </>
                  }
                  tag={<Tag tone="void">Void</Tag>}
                  reason={
                    v.voidReason
                      ? (VOID_REASON_LABELS[v.voidReason] ?? v.voidReason)
                      : undefined
                  }
                  meta={
                    <>
                      <span className={META}>
                        Waiter <b className={METAB}>{staffName(v.staffId, roster)}</b>
                      </span>
                      <span className={META}>
                        Approved by{" "}
                        <b className={METAB}>
                          {staffName(v.approvedBy ?? v.removedBy, roster)}
                        </b>
                      </span>
                      {v.removedAt ? (
                        <span className={META}>{fmtTime(v.removedAt)}</span>
                      ) : null}
                    </>
                  }
                />
              ))}
            </div>
          ) : null}

          {/* Cancelled orders — full tickets cancelled outright, distinct
              from a single voided line item above. Only labelled when
              voided items sit above it and need separating. */}
          {cancelledOrders.length > 0 ? (
            <div
              className={cn(items.length > 0 && "mt-1 border-t border-line pt-3.5")}
            >
              {items.length > 0 ? (
                <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                  Cancellations
                </div>
              ) : null}
              <div className="flex flex-col">
                {cancelledOrders.map((c) => (
                  <RecordRow
                    key={c.orderId}
                    title={<>#{c.orderNumber}</>}
                    tag={<Tag tone="cancel">Cancelled</Tag>}
                    reason={
                      c.cancellationReason
                        ? (CANCELLATION_REASON_LABELS[
                            c.cancellationReason as CancellationReason
                          ] ?? c.cancellationReason)
                        : undefined
                    }
                    meta={
                      <>
                        <span className={META}>
                          Approved by{" "}
                          <b className={METAB}>{staffName(c.cancelledBy, roster)}</b>
                        </span>
                        {c.cancelledAt ? (
                          <span className={META}>{fmtTime(c.cancelledAt)}</span>
                        ) : null}
                      </>
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </CodCard>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Customer prepayments
// ─────────────────────────────────────────────────────────────────────

export function Prepayments({
  prepayments,
  methodNameById,
  currency,
}: {
  prepayments: DaySessionPrepaymentsSummary | null;
  methodNameById: Map<string, string>;
  currency: string;
}) {
  const items = prepayments?.items ?? [];
  const usages = prepayments?.usages ?? [];
  const totals = prepayments?.totals;

  // Nothing taken AND nothing drawn down — hide the card entirely. A null
  // summary means the read failed, which is worth saying out loud, so that
  // still renders.
  if (prepayments && items.length === 0 && usages.length === 0) return null;

  const usedTotal =
    totals?.usedTotal ?? usages.reduce((sum, u) => sum + (u.amountUsed ?? 0), 0);

  return (
    <CodCard title="Customer prepayments" icon={<HandCoins />}>
      {prepayments == null ? (
        <EmptyRow>Prepayments data is unavailable for this session.</EmptyRow>
      ) : (
        <>
          {items.length > 0 ? (
            <>
              <div className="flex flex-col">
                {items.map((p, idx) => {
                  const method = p.paymentMethodId
                    ? (methodNameById.get(p.paymentMethodId) ?? null)
                    : null;
                  const held = p.status === "HELD";
                  return (
                    <RecordRow
                      key={`${p.instrumentId}-${idx}`}
                      title={p.customerName ?? "Walk-in customer"}
                      tag={
                        <Tag tone={held ? "held" : "applied"}>
                          {held ? "Held" : "Applied"}
                        </Tag>
                      }
                      reason={
                        [p.reference, p.description].filter(Boolean).join(" · ") ||
                        undefined
                      }
                      meta={
                        <>
                          {method ? <span className={META}>{method}</span> : null}
                          <span className={META}>
                            {held ? (
                              <>
                                Taken <b className={METAB}>{fmtTime(p.receivedAt)}</b>
                              </>
                            ) : (
                              "Applied to order"
                            )}
                          </span>
                        </>
                      }
                      amount={p.amount}
                      currency={p.currency ?? currency}
                    />
                  );
                })}
              </div>
              {totals ? (
                <RecFoot
                  split={`Held ${fmt(totals.heldTotal)} · Applied ${fmt(totals.appliedTotal)}`}
                  total={totals.totalReceived}
                />
              ) : null}
            </>
          ) : null}

          {/* Balances drawn down during this session — whenever the money
              was originally taken — with what each customer had left after
              their last draw. */}
          {usages.length > 0 ? (
            <div className={cn(items.length > 0 && "mt-3.5 border-t border-line pt-3.5")}>
              <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                Used this session
              </div>
              <div className="flex flex-col">
                {usages.map((u) => (
                  <RecordRow
                    key={u.instrumentId}
                    title={u.customerName ?? "Walk-in customer"}
                    tag={<Tag tone="applied">Used</Tag>}
                    reason={u.reference ?? undefined}
                    meta={
                      <>
                        <span className={META}>
                          Balance left{" "}
                          <b className={METAB}>{fmt(u.balanceAfter)}</b>
                        </span>
                        {u.redemptionCount > 1 ? (
                          <span className={META}>{u.redemptionCount} draws</span>
                        ) : null}
                        {u.lastUsedAt ? (
                          <span className={META}>{fmtTime(u.lastUsedAt)}</span>
                        ) : null}
                      </>
                    }
                    amount={u.amountUsed}
                    currency={u.currency ?? currency}
                  />
                ))}
              </div>
              <RecFoot
                split={`${usages.length} customer${usages.length === 1 ? "" : "s"} paid from prepayments`}
                total={usedTotal}
              />
            </div>
          ) : null}
        </>
      )}
    </CodCard>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Refunds
// ─────────────────────────────────────────────────────────────────────

export function RefundsList({
  refunds,
  roster,
  currency,
}: {
  refunds: DaySessionRefundsResponse | null;
  roster: Map<string, Staff>;
  currency: string;
}) {
  const items = refunds?.refunds ?? [];

  // Nothing refunded — hide the card. A null response (read failed) still
  // renders, so an outage never reads as a clean session.
  if (refunds && items.length === 0) return null;

  // Footer split by payment method code ("Cash 13,200 · M-Pesa 68,000").
  const byMethod = new Map<string, number>();
  for (const r of items) {
    const key = r.paymentMethodCode ?? "Other";
    byMethod.set(key, (byMethod.get(key) ?? 0) + (r.refundAmount ?? 0));
  }
  const split = [...byMethod.entries()]
    .map(([k, v]) => `${k} ${fmt(v)}`)
    .join(" · ");

  return (
    <CodCard title="Refunds" icon={<Undo2 />}>
      {refunds == null ? (
        <EmptyRow>Refunds data is unavailable for this session.</EmptyRow>
      ) : (
        <>
          <div className="flex flex-col">
            {items.map((r) => (
              <RecordRow
                key={r.id}
                title={
                  <>
                    {r.orderNumber ? `#${r.orderNumber} · ` : ""}
                    {r.itemName ?? `Item #${shortId(r.orderItemId)}`}
                    {r.quantity ? ` ×${r.quantity}` : ""}
                  </>
                }
                reason={r.reason ?? undefined}
                meta={
                  <>
                    {r.paymentMethodCode ? (
                      <span className={META}>{r.paymentMethodCode}</span>
                    ) : null}
                    <span className={META}>
                      Approved{" "}
                      <b className={METAB}>{staffName(r.approvedBy, roster)}</b>
                    </span>
                  </>
                }
                amount={r.refundAmount}
                currency={r.refundCurrency ?? currency}
              />
            ))}
          </div>
          <RecFoot
            split={split || `${items.length} refunds`}
            total={refunds.totalAmount}
          />
        </>
      )}
    </CodCard>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Expenses
// ─────────────────────────────────────────────────────────────────────

/** One posted payment under an expense: method, where from, when, how much. */
function ExpensePaymentLine({
  payment,
  currency,
}: {
  payment: DaySessionExpensePayment;
  currency: string;
}) {
  const method = paymentMethodLabel(
    payment.paymentMethodCode,
    payment.paymentMethod,
  );
  // The free-text label is "CODE · Account name", so the account name is
  // already implied there; only show it when it adds something.
  const account =
    payment.sourceAccountName && payment.sourceAccountName !== method
      ? payment.sourceAccountName
      : null;
  const when = payment.paymentDate
    ? fmtShortDay(payment.paymentDate)
    : payment.recordedAt
      ? fmtTime(payment.recordedAt)
      : null;

  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <span className={cn(META, "min-w-0 truncate")}>
        <b className={METAB}>{method}</b>
        {account ? ` · ${account}` : ""}
        {when ? ` · ${when}` : ""}
        {payment.reference ? ` · ${payment.reference}` : ""}
      </span>
      <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-ink-3">
        {fmt(payment.amount)}
        <span className="ml-1 font-normal text-muted-foreground">
          {payment.currencyCode ?? currency}
        </span>
      </span>
    </div>
  );
}

export function ExpensesList({
  expenses,
  currency,
}: {
  expenses: DaySessionExpensesSummary | null;
  currency: string;
}) {
  const items = expenses?.items ?? [];
  const totals = expenses?.totals;
  // Paid today against earlier days' expenses — absent from `items`, but
  // money that left the tills all the same.
  const earlier = expenses?.earlierSettlements ?? [];
  const earlierTotal =
    expenses?.earlierSettlementsTotal ??
    earlier.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  // Nothing spent this session — drop the card rather than showing an
  // empty shell. A null summary is a different thing (the read failed)
  // and still renders, so a service outage isn't mistaken for a quiet day.
  if (expenses && items.length === 0 && earlier.length === 0) return null;

  const paid = totals
    ? totals.paidByCash + totals.paidByMobile + totals.paidByOther
    : 0;

  // Footer split by actual tender ("Cash 45,000 · Bank transfer 20,000").
  // Falls back to the backend's cash/mobile/other buckets when the rows
  // carry no itemized payments (older Accounting build).
  const byMethod = new Map<string, number>();
  for (const e of items) {
    for (const p of e.payments ?? []) {
      const label = paymentMethodLabel(p.paymentMethodCode, p.paymentMethod);
      byMethod.set(label, (byMethod.get(label) ?? 0) + (p.amount ?? 0));
    }
  }
  if (byMethod.size === 0 && totals) {
    if (totals.paidByCash) byMethod.set("Cash", totals.paidByCash);
    if (totals.paidByMobile) byMethod.set("Mobile", totals.paidByMobile);
    if (totals.paidByOther) byMethod.set("Other", totals.paidByOther);
  }
  const split = [
    ...[...byMethod.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount]) => `${label} ${fmt(amount)}`),
    ...(totals && totals.unpaidTotal > 0
      ? [`Unpaid ${fmt(totals.unpaidTotal)}`]
      : []),
  ].join(" · ");

  return (
    <CodCard
      title="Expenses"
      icon={<Receipt />}
      sub={
        items.length > 0
          ? `${items.length} expense${items.length === 1 ? "" : "s"} · ${fmt(
              paid + earlierTotal,
            )} paid out`
          : earlier.length > 0
            ? `${fmt(earlierTotal)} paid out`
            : undefined
      }
    >
      {expenses == null ? (
        <EmptyRow>Expenses data is unavailable for this session.</EmptyRow>
      ) : (
        <>
          <PaginatedRows pageSize={6}>
            {items.map((e) => {
              const payments = e.payments ?? [];
              const codes = e.paymentMethodCodes?.length
                ? e.paymentMethodCodes
                    .map((c) => paymentMethodLabel(c))
                    .join(" + ")
                : null;
              const tone =
                e.paymentStatus === "PAID"
                  ? "paid"
                  : e.paymentStatus === "UNPAID"
                    ? "unpaid"
                    : "cancel";
              const label =
                e.paymentStatus === "PAID"
                  ? "Paid"
                  : e.paymentStatus === "UNPAID"
                    ? "Unpaid"
                    : "Part-paid";
              // A wholly unpaid expense needs no balance line — the tag
              // says Unpaid and the balance equals the row amount.
              const showBalance =
                e.balanceDue > 0 && e.paymentStatus !== "UNPAID";
              return (
                <RecordRow
                  key={e.expenseId}
                  title={e.description ?? e.expenseNumber}
                  tag={<Tag tone={tone}>{label}</Tag>}
                  meta={
                    <>
                      <span className={META}>{e.expenseNumber}</span>
                      <span className={META}>
                        {e.categoryName ?? "Uncategorised"}
                      </span>
                      {e.payeeName ? (
                        <span className={META}>
                          To <b className={METAB}>{e.payeeName}</b>
                        </span>
                      ) : null}
                      {/* Method on the meta line only when there are no
                          itemized payments to carry it below. */}
                      {payments.length === 0 && codes ? (
                        <span className={META}>
                          Via <b className={METAB}>{codes}</b>
                        </span>
                      ) : null}
                      {e.reference ? (
                        <span className={META}>Ref {e.reference}</span>
                      ) : null}
                      {e.recordedAt ? (
                        <span className={META}>{fmtTime(e.recordedAt)}</span>
                      ) : null}
                    </>
                  }
                  details={
                    payments.length > 0 || showBalance ? (
                      <div className="mt-2 rounded-lg bg-canvas px-2.5 py-1.5">
                        {payments.map((p, idx) => (
                          <ExpensePaymentLine
                            key={p.paymentId ?? `${e.expenseId}-${idx}`}
                            payment={p}
                            currency={e.currencyCode ?? currency}
                          />
                        ))}
                        {showBalance ? (
                          <div className="flex items-baseline justify-between gap-3 py-[3px]">
                            <span className={META}>Balance due</span>
                            <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-warn">
                              {fmt(e.balanceDue)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : null
                  }
                  amount={e.amount}
                  currency={e.currencyCode ?? currency}
                />
              );
            })}
          </PaginatedRows>
          {totals && items.length > 0 ? (
            <RecFoot
              split={split || `${items.length} expenses`}
              total={totals.totalAmount}
            />
          ) : null}

          {earlier.length > 0 ? (
            <EarlierSettlements
              settlements={earlier}
              total={earlierTotal}
              hasItems={items.length > 0}
              currency={currency}
            />
          ) : null}
        </>
      )}
    </CodCard>
  );
}

/**
 * Invoices raised on an earlier day but settled from today's tills.
 *
 * <p>They belong to no line above — this card lists what the session
 * SPENT — yet the cash-up nets them off because the money left today.
 * Without them on the page the two cards read as a contradiction, so they
 * sit here under their own subtotal, deliberately outside the card's
 * total, with the reconciliation spelled out.
 */
function EarlierSettlements({
  settlements,
  total,
  hasItems,
  currency,
}: {
  settlements: DaySessionEarlierSettlement[];
  total: number;
  hasItems: boolean;
  currency: string;
}) {
  return (
    <div className={cn(hasItems && "mt-3.5 border-t border-line pt-3.5")}>
      <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
        Settled from earlier days
      </div>
      <div className="flex flex-col">
        {settlements.map((e) => {
          const method = paymentMethodLabel(e.paymentMethodCode, e.paymentMethod);
          return (
            <RecordRow
              key={e.paymentId}
              title={e.description ?? e.expenseNumber}
              tag={<Tag tone="paid">Paid</Tag>}
              meta={
                <>
                  <span className={META}>{e.expenseNumber}</span>
                  <span className={META}>
                    Raised{" "}
                    <b className={METAB}>{fmtShortDay(e.expenseBusinessDate)}</b>
                  </span>
                  <span className={META}>{method}</span>
                  {e.recordedAt ? (
                    <span className={META}>{fmtTime(e.recordedAt)}</span>
                  ) : null}
                </>
              }
              amount={e.amount}
              currency={e.currencyCode ?? currency}
            />
          );
        })}
      </div>
      <RecFoot
        split={`${settlements.length} earlier expense${
          settlements.length === 1 ? "" : "s"
        } settled today`}
        total={total}
      />
      <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
        Counted in the cash-up, not in the total above — that covers what
        this session spent, whenever it was paid.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cash drawer — waterfall from opening float to counted variance.
//
// Only opening / expected / counted / variance are authoritative (from
// the till reconciliation). The cash-flow component lines are derived
// best-effort from session activity; see the CoD data-gap notes.
// ─────────────────────────────────────────────────────────────────────

function DrawerRow({
  label,
  value,
  grand,
  tone,
}: {
  label: string;
  value: string;
  grand?: boolean;
  tone?: "neg" | "warn" | "pos";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line py-[9px] last:border-b-0",
        grand && "mt-0.5 border-b-0 border-t-2 border-line-2 pt-3",
      )}
    >
      <span
        className={cn(
          grand ? "text-[13.5px] font-bold text-ink" : "text-[12.5px] text-ink-3",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-right font-mono tabular-nums",
          grand ? "text-[15px] font-bold" : "text-[12.5px] font-semibold",
          tone ? TEXT_TONE[tone] : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function CashDrawer({
  till,
  payments,
  refunds,
  prepayments,
  cashExpenses,
  methodNameById,
  currency,
}: {
  till: NonNullable<DaySessionReport["physicalTill"]>;
  payments: DaySessionReport["paymentsByMethod"];
  refunds: DaySessionRefundsResponse["refunds"];
  prepayments: DaySessionPrepaymentsSummary["items"];
  cashExpenses: number;
  methodNameById: Map<string, string>;
  currency: string;
}) {
  const cashSales = payments
    .filter((p) => isCashMethod(p.paymentMethodName ?? p.paymentMethodCode))
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  const cashRefunds = refunds
    .filter((r) => isCashMethod(r.paymentMethodCode))
    .reduce((s, r) => s + (r.refundAmount ?? 0), 0);

  const cashPrepayment = prepayments
    .filter(
      (p) =>
        p.paymentMethodId &&
        isCashMethod(methodNameById.get(p.paymentMethodId)),
    )
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  const variance = till.variance ?? 0;

  return (
    <CodCard title="Cash drawer" icon={<Banknote />} sub={currency}>
      <div className="flex flex-col">
        <DrawerRow label="Opening float" value={fmt(till.opening)} />
        <DrawerRow label="+ Cash sales" value={fmt(cashSales)} />
        {cashPrepayment > 0 ? (
          <DrawerRow label="+ Cash prepayment" value={fmt(cashPrepayment)} />
        ) : null}
        <DrawerRow label="− Cash refunds" value={fmt(cashRefunds)} />
        <DrawerRow label="− Cash expenses" value={fmt(cashExpenses)} />
        <DrawerRow label="Expected in drawer" value={fmt(till.expected)} />
        <DrawerRow label="Counted" value={fmt(till.counted)} />
        <DrawerRow
          label="Variance"
          value={
            variance === 0
              ? "0"
              : variance > 0
                ? `+${fmt(variance)}`
                : `−${fmt(Math.abs(variance))}`
          }
          grand
          tone={variance === 0 ? undefined : variance > 0 ? "warn" : "neg"}
        />
      </div>
      <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
        Expected, counted &amp; variance are from the till count. Component
        lines are derived from cash-tagged session activity.
      </p>
    </CodCard>
  );
}
