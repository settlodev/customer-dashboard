"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { previewPurchaseOrder } from "@/lib/actions/stock-purchase-actions";
import { AcceptStockPurchase } from "@/lib/actions/stock-purchase-actions";
import { toast } from "sonner";

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
      .catch(() => {
        setLoading(false);
      });
  }, [purchaseId]);

  const handlePrint = () => {
    window.print();
  };

  const handleAccept = async ({}) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Purchase order not found</p>
        </div>
      </div>
    );
  }

  const isAccepted = order.status === "ACCEPTED" || order.status === "APPROVED";
  const canAccept = order.status === "SUBMITTED";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Action buttons - hidden in print */}
        <div className="mb-6 flex justify-end items-center print:hidden">
          <div>
            {canAccept && (
              <Button
                onClick={handleAccept}
                disabled={accepting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Purchase Order
                  </>
                )}
              </Button>
            )}
            {isAccepted && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Purchase Order Accepted</span>
              </div>
            )}
          </div>
          {/*<div className="flex gap-3">*/}
          {/*  <Button variant="outline" onClick={handlePrint}>*/}
          {/*    <Printer className="mr-2 h-4 w-4" />*/}
          {/*    Print*/}
          {/*  </Button>*/}
          {/*  <Button variant="outline">*/}
          {/*    <Download className="mr-2 h-4 w-4" />*/}
          {/*    Download PDF*/}
          {/*  </Button>*/}
          {/*</div>*/}
        </div>

        {/* Main LPO Document */}
        <Card className="shadow-xl bg-white print:shadow-none">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className="border-b-4 border-gray-900 bg-gray-50 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    LOCAL PURCHASE ORDER
                  </h1>
                </div>
                <div className="text-right">
                  <Badge
                    className={`text-sm px-4 py-1 ${
                      order.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "APPROVED" ||
                            order.status === "ACCEPTED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Order Number and Date Section */}
            <div className="px-8 py-6 bg-white border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">
                    Purchase Order Number
                  </p>
                  <p className="text-xl font-mono font-bold text-gray-900">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">
                    Issue Date
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {format(new Date(), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {/* Supplier & Delivery Information */}
            <div className="px-8 py-6 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Supplier Details */}
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-300 pb-1">
                    Supplier Information
                  </h2>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      <p className="text-base font-semibold text-gray-900">
                        {order.supplierName}
                      </p>
                    </div>
                    {order.supplierEmail && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-base text-gray-900">
                          {order.supplierEmail}
                        </p>
                      </div>
                    )}
                    {order.supplierPhoneNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-base text-gray-900">
                          {order.supplierPhoneNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Details */}
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-300 pb-1">
                    Delivery Information
                  </h2>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">
                        Expected Delivery Date
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {format(new Date(order.deliveryDate), "MMMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="px-8 py-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-300 pb-1">
                Order Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Item Description
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Variant
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.stockIntakePurchaseOrderItems.map(
                      (item: any, index: number) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-4 px-2 text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="py-4 px-2">
                            <p className="text-sm font-medium text-gray-900">
                              {item.stockName}
                            </p>
                          </td>
                          <td className="py-4 px-2">
                            <p className="text-sm text-gray-600">
                              {item.stockVariantName}
                            </p>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {item.quantity}
                            </p>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Row */}
              <div className="mt-6 pt-4 border-t-2 border-gray-300">
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2">
                      <span className="text-sm font-bold text-gray-700 uppercase">
                        Total Items:
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {order.stockIntakePurchaseOrderItems.length}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm font-bold text-gray-700 uppercase">
                        Total Quantity:
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {order.stockIntakePurchaseOrderItems.reduce(
                          (sum: number, item: any) => sum + item.quantity,
                          0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.notes && (
              <div className="px-8 py-6 border-t bg-gray-50">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-300 pb-1">
                  Special Instructions / Notes
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="px-8 py-6 border-t">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-300 pb-1">
                Terms & Conditions
              </h2>
              <div className="text-xs text-gray-600 space-y-2">
                <p>
                  1. Please confirm receipt of this purchase order within 24
                  hours.
                </p>
                <p>
                  2. Delivery must be made on or before the specified delivery
                  date.
                </p>
                <p>
                  3. All items must meet the specified quality standards and
                  match the descriptions provided.
                </p>
                <p>
                  4. Invoice should reference the purchase order number for
                  processing.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-emerald-500 text-center">
              <p className="text-xs text-white">
                Powered by{" "}
                <span className="font-semibold text-white">Settlo</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
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
