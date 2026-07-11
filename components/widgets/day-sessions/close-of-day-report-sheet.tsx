/**
 * Close-of-Day report — the formal A4 "Z-report" body.
 *
 * Server component that reuses the SAME shared-document template as the
 * GRN / proforma shareables: rendered inside `PrintableDocument`'s A4
 * sheet + toolbar + print stylesheet, opening with the shared
 * `DocumentHeader` letterhead and closing with `NotesFooter` (signatures
 * + "Powered by Settlo"). Body is the slate document palette with the
 * tenant brand colour on the title + the cash-up table header only —
 * matching how the GRN line-items table is themed.
 */

import * as React from "react";

import { cn } from "@/lib/utils";
import { composeLetterheadAddress } from "@/lib/grn-document";
import { DocumentHeader } from "@/components/documents/sections/DocumentHeader";
import { NotesFooter } from "@/components/documents/sections/NotesFooter";
import type { BusinessIdentity, DocumentMeta } from "@/components/documents/types";
import type { Staff } from "@/types/staff";
import type { LocationLetterhead } from "@/types/letterhead/type";
import type { DaySession } from "@/lib/actions/location-day-sessions-actions";
import type {
  CloseOfDayExtras,
  DaySessionReport,
} from "@/lib/actions/day-session-list-actions";
import type { PaymentMethodReconciliation } from "@/types/payment-method-reconciliation/type";
import { VOID_REASON_LABELS } from "@/types/orders/type";
import {
  fmt2,
  fmtBusinessDate,
  fmtClock,
  fmtDateTimeShort,
  fmtLongDate,
  fmtVariance2,
  isCashMethod,
  methodNameIndex,
  shortId,
  staffChip,
  staffName,
  type StaffChip,
} from "@/lib/day-sessions/cod-format";

// Default Settlo brand (matches lib/grn-document.ts) when the tenant
// letterhead carries no brand colour.
const SETTLO_PRIMARY = "#ED7B40";

// Status accent colours — fixed hex, print-safe (never theme-flip).
const POS = "text-[#0A6B49]";
const NEG = "text-[#C0392B]";
const WARN = "text-[#B9791F]";

// A drawer/cash-up over or short is a discrepancy either way — never
// "good" — so a positive variance gets the amber warn tone.
const varTone = (n: number) => (n === 0 ? "text-slate-400" : n > 0 ? WARN : NEG);

// Table class fragments (shared-document slate palette).
const TH =
  "border-b border-slate-200 bg-slate-100 px-[15px] py-[11px] text-left font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-600 whitespace-nowrap";
const HERO_TH =
  "px-[15px] py-[11px] text-left font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-white whitespace-nowrap";
const TD = "border-b border-slate-200 px-[15px] py-3 align-top text-[13px]";
const NUM = "text-right font-mono tabular-nums whitespace-nowrap";
const PRIM = "font-semibold tracking-[-0.005em] text-slate-900";
const SUB = "mt-0.5 text-[11.5px] text-slate-400";

export function CloseOfDayReportSheet({
  session,
  report,
  reconciliations,
  extras,
  letterhead,
  roster,
  currency,
  generatedAt,
}: {
  session: DaySession;
  report: DaySessionReport | null;
  reconciliations: PaymentMethodReconciliation[];
  extras: CloseOfDayExtras;
  letterhead: LocationLetterhead | null;
  roster: Map<string, Staff>;
  currency: string;
  generatedAt: string;
}) {
  const lh = letterhead?.letterhead ?? null;
  const tax = letterhead?.taxIds ?? null;
  const businessName = lh?.businessName ?? session.locationName ?? "Business";
  const primaryColor = letterhead?.brand?.primaryColor?.trim() || SETTLO_PRIMARY;
  const heroStyle: React.CSSProperties = { backgroundColor: primaryColor };

  // Shared-document letterhead (identical component to GRN / proforma).
  const issuer: BusinessIdentity = {
    name: businessName,
    logoUrl: lh?.logoUrl ?? undefined,
    addressLines: composeLetterheadAddress(lh),
    phone: lh?.phone ?? undefined,
    email: lh?.email ?? undefined,
    website: lh?.website ?? undefined,
    tin: tax?.tin ?? undefined,
    vrn: tax?.vrn ?? undefined,
  };
  const meta: DocumentMeta = {
    type: "statement",
    titleOverride: "Close of Day Report",
    documentNumber: session.identifier ?? shortId(session.id),
    issueDate: session.businessDate,
  };

  const methodNameById = methodNameIndex(
    report?.paymentsByMethod ?? [],
    reconciliations,
  );
  const txnsByMethodId = new Map(
    (report?.paymentsByMethod ?? []).map((p) => [p.paymentMethodId, p.count]),
  );

  // Verification (derived — no session-level sign-off field exists).
  const approved = reconciliations
    .filter((r) => r.status === "APPROVED" && r.approvedAt)
    .sort(
      (a, b) =>
        new Date(b.approvedAt as string).getTime() -
        new Date(a.approvedAt as string).getTime(),
    );
  const verified =
    session.status === "CLOSED" &&
    reconciliations.length > 0 &&
    reconciliations.every((r) => r.status === "APPROVED");
  const verifier: StaffChip | null =
    verified && approved[0]?.approvedBy
      ? staffChip(approved[0].approvedBy, roster, approved[0].approvedByName)
      : null;
  const closedBy = session.closedBy
    ? staffChip(session.closedBy, roster, session.closedByName)
    : null;
  const openedByName = session.openedBy
    ? staffName(session.openedBy, roster, session.openedByName)
    : (session.openedByLabel ?? null);

  const expectedTotal = reconciliations.reduce(
    (s, r) => s + (r.expectedAmount ?? 0),
    0,
  );
  const countedTotal = reconciliations.reduce(
    (s, r) => s + (r.countedAmount ?? 0),
    0,
  );
  const txnsTotal = reconciliations.reduce(
    (s, r) => s + (r.paymentMethodId ? (txnsByMethodId.get(r.paymentMethodId) ?? 0) : 0),
    0,
  );
  const netVariance = countedTotal - expectedTotal;

  const sales = report?.sales;
  const till = report?.physicalTill ?? null;

  const voidItems = extras.voids?.items ?? [];
  const cancelledOrders = extras.voids?.cancelledOrders ?? [];
  const cancelledTotal =
    extras.voids?.totalCancelledAmount ?? report?.voids?.cancelledAmount ?? 0;
  const refundItems = extras.refunds?.refunds ?? [];
  const prepayItems = extras.prepayments?.items ?? [];
  const expenseItems = extras.expenses?.items ?? [];

  // Cash-drawer components (derived best-effort; see CoD data-gap notes).
  const cashSales = (report?.paymentsByMethod ?? [])
    .filter((p) => isCashMethod(p.paymentMethodName ?? p.paymentMethodCode))
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const cashRefunds = refundItems
    .filter((r) => isCashMethod(r.paymentMethodCode))
    .reduce((s, r) => s + (r.refundAmount ?? 0), 0);
  const cashPrepay = prepayItems
    .filter(
      (p) => p.paymentMethodId && isCashMethod(methodNameById.get(p.paymentMethodId)),
    )
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const cashExpenses = extras.expenses?.totals.paidByCash ?? 0;

  const signatures = [
    {
      label: "Closed by",
      name: closedBy
        ? `${closedBy.name}${closedBy.title ? ` · ${closedBy.title}` : ""}`
        : (session.closedByLabel ?? "—"),
    },
    {
      label: "Verified by",
      name: verifier
        ? `${verifier.name}${verifier.title ? ` · ${verifier.title}` : ""}`
        : "—",
    },
  ];

  return (
    <>
      <DocumentHeader issuer={issuer} meta={meta} titleColor={primaryColor} />

      {/* ── Meta ───────────────────────────────────────────────────── */}
      <div className="px-10 pb-2 pt-7">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
          <div>
            <div className="mb-1.5 text-[12.5px] text-slate-500">
              Location{session.identifier ? " · Session" : ""}
            </div>
            <div className="text-[17px] font-bold tracking-[-0.01em]">
              {session.locationName ?? "—"}
            </div>
            {session.identifier && (
              <div className="mt-0.5 font-mono text-[13px] text-slate-600">
                {session.identifier}
              </div>
            )}
            {openedByName && (
              <div className="mt-3 text-[13px] text-slate-500">
                Day session opened by {openedByName}
              </div>
            )}
          </div>
          <div>
            <Kv k="Reference" v={session.identifier ?? shortId(session.id)} />
            <Kv k="Business date" v={fmtBusinessDate(session.businessDate)} />
            <Kv k="Generated" v={fmtDateTimeShort(generatedAt)} />
            <div className="sm:text-right">
              <span
                className={cn(
                  "mt-2 inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em]",
                  verified
                    ? "bg-[#0A6B49]/10 text-[#0A6B49]"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {verified ? "Verified & closed" : session.status}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-[9px] bg-slate-100 px-4 py-3.5">
              <span className="text-[14px] font-semibold text-slate-700">
                Net variance ({currency}):
              </span>
              <span
                className={cn(
                  "font-mono text-[17px] font-bold tabular-nums",
                  varTone(netVariance),
                )}
              >
                {fmtVariance2(netVariance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Session audit trail ────────────────────────────────────── */}
      <Section title="Session" note="Open / close audit trail">
        <div className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-slate-200 sm:grid-cols-4">
          <SessCell
            label="Opened"
            value={fmtLongDate(session.openedAt)}
            sub={fmtClock(session.openedAt)}
          />
          <SessCell
            label="Closed"
            value={session.closedAt ? fmtLongDate(session.closedAt) : "In progress"}
            sub={session.closedAt ? fmtClock(session.closedAt) : "—"}
          />
          <SessWho label="Closed by" chip={closedBy} fallback={session.closedByLabel} />
          <SessWho
            label="Verified by"
            chip={verifier}
            fallback={verified ? "Verified" : "Not verified"}
          />
        </div>
      </Section>

      {/* ── Sales summary ──────────────────────────────────────────── */}
      <Section title="Sales summary" note={`All figures in ${currency}`}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <SumCard
            label="Gross sales"
            value={fmt2(sales?.gross)}
            unit={currency}
            sub={`${(report?.orderCount ?? 0).toLocaleString()} tickets${
              sales?.itemCount != null
                ? ` · ${sales.itemCount.toLocaleString()} items`
                : ""
            }`}
          />
          <SumCard
            label={report?.complimentaryAmount ? "Discounts + comps" : "Discounts"}
            value={`−${fmt2((sales?.discounts ?? 0) + (report?.complimentaryAmount ?? 0))}`}
            unit={currency}
            valueClass={WARN}
            sub={
              report?.complimentaryAmount
                ? `Discounts ${fmt2(sales?.discounts)} · Comps ${fmt2(report.complimentaryAmount)}`
                : sales?.discountCount
                  ? `${sales.discountCount} discount${sales.discountCount === 1 ? "" : "s"} applied`
                  : "Applied at point of sale"
            }
          />
          <SumCard
            label="Net sales collected"
            value={fmt2(sales?.net)}
            unit={currency}
            valueClass={POS}
            sub="Reconciled against cash-up below"
          />
        </div>
      </Section>

      {/* ── Cash-up by payment method (brand-themed, like GRN items) ── */}
      <Section
        title="Cash-up by payment method"
        count={`${reconciliations.length} method${reconciliations.length === 1 ? "" : "s"}`}
        note="Expected vs counted"
      >
        {reconciliations.length === 0 ? (
          <EmptyBox>No cash-up was recorded for this session.</EmptyBox>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-slate-200">
            <table className="w-full border-collapse [&_tbody_tr:last-child>td]:border-b-0">
              <thead>
                <tr>
                  <th className={HERO_TH} style={heroStyle}>
                    Payment method
                  </th>
                  <th className={cn(HERO_TH, "text-right")} style={heroStyle}>
                    Txns
                  </th>
                  <th className={cn(HERO_TH, "text-right")} style={heroStyle}>
                    Expected
                  </th>
                  <th className={cn(HERO_TH, "text-right")} style={heroStyle}>
                    Counted
                  </th>
                  <th className={cn(HERO_TH, "text-right")} style={heroStyle}>
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((r) => {
                  const variance = r.variance ?? 0;
                  const txns = r.paymentMethodId
                    ? txnsByMethodId.get(r.paymentMethodId)
                    : undefined;
                  const subtitle =
                    r.paymentMethodCode &&
                    r.paymentMethodCode !== r.paymentMethodName
                      ? r.paymentMethodCode
                      : (r.expectedSource ?? null);
                  return (
                    <tr key={r.id}>
                      <td className={TD}>
                        <div className={PRIM}>
                          {r.paymentMethodName ?? r.paymentMethodCode ?? "—"}
                        </div>
                        {subtitle && <div className={SUB}>{subtitle}</div>}
                      </td>
                      <td className={cn(TD, NUM)}>{txns != null ? txns : "—"}</td>
                      <td className={cn(TD, NUM)}>{fmt2(r.expectedAmount)}</td>
                      <td className={cn(TD, NUM)}>{fmt2(r.countedAmount)}</td>
                      <td className={cn(TD, NUM, varTone(variance))}>
                        {fmtVariance2(variance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <TFootLabel>Total collected</TFootLabel>
                  <TFootNum>{txnsTotal.toLocaleString()}</TFootNum>
                  <TFootNum>{fmt2(expectedTotal)}</TFootNum>
                  <TFootNum>{fmt2(countedTotal)}</TFootNum>
                  <td
                    className={cn(
                      "border-t-2 border-slate-300 bg-slate-50 px-[15px] py-3 text-right font-mono font-bold tabular-nums",
                      varTone(netVariance),
                    )}
                  >
                    {fmtVariance2(netVariance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>

      {/* ── Opening balance & discounts ────────────────────────────── */}
      {(till?.opening != null || (sales?.discounts ?? 0) > 0) && (
        <Section title="Opening balance & discounts">
          <TableBox>
            <thead>
              <tr>
                <th className={TH}>Item</th>
                <th className={TH}>Detail</th>
                <th className={cn(TH, "text-right")}>Count</th>
                <th className={cn(TH, "text-right")}>Amount ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {till?.opening != null && (
                <tr>
                  <td className={cn(TD, PRIM)}>Opening cash float</td>
                  <td className={cn(TD, "text-[12.5px] text-slate-700")}>
                    Issued to the till at open
                  </td>
                  <td className={cn(TD, NUM)}>—</td>
                  <td className={cn(TD, NUM)}>{fmt2(till.opening)}</td>
                </tr>
              )}
              {(sales?.discounts ?? 0) > 0 && (
                <tr>
                  <td className={cn(TD, PRIM)}>Discounts applied</td>
                  <td className={cn(TD, "text-[12.5px] text-slate-700")}>
                    Point-of-sale discounts
                  </td>
                  <td className={cn(TD, NUM)}>
                    {sales?.discountCount != null ? sales.discountCount : "—"}
                  </td>
                  <td className={cn(TD, NUM)}>{fmt2(sales?.discounts)}</td>
                </tr>
              )}
            </tbody>
          </TableBox>
        </Section>
      )}

      {/* ── Cancellations & voids ──────────────────────────────────── */}
      <Section
        title="Cancellations & voids"
        count={`${voidItems.length + cancelledOrders.length} record${
          voidItems.length + cancelledOrders.length === 1 ? "" : "s"
        }`}
        note="With reason & approval"
      >
        {voidItems.length === 0 && cancelledOrders.length === 0 ? (
          <EmptyBox>No voids or cancellations recorded this session.</EmptyBox>
        ) : (
          <TableBox>
            <thead>
              <tr>
                <th className={TH}>Ticket · item</th>
                <th className={TH}>Reason & staff</th>
                <th className={cn(TH, "text-right")}>Time</th>
                <th className={cn(TH, "text-right")}>Amount ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {voidItems.map((v) => (
                <tr key={`${v.orderId}:${v.orderItemId}`}>
                  <td className={TD}>
                    <div className={PRIM}>
                      #{v.orderNumber} · {v.itemName}
                      {v.quantity ? ` ×${v.quantity}` : ""}
                    </div>
                    <Chip tone="void">VOID</Chip>
                  </td>
                  <td className={TD}>
                    <div className="text-[12.5px] text-slate-700">
                      {v.voidReason
                        ? (VOID_REASON_LABELS[v.voidReason] ?? v.voidReason)
                        : "—"}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1">
                      <Appr label="Waiter" value={staffName(v.staffId, roster)} />
                      <Appr label="Cashier" value={staffName(v.removedBy, roster)} />
                      <Appr label="Approved" value={staffName(v.approvedBy, roster)} />
                    </div>
                  </td>
                  <td className={cn(TD, NUM)}>
                    {v.removedAt ? fmtClock(v.removedAt).slice(0, 5) : "—"}
                  </td>
                  <td className={cn(TD, NUM)}>{fmt2(v.netAmount)}</td>
                </tr>
              ))}
              {cancelledOrders.map((c) => (
                <tr key={c.orderId}>
                  <td className={TD}>
                    <div className={PRIM}>#{c.orderNumber} · Full ticket</div>
                    <Chip tone="void">CANCELLED</Chip>
                  </td>
                  <td className={TD}>
                    <div className="text-[12.5px] text-slate-700">
                      {c.cancellationReason ?? "—"}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1">
                      <Appr
                        label="Cancelled by"
                        value={staffName(c.cancelledBy, roster)}
                      />
                    </div>
                  </td>
                  <td className={cn(TD, NUM)}>
                    {c.cancelledAt ? fmtClock(c.cancelledAt).slice(0, 5) : "—"}
                  </td>
                  <td className={cn(TD, NUM)}>{fmt2(c.netAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <TFootLabel colSpan={3}>Total voided / cancelled</TFootLabel>
                <TFootNum>
                  {fmt2((extras.voids?.totalVoidedAmount ?? 0) + cancelledTotal)}
                </TFootNum>
              </tr>
            </tfoot>
          </TableBox>
        )}
      </Section>

      {/* ── Customer prepayments ───────────────────────────────────── */}
      <Section
        title="Customer prepayments"
        count={`${prepayItems.length} record${prepayItems.length === 1 ? "" : "s"}`}
      >
        {prepayItems.length === 0 ? (
          <EmptyBox>No prepayments recorded this session.</EmptyBox>
        ) : (
          <TableBox>
            <thead>
              <tr>
                <th className={TH}>Customer · reference</th>
                <th className={TH}>Method</th>
                <th className={TH}>Status</th>
                <th className={cn(TH, "text-right")}>Amount ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {prepayItems.map((p, i) => {
                const held = p.status === "HELD";
                const method = p.paymentMethodId
                  ? (methodNameById.get(p.paymentMethodId) ?? "—")
                  : "—";
                return (
                  <tr key={`${p.instrumentId}-${i}`}>
                    <td className={TD}>
                      <div className={PRIM}>
                        {p.customerName ?? "Walk-in customer"}
                      </div>
                      {(p.reference || p.description) && (
                        <div className={SUB}>
                          {[p.reference, p.description].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className={cn(TD, "text-[12.5px] text-slate-700")}>{method}</td>
                    <td className={TD}>
                      <Chip tone={held ? "held" : "applied"}>
                        {held ? "HELD" : "APPLIED"}
                      </Chip>
                    </td>
                    <td className={cn(TD, NUM)}>{fmt2(p.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
            {extras.prepayments?.totals && (
              <tfoot>
                <tr>
                  <TFootLabel colSpan={3}>
                    Total received · Held {fmt2(extras.prepayments.totals.heldTotal)} ·
                    Applied {fmt2(extras.prepayments.totals.appliedTotal)}
                  </TFootLabel>
                  <TFootNum>{fmt2(extras.prepayments.totals.totalReceived)}</TFootNum>
                </tr>
              </tfoot>
            )}
          </TableBox>
        )}
      </Section>

      {/* ── Refunds ────────────────────────────────────────────────── */}
      <Section
        title="Refunds"
        count={`${refundItems.length} record${refundItems.length === 1 ? "" : "s"}`}
      >
        {refundItems.length === 0 ? (
          <EmptyBox>No refunds recorded this session.</EmptyBox>
        ) : (
          <TableBox>
            <thead>
              <tr>
                <th className={TH}>Item</th>
                <th className={TH}>Reason & approver</th>
                <th className={TH}>Method</th>
                <th className={cn(TH, "text-right")}>Amount ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {refundItems.map((r) => (
                <tr key={r.id}>
                  <td className={cn(TD, PRIM)}>
                    {r.orderNumber ? `#${r.orderNumber} · ` : ""}
                    {r.itemName ?? `Item #${shortId(r.orderItemId)}`}
                    {r.quantity ? ` ×${r.quantity}` : ""}
                  </td>
                  <td className={TD}>
                    <div className="text-[12.5px] text-slate-700">
                      {r.reason ?? "—"}
                    </div>
                    <div className="mt-1.5">
                      <Appr label="Approved" value={staffName(r.approvedBy, roster)} />
                    </div>
                  </td>
                  <td className={cn(TD, "text-[12.5px] text-slate-700")}>
                    {r.paymentMethodCode ?? "—"}
                  </td>
                  <td className={cn(TD, NUM)}>{fmt2(r.refundAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <TFootLabel colSpan={3}>Total refunded</TFootLabel>
                <TFootNum>{fmt2(extras.refunds?.totalAmount)}</TFootNum>
              </tr>
            </tfoot>
          </TableBox>
        )}
      </Section>

      {/* ── Expenses ───────────────────────────────────────────────── */}
      <Section
        title="Expenses"
        count={`${expenseItems.length} record${expenseItems.length === 1 ? "" : "s"}`}
        note="Paid & unpaid"
      >
        {expenseItems.length === 0 ? (
          <EmptyBox>No expenses recorded this session.</EmptyBox>
        ) : (
          <TableBox>
            <thead>
              <tr>
                <th className={TH}>Description</th>
                <th className={TH}>Category · payee</th>
                <th className={TH}>Status</th>
                <th className={cn(TH, "text-right")}>Amount ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {expenseItems.map((e) => {
                const methods = e.paymentMethodCodes?.length
                  ? e.paymentMethodCodes.join(" + ")
                  : null;
                const tone =
                  e.paymentStatus === "PAID"
                    ? "paid"
                    : e.paymentStatus === "UNPAID"
                      ? "unpaid"
                      : "held";
                const label =
                  e.paymentStatus === "PAID"
                    ? methods
                      ? `PAID · ${methods}`
                      : "PAID"
                    : e.paymentStatus === "UNPAID"
                      ? "UNPAID"
                      : "PART-PAID";
                return (
                  <tr key={e.expenseId}>
                    <td className={cn(TD, PRIM)}>
                      {e.description ?? e.expenseNumber}
                    </td>
                    <td className={cn(TD, "text-[12.5px] text-slate-700")}>
                      {[e.categoryName, e.payeeName].filter(Boolean).join(" · ") ||
                        "Uncategorised"}
                    </td>
                    <td className={TD}>
                      <Chip tone={tone}>{label}</Chip>
                    </td>
                    <td className={cn(TD, NUM)}>{fmt2(e.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
            {extras.expenses?.totals && (
              <tfoot>
                <tr>
                  <TFootLabel colSpan={3}>
                    Total · Paid cash {fmt2(extras.expenses.totals.paidByCash)} · Paid
                    mobile {fmt2(extras.expenses.totals.paidByMobile)} · Paid other{" "}
                    {fmt2(extras.expenses.totals.paidByOther)} · Unpaid{" "}
                    {fmt2(extras.expenses.totals.unpaidTotal)}
                  </TFootLabel>
                  <TFootNum>{fmt2(extras.expenses.totals.totalAmount)}</TFootNum>
                </tr>
              </tfoot>
            )}
          </TableBox>
        )}
      </Section>

      {/* ── Cash drawer reconciliation ─────────────────────────────── */}
      {till && (
        <Section title="Cash drawer reconciliation">
          <div className="flex justify-end">
            <div className="w-full max-w-[380px]">
              <ReconRow k="Opening float" v={fmt2(till.opening)} />
              <ReconRow k="+ Cash sales collected" v={fmt2(cashSales)} />
              {cashPrepay > 0 && (
                <ReconRow k="+ Cash prepayments" v={fmt2(cashPrepay)} />
              )}
              <ReconRow k="− Cash refunds" v={fmt2(cashRefunds)} />
              <ReconRow k="− Cash expenses (paid)" v={fmt2(cashExpenses)} />
              <ReconRow k="Expected in drawer" v={fmt2(till.expected)} />
              <ReconRow k="Counted in drawer" v={fmt2(till.counted)} />
              <ReconRow
                k="Cash variance"
                v={fmtVariance2(till.variance)}
                grand
                tone={varTone(till.variance ?? 0)}
              />
            </div>
          </div>
        </Section>
      )}

      {/* Trailing spacer so the sections don't butt against the footer. */}
      <div className="pt-6" />

      {/* ── Signatures + Powered by Settlo (shared component) ───────── */}
      <NotesFooter signatures={signatures} footerMessage="" />
    </>
  );
}

// ── Local presentational helpers (shared-document slate palette) ─────

function Section({
  title,
  count,
  note,
  children,
}: {
  title: string;
  count?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-10 pt-[30px]">
      <div className="mb-3 flex items-baseline gap-2.5">
        <h3 className="m-0 font-mono text-[12px] font-semibold uppercase tracking-[0.13em] text-slate-700">
          {title}
        </h3>
        {count && <span className="font-mono text-[11px] text-slate-400">{count}</span>}
        {note && <span className="ml-auto text-[12px] text-slate-400">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function TableBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-slate-200">
      <table className="w-full border-collapse [&_tbody_tr:last-child>td]:border-b-0">
        {children}
      </table>
    </div>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-[15px] py-5 text-center text-[13px] text-slate-500">
      {children}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-[5px] text-[14px]">
      <span className="text-slate-600">{k}</span>
      <span className="text-right font-semibold text-slate-900">{v}</span>
    </div>
  );
}

function SessCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border-b border-r border-slate-200 px-4 py-3.5 last:border-r-0 sm:border-b-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r [&:nth-child(3)]:border-b-0">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 text-[15px] font-bold tracking-[-0.01em]">{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[11.5px] text-slate-600">{sub}</div>}
    </div>
  );
}

function SessWho({
  label,
  chip,
  fallback,
}: {
  label: string;
  chip: StaffChip | null;
  fallback?: string | null;
}) {
  return (
    <div className="border-b border-r border-slate-200 px-4 py-3.5 last:border-r-0 sm:border-b-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r [&:nth-child(3)]:border-b-0">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>
      {chip ? (
        <div className="mt-1.5 flex items-center gap-2.5">
          <span
            className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ background: chip.color }}
          >
            {chip.initials}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold">{chip.name}</div>
            {chip.title && (
              <div className="truncate text-[11px] text-slate-400">{chip.title}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-1.5 text-[15px] font-bold tracking-[-0.01em] text-slate-500">
          {fallback ?? "—"}
        </div>
      )}
    </div>
  );
}

function SumCard({
  label,
  value,
  unit,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[10px] border border-slate-200 px-4 py-3.5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-[22px] font-bold tabular-nums tracking-[-0.02em]",
          valueClass ?? "text-slate-900",
        )}
      >
        {value}
        <span className="ml-1 text-[11px] font-medium text-slate-400">{unit}</span>
      </div>
      {sub && <div className="mt-1.5 text-[11.5px] text-slate-600">{sub}</div>}
    </div>
  );
}

const CHIP_TONE: Record<string, string> = {
  paid: "bg-[#0A6B49]/10 text-[#0A6B49]",
  applied: "bg-[#0A6B49]/10 text-[#0A6B49]",
  unpaid: "bg-[#B9791F]/10 text-[#B9791F]",
  held: "bg-[#3B6FB0]/10 text-[#3B6FB0]",
  void: "bg-[#C0392B]/10 text-[#C0392B]",
};

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "mt-1.5 inline-flex h-5 items-center rounded-[5px] px-2 font-mono text-[10px] font-semibold tracking-[0.03em]",
        CHIP_TONE[tone] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {children}
    </span>
  );
}

function Appr({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[11.5px] text-slate-400">
      {label} <b className="font-semibold text-slate-700">{value}</b>
    </span>
  );
}

function TFootLabel({
  colSpan,
  children,
}: {
  colSpan?: number;
  children: React.ReactNode;
}) {
  return (
    <td
      colSpan={colSpan}
      className="border-t-2 border-slate-300 bg-slate-50 px-[15px] py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-700"
    >
      {children}
    </td>
  );
}

function TFootNum({ children }: { children: React.ReactNode }) {
  return (
    <td className="border-t-2 border-slate-300 bg-slate-50 px-[15px] py-3 text-right font-mono font-bold tabular-nums">
      {children}
    </td>
  );
}

function ReconRow({
  k,
  v,
  grand,
  tone,
}: {
  k: string;
  v: string;
  grand?: boolean;
  tone?: string;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4 py-[9px] text-[14px]",
        grand
          ? "mt-0.5 border-t-2 border-slate-300 pt-3.5"
          : "border-b border-slate-200",
      )}
    >
      <span
        className={cn(grand ? "text-[16px] font-bold text-slate-900" : "text-slate-600")}
      >
        {k}
      </span>
      <span
        className={cn(
          "font-mono font-semibold tabular-nums",
          grand ? "text-[18px] font-bold" : "",
          tone ?? "text-slate-900",
        )}
      >
        {v}
      </span>
    </div>
  );
}
