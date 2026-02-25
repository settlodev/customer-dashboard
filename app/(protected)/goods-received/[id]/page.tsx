import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { UUID } from "node:crypto";
import { getStockIntakeReceipt } from "@/lib/actions/stock-purchase-actions";
import { StockReceipt } from "@/types/stock-intake-receipt/type";

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

  return (
    <div className="flex-1 p-4 md:p-10 bg-white min-h-screen mt-4">
      <Card className="shadow-none border border-black mt-4 bg-white max-w-4xl mx-auto print:border-0 print:shadow-none">
        <CardContent className="p-0">
          {/* ── HEADER ── */}
          <div className="border-b-2 border-black px-8 py-6 print:px-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black text-black uppercase tracking-[0.25em] mb-1">
                  {receiptData.businessName}
                </p>
                <h1 className="text-3xl font-black text-black tracking-tight leading-none">
                  Goods Received Note
                </h1>
                <p className="text-xs text-black mt-1 font-medium">
                  {receiptData.locationName}
                </p>
              </div>

              <div className="text-right border border-black px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-0.5">
                  GRN No.
                </p>
                <p className="text-xl font-black font-mono text-black">
                  {receiptData.receiptNumber}
                </p>
              </div>
            </div>
          </div>

          {/* ── META ROW ── */}
          <div className="px-8 py-4 border-b border-black print:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-black">
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
              ].map(({ label, value }, i) => (
                <div key={label} className={cn("pl-4", i === 0 && "pl-0")}>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SUPPLIER & RECEIVING LOCATION ── */}
          <div className="px-8 py-6 border-b border-black print:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Supplier */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-3 pb-1.5 border-b border-black">
                  Supplier Information
                </p>
                <div className="space-y-1.5 ">
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
                      <div key={label} className="flex gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-black w-14 shrink-0 mt-0.5">
                          {label}
                        </span>
                        <span className="text-sm text-black font-medium">
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Receiving Location */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-3 pb-1.5 border-b border-black">
                  Receiving Location
                </p>
                <div className="space-y-1.5">
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
                      <div key={label} className="flex gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-black w-14 shrink-0 mt-0.5">
                          {label}
                        </span>
                        <span className="text-sm text-black font-medium">
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── ITEMS TABLE ── */}
          <div className="px-8 py-6 print:px-6">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-4 pb-1.5 border-b border-black">
              Received Items
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    {[
                      "#",
                      "Product Description",
                      "Qty",
                      "CP",
                      "Last CP",
                      "Amount",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "py-2 px-3 text-[9px] font-black uppercase tracking-[0.15em] text-black",
                          i === 0
                            ? "text-left"
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
                        "border-b border-black",
                        index % 2 === 0 ? "bg-white" : "bg-black/[0.02]",
                      )}
                    >
                      <td className="py-3 px-3 text-black text-xs font-bold">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-black">{item.stockName}</p>
                        {item.stockVariantName &&
                          item.stockVariantName !== item.stockName && (
                            <p className="text-xs text-black mt-0.5">
                              {item.stockVariantName}
                            </p>
                          )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-black">
                        {item.quantityReceived?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-black font-medium">
                        {item.previousCostPerItem != null
                          ? item.previousCostPerItem.toLocaleString("default", {
                              minimumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-black font-medium">
                        {item.lastCostPerItem != null
                          ? item.lastCostPerItem.toLocaleString("default", {
                              minimumFractionDigits: 2,
                            })
                          : item.previousCostPerItem != null
                            ? item.previousCostPerItem.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })
                            : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-black">
                        {item.totalCost?.toLocaleString("default", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black bg-black/[0.03]">
                    <td
                      colSpan={2}
                      className="py-3 px-3 text-[9px] font-black uppercase tracking-widest text-black"
                    >
                      Totals
                    </td>
                    <td className="py-3 px-3 text-right font-black text-black">
                      {totalQuantityReceived.toLocaleString()}
                    </td>
                    <td colSpan={2} />
                    <td className="py-3 px-3 text-right font-black text-black">
                      {totalValue.toLocaleString("default", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── SUMMARY BOXES ── */}
            <div className="mt-8 flex justify-end">
              <div className="w-full md:w-72 border border-black overflow-hidden">
                <div className="border-b border-black px-4 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black">
                    Summary
                  </p>
                </div>
                <div className="divide-y divide-black/10">
                  {[
                    {
                      label: "Net Amount",
                      value: totalValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      }),
                      strong: false,
                    },
                    { label: "VAT Amount", value: "0.00", strong: false },
                    { label: "Rounding Amount", value: "0.00", strong: false },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between px-4 py-2.5"
                    >
                      <span className="text-xs text-black font-medium">
                        {label}
                      </span>
                      <span className="text-sm font-bold text-black">
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 bg-black">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/70">
                      Total Amount
                    </span>
                    <span className="text-base font-black text-white">
                      {totalValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SIGNATURES ── */}
          <div className="px-8 py-6 border-t border-black print:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  label: "Pre. By",
                  value: `${receiptData.staffFirstName} ${receiptData.staffLastName}`,
                },
                { label: "Checked By", value: "" },
                { label: "Auth. By", value: "" },
                { label: "Accounts", value: "" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="h-10 border-b border-black/30 mb-1 flex items-end justify-center pb-1">
                    <span className="text-sm text-black font-bold">
                      {value}
                    </span>
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Approval + VAT Summary */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-2">
                  Approval
                </p>
                <table className="w-full border border-black text-xs text-center">
                  <thead>
                    <tr className="border-b border-black">
                      {["Approved By", "Date", "Amount"].map((h) => (
                        <th
                          key={h}
                          className="py-2 px-3 text-black font-black border-r border-black last:border-r-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((r) => (
                      <tr key={r} className="border-t border-black/10">
                        <td className="py-4 border-r border-black/10" />
                        <td className="py-4 border-r border-black/10" />
                        <td className="py-4" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-2">
                  VAT Summary
                </p>
                <table className="w-full border border-black text-xs">
                  <thead>
                    <tr className="border-b border-black">
                      {["Type", "VAT", "Goods Value"].map((h) => (
                        <th
                          key={h}
                          className="py-2 px-3 text-black font-black border-r border-black last:border-r-0 text-right first:text-left"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-black/10">
                      <td className="py-2 px-3 border-r border-black/10 font-bold">
                        VAT
                      </td>
                      <td className="py-2 px-3 border-r border-black/10 text-right">
                        0
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        {totalValue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="border-t border-black/10">
                      <td className="py-2 px-3 border-r border-black/10 font-bold">
                        EXEM
                      </td>
                      <td className="py-2 px-3 border-r border-black/10 text-right">
                        0
                      </td>
                      <td className="py-2 px-3 text-right font-bold">0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── NOTES ── */}
          {receiptData.notes && (
            <div className="px-8 py-4 border-t border-black print:px-6">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-2">
                Notes
              </p>
              <p className="text-sm text-black border border-black rounded p-3 bg-black/[0.02]">
                {receiptData.notes}
              </p>
            </div>
          )}

          {/* ── TERMS ── */}
          <div className="px-8 py-6 border-t border-black print:px-6">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black mb-3">
              Terms & Conditions
            </p>
            <ol className="space-y-1 list-decimal list-inside text-[11px] text-black leading-relaxed">
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
          <div className="px-8 py-3 bg-emerald-500 flex items-center justify-between print:px-6">
            <p className="text-[12px] text-white font-medium">
              This is a system-generated document
            </p>
            <p className="text-[12px] text-white font-medium">
              {format(new Date(), "dd MMM yyyy, hh:mm:ss a")}
            </p>
            <p className="text-[12px] text-white font-medium tracking-wider">
              Powered by Settlo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
