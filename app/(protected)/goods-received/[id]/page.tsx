import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { UUID } from "node:crypto";
import { getStockIntakeReceipt } from "@/lib/actions/stock-purchase-actions";
import { StockReceipt } from "@/types/stock-intake-receipt/type";
import { GRNDownloadButton } from "@/components/widgets/grn-download-button";

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
  const isNewItem = id === "new";

  if (isNewItem) notFound();

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

  const totalQuantityReceived = items.reduce(
    (sum, item) => sum + (item.quantityReceived || 0),
    0,
  );
  const totalValue = items.reduce(
    (sum, item) => sum + (item.totalCost || 0),
    0,
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-emerald-50 min-h-screen mt-4">
      <Card className="shadow-none border border-emerald-200 mt-4 bg-white w-full max-w-7xl mx-auto overflow-hidden">
        <CardContent className="p-0">
          {/* ── HEADER ── */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4 sm:px-6 md:px-8 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
              <div className="w-full sm:w-auto">
                <p className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">
                  {receiptData.businessName}
                </p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                  Goods Received Note
                </h1>
                <p className="text-xs sm:text-sm text-emerald-300/70 mt-1.5 font-medium">
                  {receiptData.locationName}
                </p>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                {/* GRN Badge */}
                <div className="bg-emerald-500 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-right">
                  <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.25em] text-emerald-100 mb-0.5">
                    GRN No.
                  </p>
                  <p className="text-sm sm:text-base font-black font-mono text-white break-all leading-tight">
                    {receiptData.receiptNumber}
                  </p>
                </div>
                <div className="sm:mt-1">
                  <GRNDownloadButton
                    receiptData={receiptData}
                    items={items}
                    totalQuantityReceived={totalQuantityReceived}
                    totalValue={totalValue}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── EMERALD ACCENT BAR ── */}
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />

          {/* ── META ROW ── */}
          <div className="px-4 sm:px-6 md:px-8 py-4 border-b border-emerald-100 bg-emerald-50/50">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  label: "PO Reference",
                  value: receiptData.purchaseOrderNumber || "—",
                },
                {
                  label: "GRN Date",
                  value: receiptData.dateReceived
                    ? format(new Date(receiptData.dateReceived), "dd-MMM-yyyy")
                    : format(new Date(), "dd-MMM-yyyy"),
                },
                {
                  label: "Invoice No.",
                  value: (receiptData as any).invoiceNumber || "—",
                },
                {
                  label: "Prepared By",
                  value: `${receiptData.staffFirstName} ${receiptData.staffLastName}`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="border border-emerald-200 p-2.5 sm:p-3 rounded-lg bg-white shadow-sm"
                >
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">
                    {label}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 break-words">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SUPPLIER & RECEIVING LOCATION ── */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-emerald-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Supplier */}
              <div className="border border-emerald-200 rounded-lg overflow-hidden">
                <div className="bg-emerald-500 px-4 py-2">
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white">
                    Supplier Information
                  </p>
                </div>
                <div className="p-3 sm:p-4 space-y-2.5 bg-white">
                  {[
                    { label: "Supplier", value: receiptData.supplierName },
                    receiptData.supplierEmail && {
                      label: "Email",
                      value: receiptData.supplierEmail,
                    },
                    receiptData.supplierPhoneNumber && {
                      label: "Phone",
                      value: receiptData.supplierPhoneNumber,
                    },
                  ]
                    .filter(Boolean)
                    .map(({ label, value }: any) => (
                      <div
                        key={label}
                        className="flex flex-col sm:flex-row sm:gap-3"
                      >
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600 sm:w-16 shrink-0">
                          {label}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 font-medium break-words">
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Receiving Location */}
              <div className="border border-emerald-200 rounded-lg overflow-hidden">
                <div className="bg-emerald-500 px-4 py-2">
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white">
                    Receiving Location
                  </p>
                </div>
                <div className="p-3 sm:p-4 space-y-2.5 bg-white">
                  {[
                    { label: "Business", value: receiptData.businessName },
                    { label: "Location", value: receiptData.locationName },
                    receiptData.locationEmail && {
                      label: "Email",
                      value: receiptData.locationEmail,
                    },
                    receiptData.locationPhone && {
                      label: "Phone",
                      value: receiptData.locationPhone,
                    },
                    receiptData.locationAddress && {
                      label: "Address",
                      value: receiptData.locationAddress,
                    },
                  ]
                    .filter(Boolean)
                    .map(({ label, value }: any) => (
                      <div
                        key={label}
                        className="flex flex-col sm:flex-row sm:gap-3"
                      >
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600 sm:w-16 shrink-0">
                          {label}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 font-medium break-words">
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── ITEMS TABLE ── */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
            {/* Section heading */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-5 w-1 bg-emerald-500 rounded-full" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-gray-700">
                Received Items
              </p>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border border-emerald-200 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="bg-emerald-50 px-3 py-2 border-b border-emerald-200 flex items-center gap-2">
                    <span className="bg-emerald-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-700">
                      {item.stockName}
                    </span>
                  </div>
                  <div className="p-3 bg-white">
                    {item.stockVariantName &&
                      item.stockVariantName !== item.stockName && (
                        <p className="text-xs text-gray-500 mb-2">
                          {item.stockVariantName}
                        </p>
                      )}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          k: "Qty",
                          v: item.quantityReceived?.toLocaleString(),
                        },
                        {
                          k: "Cost Price",
                          v:
                            item.previousCostPerItem != null
                              ? formatCurrency(item.previousCostPerItem)
                              : "—",
                        },
                        {
                          k: "Last CP",
                          v:
                            item.lastCostPerItem != null
                              ? formatCurrency(item.lastCostPerItem)
                              : item.previousCostPerItem != null
                                ? formatCurrency(item.previousCostPerItem)
                                : "—",
                        },
                        { k: "Amount", v: formatCurrency(item.totalCost || 0) },
                      ].map(({ k, v }) => (
                        <div key={k}>
                          <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                            {k}
                          </p>
                          <p className="text-sm font-bold text-gray-800">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Totals */}
              <div className="border border-emerald-300 bg-emerald-50 p-3 rounded-lg mt-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                    Total Items
                  </span>
                  <span className="font-bold text-gray-800">
                    {items.length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                    Total Quantity
                  </span>
                  <span className="font-bold text-gray-800">
                    {totalQuantityReceived.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-emerald-300">
                  <span className="text-sm font-black uppercase tracking-wider text-emerald-700">
                    Total Value
                  </span>
                  <span className="text-lg font-black text-gray-900">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-lg border border-emerald-200 shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-900">
                    {[
                      "#",
                      "Product Description",
                      "Qty",
                      "Cost Price",
                      "Last Cost",
                      "Amount",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "py-3 px-4 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-400 whitespace-nowrap",
                          i === 0
                            ? "text-center"
                            : i === 1
                              ? "text-left"
                              : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className={cn(
                        "border-b border-emerald-100 hover:bg-emerald-50/60 transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-emerald-50/30",
                      )}
                    >
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-black rounded-full w-6 h-6 inline-flex items-center justify-center">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-800">
                          {item.stockName}
                        </p>
                        {item.stockVariantName &&
                          item.stockVariantName !== item.stockName && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.stockVariantName}
                            </p>
                          )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-800 whitespace-nowrap">
                        {item.quantityReceived?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 font-medium whitespace-nowrap">
                        {item.previousCostPerItem != null
                          ? formatCurrency(item.previousCostPerItem)
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 font-medium whitespace-nowrap">
                        {item.lastCostPerItem != null
                          ? formatCurrency(item.lastCostPerItem)
                          : item.previousCostPerItem != null
                            ? formatCurrency(item.previousCostPerItem)
                            : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                        {formatCurrency(item.totalCost || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-500">
                    <td
                      colSpan={2}
                      className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-white"
                    >
                      Totals
                    </td>
                    <td className="py-3 px-4 text-right font-black text-white whitespace-nowrap">
                      {totalQuantityReceived.toLocaleString()}
                    </td>
                    <td colSpan={2} />
                    <td className="py-3 px-4 text-right font-black text-white whitespace-nowrap">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── SUMMARY BOX ── */}
            <div className="mt-6 sm:mt-8 flex justify-end">
              <div className="w-full sm:w-80 md:w-72 rounded-lg border border-emerald-200 overflow-hidden shadow-sm">
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5">
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    Summary
                  </p>
                </div>
                <div className="divide-y divide-emerald-100 bg-white">
                  {[
                    { label: "Net Amount", value: formatCurrency(totalValue) },
                    { label: "VAT Amount", value: "0.00" },
                    { label: "Rounding Amount", value: "0.00" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between px-4 py-2.5"
                    >
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">
                        {label}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-gray-800">
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 bg-emerald-500">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-emerald-100">
                      Total Amount
                    </span>
                    <span className="text-sm sm:text-base font-black text-white">
                      {formatCurrency(totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SIGNATURES ── */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-t border-emerald-100 bg-emerald-50/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-5 w-1 bg-emerald-500 rounded-full" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-gray-700">
                Authorisation & Signatures
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  label: "Prepared By",
                  value: `${receiptData.staffFirstName} ${receiptData.staffLastName}`,
                },
                { label: "Checked By", value: "" },
                { label: "Authorised By", value: "" },
                { label: "Accounts", value: "" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="h-12 flex items-end justify-center pb-1.5">
                    {value && (
                      <span className="text-xs sm:text-sm text-gray-700 font-bold truncate max-w-full px-1">
                        {value}
                      </span>
                    )}
                  </div>
                  <div className="border-b-2 border-gray-400 mx-2 mb-2" />
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Approval + VAT Summary */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="overflow-x-auto">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3.5 w-0.5 bg-emerald-500 rounded-full" />
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                    Approval
                  </p>
                </div>
                <table className="w-full min-w-[300px] border border-emerald-200 text-xs text-center rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-900">
                      {["Approved By", "Date", "Amount"].map((h) => (
                        <th
                          key={h}
                          className="py-2.5 px-3 text-emerald-400 font-black border-r border-gray-700 last:border-r-0 text-xs"
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
                        className="border-t border-emerald-100 bg-white"
                      >
                        <td className="py-4 border-r border-emerald-100" />
                        <td className="py-4 border-r border-emerald-100" />
                        <td className="py-4" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3.5 w-0.5 bg-emerald-500 rounded-full" />
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                    VAT Summary
                  </p>
                </div>
                <table className="w-full min-w-[250px] border border-emerald-200 text-xs rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-900">
                      {["Type", "VAT", "Goods Value"].map((h) => (
                        <th
                          key={h}
                          className="py-2.5 px-3 text-emerald-400 font-black border-r border-gray-700 last:border-r-0 text-right first:text-left text-xs"
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
                        vat: "0",
                        goods: formatCurrency(totalValue),
                      },
                      { type: "EXEM", vat: "0", goods: "0.00" },
                    ].map(({ type, vat, goods }, i) => (
                      <tr
                        key={type}
                        className={cn(
                          "border-t border-emerald-100",
                          i % 2 === 0 ? "bg-white" : "bg-emerald-50/40",
                        )}
                      >
                        <td className="py-2.5 px-3 border-r border-emerald-100 font-bold text-gray-700">
                          {type}
                        </td>
                        <td className="py-2.5 px-3 border-r border-emerald-100 text-right text-gray-600">
                          {vat}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-800">
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
            <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-t border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3.5 w-0.5 bg-emerald-500 rounded-full" />
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Notes
                </p>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 border border-emerald-200 rounded-lg p-3 bg-emerald-50/50">
                {receiptData.notes}
              </p>
            </div>
          )}

          {/* ── TERMS ── */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-t border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3.5 w-0.5 bg-emerald-500 rounded-full" />
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                Terms & Conditions
              </p>
            </div>
            <ol className="space-y-1.5 list-decimal list-inside text-[10px] sm:text-[11px] text-gray-600 leading-relaxed bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 sm:p-4">
              <li>
                This goods receipt note confirms the receipt of items listed
                above in the specified quantities and conditions.
              </li>
              <li>
                Any discrepancies or damages must be reported within 48 hours of
                receipt.
              </li>
              <li>
                The receiver confirms that all items have been inspected and
                meet the required quality standards.
              </li>
              <li>
                This document serves as proof of delivery and acceptance of
                goods.
              </li>
              <li>
                The supplier&apos;s invoice should reference this receipt number
                for payment processing.
              </li>
              <li>
                Payment will be processed based on quantities received and
                accepted as per this note.
              </li>
            </ol>
          </div>

          {/* ── FOOTER ── */}
          <div className="px-4 sm:px-6 md:px-8 py-3 bg-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[12px] text-emerald-100 font-medium text-center sm:text-left">
              This is a system-generated document
            </p>
            <p className="text-[10px] sm:text-[12px] text-emerald-100 font-medium text-center">
              {format(new Date(), "dd MMM yyyy, hh:mm:ss a")}
            </p>
            <p className="text-[10px] sm:text-[12px] text-white font-black tracking-wider text-center">
              Powered by Settlo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
