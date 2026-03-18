import { format } from "date-fns";
import { notFound } from "next/navigation";
import { UUID } from "node:crypto";
import { getStockIntakeReceipt } from "@/lib/actions/stock-purchase-actions";
import { StockReceipt } from "@/types/stock-intake-receipt/type";
import { GRNDownloadButton } from "@/components/widgets/grn-download-button";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

type Params = Promise<{ id: string }>;

interface EnhancedStockPurchaseItem {
  id?: string;
  stock: string;
  stockName: string;
  stockVariant: string;
  stockVariantName: string;
  quantityReceived: number;
  bonusQuantity?: number;
  totalCost: number;
  previousCostPerItem: number;
  lastCostPerItem?: number;
  sellingPrice?: number;
  margin?: number;
  code?: string;
}

export default async function StockReceiptPage({ params }: { params: Params }) {
  const paramsData = await params;
  const { id } = paramsData;
  if (id === "new") notFound();

  let receiptData: StockReceipt;
  try {
    receiptData = await getStockIntakeReceipt(id as UUID);
    if (!receiptData) notFound();
  } catch (error) {
    console.error(error);
    notFound();
  }

  const items = (receiptData.stockIntakeReceiptItems ||
    []) as EnhancedStockPurchaseItem[];

  const totalQty = items.reduce((s, i) => s + (i.quantityReceived || 0), 0);
  const totalValue = items.reduce((s, i) => s + (i.totalCost || 0), 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (d: string | Date) => format(new Date(d), "dd MMM yyyy");

  const formatDateTime = (d: string | Date) =>
    format(new Date(d), "dd MMM yyyy, hh:mm a");

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{ backgroundColor: SECONDARY }}
    >
      <div className="max-w-4xl mx-auto">
        {/* ─── Document ─── */}
        <div
          id="grn-content"
          className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
          style={{ maxWidth: "794px", border: `1px solid ${SECONDARY}` }}
        >
          <div className="px-6 lg:px-10 pt-8 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
            {/* Left: logo + business name only */}
            <div className="flex items-center gap-4">
              {(receiptData as any).locationLogo ? (
                <img
                  src={(receiptData as any).locationLogo}
                  alt={`${receiptData.businessName} logo`}
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
                GOODS RECEIVED NOTE
              </h2>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-800">
                  {receiptData.businessName}
                </p>
                {receiptData.locationAddress && (
                  <p>{receiptData.locationAddress}</p>
                )}
                {receiptData.locationName && <p>{receiptData.locationName}</p>}
                {receiptData.locationPhone && (
                  <p>Phone number: {receiptData.locationPhone}</p>
                )}
                {receiptData.locationEmail && (
                  <p>{receiptData.locationEmail}</p>
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
                  {receiptData.supplierName}
                </p>
                {receiptData.supplierPhoneNumber && (
                  <p>Phone number: {receiptData.supplierPhoneNumber}</p>
                )}
                {receiptData.supplierEmail && (
                  <p>Email: {receiptData.supplierEmail}</p>
                )}
                {receiptData.supplierPhysicalAddress && (
                  <p>Physical address: {receiptData.supplierPhysicalAddress}</p>
                )}
              </div>
            </div>

            {/* Right: GRN meta — fixed label width so nothing wraps */}
            <div className="w-full lg:w-80">
              <table className="w-full text-sm">
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      GRN Number:
                    </td>
                    <td className="py-2 text-gray-900 text-right font-mono text-xs">
                      {receiptData.receiptNumber}
                    </td>
                  </tr>
                  {receiptData.purchaseOrderNumber && (
                    <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                      <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                        PO Reference:
                      </td>
                      <td className="py-2 text-gray-900 text-right text-xs break-all">
                        {receiptData.purchaseOrderNumber}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      Date Received:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {receiptData.receivedAt
                        ? formatDate(receiptData.receivedAt)
                        : formatDate(new Date())}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${SECONDARY}` }}>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      Prepared By:
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {receiptData.staffFirstName} {receiptData.staffLastName}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                      Total Value:
                    </td>
                    <td className="py-2 font-bold text-right">
                      TZS {formatCurrency(totalValue)}
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
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white w-8">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Item / Variant
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white w-24">
                    Qty
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white w-32">
                    Prev. Cost
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white w-32">
                    New Cost
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white w-36">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id || index}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#ffffff" : `${SECONDARY}40`,
                      borderBottom: `1px solid ${SECONDARY}`,
                    }}
                  >
                    <td className="px-3 py-3 text-sm text-gray-500 text-center">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">
                        {item.stockName}
                      </p>
                      {item.stockVariantName &&
                        item.stockVariantName !== item.stockName && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.stockVariantName}
                          </p>
                        )}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-gray-800">
                      {item.quantityReceived?.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-500">
                      {item.previousCostPerItem != null
                        ? formatCurrency(item.previousCostPerItem)
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800">
                      {item.lastCostPerItem != null
                        ? formatCurrency(item.lastCostPerItem)
                        : item.previousCostPerItem != null
                          ? formatCurrency(item.previousCostPerItem)
                          : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900">
                      TZS {formatCurrency(item.totalCost || 0)}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr>
                  <td
                    colSpan={2}
                    className="px-3 py-3 text-sm font-semibold text-right"
                  >
                    Total — {items.length}{" "}
                    {items.length === 1 ? "line" : "lines"}
                  </td>
                  <td className="px-3 py-3 text-center font-bold">
                    {totalQty.toLocaleString()}
                  </td>
                  <td colSpan={2} />
                  <td className="px-3 py-3 text-right font-bold">
                    TZS {formatCurrency(totalValue)}
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
              <span>Total</span>
            </div>
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="rounded-lg p-4"
                style={{
                  border: `1px solid ${SECONDARY}`,
                  backgroundColor:
                    index % 2 === 0 ? "#ffffff" : `${SECONDARY}20`,
                }}
              >
                <div className="flex justify-between items-start gap-3 mb-3">
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
                    TZS {formatCurrency(item.totalCost || 0)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 uppercase tracking-wider mb-0.5">
                      Qty Received
                    </p>
                    <p className="font-bold text-gray-800">
                      {item.quantityReceived?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase tracking-wider mb-0.5">
                      Total Amount
                    </p>
                    <p className="font-bold">
                      TZS {formatCurrency(item.totalCost || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase tracking-wider mb-0.5">
                      Prev. Cost
                    </p>
                    <p className="font-semibold text-gray-600">
                      {item.previousCostPerItem != null
                        ? formatCurrency(item.previousCostPerItem)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase tracking-wider mb-0.5">
                      New Cost
                    </p>
                    <p className="font-semibold text-gray-800">
                      {item.lastCostPerItem != null
                        ? formatCurrency(item.lastCostPerItem)
                        : item.previousCostPerItem != null
                          ? formatCurrency(item.previousCostPerItem)
                          : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* Mobile total */}
            <div className="flex justify-between items-center px-4 py-3 rounded-lg font-semibold text-sm">
              <span>Total ({totalQty.toLocaleString()} units)</span>
              <span>TZS {formatCurrency(totalValue)}</span>
            </div>
          </div>

          {/* ── INVOICE SUMMARY ── */}
          <div className="px-6 lg:px-10 mb-6">
            <div className="flex justify-end">
              <div className="w-full lg:max-w-xs">
                <div
                  className="flex justify-between text-sm text-gray-600 py-2"
                  style={{ borderBottom: `1px solid ${SECONDARY}` }}
                >
                  <span>Net Amount:</span>
                  <span>TZS {formatCurrency(totalValue)}</span>
                </div>
                <div
                  className="flex justify-between text-sm text-gray-600 py-2"
                  style={{ borderBottom: `1px solid ${SECONDARY}` }}
                >
                  <span>VAT Amount:</span>
                  <span>TZS 0.00</span>
                </div>
                <div className="flex justify-between font-bold py-3 mt-1 rounded px-3">
                  <span>Total Amount (TZS):</span>
                  <span>TZS {formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SIGNATURES ── */}
          <div
            className="px-6 lg:px-10 py-6"
            style={{ borderTop: `1px solid ${SECONDARY}` }}
          >
            <p className="text-xs uppercase tracking-widest mb-5 font-semibold">
              Authorisation & Signatures
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                {
                  label: "Prepared By",
                  value: `${receiptData.staffFirstName} ${receiptData.staffLastName}`,
                },
                { label: "Checked By", value: "" },
                { label: "Authorised By", value: "" },
                { label: "Accounts", value: "" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="h-10 flex items-end justify-center pb-1 w-full">
                    {value && (
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {value}
                      </span>
                    )}
                  </div>
                  <div
                    className="w-full mb-1.5"
                    style={{ borderBottom: "2px solid #d1d5db" }}
                  />
                  <p className="text-xs text-gray-400 text-center">{label}</p>
                </div>
              ))}
            </div>

            {/* Approval + VAT tables */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approval table */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-2 font-semibold">
                  Approval
                </p>
                <table
                  className="w-full text-xs"
                  style={{ border: `1px solid ${SECONDARY}`, borderRadius: 8 }}
                >
                  <thead>
                    <tr style={{ backgroundColor: `${SECONDARY}80` }}>
                      {["Approved By", "Date", "Amount"].map((h) => (
                        <th
                          key={h}
                          className="py-2.5 px-3 font-semibold text-gray-600 text-center"
                          style={{ borderBottom: `1px solid ${SECONDARY}` }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((r) => (
                      <tr
                        key={r}
                        style={{ borderTop: `1px solid ${SECONDARY}` }}
                      >
                        <td className="py-5" />
                        <td
                          className="py-5"
                          style={{ borderLeft: `1px solid ${SECONDARY}` }}
                        />
                        <td
                          className="py-5"
                          style={{ borderLeft: `1px solid ${SECONDARY}` }}
                        />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* VAT summary */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-2 font-semibold">
                  VAT Summary
                </p>
                <table
                  className="w-full text-xs"
                  style={{ border: `1px solid ${SECONDARY}` }}
                >
                  <thead>
                    <tr style={{ backgroundColor: `${SECONDARY}80` }}>
                      {["Type", "VAT", "Goods Value"].map((h, i) => (
                        <th
                          key={h}
                          className={`py-2.5 px-3 font-semibold text-gray-600 ${i === 0 ? "text-left" : "text-right"}`}
                          style={{ borderBottom: `1px solid ${SECONDARY}` }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        type: "VAT",
                        vat: "0.00",
                        goods: formatCurrency(totalValue),
                      },
                      { type: "EXEMPT", vat: "0.00", goods: "0.00" },
                    ].map(({ type, vat, goods }, i) => (
                      <tr
                        key={type}
                        style={{
                          borderTop: `1px solid ${SECONDARY}`,
                          backgroundColor:
                            i % 2 === 0 ? "#ffffff" : `${SECONDARY}30`,
                        }}
                      >
                        <td className="py-3 px-3 font-semibold text-gray-700">
                          {type}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-500">
                          {vat}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-800">
                          {goods}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── NOTES ── */}
          {receiptData.notes && (
            <div
              className="px-6 lg:px-10 pb-6"
              style={{ borderTop: `1px solid ${SECONDARY}` }}
            >
              <p
                className="text-xs uppercase tracking-widest mt-5 mb-2 font-semibold"
                style={{ color: PRIMARY }}
              >
                Notes
              </p>
              <p
                className="text-sm text-gray-600 p-4 rounded-lg leading-relaxed"
                style={{
                  backgroundColor: `${SECONDARY}40`,
                  border: `1px solid ${SECONDARY}`,
                }}
              >
                {receiptData.notes}
              </p>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div
            className="px-6 lg:px-10 py-6 flex  justify-center items-center gap-4"
            style={{ borderTop: `1px solid ${SECONDARY}` }}
          >
            <div className="flex justify-center items-center gap-4">
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
        </div>

        {/* ── Action Buttons ── */}
        <div className="hidden lg:flex w-full justify-center items-center mt-6 mb-4 gap-3">
          <GRNDownloadButton
            receiptData={receiptData}
            items={items}
            totalQuantityReceived={totalQty}
            totalValue={totalValue}
          />
        </div>
      </div>
    </div>
  );
}
