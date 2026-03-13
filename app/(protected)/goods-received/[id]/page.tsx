import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { UUID } from "node:crypto";
import { getStockIntakeReceipt } from "@/lib/actions/stock-purchase-actions";
import { StockReceipt } from "@/types/stock-intake-receipt/type";
import { GRNDownloadButton } from "@/components/widgets/grn-download-button";
import {
  Package,
  MapPin,
  Building2,
  FileText,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

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

// ── Meta tile ────────────────────────────────────────────────────────────────
function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-1.5">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-semibold text-zinc-800 leading-snug break-words">
        {value}
      </p>
    </div>
  );
}

// ── Info panel ───────────────────────────────────────────────────────────────
function InfoPanel({
  icon: Icon,
  title,
  rows,
}: {
  icon: React.ElementType;
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <div className="flex items-center gap-2.5 bg-zinc-100 border-b border-zinc-200 px-4 py-3">
        <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">
          {title}
        </p>
      </div>
      <div className="bg-white p-4 space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex gap-3">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 w-16 shrink-0 pt-0.5">
              {label}
            </span>
            <span className="text-xs text-zinc-700 font-medium leading-snug break-words flex-1">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200">
        <Icon className="w-3.5 h-3.5 text-zinc-500" />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
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

  const supplierRows: { label: string; value: string }[] = [
    { label: "Name", value: receiptData.supplierName ?? "—" },
    ...(receiptData.supplierEmail
      ? [{ label: "Email", value: receiptData.supplierEmail }]
      : []),
    ...(receiptData.supplierPhoneNumber
      ? [{ label: "Phone", value: receiptData.supplierPhoneNumber }]
      : []),
  ];

  const locationRows: { label: string; value: string }[] = [
    { label: "Business", value: receiptData.businessName ?? "—" },
    { label: "Location", value: receiptData.locationName ?? "—" },
    ...(receiptData.locationEmail
      ? [{ label: "Email", value: receiptData.locationEmail }]
      : []),
    ...(receiptData.locationPhone
      ? [{ label: "Phone", value: receiptData.locationPhone }]
      : []),
    ...(receiptData.locationAddress
      ? [{ label: "Address", value: receiptData.locationAddress }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-100 p-3 sm:p-6 md:p-8 mt-4">
      <div className="w-full max-w-5xl mx-auto">
        <Card className="border border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-zinc-200 px-5 sm:px-8 md:px-10 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-zinc-200 flex items-center justify-center">
                      <ClipboardList className="w-3.5 h-3.5 text-zinc-600" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400">
                      {receiptData.businessName}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-none mb-2">
                    Goods Received Note
                  </h1>
                  <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 mt-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {receiptData.locationName}
                  </p>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="border-2 border-zinc-200 rounded-xl px-4 py-3 text-right bg-zinc-50 min-w-[120px]">
                    <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-zinc-400 mb-1">
                      GRN No.
                    </p>
                    <p className="text-sm font-black font-mono text-zinc-900 tracking-wide">
                      {receiptData.receiptNumber}
                    </p>
                  </div>
                  <GRNDownloadButton
                    receiptData={receiptData}
                    items={items}
                    totalQuantityReceived={totalQuantityReceived}
                    totalValue={totalValue}
                  />
                </div>
              </div>
            </div>

            {/* ── META TILES ─────────────────────────────────────────────── */}
            <div className="px-5 sm:px-8 md:px-10 py-5 bg-zinc-50 border-b border-zinc-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetaTile
                  label="PO Reference"
                  value={receiptData.purchaseOrderNumber || "—"}
                />
                <MetaTile
                  label="GRN Date"
                  value={
                    receiptData.dateReceived
                      ? format(
                          new Date(receiptData.dateReceived),
                          "dd MMM yyyy",
                        )
                      : format(new Date(), "dd MMM yyyy")
                  }
                />
                <MetaTile
                  label="Invoice No."
                  value={(receiptData as any).invoiceNumber || "—"}
                />
                <MetaTile
                  label="Prepared By"
                  value={`${receiptData.staffFirstName} ${receiptData.staffLastName}`}
                />
              </div>
            </div>

            {/* ── SUPPLIER & LOCATION ────────────────────────────────────── */}
            <div className="px-5 sm:px-8 md:px-10 py-6 border-b border-zinc-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoPanel
                  icon={Building2}
                  title="Supplier Information"
                  rows={supplierRows}
                />
                <InfoPanel
                  icon={MapPin}
                  title="Receiving Location"
                  rows={locationRows}
                />
              </div>
            </div>

            {/* ── ITEMS ──────────────────────────────────────────────────── */}
            <div className="px-5 sm:px-8 md:px-10 py-6">
              <SectionHeading icon={Package} label="Received Items" />

              {/* Mobile cards */}
              <div className="block lg:hidden space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="rounded-xl border border-zinc-200 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2.5 border-b border-zinc-200">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-zinc-800 truncate">
                        {item.stockName}
                      </span>
                    </div>
                    <div className="p-4 bg-white">
                      {item.stockVariantName &&
                        item.stockVariantName !== item.stockName && (
                          <p className="text-xs text-zinc-400 mb-3">
                            {item.stockVariantName}
                          </p>
                        )}
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          {
                            k: "Qty Received",
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
                            k: "Last Cost",
                            v:
                              item.lastCostPerItem != null
                                ? formatCurrency(item.lastCostPerItem)
                                : item.previousCostPerItem != null
                                  ? formatCurrency(item.previousCostPerItem)
                                  : "—",
                          },
                          {
                            k: "Total Amount",
                            v: formatCurrency(item.totalCost || 0),
                          },
                        ].map(({ k, v }) => (
                          <div key={k}>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                              {k}
                            </p>
                            <p className="text-sm font-bold text-zinc-800">
                              {v}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile totals */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
                  {[
                    { label: "Total Lines", value: items.length.toString() },
                    {
                      label: "Total Quantity",
                      value: totalQuantityReceived.toLocaleString(),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between text-sm text-zinc-600 font-semibold"
                    >
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-zinc-200 flex justify-between items-center">
                    <span className="text-sm font-black text-zinc-700 uppercase tracking-wide">
                      Total Value
                    </span>
                    <span className="text-lg font-black text-zinc-900">
                      {formatCurrency(totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block rounded-xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200">
                      {[
                        "#",
                        "Product",
                        "Qty",
                        "Cost Price",
                        "Last Cost",
                        "Amount",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "py-3 px-5 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 whitespace-nowrap",
                            i === 0
                              ? "text-center w-12"
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
                          "border-b border-zinc-100 transition-colors hover:bg-zinc-50",
                          index % 2 === 0 ? "bg-white" : "bg-zinc-50/40",
                        )}
                      >
                        <td className="py-3.5 px-5 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-black">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-zinc-800">
                            {item.stockName}
                          </p>
                          {item.stockVariantName &&
                            item.stockVariantName !== item.stockName && (
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {item.stockVariantName}
                              </p>
                            )}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-zinc-800 whitespace-nowrap">
                          {item.quantityReceived?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-right text-zinc-500 font-medium whitespace-nowrap">
                          {item.previousCostPerItem != null
                            ? formatCurrency(item.previousCostPerItem)
                            : "—"}
                        </td>
                        <td className="py-3.5 px-5 text-right text-zinc-500 font-medium whitespace-nowrap">
                          {item.lastCostPerItem != null
                            ? formatCurrency(item.lastCostPerItem)
                            : item.previousCostPerItem != null
                              ? formatCurrency(item.previousCostPerItem)
                              : "—"}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-zinc-900 whitespace-nowrap">
                          {formatCurrency(item.totalCost || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 border-t-2 border-zinc-200">
                      <td
                        colSpan={2}
                        className="py-3.5 px-5 text-[9px] font-bold uppercase tracking-widest text-zinc-500"
                      >
                        Totals — {items.length}{" "}
                        {items.length === 1 ? "line" : "lines"}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-zinc-800 whitespace-nowrap">
                        {totalQuantityReceived.toLocaleString()}
                      </td>
                      <td colSpan={2} />
                      <td className="py-3.5 px-5 text-right font-black text-zinc-900 whitespace-nowrap text-base">
                        {formatCurrency(totalValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Summary box */}
              <div className="mt-6 flex justify-end">
                <div className="w-full sm:w-72 rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                      Invoice Summary
                    </p>
                  </div>
                  <div className="bg-white divide-y divide-zinc-100">
                    {[
                      {
                        label: "Net Amount",
                        value: formatCurrency(totalValue),
                      },
                      { label: "VAT Amount", value: "0.00" },
                      { label: "Rounding", value: "0.00" },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex justify-between px-5 py-3"
                      >
                        <span className="text-sm text-zinc-500">{label}</span>
                        <span className="text-sm font-semibold text-zinc-700">
                          {value}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between px-5 py-4 bg-zinc-900 rounded-b-xl">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                        Total Amount
                      </span>
                      <span className="text-base font-black text-white">
                        {formatCurrency(totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SIGNATURES ─────────────────────────────────────────────── */}
            <div className="px-5 sm:px-8 md:px-10 py-6 border-t border-zinc-200 bg-zinc-50">
              <SectionHeading
                icon={ShieldCheck}
                label="Authorisation & Signatures"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-8">
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
                    <div className="h-12 flex items-end justify-center pb-2 w-full">
                      {value && (
                        <span className="text-xs font-semibold text-zinc-700 truncate">
                          {value}
                        </span>
                      )}
                    </div>
                    <div className="w-full border-b-2 border-zinc-300 mb-2" />
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500 text-center">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Approval + VAT tables */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2.5">
                    Approval
                  </p>
                  <div className="rounded-xl border border-zinc-200 overflow-hidden">
                    <table className="w-full text-xs text-center">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-zinc-200">
                          {["Approved By", "Date", "Amount"].map((h) => (
                            <th
                              key={h}
                              className="py-3 px-4 text-zinc-500 font-bold border-r border-zinc-200 last:border-r-0"
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
                            className="border-t border-zinc-100 bg-white"
                          >
                            <td className="py-5 border-r border-zinc-100" />
                            <td className="py-5 border-r border-zinc-100" />
                            <td className="py-5" />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2.5">
                    VAT Summary
                  </p>
                  <div className="rounded-xl border border-zinc-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-zinc-200">
                          {["Type", "VAT", "Goods Value"].map((h, i) => (
                            <th
                              key={h}
                              className={cn(
                                "py-3 px-4 text-zinc-500 font-bold border-r border-zinc-200 last:border-r-0",
                                i === 0 ? "text-left" : "text-right",
                              )}
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
                            className={cn(
                              "border-t border-zinc-100",
                              i % 2 === 0 ? "bg-white" : "bg-zinc-50",
                            )}
                          >
                            <td className="py-3 px-4 border-r border-zinc-100 font-semibold text-zinc-700">
                              {type}
                            </td>
                            <td className="py-3 px-4 border-r border-zinc-100 text-right text-zinc-500">
                              {vat}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-zinc-800">
                              {goods}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* ── NOTES ──────────────────────────────────────────────────── */}
            {receiptData.notes && (
              <div className="px-5 sm:px-8 md:px-10 py-5 border-t border-zinc-200">
                <SectionHeading icon={FileText} label="Notes" />
                <p className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl p-4 leading-relaxed">
                  {receiptData.notes}
                </p>
              </div>
            )}

            {/* ── TERMS ──────────────────────────────────────────────────── */}
            <div className="px-5 sm:px-8 md:px-10 py-5 border-t border-zinc-200">
              <SectionHeading icon={CheckCircle2} label="Terms & Conditions" />
              <ol className="space-y-2 list-decimal list-inside text-[11px] text-zinc-500 leading-relaxed bg-zinc-50 border border-zinc-200 rounded-xl p-4 sm:p-5">
                {[
                  "This goods receipt note confirms receipt of items listed above in the specified quantities and condition.",
                  "Any discrepancies or damages must be reported within 48 hours of receipt.",
                  "The receiver confirms all items have been inspected and meet required quality standards.",
                  "This document serves as proof of delivery and acceptance of goods.",
                  "The supplier's invoice should reference this receipt number for payment processing.",
                  "Payment will be processed based on quantities received and accepted as per this note.",
                ].map((term, i) => (
                  <li key={i} className="pl-1">
                    {term}
                  </li>
                ))}
              </ol>
            </div>

            {/* ── FOOTER ─────────────────────────────────────────────────── */}
            <div className="px-5 sm:px-8 md:px-10 py-4 bg-zinc-100 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[10px] text-zinc-400 font-medium text-center sm:text-left">
                System-generated document — do not alter
              </p>
              <p className="text-[10px] text-zinc-400 font-medium">
                {format(new Date(), "dd MMM yyyy, hh:mm:ss a")}
              </p>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                Powered by Settlo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
