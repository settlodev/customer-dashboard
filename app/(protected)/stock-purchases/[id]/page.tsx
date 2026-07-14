import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getStockPurchases } from "@/lib/actions/stock-purchase-actions";
import { UUID } from "node:crypto";
import { StockPurchase } from "@/types/stock-purchases/type";
import SharePurchaseOrder from "@/components/local-purchase-order/order-purchase";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

type Params = Promise<{ id: string }>;

export default async function StockPurchasePage({
  params,
}: {
  params: Params;
}) {
  const paramsData = await params;
  const { id } = paramsData;
  if (id === "new") notFound();

  let purchaseData: StockPurchase;
  try {
    purchaseData = await getStockPurchases(id as UUID);
    if (!purchaseData) notFound();
  } catch (error) {
    console.error(error);
    notFound();
  }

  const items = purchaseData.stockIntakePurchaseOrderItems ?? [];
  const totalItems = items.length;
  const totalQuantity = items.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  const formatDate = (d: string | Date) => format(new Date(d), "MMMM dd, yyyy");

  const formatDateTime = (d: string | Date) =>
    format(new Date(d), "dd MMM yyyy, hh:mm a");

  // Status badge colors
  const statusStyle: Record<string, { bg: string; color: string }> = {
    SUBMITTED: { bg: "#dbeafe", color: "#1d4ed8" },
    APPROVED: { bg: "#dcfce7", color: "#15803d" },
    DELIVERED: { bg: "#ede9fe", color: "#7c3aed" },
    PARTIALLY_RECEIVED: { bg: PRIMARY_LIGHT, color: PRIMARY },
    RECEIVED: { bg: "#d1fae5", color: "#065f46" },
  };
  const ss = statusStyle[purchaseData.status] ?? {
    bg: SECONDARY,
    color: "#374151",
  };

  const breadCrumbItems = [
    { title: "Stock Purchases", link: "/stock-purchases" },
    { title: purchaseData.orderNumber || "Purchase Order", link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <BreadcrumbsNav items={breadCrumbItems} />

      {/* ─── Document ─── */}
      <div
        id="lpo-content"
        className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
        style={{ border: `1px solid ${SECONDARY}` }}
      >
        {/* Top accent bar */}
        <div style={{ height: 8, backgroundColor: PRIMARY }} />

        {/* ── HEADER: Logo/Name left · Title+Address right ── */}
        <div className="px-6 lg:px-10 pt-8 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
          {/* Left: business name (no logo available in LPO data) */}
          <div className="flex items-center gap-4">
            {(purchaseData as any).locationLogo ? (
              <img
                src={(purchaseData as any).locationLogo}
                alt={`${purchaseData.businessName} logo`}
                className="h-16 w-auto object-contain flex-shrink-0 rounded"
                style={{ border: `1px solid ${SECONDARY}` }}
              />
            ) : (
              <div className="h-14 w-14 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"></div>
            )}
          </div>

          {/* Right: doc title + location details */}
          <div className="lg:text-right">
            <h2
              className="text-3xl lg:text-4xl font-light tracking-wide mb-2"
              style={{ color: PRIMARY }}
            >
              LOCAL PURCHASE ORDER
            </h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-800">
                {purchaseData.businessName}
              </p>
              <p>{purchaseData.locationName}</p>
              {purchaseData.locationPhone && (
                <p>Mobile: {purchaseData.locationPhone}</p>
              )}
              {purchaseData.locationEmail && (
                <p>{purchaseData.locationEmail}</p>
              )}
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
          {/* Left: Supplier */}
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
              Supplier
            </p>
            <div className="text-sm text-gray-700 space-y-0.5">
              <p className="font-semibold text-gray-900">
                {purchaseData.supplierName}
              </p>
              {purchaseData.supplierPhoneNumber && (
                <p>{purchaseData.supplierPhoneNumber}</p>
              )}
              {purchaseData.supplierEmail && (
                <p>{purchaseData.supplierEmail}</p>
              )}
            </div>
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
                    {purchaseData.orderNumber}
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                  <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                    Date Created:
                  </td>
                  <td className="py-2 text-gray-900 text-right">
                    {purchaseData.dateCreated
                      ? formatDate(purchaseData.dateCreated)
                      : "—"}
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                  <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                    Expected Delivery:
                  </td>
                  <td className="py-2 text-gray-900 text-right">
                    {purchaseData.deliveryDate
                      ? formatDate(purchaseData.deliveryDate)
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
                    {totalQuantity.toLocaleString()}
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Variant
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white w-32">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
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
                    {item.stockName}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {item.stockVariantName &&
                    item.stockVariantName !== item.stockName
                      ? item.stockVariantName
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {item.quantity?.toLocaleString()}
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-3 text-sm font-semibold text-right"
                >
                  Total Quantity:
                </td>
                <td className="px-4 py-3 text-right font-bold">
                  {totalQuantity.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── ITEMS CARDS — mobile ── */}
        <div className="lg:hidden px-4 mb-6 space-y-3">
          <div className="flex justify-between items-center px-4 py-2 rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider">
            <span>Item</span>
            <span>Qty</span>
          </div>
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg p-4"
              style={{
                border: `1px solid ${SECONDARY}`,
                backgroundColor: index % 2 === 0 ? "#ffffff" : `${SECONDARY}20`,
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
          ))}
          {/* Mobile total */}
          <div className="flex justify-between items-center px-4 py-3 rounded-lg font-semibold text-sm">
            <span>
              Total — {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
            <span>{totalQuantity.toLocaleString()} units</span>
          </div>
        </div>

        {/* ── NOTES ── */}
        {purchaseData.notes && (
          <div
            className="px-6 lg:px-10 pb-6"
            style={{ borderTop: `1px solid ${SECONDARY}` }}
          >
            <p className="text-xs uppercase tracking-widest mt-5 mb-2 font-semibold">
              Special Instructions / Notes
            </p>
            <p
              className="text-sm text-gray-600 p-4 rounded-lg leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: `${SECONDARY}40`,
                border: `1px solid ${SECONDARY}`,
              }}
            >
              {purchaseData.notes}
            </p>
          </div>
        )}

        {/* ── TERMS ── */}
        <div
          className="px-6 lg:px-10 pb-6"
          style={{ borderTop: `1px solid ${SECONDARY}` }}
        >
          <p className="text-xs uppercase tracking-widest mt-5 mb-2 font-semibold">
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

      <SharePurchaseOrder />
    </div>
  );
}
