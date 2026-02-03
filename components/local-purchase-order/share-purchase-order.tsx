"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { fetchPurchaseOrderForShare } from "@/lib/actions/stock-purchase-actions";

interface SharePurchaseOrderProps {
  purchaseId: string;
}

export default function SharePurchaseOrder({
  purchaseId,
}: SharePurchaseOrderProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseOrderForShare(purchaseId)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [purchaseId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!order) {
    return <div>Purchase order not found</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchase Order #{purchaseId}</CardTitle>
              <p className="text-sm text-gray-500">
                For Supplier: {order.supplierName}
              </p>
            </div>
            <Badge>{order.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Render purchase order details */}
          <div className="space-y-6">
            {/* Order details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Delivery Date</p>
                <p className="font-medium">
                  {format(new Date(order.deliveryDate), "PPP")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created Date</p>
                <p className="font-medium">{format(new Date(), "PPP")}</p>
              </div>
            </div>

            {/* Items list */}
            <div className="border rounded-lg">
              <div className="bg-gray-50 p-4 font-medium">Order Items</div>
              <div className="divide-y">
                {order.stockIntakePurchaseOrderItems.map(
                  (item: any, index: number) => (
                    <div key={item.id} className="p-4 grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <p className="font-medium">{item.stockName}</p>
                        <p className="text-sm text-gray-500">
                          {item.stockVariantName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="border rounded-lg p-4">
                <p className="font-medium mb-2">Special Instructions</p>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
