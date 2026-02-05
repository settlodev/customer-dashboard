import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { notFound } from "next/navigation";
import { getStockPurchases } from "@/lib/actions/stock-purchase-actions";
import { UUID } from "node:crypto";
import { StockPurchase } from "@/types/stock-purchases/type";
import SharePurchaseOrder from "@/components/local-purchase-order/order-purchase";

type Params = Promise<{ id: string }>;

export default async function StockPurchasePage({
  params,
}: {
  params: Params;
}) {
  const paramsData = await params;
  const { id } = paramsData;
  const isNewItem = id === "new";

  // If it's a new item, redirect or show appropriate message
  if (isNewItem) {
    notFound(); // Or redirect to create form
  }

  let purchaseData: StockPurchase;
  try {
    purchaseData = await getStockPurchases(id as UUID);
    if (!purchaseData) notFound();
  } catch (error) {
    console.error(error);
    notFound();
  }

  // Calculate totals
  const totalItems = purchaseData.stockIntakePurchaseOrderItems?.length || 0;
  const totalQuantity =
    purchaseData.stockIntakePurchaseOrderItems?.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    ) || 0;

  const breadCrumbItems = [
    { title: "Stock Purchases", link: "/stock-purchases" },
    {
      title: purchaseData.orderNumber || "Purchase Order",
      link: "",
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1">
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
      </div>

      {/* Purchase Order Card */}
      <Card className="shadow-xl print:shadow-none">
        <CardContent className="p-0">
          {/* LPO Header */}
          <div className="border-b-4 border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-900 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  LOCAL PURCHASE ORDER
                </h1>
              </div>
              <Badge
                className={cn(
                  "text-sm px-4 py-1",
                  purchaseData.status === "SUBMITTED"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : purchaseData.status === "APPROVED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : purchaseData.status === "DELIVERED"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
                )}
              >
                {purchaseData.status || "SUBMITTED"}
              </Badge>
            </div>
          </div>

          {/* Order Number and Date */}
          <div className="px-8 py-6 bg-white dark:bg-gray-800 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                  Order Number
                </p>
                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                  {purchaseData.orderNumber}
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                  Issue Date
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {format(new Date(), "MMMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier & Delivery Information */}
          <div className="px-8 py-6 border-b bg-gray-50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Supplier Details */}
              <div>
                <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-300 dark:border-gray-700 pb-1">
                  Supplier Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Company Name
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {purchaseData.supplierName}
                    </p>
                  </div>
                  {purchaseData.supplierEmail && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Email
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {purchaseData.supplierEmail}
                      </p>
                    </div>
                  )}
                  {purchaseData.supplierPhoneNumber && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Phone
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {purchaseData.supplierPhoneNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Details */}
              <div>
                <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-300 dark:border-gray-700 pb-1">
                  Delivery Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Expected Delivery Date
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {purchaseData.deliveryDate
                        ? format(
                            new Date(purchaseData.deliveryDate),
                            "MMMM dd, yyyy",
                          )
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-6">
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-300 dark:border-gray-700 pb-1">
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Item Description
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Variant
                    </th>
                    <th className="text-right py-3 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {purchaseData.stockIntakePurchaseOrderItems?.map(
                    (item, index: number) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400">
                          {index + 1}
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.stockName}
                          </p>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.stockVariantName}
                          </p>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.quantity?.toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-8 pt-6 border-t-2 border-gray-300 dark:border-gray-700">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Total Items:
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {totalItems}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-gray-300 dark:border-gray-700 mt-2 pt-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Total Quantity:
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {totalQuantity.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {purchaseData.notes && (
            <div className="px-8 py-6 border-t bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-300 dark:border-gray-700 pb-1">
                Special Instructions / Notes
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {purchaseData.notes}
              </p>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="px-8 py-6 border-t">
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-300 dark:border-gray-700 pb-1">
              Terms & Conditions
            </h2>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                1. Please confirm receipt of this purchase order within 24
                hours.
              </p>
              <p>
                2. Delivery must be made on or before the specified delivery
                date.
              </p>
              <p>
                3. All items must meet the specified quality standards and match
                the descriptions provided.
              </p>
              <p>
                4. Invoice should reference the purchase order number for
                processing.
              </p>
              <p>5. Goods received are subject to inspection and approval.</p>
              <p>6. Payment terms: Net 30 days from date of invoice.</p>
            </div>
          </div>

          {/* Signature Section */}
          {/*<div className="px-8 py-6 border-t bg-gray-50 dark:bg-gray-900/50">*/}
          {/*  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">*/}
          {/*    <div>*/}
          {/*      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8 font-semibold">*/}
          {/*        Authorized By*/}
          {/*      </p>*/}
          {/*      <div className="border-t border-gray-400 dark:border-gray-600 pt-2 mt-4">*/}
          {/*        <p className="text-sm text-gray-700 dark:text-gray-300">*/}
          {/*          ___________________________*/}
          {/*        </p>*/}
          {/*        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">*/}
          {/*          Signature*/}
          {/*        </p>*/}
          {/*      </div>*/}
          {/*      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">*/}
          {/*        Name: _______________________*/}
          {/*      </p>*/}
          {/*      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">*/}
          {/*        Date: _____________*/}
          {/*      </p>*/}
          {/*    </div>*/}
          {/*    <div>*/}
          {/*      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8 font-semibold">*/}
          {/*        Supplier Acknowledgment*/}
          {/*      </p>*/}
          {/*      <div className="border-t border-gray-400 dark:border-gray-600 pt-2 mt-4">*/}
          {/*        <p className="text-sm text-gray-700 dark:text-gray-300">*/}
          {/*          ___________________________*/}
          {/*        </p>*/}
          {/*        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">*/}
          {/*          Signature*/}
          {/*        </p>*/}
          {/*      </div>*/}
          {/*      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">*/}
          {/*        Name: _______________________*/}
          {/*      </p>*/}
          {/*      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">*/}
          {/*        Date: _____________*/}
          {/*      </p>*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/* Footer */}
          <div className="px-8 py-4 bg-emerald-500 text-center">
            <p className="text-xs text-white">
              Powered by{" "}
              <span className="font-semibold text-white">Settlo</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <SharePurchaseOrder />
    </div>
  );
}
