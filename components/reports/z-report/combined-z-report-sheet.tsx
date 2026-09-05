/**
 * Combined daily Z-report — the printable A4 body.
 *
 * Server component rendered inside `PrintableDocument`'s A4 sheet, using the
 * same shared-document frame as the Close-of-Day report: `DocumentHeader`
 * letterhead at the top, `NotesFooter` signatures at the bottom, slate
 * document palette with the tenant brand colour on the title only.
 *
 * <p>Where the Close-of-Day sheet documents ONE session, this documents one
 * DATE — every session of that business day rolled up — and sets it against
 * the TRA fiscal Z, which exists only per fiscal day and so has no
 * session-level counterpart at all.
 */

import * as React from "react";

import { cn } from "@/lib/utils";
import { composeLetterheadAddress } from "@/lib/grn-document";
import { isDisplayableImageUrl } from "@/lib/image-url";
import { DocumentHeader } from "@/components/documents/sections/DocumentHeader";
import { NotesFooter } from "@/components/documents/sections/NotesFooter";
import {
  ReportKv as Kv,
  ReportSection as Section,
  ReportSumCard as SumCard,
  ReportTableBox as TableBox,
} from "@/components/documents/sections/report-blocks";
import type {
  BusinessIdentity,
  DocumentMeta,
} from "@/components/documents/types";
import type { LocationLetterhead } from "@/types/letterhead/type";
import type { ZReportDayDetail } from "@/types/reports/z-report";
import { vfdSalesFigure } from "@/lib/z-report/aggregate";
import {
  fmt2,
  fmtBusinessDate,
  fmtClock,
  fmtDateTimeShort,
  shortId,
} from "@/lib/day-sessions/cod-format";

// Default Settlo brand (matches lib/grn-document.ts) when the tenant
// letterhead carries no brand colour.
const SETTLO_PRIMARY = "#ED7B40";

// Status accent colours — fixed hex, print-safe (never theme-flip).
const POS = "text-[#0A6B49]";
const WARN = "text-[#B9791F]";

/** Under a shilling of drift between two systems is not a finding. */
const balanced = (value: number) => Math.abs(value) < 1;

const signed2 = (value: number) => `${value > 0 ? "+" : ""}${fmt2(value)}`;

export function CombinedZReportSheet({
  day,
  locationName,
  letterhead,
  generatedAt,
}: {
  day: ZReportDayDetail;
  locationName: string | null;
  letterhead: LocationLetterhead | null;
  generatedAt: string;
}) {
  const lh = letterhead?.letterhead ?? null;
  const taxIds = letterhead?.taxIds ?? null;
  const businessName = lh?.businessName ?? locationName ?? "Business";
  const primaryColor =
    letterhead?.brand?.primaryColor?.trim() || SETTLO_PRIMARY;

  const issuer: BusinessIdentity = {
    name: businessName,
    // Migrated tenants can still hold a logo URL on a retired upload host;
    // handing that to next/image costs a doomed round-trip and prints a
    // broken box at the top of a filed document.
    logoUrl: isDisplayableImageUrl(lh?.logoUrl) ? lh.logoUrl : undefined,
    addressLines: composeLetterheadAddress(lh),
    phone: lh?.phone ?? undefined,
    email: lh?.email ?? undefined,
    website: lh?.website ?? undefined,
    tin: taxIds?.tin ?? undefined,
    vrn: taxIds?.vrn ?? undefined,
  };
  const meta: DocumentMeta = {
    type: "statement",
    titleOverride: "Daily Z-Report",
    documentNumber: day.date,
    issueDate: day.date,
  };

  const { local, aggregate, vfd, variance, currency } = day;
  const netCollected = aggregate?.sales.netCollected ?? local?.net ?? 0;
  const fiscalSales = vfd ? vfdSalesFigure(vfd) : null;

  // The headline fiscal state, printed as a pill next to the meta block so
  // whoever files the page sees it without reading the tables. Null when the
  // location has no fiscal device: the document is then a plain daily
  // Z-report and says nothing about TRA at all. A registered location whose
  // device issued no Z for the date is the one warning worth printing.
  const state: { label: string; tone: "ok" | "warn" } | null = !vfd
    ? day.vfdAvailability === "available"
      ? { label: "No fiscal Z for this date", tone: "warn" }
      : null
    : variance && balanced(variance.sales) && variance.receipts === 0
      ? { label: "Reconciled with TRA", tone: "ok" }
      : { label: "Differs from TRA", tone: "warn" };

  const paymentTotal = (aggregate?.paymentsByMethod ?? []).reduce(
    (sum, pm) => sum + pm.amount,
    0,
  );

  return (
    <>
      <DocumentHeader issuer={issuer} meta={meta} titleColor={primaryColor} />

      {/* ── Meta ───────────────────────────────────────────────────── */}
      <div className="px-10 pb-2 pt-7">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
          <div>
            <div className="mb-1.5 text-[12.5px] text-slate-500">Location</div>
            <div className="text-[17px] font-bold tracking-[-0.01em]">
              {locationName ?? businessName}
            </div>
            <div className="mt-3 text-[13px] text-slate-500">
              {local
                ? `${local.sessionCount} day ${local.sessionCount === 1 ? "session" : "sessions"} on this business date`
                : "No day session recorded on this date"}
            </div>
            {aggregate?.preliminary && (
              <div className={cn("mt-1 text-[12.5px]", WARN)}>
                A session was still open when this was generated — figures are
                provisional.
              </div>
            )}
            {aggregate && aggregate.missingSessionCount > 0 && (
              <div className={cn("mt-1 text-[12.5px]", WARN)}>
                {aggregate.missingSessionCount} session
                {aggregate.missingSessionCount === 1 ? "" : "s"} missing from
                analytics — totals under-count.
              </div>
            )}
          </div>
          <div>
            <Kv k="Business date" v={fmtBusinessDate(day.date)} />
            {vfd && <Kv k="Fiscal Z issued" v={vfd.zrTime ?? "—"} />}
            <Kv k="Generated" v={fmtDateTimeShort(generatedAt)} />
            {state && (
              <div className="sm:text-right">
                <span
                  className={cn(
                    "mt-2 inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em]",
                    state.tone === "ok"
                      ? "bg-[#0A6B49]/10 text-[#0A6B49]"
                      : "bg-[#B9791F]/10 text-[#B9791F]",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {state.label}
                </span>
              </div>
            )}
            {variance && (
              <div className="mt-4 flex items-center justify-between gap-4 rounded-[9px] bg-slate-100 px-4 py-3.5">
                <span className="text-[14px] font-semibold text-slate-700">
                  Sales difference ({currency}):
                </span>
                <span
                  className={cn(
                    "font-mono text-[17px] font-bold tabular-nums",
                    balanced(variance.sales) ? POS : WARN,
                  )}
                >
                  {balanced(variance.sales) ? fmt2(0) : signed2(variance.sales)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sales summary ──────────────────────────────────────────── */}
      <Section title="Sales summary" note={`All figures in ${currency}`}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <SumCard
            label="Gross sales"
            value={fmt2(aggregate?.sales.gross ?? local?.gross)}
            unit={currency}
            sub={`${(local?.orderCount ?? 0).toLocaleString()} tickets${
              aggregate?.sales.itemCount
                ? ` · ${aggregate.sales.itemCount.toLocaleString()} items`
                : ""
            }`}
          />
          <SumCard
            label="Discounts"
            value={`−${fmt2(aggregate?.sales.discounts ?? local?.discounts)}`}
            unit={currency}
            sub="off list price"
          />
          <SumCard
            label="Net sales"
            value={fmt2(local?.net ?? aggregate?.sales.net)}
            unit={currency}
            sub="billed value, comps included"
          />
          <SumCard
            label="Net collected"
            value={fmt2(netCollected)}
            unit={currency}
            sub={
              aggregate?.complimentaryAmount
                ? `less ${fmt2(aggregate.complimentaryAmount)} comped`
                : "no comps"
            }
          />
          <SumCard
            label="Tax charged"
            value={fmt2(local?.taxAmount)}
            unit={currency}
            sub={`on ${fmt2(local?.taxableAmount)} taxable`}
          />
          <SumCard
            label="Cash net"
            value={fmt2(aggregate?.cashNet)}
            unit={currency}
            sub="cash in less cash out"
          />
        </div>
      </Section>

      {/* ── Settlo vs TRA — only when the device issued a Z ───────── */}
      {vfd && (
        <Section
          title="Settlo vs TRA"
          note={`Fiscal Z ${vfd.zrDate}${vfd.status ? ` · ${vfd.status}` : ""}`}
        >
          <TableBox>
            <thead>
              <tr className="bg-slate-50 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">
                  Figure
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Settlo
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  VFD
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              <CompareRow
                label="Sales (VAT inclusive)"
                settlo={local?.net ?? null}
                fiscal={fiscalSales}
                delta={variance?.sales ?? null}
              />
              <CompareRow
                label="Tax"
                settlo={local?.taxAmount ?? null}
                fiscal={vfd?.totalTax ?? null}
                delta={variance?.tax ?? null}
              />
              <CompareRow
                label="Discounts"
                settlo={local?.discounts ?? null}
                fiscal={vfd?.totalDiscount ?? null}
                delta={
                  local && vfd
                    ? local.discounts - (vfd.totalDiscount ?? 0)
                    : null
                }
              />
              <CompareRow
                label="Orders / fiscal receipts"
                settlo={local?.orderCount ?? null}
                fiscal={vfd?.totalReceipt ?? null}
                delta={variance?.receipts ?? null}
                integer
              />
            </tbody>
          </TableBox>

          <>
            <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-1.5 rounded-[10px] border border-slate-200 px-4 py-3 text-[12px]">
              <Raw label="Total sales" value={vfd.totalSales} />
              <Raw label="Sales VAT inc." value={vfd.totalSalesVatInc} />
              <Raw label="Sales VAT exc." value={vfd.totalSalesVatExc} />
              <Raw label="Net amount" value={vfd.totalNetAmount} />
              <Raw label="Gross" value={vfd.gross} />
              <Raw label="Tax" value={vfd.totalTax} />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              The comparison reads the device&apos;s VAT-inclusive sales, which
              is what Settlo bills at; every figure the device reported is
              printed above so the choice stays checkable. Fiscal days are
              struck in EAT by the device and business days by this
              location&apos;s session, so a session running past midnight posts
              its late receipts under the next fiscal date.
            </p>
          </>
        </Section>
      )}

      {/* ── Sessions ───────────────────────────────────────────────── */}
      {local && local.sessions.length > 0 && (
        <Section
          title="Sessions"
          count={`${local.sessionCount}`}
          note="Each settles independently"
        >
          <TableBox>
            <thead>
              <tr className="bg-slate-50 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">
                  Session
                </th>
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">
                  Opened
                </th>
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">
                  Closed
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Orders
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Net sales
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {local.sessions.map((session) => (
                <tr key={session.sessionId}>
                  <td className="border-b border-slate-100 px-3 py-2 font-mono text-[11px]">
                    {shortId(session.sessionId)}
                    {session.status === "OPEN" && (
                      <span className={cn("ml-2 text-[10px]", WARN)}>open</span>
                    )}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    {fmtClock(session.openedAt)}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    {session.closedAt ? fmtClock(session.closedAt) : "—"}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">
                    {session.orderCount}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">
                    {fmt2(session.netSales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableBox>
        </Section>
      )}

      {/* ── Payments ───────────────────────────────────────────────── */}
      {aggregate && aggregate.paymentsByMethod.length > 0 && (
        <Section title="Payments" note={`All figures in ${currency}`}>
          <TableBox>
            <thead>
              <tr className="bg-slate-50 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">
                  Method
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Count
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Amount
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Tips
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {aggregate.paymentsByMethod.map((pm) => (
                <tr key={pm.paymentMethodId ?? pm.paymentMethodCode}>
                  <td className="border-b border-slate-100 px-3 py-2">
                    {pm.paymentMethodName ?? pm.paymentMethodCode ?? "—"}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">
                    {pm.count}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right font-semibold tabular-nums">
                    {fmt2(pm.amount)}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">
                    {pm.tips ? fmt2(pm.tips) : "—"}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="px-3 py-2 font-semibold">Total</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {aggregate.paymentsByMethod.reduce(
                    (s, pm) => s + pm.count,
                    0,
                  )}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {fmt2(paymentTotal)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt2(aggregate.sales.tips)}
                </td>
              </tr>
            </tbody>
          </TableBox>
        </Section>
      )}

      {/* ── Movements ──────────────────────────────────────────────── */}
      {aggregate && (
        <Section title="Day movements" note={`All figures in ${currency}`}>
          <TableBox>
            <tbody className="text-[13px]">
              <MovementRow
                label="Refunds"
                note={`${aggregate.refunds.count} refunded`}
                value={aggregate.refunds.amount}
              />
              <MovementRow
                label="Complimentary"
                note={`${aggregate.complimentaryCount} orders on the house`}
                value={aggregate.complimentaryAmount}
              />
              <MovementRow
                label="Voided items"
                note={`${aggregate.voids.voidedItemCount} items`}
                value={aggregate.voids.voidedAmount}
              />
              <MovementRow
                label="Cancelled orders"
                note={`${aggregate.voids.cancelledOrderCount} orders`}
                value={aggregate.voids.cancelledAmount}
              />
              <MovementRow
                label="Expenses paid out"
                note={`${aggregate.expenses.count} payments`}
                value={aggregate.expenses.amount}
              />
              <MovementRow
                label="Cost of goods sold"
                note="cost of what sold"
                value={aggregate.cogs}
              />
              <MovementRow
                label="Gross profit"
                note="collected less COGS and expenses"
                value={aggregate.grossProfit}
                emphasise
              />
            </tbody>
          </TableBox>
        </Section>
      )}

      {/* ── Tax split ──────────────────────────────────────────────── */}
      {day.taxByCode.length > 0 && (
        <Section title="Tax by code" note="As charged on orders">
          <TableBox>
            <thead>
              <tr className="bg-slate-50 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">
                  Code
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Taxable
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                  Tax
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {day.taxByCode.map((code) => (
                <tr key={`${code.taxCode}-${code.taxName ?? ""}`}>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <span className="font-semibold">
                      {code.taxCode || "Unclassified"}
                    </span>
                    {code.taxName && (
                      <span className="ml-2 text-[11px] text-slate-500">
                        {code.taxName}
                      </span>
                    )}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">
                    {fmt2(code.taxableAmount)}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right font-semibold tabular-nums">
                    {fmt2(code.taxAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableBox>
        </Section>
      )}

      {/* Trailing spacer so the sections don't butt against the footer. */}
      <div className="pt-6" />

      <NotesFooter
        signatures={[{ label: "Prepared by" }, { label: "Verified by" }]}
        footerMessage=""
      />
    </>
  );
}

function CompareRow({
  label,
  settlo,
  fiscal,
  delta,
  integer = false,
}: {
  label: string;
  settlo: number | null;
  fiscal: number | null;
  delta: number | null;
  integer?: boolean;
}) {
  const show = (value: number | null) =>
    value === null ? "—" : integer ? value.toLocaleString() : fmt2(value);

  return (
    <tr>
      <td className="border-b border-slate-100 px-3 py-2">{label}</td>
      <td className="border-b border-slate-100 px-3 py-2 text-right font-semibold tabular-nums">
        {show(settlo)}
      </td>
      <td className="border-b border-slate-100 px-3 py-2 text-right font-semibold tabular-nums">
        {show(fiscal)}
      </td>
      <td
        className={cn(
          "border-b border-slate-100 px-3 py-2 text-right tabular-nums",
          delta === null
            ? "text-slate-400"
            : balanced(delta)
              ? POS
              : cn(WARN, "font-semibold"),
        )}
      >
        {delta === null
          ? "n/a"
          : balanced(delta)
            ? "0"
            : integer
              ? `${delta > 0 ? "+" : ""}${delta}`
              : signed2(delta)}
      </td>
    </tr>
  );
}

function MovementRow({
  label,
  note,
  value,
  emphasise = false,
}: {
  label: string;
  note: string;
  value: number;
  emphasise?: boolean;
}) {
  return (
    <tr className={emphasise ? "bg-slate-50" : undefined}>
      <td className="border-b border-slate-100 px-3 py-2">
        <span className={emphasise ? "font-semibold" : undefined}>{label}</span>
        <span className="ml-2 text-[11px] text-slate-500">{note}</span>
      </td>
      <td className="border-b border-slate-100 px-3 py-2 text-right font-semibold tabular-nums">
        {fmt2(value)}
      </td>
    </tr>
  );
}

function Raw({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums">{fmt2(value)}</span>
    </div>
  );
}
