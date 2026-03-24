"use client";

import type { Proforma } from "@/types/proforma/type";

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
  }).format(n);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

const fmtDateShort = (d: string | null | undefined) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
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
}: {
  data: Proforma;
  printRef: React.RefObject<HTMLDivElement>;
}) {
  const customerName =
    `${data.customerFirstName ?? ""} ${data.customerLastName ?? ""}`.trim();

  const taxExclusiveGross: number = (data as any).taxExclusiveGrossAmount ?? 0;
  const taxAmount: number = (data as any).taxAmount ?? 0;
  const grossAmount: number = (data as any).grossAmount ?? 0;
  const discountAmount: number = data.totalDiscountAmount ?? 0;
  const netAmount: number = data.netAmount ?? 0;

  // ✅ Use showTaxAmounts from payload — not derived from taxAmount > 0
  const showTax: boolean = (data as any).showTaxAmounts === true;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-content, #receipt-content * { visibility: visible !important; }
          #receipt-content {
            position: fixed !important;
            inset: 0 !important;
            padding: 32px !important;
            background: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        id="receipt-content"
        ref={printRef as React.RefObject<HTMLDivElement>}
        className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
        style={{ maxWidth: 794, border: `1px solid ${SECONDARY}` }}
      >
        {/* ── HEADER ── */}
        <div className="px-8 pt-8 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="flex items-center gap-4">
            {data.locationLogo ? (
              <img
                src={data.locationLogo}
                alt="Logo"
                className="h-16 w-auto object-contain flex-shrink-0"
                style={{ border: `1px solid ${SECONDARY}`, borderRadius: 4 }}
              />
            ) : (
              <div className="h-14 w-14 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0" />
            )}
          </div>

          <div className="lg:text-right">
            <h2
              className="text-4xl font-light tracking-wide mb-2"
              style={{ color: PRIMARY }}
            >
              PROFORMA INVOICE
            </h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              {data.tinNumber && (
                <p className="font-semibold text-gray-800">
                  TIN: {data.tinNumber}
                </p>
              )}
              <p className="font-semibold text-gray-800">{data.businessName}</p>
              {data.locationAddress && <p>{data.locationAddress}</p>}
              {(data as any).locationCity && (
                <p>{(data as any).locationCity}</p>
              )}
              {data.locationPhoneNumber && (
                <p>Mobile: {data.locationPhoneNumber}</p>
              )}
              {(data as any).locationEmail && (
                <p>{(data as any).locationEmail}</p>
              )}
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
              {(data as any).customerAddress && (
                <p>{(data as any).customerAddress}</p>
              )}
              {(data as any).customerCity && (
                <p>{(data as any).customerCity}</p>
              )}
              {data.customerPhoneNumber && <p>{data.customerPhoneNumber}</p>}
              {data.customerEmail && <p>{data.customerEmail}</p>}
              {(data as any).customerTin && (
                <p>TIN: {(data as any).customerTin}</p>
              )}
            </div>
          </div>

          <div className="w-full lg:w-72">
            <table className="w-full text-sm">
              <tbody>
                <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                  <td className="py-2 font-semibold text-gray-700 pr-4">
                    Estimate Number:
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

        {/* ── ITEMS TABLE — desktop ── */}
        <div className="hidden lg:block px-8 mb-6">
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
                  {/* ✅ Label changes based on showTax */}
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
                    {it.productVariantName && (
                      <span className="text-gray-400 text-xs ml-1">
                        — {it.productVariantName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-center">
                    {it.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-right">
                    {/* ✅ Show ex-tax price when showTax, otherwise VAT-inclusive */}
                    {fmt(
                      showTax
                        ? (it as any).unitTaxExclusivePrice
                        : it.unitPrice,
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 text-right">
                    {/* ✅ Line total follows the same rule */}
                    {fmt(
                      showTax
                        ? (it as any).unitTaxExclusivePrice * it.quantity
                        : it.unitPrice * it.quantity,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── ITEMS CARDS — mobile ── */}
        <div className="lg:hidden px-4 mb-6 space-y-3">
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
                  {it.productVariantName && (
                    <span className="text-gray-400 text-xs ml-1">
                      — {it.productVariantName}
                    </span>
                  )}
                </p>
                <p className="text-sm font-bold whitespace-nowrap">
                  {/* ✅ Mobile card amount also respects showTax */}
                  {fmt(
                    showTax
                      ? (it as any).unitTaxExclusivePrice * it.quantity
                      : it.unitPrice * it.quantity,
                  )}
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
                  {fmt(
                    showTax ? (it as any).unitTaxExclusivePrice : it.unitPrice,
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── TOTALS ── */}
        <div className="px-6 lg:px-8 mb-6">
          <div className="flex justify-end">
            <div className="w-full lg:max-w-xs">
              {showTax ? (
                <>
                  {/* Subtotal before VAT */}
                  <div
                    className="flex justify-between text-sm text-gray-600 py-2"
                    style={{ borderBottom: `1px solid ${SECONDARY}` }}
                  >
                    <span>Subtotal (excl. VAT):</span>
                    <span>{fmt(taxExclusiveGross)}</span>
                  </div>

                  {/* VAT */}
                  <div
                    className="flex justify-between text-sm py-2"
                    style={{
                      borderBottom: `1px solid ${SECONDARY}`,
                      color: "#059669",
                    }}
                  >
                    <span className="font-medium">VAT (18%):</span>
                    <span className="font-medium">+ {fmt(taxAmount)}</span>
                  </div>

                  {/* Gross incl. VAT */}
                  <div
                    className="flex justify-between text-sm text-gray-600 py-2"
                    style={{ borderBottom: `1px solid ${SECONDARY}` }}
                  >
                    <span>Gross (incl. VAT):</span>
                    <span>{fmt(grossAmount)}</span>
                  </div>
                </>
              ) : (
                /* ✅ showTax false — simple subtotal, no VAT lines */
                <div
                  className="flex justify-between text-sm text-gray-600 py-2"
                  style={{ borderBottom: `1px solid ${SECONDARY}` }}
                >
                  <span>Subtotal:</span>
                  <span>{fmt(grossAmount || netAmount)}</span>
                </div>
              )}

              {/* Discount */}
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

              {/* Grand Total */}
              <div
                className="flex justify-between font-bold py-3 mt-1 rounded px-3"
                style={{ backgroundColor: PRIMARY_LIGHT, color: PRIMARY }}
              >
                <span>Grand Total (TZS):</span>
                <span>{fmt(netAmount)}</span>
              </div>

              {/* ✅ VAT note — only when showTax is true */}
              {showTax && taxAmount > 0 && (
                <p className="text-[11px] text-gray-400 mt-2 text-right">
                  VAT of {fmt(taxAmount)} is included in the grand total
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── NOTES / TERMS ── */}
        {data.notes && (
          <>
            <div
              className="mx-8"
              style={{ height: 1, backgroundColor: SECONDARY }}
            />
            <div className="px-8 py-6">
              <p className="font-bold text-gray-800 text-sm mb-2">
                Notes / Terms
              </p>
              <div className="text-sm text-gray-600 space-y-1 leading-relaxed">
                {data.notes.split("\n").map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </>
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
              Powered by Settlo Technologies
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
