"use client";

import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import type { Proforma } from "@/types/proforma/type";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en", {
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; icon: React.ReactNode; className: string }
  > = {
    COMPLETED: {
      label: "Completed",
      icon: <CheckCircle2 className="w-3 h-3" />,
      className: "bg-green-50 text-green-700 border-green-200",
    },
    DRAFT: {
      label: "Draft",
      icon: <Clock className="w-3 h-3" />,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    CANCELLED: {
      label: "Cancelled",
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const cfg = map[status] ?? {
    label: status,
    icon: <FileText className="w-3 h-3" />,
    className: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

export function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex gap-3">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 sm:w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="space-y-2 sm:text-right">
            <Skeleton className="h-6 w-28 sm:ml-auto" />
            <Skeleton className="h-3.5 w-36 sm:ml-auto" />
            <Skeleton className="h-3.5 w-28 sm:ml-auto" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="flex justify-end">
          <div className="space-y-2 w-48">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-5 w-full" />
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
    `${data.customerFirstName} ${data.customerLastName}`.trim();

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-content, #receipt-content * { visibility: visible !important; }
          #receipt-content {
            position: fixed !important;
            inset: 0 !important;
            padding: 24px !important;
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
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-indigo-500" />

        <div className="p-4 sm:p-6 lg:p-8">
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Left — business info */}
            <div className="flex items-start gap-3">
              {data.locationLogo ? (
                <img
                  src={data.locationLogo}
                  alt="Logo"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain border border-gray-100 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm sm:text-base">
                    {data.businessName?.[0] ?? "B"}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-tight">
                  {data.businessName ?? "—"}
                </p>
                {data.locationName && (
                  <p className="text-gray-500 text-xs font-medium mt-0.5">
                    {data.locationName}
                  </p>
                )}
                {data.locationAddress && (
                  <p className="text-gray-400 text-xs mt-0.5">
                    {data.locationAddress}
                  </p>
                )}
                {data.locationPhoneNumber && (
                  <p className="text-gray-400 text-xs mt-0.5">
                    {data.locationPhoneNumber}
                  </p>
                )}
                {data.tinNumber && (
                  <p className="text-gray-400 text-xs mt-0.5">
                    TIN: {data.tinNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Right — invoice meta */}
            <div className="flex flex-row items-start justify-between sm:flex-col sm:items-end gap-2 sm:gap-1.5">
              <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 sm:px-3 py-1 rounded-md whitespace-nowrap">
                Proforma Invoice
              </span>
              <div className="text-right sm:space-y-1">
                <p className="text-gray-700 font-semibold text-xs sm:text-sm">
                  {data.proformaNumber}
                </p>
                {data.dateCreated && (
                  <p className="text-gray-400 text-xs hidden sm:block">
                    Date: {fmtDate(data.dateCreated)}
                  </p>
                )}
                {data.expiresAt && (
                  <p className="text-gray-400 text-xs hidden sm:block">
                    Expires: {fmtDate(data.expiresAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile-only: dates + status */}
          <div className="sm:hidden mb-4 space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {data.dateCreated && (
                <p className="text-gray-400 text-[11px]">
                  <span className="font-medium text-gray-500">Date:</span>{" "}
                  {fmtDate(data.dateCreated)}
                </p>
              )}
              {data.expiresAt && (
                <p className="text-gray-400 text-[11px]">
                  <span className="font-medium text-gray-500">Expires:</span>{" "}
                  {fmtDate(data.expiresAt)}
                </p>
              )}
            </div>
            <StatusBadge status={data.proformaStatus} />
          </div>

          {/* Desktop-only: status badge */}
          <div className="hidden sm:flex sm:justify-end mb-2">
            <StatusBadge status={data.proformaStatus} />
          </div>

          <Separator className="mb-4 sm:mb-6" />

          {/* ── Bill To ── */}
          <div className="mb-4 sm:mb-6">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5">
              Bill To
            </p>
            <p className="font-bold text-gray-900 text-sm">{customerName}</p>
            {data.customerPhoneNumber && (
              <p className="text-gray-500 text-xs mt-0.5">
                {data.customerPhoneNumber}
              </p>
            )}
            {data.customerEmail && (
              <p className="text-gray-500 text-xs mt-0.5">
                {data.customerEmail}
              </p>
            )}
          </div>

          {/* ── Items Table ── */}
          <div className="mb-4 sm:mb-6 -mx-4 sm:mx-0">
            <div className="overflow-x-auto px-4 sm:px-0">
              <table className="w-full min-w-[340px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 sm:py-2.5 px-2.5 sm:px-3 text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-bold rounded-l-lg">
                      Item
                    </th>
                    <th className="text-right py-2 sm:py-2.5 px-2.5 sm:px-3 text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                      Qty
                    </th>
                    <th className="text-right py-2 sm:py-2.5 px-2.5 sm:px-3 text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                      Unit Price
                    </th>
                    <th className="text-right py-2 sm:py-2.5 px-2.5 sm:px-3 text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-bold rounded-r-lg">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs sm:text-sm text-gray-800">
                        <span className="font-medium">{it.productName}</span>
                        {it.productVariantName && (
                          <>
                            <span className="text-gray-300 mx-1 hidden sm:inline">
                              —
                            </span>
                            <span className="text-gray-400 text-[10px] sm:text-xs block sm:inline mt-0.5 sm:mt-0">
                              {it.productVariantName}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 text-right text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {it.quantity.toLocaleString()}
                      </td>
                      <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 text-right text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {fmt(it.unitPrice)}
                      </td>
                      <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 text-right text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {fmt(it.unitPrice * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Totals ── */}
          <div className="flex justify-end mb-4 sm:mb-6">
            <div className="w-full sm:w-64 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="whitespace-nowrap font-medium">
                  {fmt(data.grossAmount)}
                </span>
              </div>
              {data.totalDiscountAmount > 0 && (
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Discount</span>
                  <span className="whitespace-nowrap">
                    − {fmt(data.totalDiscountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-sm sm:text-base border-t border-gray-200 pt-2">
                <span>Total</span>
                <span className="text-emerald-700 whitespace-nowrap">
                  {fmt(data.netAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          {data.notes && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1 sm:mb-1.5">
                Note
              </p>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                {data.notes}
              </p>
            </div>
          )}

          {/* ── Footer ── */}
          <Separator className="mb-3 sm:mb-5" />
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 sm:gap-4">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 sm:mb-1.5">
                Thank You
              </p>
              <p className="text-gray-400 text-[10px] sm:text-xs leading-relaxed max-w-xs">
                This is a proforma invoice. Payment confirms acceptance of the
                terms outlined above.
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold">
                Powered by Settlo Technologies Ltd
              </p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">
                Generated on {fmtDateShort(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
