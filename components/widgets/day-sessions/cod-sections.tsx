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
  HandCoins,
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
import type { DaySessionExpensesSummary } from "@/types/expense/type";
import type { DaySessionPrepaymentsSummary } from "@/types/customer-prepayments/type";
import {
  fmt,
  isCashMethod,
  pmColor,
  shortId,
  staffName,
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

/** A single record row: title + tag, optional reason, meta line, amount. */
function RecordRow({
  title,
  tag,
  reason,
  meta,
  amount,
  currency,
}: {
  title: React.ReactNode;
  tag?: React.ReactNode;
  reason?: React.ReactNode;
  meta?: React.ReactNode;
  amount: number;
  currency: string;
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
      </div>
      <div className="shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-ink">
        {fmt(amount)}
        <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
          {currency}
        </span>
      </div>
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
  const margin =
    s.net > 0 ? Math.round(((report.grossProfit ?? 0) / s.net) * 100) : null;

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
                ? `${fmt(report.complimentaryCount)} item${report.complimentaryCount === 1 ? "" : "s"}`
                : undefined
            }
          />
        ) : null}
        <MCell label="Net sales" value={fmt(s.net)} sub="collected" accent />
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
// Cancellations & voids
// ─────────────────────────────────────────────────────────────────────

export function CancellationsVoids({
  voids,
  report,
  roster,
  currency,
}: {
  voids: DaySessionVoidsResponse | null;
  report: DaySessionReport | null;
  roster: Map<string, Staff>;
  currency: string;
}) {
  const items = voids?.items ?? [];
  const cancelledOrders = voids?.cancelledOrders ?? [];
  const cancelledAmount = report?.voids?.cancelledAmount ?? 0;
  const cancelledCount = report?.voids?.cancelledOrderCount ?? 0;
  const voidedTotal = voids?.totalVoidedAmount ?? 0;
  const sub =
    report?.voids != null
      ? `${report.voids.voidedItemCount} voided · ${cancelledCount} cancelled`
      : `${items.length} item${items.length === 1 ? "" : "s"}`;

  return (
    <CodCard title="Cancellations & voids" icon={<XCircle />} sub={sub}>
      {voids == null ? (
        <EmptyRow>Void detail is unavailable for this session.</EmptyRow>
      ) : items.length === 0 &&
        cancelledOrders.length === 0 &&
        cancelledAmount === 0 ? (
        <EmptyRow>No voids or cancellations recorded this session.</EmptyRow>
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
                        Cashier{" "}
                        <b className={METAB}>{staffName(v.removedBy, roster)}</b>
                      </span>
                      <span className={META}>
                        Approved{" "}
                        <b className={METAB}>{staffName(v.approvedBy, roster)}</b>
                      </span>
                      {v.removedAt ? (
                        <span className={META}>{fmtTime(v.removedAt)}</span>
                      ) : null}
                    </>
                  }
                  amount={v.netAmount}
                  currency={currency}
                />
              ))}
            </div>
          ) : null}

          {/* Cancelled orders — full tickets cancelled outright, distinct
              from a single voided line item above. */}
          <div
            className={cn(items.length > 0 && "mt-1 border-t border-line pt-3.5")}
          >
            <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
              Cancellations
            </div>
            {cancelledOrders.length === 0 ? (
              <EmptyRow>No cancelled orders this session.</EmptyRow>
            ) : (
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
                          Cancelled by{" "}
                          <b className={METAB}>{staffName(c.cancelledBy, roster)}</b>
                        </span>
                        {c.cancelledAt ? (
                          <span className={META}>{fmtTime(c.cancelledAt)}</span>
                        ) : null}
                      </>
                    }
                    amount={c.netAmount}
                    currency={currency}
                  />
                ))}
              </div>
            )}
          </div>

          <RecFoot
            split={`Voids ${fmt(voidedTotal)} · Cancelled ${fmt(cancelledAmount)}`}
            total={voidedTotal + cancelledAmount}
          />
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
  const totals = prepayments?.totals;

  return (
    <CodCard title="Customer prepayments" icon={<HandCoins />}>
      {prepayments == null ? (
        <EmptyRow>Prepayments data is unavailable for this session.</EmptyRow>
      ) : items.length === 0 ? (
        <EmptyRow>No prepayments recorded this session.</EmptyRow>
      ) : (
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
      ) : items.length === 0 ? (
        <EmptyRow>No refunds recorded this session.</EmptyRow>
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

export function ExpensesList({
  expenses,
  currency,
}: {
  expenses: DaySessionExpensesSummary | null;
  currency: string;
}) {
  const items = expenses?.items ?? [];
  const totals = expenses?.totals;
  const paid = totals
    ? totals.paidByCash + totals.paidByMobile + totals.paidByOther
    : 0;

  return (
    <CodCard title="Expenses" icon={<Receipt />}>
      {expenses == null ? (
        <EmptyRow>Expenses data is unavailable for this session.</EmptyRow>
      ) : items.length === 0 ? (
        <EmptyRow>No expenses recorded this session.</EmptyRow>
      ) : (
        <>
          <div className="flex flex-col">
            {items.map((e) => {
              const methods = e.paymentMethodCodes?.length
                ? e.paymentMethodCodes.join(" + ")
                : null;
              const tone =
                e.paymentStatus === "PAID"
                  ? "paid"
                  : e.paymentStatus === "UNPAID"
                    ? "unpaid"
                    : "cancel";
              const label =
                e.paymentStatus === "PAID"
                  ? methods
                    ? `Paid · ${methods}`
                    : "Paid"
                  : e.paymentStatus === "UNPAID"
                    ? "Unpaid"
                    : "Part-paid";
              return (
                <RecordRow
                  key={e.expenseId}
                  title={e.description ?? e.expenseNumber}
                  tag={<Tag tone={tone}>{label}</Tag>}
                  meta={
                    <span className={META}>
                      {[e.categoryName, e.payeeName].filter(Boolean).join(" · ") ||
                        "Uncategorised"}
                    </span>
                  }
                  amount={e.amount}
                  currency={e.currencyCode ?? currency}
                />
              );
            })}
          </div>
          {totals ? (
            <RecFoot
              split={`Paid ${fmt(paid)} · Unpaid ${fmt(totals.unpaidTotal)}`}
              total={totals.totalAmount}
            />
          ) : null}
        </>
      )}
    </CodCard>
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
