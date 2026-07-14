"use client";

import type {
  Proforma,
  ProformaItem,
  ProformaStatus,
} from "@/types/proforma/type";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return null;
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fmtDateShort = (d: string | null | undefined) => {
  if (!d) return "";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Money comparison that tolerates float noise. */
const nearlyEqual = (a: number, b: number, epsilon = 0.01) =>
  Math.abs(a - b) < epsilon;

/**
 * Resolve the discount.
 *
 * THE ORIGINAL BUG: `data.totalDiscountAmount ?? data.manualDiscountAmount`.
 * `??` only falls through on null/undefined. The backend sends
 * `totalDiscountAmount: 0` — a real number — so the 5,000 TZS manual discount
 * was never read and the discount row never rendered.
 */
const resolveDiscount = (data: Proforma): number => {
  const candidates = [
    data.totalDiscountAmount,
    data.manualDiscountAmount,
    data.appliedDiscountAmount,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && c > 0) return c;
  }
  return 0;
};

/** Derive the VAT rate from the payload rather than hardcoding 18%. */
const deriveVatRate = (taxExclusiveGross: number, taxAmount: number) => {
  if (taxExclusiveGross <= 0 || taxAmount <= 0) return null;
  return Math.round((taxAmount / taxExclusiveGross) * 100);
};

const STATUS_STYLES: Record<
  ProformaStatus,
  { label: string; bg: string; fg: string }
> = {
  DRAFT: { label: "Draft", bg: "#f3f4f6", fg: "#374151" },
  AWAITING: { label: "Awaiting confirmation", bg: "#fef3c7", fg: "#92400e" },
  CONFIRMED: { label: "Confirmed by customer", bg: "#d1fae5", fg: "#065f46" },
  COMPLETED: { label: "Completed", bg: "#d1fae5", fg: "#065f46" },
  EXPIRED: { label: "Expired", bg: "#fee2e2", fg: "#991b1b" },
  CANCELLED: { label: "Cancelled", bg: "#f3f4f6", fg: "#374151" },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}

export function DetailsSkeleton() {
  return (
    <div
      className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
      style={{ maxWidth: 794, border: `1px solid ${SECONDARY}` }}
    >
      <div style={{ height: 8, backgroundColor: PRIMARY }} />
      <div className="p-8 space-y-6">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Pulse className="h-16 w-16 rounded" />
            <div className="space-y-2 pt-1">
              <Pulse className="h-5 w-40" />
              <Pulse className="h-3 w-32" />
              <Pulse className="h-3 w-28" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <Pulse className="h-8 w-48 ml-auto" />
            <Pulse className="h-3 w-36 ml-auto" />
            <Pulse className="h-3 w-28 ml-auto" />
          </div>
        </div>
        <Pulse className="h-px w-full" />
        <div className="flex justify-between gap-8">
          <div className="space-y-2 flex-1">
            <Pulse className="h-3 w-12" />
            <Pulse className="h-4 w-40" />
            <Pulse className="h-3 w-32" />
          </div>
          <div className="space-y-2 w-64">
            <Pulse className="h-8 w-full" />
            <Pulse className="h-8 w-full" />
            <Pulse className="h-8 w-full" />
            <Pulse className="h-8 w-full" />
          </div>
        </div>
        <Pulse className="h-40 w-full rounded-lg" />
        <div className="flex justify-end">
          <div className="space-y-2 w-56">
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-full" />
            <Pulse className="h-5 w-full" />
          </div>
        </div>
        <Pulse className="h-px w-full" />
        <div className="flex justify-between">
          <div className="space-y-1.5 w-64">
            <Pulse className="h-3 w-24" />
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-5/6" />
          </div>
          <div className="space-y-1 text-right">
            <Pulse className="h-3 w-40" />
            <Pulse className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Document ─────────────────────────────────────────────────────────
export function InvoiceDocument({
  data,
  printRef,
  /**
   * When the server's `netAmount` doesn't equal `gross - discount`, prefer the
   * locally computed figure so the printed document at least adds up.
   * Set to `false` once the backend is fixed and `netAmount` is authoritative.
   */
  reconcileTotals = true,
}: {
  data: Proforma;
  printRef: React.RefObject<HTMLDivElement>;
  reconcileTotals?: boolean;
}) {
  const customerName =
    `${data.customerFirstName ?? ""} ${data.customerLastName ?? ""}`.trim();

  const taxExclusiveGross = data.taxExclusiveGrossAmount ?? 0;
  const taxAmount = data.taxAmount ?? 0;
  const grossAmount = data.grossAmount ?? 0;
  const serverNet = data.netAmount ?? 0;

  const showTax = data.showTaxAmounts === true;
  const vatRate = deriveVatRate(taxExclusiveGross, taxAmount);

  // ── Discount + totals reconciliation ──
  const discountAmount = resolveDiscount(data);
  const computedNet = Math.max(0, grossAmount - discountAmount);
  const totalsMismatch =
    discountAmount > 0 && !nearlyEqual(serverNet, computedNet);
  const netAmount = totalsMismatch && reconcileTotals ? computedNet : serverNet;

  if (totalsMismatch && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      `[Proforma ${data.proformaNumber}] totals do not reconcile: ` +
        `gross ${grossAmount} - discount ${discountAmount} = ${computedNet}, ` +
        `but the server returned netAmount ${serverNet}. The backend is likely ` +
        `not applying manualDiscountAmount to netAmount, nor writing it back ` +
        `into totalDiscountAmount.`,
    );
  }

  /** VAT is the server figure, computed on the pre-discount gross. */
  const discountAffectsVat = showTax && discountAmount > 0 && taxAmount > 0;

  const lineExTotal = (it: ProformaItem) =>
    it.lineTaxExclusiveTotal ?? it.unitTaxExclusivePrice * it.quantity;
  const lineIncTotal = (it: ProformaItem) =>
    it.lineTotal ?? it.unitPrice * it.quantity;

  const unitPriceFor = (it: ProformaItem) =>
    showTax ? it.unitTaxExclusivePrice : it.unitPrice;
  const lineTotalFor = (it: ProformaItem) =>
    showTax ? lineExTotal(it) : lineIncTotal(it);

  const status = STATUS_STYLES[data.proformaStatus];

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-content, #receipt-content * { visibility: visible !important; }

          /* Static flow so multi-page invoices paginate instead of being clipped
             to one sheet by position:fixed + inset:0. */
          #receipt-content {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          /* Tailwind's lg: breakpoints resolve against the *paper* width when
             printing, so a narrow window would otherwise print the mobile cards.
             Force the table and hide the cards explicitly. */
          #receipt-content .items-table { display: block !important; }
          #receipt-content .items-cards { display: none !important; }

          #receipt-content table { page-break-inside: auto; }
          #receipt-content tr { page-break-inside: avoid; page-break-after: auto; }
          #receipt-content thead { display: table-header-group; }
          #receipt-content .totals-block,
          #receipt-content .notes-block { page-break-inside: avoid; }

          .no-print { display: none !important; }

          @page { margin: 16mm; }
        }
      `}</style>

      <div
        id="receipt-content"
        ref={printRef}
        className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
        style={{ maxWidth: 794, border: `1px solid ${SECONDARY}` }}
      >
        {/* ── HEADER ── */}
        <div className="px-8 pt-8 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="flex items-center gap-4">
            {data.locationLogo ? (
              <img
                src={data.locationLogo}
                alt={`${data.businessName ?? "Business"} logo`}
                className="max-h-24 w-auto object-contain flex-shrink-0"
                style={{ border: `1px solid ${SECONDARY}`, borderRadius: 4 }}
              />
            ) : (
              /* No logo: show the business name rather than an invisible box. */
              <div></div>
            )}
          </div>

          <div className="lg:text-right">
            <h2
              className="text-4xl font-light tracking-wide mb-2"
              style={{ color: PRIMARY }}
            >
              PROFORMA INVOICE
            </h2>

            {status && (
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-2"
                style={{ backgroundColor: status.bg, color: status.fg }}
              >
                {status.label}
              </span>
            )}

            <div className="text-sm text-gray-600 space-y-0.5">
              {data.tinNumber && (
                <p className="font-semibold text-gray-800">
                  TIN: {data.tinNumber}
                </p>
              )}
              {data.businessName && (
                <p className="font-semibold text-gray-800">
                  {data.businessName}
                </p>
              )}
              {data.locationAddress && <p>{data.locationAddress}</p>}
              {data.locationCity && <p>{data.locationCity}</p>}
              {data.locationPhoneNumber && (
                <p>Mobile: {data.locationPhoneNumber}</p>
              )}
              {data.locationEmail && <p>{data.locationEmail}</p>}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className="mx-8"
          style={{ height: 1, backgroundColor: SECONDARY }}
        />

        {/* ── BILL TO + META TABLE ── */}
        <div className="px-8 py-6 flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
              Bill To
            </p>
            <div className="text-sm text-gray-700 space-y-0.5">
              {customerName && (
                <p className="font-semibold text-gray-900">{customerName}</p>
              )}
              {data.customerAddress && <p>{data.customerAddress}</p>}
              {data.customerCity && <p>{data.customerCity}</p>}
              {data.customerPhoneNumber && <p>{data.customerPhoneNumber}</p>}
              {data.customerEmail && <p>{data.customerEmail}</p>}
              {data.customerTin && <p>TIN: {data.customerTin}</p>}
            </div>
          </div>

          <div className="w-full lg:w-72">
            <table className="w-full text-sm">
              <tbody>
                <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                  <td className="py-2 font-semibold text-gray-700 pr-4">
                    Prof Number:
                  </td>
                  <td className="py-2 text-gray-900 text-right">
                    {data.proformaNumber}
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                  <td className="py-2 font-semibold text-gray-700 pr-4">
                    Estimate Date:
                  </td>
                  <td className="py-2 text-gray-900 text-right">
                    {fmtDate(data.dateCreated)}
                  </td>
                </tr>
                {data.expiresAt && (
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 pr-4">
                      Valid Until:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {fmtDate(data.expiresAt)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 font-semibold text-gray-700 pr-4">
                    Grand Total:
                  </td>
                  <td className="py-2 font-bold text-right">
                    {fmt(netAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ITEMS TABLE — desktop + print ── */}
        <div className="items-table hidden lg:block px-8 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: PRIMARY }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Items
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  {showTax ? "Unit Price (excl. VAT)" : "Price"}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it, index) => (
                <tr
                  key={it.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? "#ffffff" : `${SECONDARY}40`,
                    borderBottom: `1px solid ${SECONDARY}`,
                  }}
                >
                  <td className="px-4 py-3 text-gray-900">
                    <span className="text-gray-400 mr-2">{index + 1}.</span>
                    <span className="font-medium">{it.productName}</span>
                    {it.productVariantName &&
                      it.productVariantName !== it.productName && (
                        <span className="text-gray-400 text-xs ml-1">
                          — {it.productVariantName}
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-center">
                    {it.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-right">
                    {fmt(unitPriceFor(it))}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 text-right">
                    {fmt(lineTotalFor(it))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── ITEMS CARDS — mobile screen only ── */}
        <div className="items-cards lg:hidden px-4 mb-6 space-y-3">
          <div
            className="flex justify-between items-center px-4 py-2 rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: PRIMARY }}
          >
            <span>Items</span>
            <span>Amount</span>
          </div>
          {data.items.map((it, index) => (
            <div
              key={it.id}
              className="rounded-lg p-4"
              style={{
                border: `1px solid ${SECONDARY}`,
                backgroundColor: index % 2 === 0 ? "#ffffff" : `${SECONDARY}20`,
              }}
            >
              <div className="flex justify-between items-start gap-3 mb-2">
                <p className="text-sm font-medium text-gray-900 flex-1">
                  <span className="text-gray-400 mr-1">{index + 1}.</span>
                  {it.productName}
                  {it.productVariantName &&
                    it.productVariantName !== it.productName && (
                      <span className="text-gray-400 text-xs ml-1">
                        — {it.productVariantName}
                      </span>
                    )}
                </p>
                <p className="text-sm font-bold whitespace-nowrap">
                  {fmt(lineTotalFor(it))}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>
                  <span className="font-medium text-gray-700">Qty:</span>{" "}
                  {it.quantity.toLocaleString()}
                </span>
                <span>
                  <span className="font-medium text-gray-700">
                    {showTax ? "Unit price (excl. VAT):" : "Unit price:"}
                  </span>{" "}
                  {fmt(unitPriceFor(it))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── TOTALS ── */}
        <div className="totals-block px-6 lg:px-8 mb-6">
          <div className="flex justify-end">
            <div className="w-full lg:max-w-xs">
              {showTax ? (
                <>
                  <div
                    className="flex justify-between text-sm text-gray-600 py-2"
                    style={{ borderBottom: `1px solid ${SECONDARY}` }}
                  >
                    <span>Subtotal (excl. VAT):</span>
                    <span>{fmt(taxExclusiveGross)}</span>
                  </div>

                  <div
                    className="flex justify-between text-sm py-2"
                    style={{
                      borderBottom: `1px solid ${SECONDARY}`,
                      color: "#059669",
                    }}
                  >
                    <span className="font-medium">
                      VAT{vatRate !== null ? ` (${vatRate}%)` : ""}:
                    </span>
                    <span className="font-medium">+ {fmt(taxAmount)}</span>
                  </div>

                  <div
                    className="flex justify-between text-sm text-gray-600 py-2"
                    style={{ borderBottom: `1px solid ${SECONDARY}` }}
                  >
                    <span>Gross (incl. VAT):</span>
                    <span>{fmt(grossAmount)}</span>
                  </div>
                </>
              ) : (
                <div
                  className="flex justify-between text-sm text-gray-600 py-2"
                  style={{ borderBottom: `1px solid ${SECONDARY}` }}
                >
                  <span>Subtotal:</span>
                  <span>{fmt(grossAmount || netAmount)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div
                  className="flex justify-between text-sm py-2"
                  style={{
                    borderBottom: `1px solid ${SECONDARY}`,
                    color: "#ef4444",
                  }}
                >
                  <span className="font-medium">Discount:</span>
                  <span className="font-medium">- {fmt(discountAmount)}</span>
                </div>
              )}

              <div
                className="flex justify-between font-bold py-3 mt-1 rounded px-3"
                style={{ backgroundColor: PRIMARY_LIGHT, color: PRIMARY }}
              >
                <span>Grand Total (TZS):</span>
                <span>{fmt(netAmount)}</span>
              </div>

              {showTax && taxAmount > 0 && !discountAffectsVat && (
                <p className="text-[11px] text-gray-400 mt-2 text-right">
                  VAT of {fmt(taxAmount)} is included in the grand total
                </p>
              )}

              {discountAffectsVat && (
                <p className="text-[11px] text-gray-400 mt-2 text-right">
                  VAT of {fmt(taxAmount)} is calculated on the gross amount
                  before discount
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── NOTES / TERMS ── */}
        {data.notes && (
          <div className="notes-block">
            <div
              className="mx-8"
              style={{ height: 1, backgroundColor: SECONDARY }}
            />
            <div className="px-8 py-6">
              <p className="font-bold text-gray-800 text-sm mb-2">
                Notes / Terms
              </p>
              <div className="text-sm text-gray-600 space-y-1 leading-relaxed">
                {data.notes.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div
          className="px-8 py-6 flex flex-col lg:flex-row justify-between items-start gap-4"
          style={{ borderTop: `1px solid ${SECONDARY}` }}
        >
          <div className="text-sm text-gray-500 space-y-0.5">
            <p>Generated on {fmtDateShort(new Date().toISOString())}</p>
            {data.proformaStatus === "CONFIRMED" && (
              <p className="font-medium" style={{ color: PRIMARY }}>
                ✓ Confirmed by customer
              </p>
            )}
          </div>
        </div>

        <div
          className="px-8 py-6 flex justify-center items-center gap-4"
          style={{ borderTop: `1px solid ${SECONDARY}` }}
        >
          <div className="text-center flex-shrink-0">
            <p className="text-xs lg:text-sm text-gray-400 font-semibold">
              Thank you for your business and continued support
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Powered by Settlo Technologies Limited
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
