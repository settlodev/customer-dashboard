/**
 * TRA fiscal (VFD) tax receipt — the formal A4 body rendered inside
 * `PrintableDocument`'s children slot (same toolbar + A4 sheet + print
 * stylesheet as the Close-of-Day report / GRN delivery note). Server
 * component: no hooks, all data comes in as props from the printable
 * routes (`app/(printables)/orders/[id]/vfd/page.tsx` and
 * `app/(printables)/invoices/[id]/vfd/page.tsx`).
 *
 * The fiscal payload is the same for an order and an invoice; only the
 * SUBJECT differs (what was sold, to whom, paid how). `VfdReceiptSubject`
 * is that neutral shape — build it with `orderToVfdSubject` /
 * `invoiceToVfdSubject`.
 *
 * Money and dates reuse the same "formal printed report" helpers as the
 * Close-of-Day report (`lib/day-sessions/cod-format.ts`) — bare grouped
 * two-decimal numbers with the currency named in the section/column
 * headers, not a per-value currency symbol.
 */

import Image from "next/image";

import { cn } from "@/lib/utils";
import {
  fmt2,
  fmtBusinessDate,
  fmtDateTimeShort,
} from "@/lib/day-sessions/cod-format";
import { VfdReceiptQr } from "./vfd-receipt-qr";
import type {
  OrderDetail,
  VfdPrintResponse,
  VfdReceiptDetail,
} from "@/types/orders/type";
import type {
  Invoice,
  InvoicePayment,
  InvoiceVfdPrintResponse,
} from "@/types/invoicing/type";

/** What the receipt is FOR, independent of whether it was an order or an invoice. */
export interface VfdReceiptSubject {
  /** e.g. "Order #" / "Invoice" */
  numberLabel: string;
  number: string;
  businessDate?: string | null;
  /** When the sale closed / the invoice was issued. */
  closedAt?: string | null;
  closedLabel: string;
  servedBy?: string | null;
  customer?: { name?: string | null; phone?: string | null } | null;
  items: Array<{
    id: string;
    name: string;
    quantity?: number | null;
    unitPrice?: number | null;
    amount?: number | null;
  }>;
  payments: Array<{
    id: string;
    method?: string | null;
    amount?: number | null;
    at?: string | null;
  }>;
}

/** The fiscal half, common to `VfdPrintResponse` (orders) and `InvoiceVfdPrintResponse`. */
export interface VfdReceiptPayload {
  fiscalReceiptNumber: string | null;
  signedAt: string | null;
  verificationUrl: string | null;
  receipt?: VfdReceiptDetail | null;
}

const TH =
  "border-b border-slate-200 bg-slate-100 px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 whitespace-nowrap";
const TD = "border-b border-slate-200 px-3 py-2.5 align-top text-[12.5px]";
const NUM = "text-right font-mono tabular-nums whitespace-nowrap";

// Quantities keep fractions (weighed items etc.) unlike money's integer form.
const qtyFmt = (q?: number | null): string =>
  (q ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const CONFIRMED_TX_STATUSES = new Set([
  "PAID",
  "CONFIRMED",
  "SUCCESS",
  "COMPLETED",
  "APPROVED",
]);

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5 text-[12.5px]">
      <span className="text-slate-500">{k}</span>
      <span className="text-right font-medium text-slate-900">{v}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-10 py-5">
      <h2 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function orderToVfdSubject(order: OrderDetail): VfdReceiptSubject {
  const confirmedPayments = (order.transactions ?? []).filter((t) =>
    CONFIRMED_TX_STATUSES.has((t.status ?? "").toUpperCase()),
  );
  return {
    numberLabel: "Order #",
    number: order.orderNumber,
    businessDate: order.businessDate,
    closedAt: order.closedDate,
    closedLabel: "Closed",
    servedBy:
      order.finishedBy?.name ?? order.assignedTo?.name ?? order.startedBy?.name,
    customer: order.customer?.name
      ? { name: order.customer.name, phone: order.customer.phone }
      : null,
    items: (order.items ?? []).map((item) => ({
      id: String(item.id),
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.netAmount,
    })),
    payments: confirmedPayments.map((t) => ({
      id: String(t.id),
      method: t.paymentMethodName,
      amount: t.amount,
      at: t.createdAt,
    })),
  };
}

const humanise = (code?: string | null) => {
  const raw = code?.trim();
  if (!raw) return null;
  const words = raw.replace(/[-_]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export function invoiceToVfdSubject(
  invoice: Invoice,
  payments: InvoicePayment[],
): VfdReceiptSubject {
  return {
    numberLabel: "Invoice",
    number: invoice.invoiceNumber,
    businessDate: invoice.businessDate ?? invoice.issueDate,
    closedAt: invoice.issueDate,
    closedLabel: "Issued",
    servedBy: null,
    customer: invoice.customerName
      ? { name: invoice.customerName, phone: invoice.customerPhone }
      : null,
    items: (invoice.lines ?? []).map((l) => ({
      id: l.id,
      name: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: l.lineTotal,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      method: humanise(p.paymentMethodCode ?? p.paymentMethod),
      amount: p.amount,
      at: p.paymentDate,
    })),
  };
}

export function VfdReceiptSheet({
  subject,
  vfd,
  currency,
}: {
  subject: VfdReceiptSubject;
  vfd: VfdPrintResponse | InvoiceVfdPrintResponse | VfdReceiptPayload;
  currency: string;
}) {
  const receipt = vfd.receipt ?? null;
  const vfdInfo = receipt?.vfdInformation ?? null;
  const clientInfo = receipt?.clientInformation ?? null;
  const data = receipt?.data ?? null;
  const totals = receipt?.totals ?? null;
  const vatTotals = receipt?.vatTotals ?? [];

  const tradingName = vfdInfo?.tradingName ?? clientInfo?.businessName ?? "—";
  const businessName = clientInfo?.businessName;
  const showBusinessName = businessName && businessName !== tradingName;
  const vfdAddress =
    [vfdInfo?.street, vfdInfo?.physicalAddress].filter(Boolean).join(", ") ||
    null;
  const addressLine = clientInfo?.physicalAddress ?? vfdAddress;
  const mobile = clientInfo?.mobile ?? vfdInfo?.mobile ?? null;
  const vrnDisplay = vfdInfo?.vrn ? vfdInfo.vrn : "NOT REGISTERED";

  const servedBy = subject.servedBy;
  const confirmedPayments = subject.payments;

  const verificationUrl = data?.traReceiptVerificationUrl ?? vfd.verificationUrl;
  const verificationCode = data?.traReceiptVerificationCode;
  const rctNum = data?.rctNum ?? vfd.fiscalReceiptNumber;
  const zNum = data?.zNum;
  const receiptDateTime = data?.dateTime ?? vfd.signedAt;

  return (
    <>
      {/* ── Header: seller identity + document title ──────────────── */}
      <header className="flex items-start justify-between gap-8 border-b border-slate-200 px-10 pb-6 pt-10">
        <div className="max-w-[60%]">
          <div className="text-[17px] font-bold tracking-[-0.01em] text-slate-900">
            {tradingName}
          </div>
          {showBusinessName && (
            <div className="text-[12.5px] text-slate-600">{businessName}</div>
          )}
          <div className="mt-2 space-y-0.5 text-[12px] leading-relaxed text-slate-600">
            {addressLine && <div>{addressLine}</div>}
            {mobile && <div>Mobile: {mobile}</div>}
            {clientInfo?.email && <div>{clientInfo.email}</div>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-light tracking-wide text-slate-900">
            TAX RECEIPT
          </h1>
          <div className="mt-3 space-y-0.5 text-[11.5px] text-slate-600">
            <div>TIN: {vfdInfo?.tin ?? "—"}</div>
            <div>VRN: {vrnDisplay}</div>
            <div>UIN: {vfdInfo?.uin ?? "—"}</div>
            <div>Tax Office: {vfdInfo?.taxOffice ?? "—"}</div>
          </div>
        </div>
      </header>

      {/* ── Subject meta ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 px-10 py-5 sm:grid-cols-2">
        <div>
          <Kv k={subject.numberLabel} v={subject.number} />
          <Kv k="Business date" v={fmtBusinessDate(subject.businessDate)} />
          <Kv k={subject.closedLabel} v={fmtDateTimeShort(subject.closedAt)} />
          {servedBy && <Kv k="Served by" v={servedBy} />}
        </div>
        {subject.customer?.name && (
          <div>
            <Kv k="Customer" v={subject.customer.name} />
            {subject.customer.phone && (
              <Kv k="Phone" v={subject.customer.phone} />
            )}
          </div>
        )}
      </div>

      {/* ── Items ───────────────────────────────────────────────────── */}
      <Section title="Items sold">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TH}>Item</th>
              <th className={cn(TH, "text-right")}>Qty</th>
              <th className={cn(TH, "text-right")}>Unit price ({currency})</th>
              <th className={cn(TH, "text-right")}>Amount ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {subject.items.map((item) => (
              <tr key={item.id}>
                <td className={TD}>{item.name}</td>
                <td className={cn(TD, NUM)}>{qtyFmt(item.quantity)}</td>
                <td className={cn(TD, NUM)}>{fmt2(item.unitPrice)}</td>
                <td className={cn(TD, NUM)}>{fmt2(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── Totals ──────────────────────────────────────────────────── */}
      <Section title="Totals">
        <div className="flex justify-end">
          <div className="w-full max-w-xs">
            <Kv
              k={`Total excl. tax (${currency})`}
              v={totals ? fmt2(totals.totalTaxExcl) : "—"}
            />
            <Kv k={`TAX (${currency})`} v={totals ? fmt2(totals.totalTax) : "—"} />
            {totals && totals.discount > 0 && (
              <Kv k={`Discount (${currency})`} v={`-${fmt2(totals.discount)}`} />
            )}
            <div className="mt-1 border-t border-slate-300 pt-1">
              <div className="flex items-baseline justify-between gap-4 py-0.5 text-[14px] font-semibold text-slate-900">
                <span>Total incl. tax ({currency})</span>
                <span>{totals ? fmt2(totals.totalTaxIncl) : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {vatTotals.length > 0 && (
          <div className="mt-5">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH}>VAT rate</th>
                  <th className={cn(TH, "text-right")}>
                    Net amount ({currency})
                  </th>
                  <th className={cn(TH, "text-right")}>
                    Tax amount ({currency})
                  </th>
                </tr>
              </thead>
              <tbody>
                {vatTotals.map((v, idx) => (
                  <tr key={`${v.vatRate}-${idx}`}>
                    <td className={TD}>{v.vatRate}</td>
                    <td className={cn(TD, NUM)}>{fmt2(v.nettAmount)}</td>
                    <td className={cn(TD, NUM)}>{fmt2(v.taxAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Payments ────────────────────────────────────────────────── */}
      {confirmedPayments.length > 0 && (
        <Section title="Payments">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TH}>Method</th>
                <th className={cn(TH, "text-right")}>Amount ({currency})</th>
                <th className={cn(TH, "text-right")}>Date</th>
              </tr>
            </thead>
            <tbody>
              {confirmedPayments.map((t) => (
                <tr key={t.id}>
                  <td className={TD}>{t.method ?? "—"}</td>
                  <td className={cn(TD, NUM)}>{fmt2(t.amount)}</td>
                  <td className={cn(TD, NUM)}>{fmtDateTimeShort(t.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* ── Fiscal footer: TRA verification ────────────────────────── */}
      <section className="mt-auto border-t border-slate-200 px-10 py-6">
        <div className="flex items-center justify-between gap-8">
          <div className="space-y-1 text-[12px] text-slate-600">
            <div>
              Receipt No.: <span className="font-mono font-medium text-slate-900">{rctNum ?? "—"}</span>
            </div>
            {zNum != null && (
              <div>
                Z No.: <span className="font-mono font-medium text-slate-900">{zNum}</span>
              </div>
            )}
            <div>
              Date/Time:{" "}
              <span className="font-mono font-medium text-slate-900">
                {receiptDateTime ? fmtDateTimeShort(receiptDateTime) : "—"}
              </span>
            </div>
            {verificationCode && (
              <div className="pt-1 text-[13px] font-semibold tracking-[0.04em] text-slate-900">
                Verification code: {verificationCode}
              </div>
            )}
          </div>
          {verificationUrl && (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <VfdReceiptQr value={verificationUrl} size={104} />
              <span className="text-[10px] text-slate-500">
                Scan for TRA verification
              </span>
            </div>
          )}
        </div>
      </section>

      <footer className="flex items-center justify-center gap-2 border-t border-slate-200 px-10 py-4 text-[11px] text-slate-400">
        <span>Powered by</span>
        <Image
          src="/images/logo_new.png"
          alt="Settlo"
          width={120}
          height={32}
          className="h-6 w-auto opacity-70"
        />
      </footer>
    </>
  );
}
