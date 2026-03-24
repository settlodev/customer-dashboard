"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Loader2, Package, Printer } from "lucide-react";
import {
  previewPurchaseOrder,
  AcceptStockPurchase,
} from "@/lib/actions/stock-purchase-actions";
import { toast } from "sonner";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

interface SharePurchaseOrderProps {
  purchaseId: string;
}

export default function SharePurchaseOrder({
  purchaseId,
}: SharePurchaseOrderProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    previewPurchaseOrder(purchaseId)
      .then((data) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [purchaseId]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const updated = await AcceptStockPurchase(order.id);
      setOrder(updated);
      toast.success("Purchase order accepted successfully!");
    } catch {
      toast.error("Failed to accept purchase order. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: SECONDARY }}
      >
        <div className="text-center space-y-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-gray-200 animate-spin mx-auto"
            style={{ borderTopColor: PRIMARY }}
          />
          <p className="text-sm text-gray-500 font-medium">
            Loading purchase order…
          </p>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: SECONDARY }}
      >
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: PRIMARY_LIGHT }}
          >
            <Package className="h-7 w-7" style={{ color: PRIMARY }} />
          </div>
          <p className="text-lg font-semibold text-gray-800">Order not found</p>
          <p className="text-sm text-gray-500">
            This purchase order may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = order.status === "ACCEPTED" || order.status === "APPROVED";
  const canAccept = order.status === "SUBMITTED";

  const totalQty =
    order.stockIntakePurchaseOrderItems?.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    ) ?? 0;
  const totalItems = order.stockIntakePurchaseOrderItems?.length ?? 0;

  // Status badge style
  const statusStyle: Record<string, { bg: string; color: string }> = {
    SUBMITTED: { bg: "#dbeafe", color: "#1d4ed8" },
    APPROVED: { bg: "#dcfce7", color: "#15803d" },
    ACCEPTED: { bg: "#dcfce7", color: "#15803d" },
    DELIVERED: { bg: "#ede9fe", color: "#7c3aed" },
    PARTIALLY_RECEIVED: { bg: PRIMARY_LIGHT, color: PRIMARY },
    RECEIVED: { bg: "#d1fae5", color: "#065f46" },
  };
  const ss = statusStyle[order.status] ?? {
    bg: SECONDARY,
    color: "#374151",
  };

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{ backgroundColor: SECONDARY }}
    >
      <div className="max-w-4xl mx-auto">
        {/* ── LPO Document ── */}
        <div
          id="lpo-content"
          className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
          style={{ border: `1px solid ${SECONDARY}` }}
        >
          {/* ── HEADER: Business left · Title+Address right ── */}
          <div className="px-6 lg:px-10 pt-8 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex items-center gap-4"></div>

            {/* Right: title + location details */}
            <div className="lg:text-right">
              <h2
                className="text-3xl lg:text-4xl font-light tracking-wide mb-2"
                style={{ color: PRIMARY }}
              >
                LOCAL PURCHASE ORDER
              </h2>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-800">
                  {order.businessName}
                </p>
                {order.locationName && <p>{order.locationName}</p>}
                {order.locationPhone && <p>Mobile: {order.locationPhone}</p>}
                {order.locationEmail && <p>{order.locationEmail}</p>}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="mx-6 lg:mx-10"
            style={{ height: 1, backgroundColor: SECONDARY }}
          />

          {/* ── SUPPLIER + META TABLE ── */}
          <div className="px-6 lg:px-10 py-6 flex flex-col lg:flex-row justify-between gap-6">
            {/* Left: Supplier + Ship To */}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                Supplier
              </p>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-semibold text-gray-900">
                  {order.supplierName}
                </p>
                {order.supplierPhoneNumber && (
                  <p>{order.supplierPhoneNumber}</p>
                )}
                {order.supplierEmail && <p>{order.supplierEmail}</p>}
              </div>

              {/*<div className="mt-5">*/}
              {/*  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">*/}
              {/*    Ship To*/}
              {/*  </p>*/}
              {/*  <div className="text-sm text-gray-700 space-y-0.5">*/}
              {/*    <p className="font-semibold text-gray-900">*/}
              {/*      {order.businessName}*/}
              {/*    </p>*/}
              {/*    {order.locationName && <p>{order.locationName}</p>}*/}
              {/*    {order.locationPhone && <p>{order.locationPhone}</p>}*/}
              {/*    {order.locationEmail && <p>{order.locationEmail}</p>}*/}
              {/*  </div>*/}
              {/*</div>*/}
            </div>

            {/* Right: PO meta */}
            <div className="w-full lg:w-80">
              <table className="w-full text-sm">
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      Order Number:
                    </td>
                    <td className="py-2 text-gray-900 text-right font-mono text-xs">
                      {order.orderNumber}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      Date Created:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {order.dateCreated
                        ? format(new Date(order.dateCreated), "MMMM dd, yyyy")
                        : "—"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      Expected Delivery:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {order.deliveryDate
                        ? format(new Date(order.deliveryDate), "MMMM dd, yyyy")
                        : "Not specified"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      Total Items:
                    </td>
                    <td className="py-2 text-gray-900 text-right font-bold">
                      {totalItems}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      Total Quantity:
                    </td>
                    <td className="py-2 font-bold text-right">
                      {totalQty.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── ITEMS TABLE — desktop ── */}
          <div className="hidden lg:block px-10 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: PRIMARY }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Item Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white w-32">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.stockIntakePurchaseOrderItems?.map(
                  (item: any, index: number) => (
                    <tr
                      key={item.id}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : `${SECONDARY}40`,
                        borderBottom: `1px solid ${SECONDARY}`,
                      }}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.stockName} -{" "}
                        {item.stockVariantName &&
                        item.stockVariantName !== item.stockName
                          ? item.stockVariantName
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {item.quantity?.toLocaleString()}
                      </td>
                    </tr>
                  ),
                )}
                {/* Total row */}
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-sm font-semibold text-right"
                  >
                    Total Quantity:
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {totalQty.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── ITEMS CARDS — mobile ── */}
          <div className="lg:hidden px-4 mb-6 space-y-3">
            <div
              className="flex justify-between items-center px-4 py-2 rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: PRIMARY }}
            >
              <span>Item</span>
              <span>Qty</span>
            </div>
            {order.stockIntakePurchaseOrderItems?.map(
              (item: any, index: number) => (
                <div
                  key={item.id}
                  className="rounded-lg p-4"
                  style={{
                    border: `1px solid ${SECONDARY}`,
                    backgroundColor:
                      index % 2 === 0 ? "#ffffff" : `${SECONDARY}20`,
                  }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="text-gray-400 mr-1">{index + 1}.</span>
                        {item.stockName}
                      </p>
                      {item.stockVariantName &&
                        item.stockVariantName !== item.stockName && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.stockVariantName}
                          </p>
                        )}
                    </div>
                    <p className="text-sm font-bold whitespace-nowrap">
                      {item.quantity?.toLocaleString()} units
                    </p>
                  </div>
                </div>
              ),
            )}
            {/* Mobile total */}
            <div className="flex justify-between items-center px-4 py-3 rounded-lg font-semibold text-sm">
              <span>
                Total — {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
              <span>{totalQty.toLocaleString()} units</span>
            </div>
          </div>

          {/* ── NOTES ── */}
          {order.notes && (
            <div
              className="px-6 lg:px-10 pb-6"
              style={{ borderTop: `1px solid ${SECONDARY}` }}
            >
              <p
                className="text-xs uppercase tracking-widest mt-5 mb-2 font-semibold"
                style={{ color: PRIMARY }}
              >
                Special Instructions / Notes
              </p>
              <p
                className="text-sm text-gray-600 p-4 rounded-lg leading-relaxed whitespace-pre-wrap"
                style={{
                  backgroundColor: `${SECONDARY}40`,
                  border: `1px solid ${SECONDARY}`,
                }}
              >
                {order.notes}
              </p>
            </div>
          )}

          {/* ── TERMS ── */}
          <div
            className="px-6 lg:px-10 pb-6"
            style={{ borderTop: `1px solid ${SECONDARY}` }}
          >
            <p
              className="text-xs uppercase tracking-widest mt-5 mb-2 font-semibold"
              style={{ color: PRIMARY }}
            >
              Terms & Conditions
            </p>
            <ol
              className="space-y-1.5 list-decimal list-inside text-xs text-gray-500 leading-relaxed p-4 rounded-lg"
              style={{
                backgroundColor: `${SECONDARY}40`,
                border: `1px solid ${SECONDARY}`,
              }}
            >
              {[
                "Please confirm receipt of this purchase order within 24 hours.",
                "Delivery must be made on or before the specified delivery date.",
                "All items must meet the specified quality standards and match the descriptions provided.",
                "Invoice should reference the purchase order number for processing.",
                "Goods received are subject to inspection and approval.",
                "Payment terms: Net 30 days from date of invoice.",
              ].map((term, i) => (
                <li key={i} className="pl-1">
                  {term}
                </li>
              ))}
            </ol>
          </div>

          {/* ── Accept CTA — no-print ── */}
          {canAccept && (
            <div
              className="px-6 lg:px-10 pb-6 print:hidden"
              style={{ borderTop: `1px solid ${SECONDARY}` }}
            >
              <div
                className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border-2 border-dashed"
                style={{ borderColor: PRIMARY, backgroundColor: PRIMARY_LIGHT }}
              >
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: PRIMARY }}
                  >
                    Ready to confirm this order?
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click Accept to notify the buyer and confirm delivery.
                  </p>
                </div>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  style={{ backgroundColor: PRIMARY }}
                  onMouseEnter={(e) =>
                    ((
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "#d4703a")
                  }
                  onMouseLeave={(e) =>
                    ((
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = PRIMARY)
                  }
                >
                  {accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Accepting…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Accept Purchase Order
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Accepted banner — no-print ── */}
          {isAccepted && (
            <div
              className="px-6 lg:px-10 pb-6 print:hidden"
              style={{ borderTop: `1px solid ${SECONDARY}` }}
            >
              <div
                className="mt-5 flex items-center gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: "#dcfce7",
                  border: "1px solid #86efac",
                }}
              >
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800 text-sm">
                    Purchase Order Accepted
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    This order has been confirmed. The buyer has been notified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div
            className="px-6 lg:px-10 py-6 flex justify-center items-center gap-4"
            style={{ borderTop: `1px solid ${SECONDARY}` }}
          >
            <div className="text-center flex-shrink-0">
              <p className="text-xs lg:text-sm font-semibold">
                Thank you for your business and continued support
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Powered by Settlo Technologies
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}
