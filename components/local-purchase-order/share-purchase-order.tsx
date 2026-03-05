"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Loader2,
  Building2,
  MapPin,
  Mail,
  Phone,
  Package,
  Calendar,
  Hash,
  Printer,
} from "lucide-react";
import {
  previewPurchaseOrder,
  AcceptStockPurchase,
} from "@/lib/actions/stock-purchase-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [purchaseId]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const updatedOrder = await AcceptStockPurchase(order.id);
      setOrder(updatedOrder);
      toast.success("Purchase order accepted successfully!");
    } catch (error) {
      console.error("Failed to accept purchase order:", error);
      toast.error("Failed to accept purchase order. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-amber-100 text-amber-800 border border-amber-300";
      case "APPROVED":
      case "ACCEPTED":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-emerald-600 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">
            Loading purchase order…
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-7 w-7 text-gray-400" />
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

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
              Settlo · Purchase Document
            </p>
            <p className="text-sm font-mono text-gray-600">
              #{order.orderNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            {canAccept && (
              <Button
                onClick={handleAccept}
                disabled={accepting}
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Accepting…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Accept Order
                  </>
                )}
              </Button>
            )}

            {isAccepted && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-semibold">Order Accepted</span>
              </div>
            )}
          </div>
        </div>

        {/* LPO Document */}
        <Card className="shadow-xl border border-gray-200 overflow-hidden bg-white print:shadow-none">
          <CardContent className="p-0">
            {/* ── Dark Header ── */}
            <div className="relative bg-gray-900 px-8 py-7 overflow-hidden">
              <div className="absolute inset-y-0 right-0 w-2 bg-emerald-500" />
              <div className="absolute bottom-0 left-0 right-2 h-px bg-emerald-500/40" />

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-1">
                    Purchase Document
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Local Purchase Order
                  </h1>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                      getStatusStyle(order.status),
                    )}
                  >
                    {order.status}
                  </span>
                  <p className="font-mono text-sm text-gray-400">
                    #{order.orderNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Meta strip ── */}
            <div className="grid grid-cols-3 divide-x divide-gray-200 bg-gray-50 border-b border-gray-200">
              {[
                {
                  icon: <Hash className="h-3.5 w-3.5" />,
                  label: "Order Number",
                  value: order.orderNumber,
                  mono: true,
                },
                {
                  icon: <Calendar className="h-3.5 w-3.5" />,
                  label: "Issue Date",
                  value: format(
                    new Date(order.dateCreated ?? new Date()),
                    "MMM dd, yyyy",
                  ),
                },
                {
                  icon: <Calendar className="h-3.5 w-3.5" />,
                  label: "Expected Delivery",
                  value: order.deliveryDate
                    ? format(new Date(order.deliveryDate), "MMM dd, yyyy")
                    : "Not specified",
                },
              ].map((m, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    {m.icon}
                    <p className="text-xs font-semibold uppercase tracking-wider truncate">
                      {m.label}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold text-gray-900 truncate",
                      m.mono && "font-mono",
                    )}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Buyer & Supplier ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-b border-gray-200">
              {/* Issued By (Business) */}
              <div className="px-7 py-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Issued By
                  </h2>
                </div>

                <p className="text-lg font-bold text-gray-900 mb-3">
                  {order.businessName}
                </p>

                <div className="space-y-2">
                  {order.locationName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <span>{order.locationName}</span>
                    </div>
                  )}
                  {order.locationEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <a
                        href={`mailto:${order.locationEmail}`}
                        className="hover:text-emerald-600 transition-colors"
                      >
                        {order.locationEmail}
                      </a>
                    </div>
                  )}
                  {order.locationPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <a
                        href={`tel:${order.locationPhone}`}
                        className="hover:text-emerald-600 transition-colors"
                      >
                        {order.locationPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier */}
              <div className="px-7 py-6 bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Supplier
                  </h2>
                </div>

                <p className="text-lg font-bold text-gray-900 mb-3">
                  {order.supplierName}
                </p>

                <div className="space-y-2">
                  {order.supplierEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <a
                        href={`mailto:${order.supplierEmail}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {order.supplierEmail}
                      </a>
                    </div>
                  )}
                  {order.supplierPhoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <a
                        href={`tel:${order.supplierPhoneNumber}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {order.supplierPhoneNumber}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Items Table ── */}
            <div className="px-7 py-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Order Items
                </h2>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-10">
                        #
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Variant
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.stockIntakePurchaseOrderItems?.map(
                      (item: any, index: number) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-xs text-gray-400 tabular-nums">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-gray-900">
                              {item.stockName}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500">
                            {item.stockVariantName}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 font-bold text-sm tabular-nums">
                              {item.quantity}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 flex justify-end">
                <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center divide-x divide-gray-200">
                    <div className="px-5 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                        Total Items
                      </p>
                      <p className="text-xl font-bold text-gray-900 tabular-nums">
                        {totalItems}
                      </p>
                    </div>
                    <div className="px-5 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                        Total Qty
                      </p>
                      <p className="text-xl font-bold text-emerald-600 tabular-nums">
                        {totalQty}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Notes ── */}
            {order.notes && (
              <div className="px-7 py-5 border-t border-gray-200 bg-amber-50/60">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Special Instructions / Notes
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            )}

            {/* ── Terms ── */}
            <div className="px-7 py-5 border-t border-gray-200 bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Terms & Conditions
              </p>
              <ol className="space-y-1.5 list-decimal list-inside">
                {[
                  "Please confirm receipt of this purchase order within 24 hours.",
                  "Delivery must be made on or before the specified delivery date.",
                  "All items must meet the specified quality standards and match the descriptions provided.",
                  "Invoice should reference the purchase order number for processing.",
                ].map((term, i) => (
                  <li key={i} className="text-xs text-gray-500">
                    {term}
                  </li>
                ))}
              </ol>
            </div>

            {/* ── Accept CTA (inline, visible on mobile) ── */}
            {canAccept && (
              <div className="px-7 py-5 border-t border-gray-200 bg-white print:hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50">
                  <div>
                    <p className="font-semibold text-emerald-800 text-sm">
                      Ready to confirm this order?
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Click Accept to notify the buyer and confirm delivery.
                    </p>
                  </div>
                  <Button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
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
                  </Button>
                </div>
              </div>
            )}

            {isAccepted && (
              <div className="px-7 py-5 border-t border-gray-200 bg-white print:hidden">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-800 text-sm">
                      Purchase Order Accepted
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      This order has been confirmed. The buyer has been
                      notified.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-7 py-3.5 bg-gray-900">
              <p className="text-xs text-gray-500">
                Generated{" "}
                {format(
                  new Date(order.dateCreated ?? new Date()),
                  "MMM dd, yyyy 'at' HH:mm",
                )}
              </p>
              <p className="text-xs text-gray-400">
                Powered by{" "}
                <span className="font-semibold text-emerald-400">Settlo</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}
