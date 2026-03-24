"use client";

import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { fetchStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { NumericFormat } from "react-number-format";
import { Textarea } from "../ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import StockVariantSelector from "../widgets/stock-variant-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SupplierSelector from "@/components/widgets/supplier-selector";
import { StockPurchase } from "@/types/stock-purchases/type";
import {
  Copy,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Printer,
} from "lucide-react";
import DateTimePicker from "@/components/widgets/datetimepicker";
import { StockPurchaseSchema } from "@/types/stock-purchases/schema";
import { Button } from "@/components/ui/button";
import { createStockPurchase } from "@/lib/actions/stock-purchase-actions";
import { format } from "date-fns";

// ─── Brand tokens (must match SharePurchaseOrder) ─────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

function StockPurchaseForm({
  item,
}: {
  item: StockPurchase | null | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [, setStocks] = useState<Stock[]>([]);
  const [shareLink, setShareLink] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [purchaseData, setPurchaseData] = useState<any>();
  const { toast } = useToast();
  const router = useRouter();

  const searchParams = useSearchParams();
  const stockVariantId = searchParams.get("stockVariant");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    item?.deliveryDate ? new Date(item.deliveryDate) : undefined,
  );

  useEffect(() => {
    const getData = async () => {
      try {
        const [stockResponse] = await Promise.all([fetchStock()]);
        setStocks(stockResponse);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load form data. Please refresh the page.",
        });
      }
    };
    getData();
  }, [toast]);

  const handleDeliveryDateSelect = (date: Date) => {
    if (date < new Date()) {
      setError("Delivery date cannot be in the past.");
      return false;
    }
    setDeliveryDate(date);
    return true;
  };

  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    if (!deliveryDate) return;
    const newDate = new Date(deliveryDate);
    if (type === "hour") newDate.setHours(Number(value));
    else if (type === "minutes") newDate.setMinutes(Number(value));
    setDeliveryDate(newDate);
    form.setValue("deliveryDate", newDate.toISOString());
  };

  const form = useForm<z.infer<typeof StockPurchaseSchema>>({
    resolver: zodResolver(StockPurchaseSchema),
    defaultValues: {
      supplier: item?.supplier || "",
      stockIntakePurchaseOrderItems: item?.stockIntakePurchaseOrderItems || [
        { stockVariantId: stockVariantId || "", quantity: 0 },
      ],
      deliveryDate: item?.deliveryDate || new Date().toISOString(),
      notes: item?.notes,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockIntakePurchaseOrderItems",
  });

  const addStockItem = () => append({ stockVariantId: "", quantity: 1 });

  const removeStockItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one stock item is required.",
      });
    }
  };

  const getTotalItems = () =>
    form
      .getValues("stockIntakePurchaseOrderItems")
      .filter((i) => i.stockVariantId).length;

  const getTotalQuantity = () =>
    form
      .getValues("stockIntakePurchaseOrderItems")
      .filter((i) => i.stockVariantId)
      .reduce((total, i) => total + (i.quantity || 0), 0);

  const onInvalid = useCallback(
    (errors: any) => {
      const getFirstMessage = (obj: any): string | undefined => {
        if (!obj || typeof obj !== "object") return undefined;
        if (typeof obj.message === "string") return obj.message;
        for (const value of Object.values(obj)) {
          const msg = getFirstMessage(value);
          if (msg) return msg;
        }
        return undefined;
      };
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          getFirstMessage(errors) || "Please check all required fields.",
      });
    },
    [toast],
  );

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link.",
      });
    }
  };

  const generateShareLink = (id: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/stock-purchases/share/${id}`;
  };

  const submitData = (values: z.infer<typeof StockPurchaseSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      if (item) {
        console.log("Update logic for existing stock purchase");
      } else {
        createStockPurchase(values)
          .then((data) => {
            if (data && data.responseType === "success") {
              const purchaseOrder = data.data as StockPurchase;
              setPurchaseData(purchaseOrder);
              setSuccess(data.message);
              toast({
                variant: "success",
                title: "Success",
                description: data.message,
              });
              setShowPreview(true);
              const link = generateShareLink(purchaseOrder.orderNumber);
              setShareLink(link);
              setTimeout(() => {
                document
                  .getElementById("lpo-preview")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            } else if (data && data.responseType === "error") {
              setError(
                typeof data.message === "string"
                  ? data.message
                  : "An error occurred.",
              );
            }
          })
          .catch((err) => {
            console.error("Error creating stock purchase:", err);
            setError("An unexpected error occurred. Please try again.");
            toast({
              variant: "destructive",
              title: "Error",
              description: err.message || "Failed to create stock purchase.",
            });
          });
      }
    });
  };

  const handleBackToList = () => {
    setShowPreview(false);
    router.push("/stock-purchases");
  };

  // ── Preview — identical layout to SharePurchaseOrder ──────────────────────
  if (showPreview && purchaseData) {
    const totalQty =
      purchaseData.stockIntakePurchaseOrderItems?.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ) ?? 0;
    const totalItems = purchaseData.stockIntakePurchaseOrderItems?.length ?? 0;

    return (
      <div
        className="min-h-screen py-8 px-4 sm:px-6"
        style={{ backgroundColor: SECONDARY }}
        id="lpo-preview"
      >
        <div className="max-w-4xl mx-auto">
          {/* ── Action bar (no-print) ── */}
          <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Purchases
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={copyShareLink}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Share Link
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          {/* ── Success banner (no-print) ── */}
          <div
            className="mb-5 flex items-center gap-3 p-4 rounded-xl print:hidden"
            style={{ backgroundColor: "#dcfce7", border: "1px solid #86efac" }}
          >
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800 text-sm">
                Purchase Order Created Successfully!
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Order{" "}
                <span className="font-mono font-medium">
                  #{purchaseData.orderNumber}
                </span>{" "}
                is ready to share with your supplier.
              </p>
            </div>
          </div>

          {/* ── LPO Document — same structure as SharePurchaseOrder ── */}
          <div
            id="lpo-content"
            className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden"
            style={{ border: `1px solid ${SECONDARY}` }}
          >
            {/* Header */}
            <div className="px-6 lg:px-10 pt-8 pb-6 flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex items-center gap-4" />
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
                  {purchaseData.locationName && (
                    <p>{purchaseData.locationName}</p>
                  )}
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

            {/* Supplier + Meta table */}
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
                    {[
                      {
                        label: "Order Number:",
                        value: purchaseData.orderNumber,
                        mono: true,
                      },
                      {
                        label: "Date Created:",
                        value: purchaseData.dateCreated
                          ? format(
                              new Date(purchaseData.dateCreated),
                              "MMMM dd, yyyy",
                            )
                          : format(new Date(), "MMMM dd, yyyy"),
                      },
                      {
                        label: "Expected Delivery:",
                        value: purchaseData.deliveryDate
                          ? format(
                              new Date(purchaseData.deliveryDate),
                              "MMMM dd, yyyy",
                            )
                          : "Not specified",
                      },
                      { label: "Total Items:", value: totalItems, bold: true },
                      {
                        label: "Total Quantity:",
                        value: totalQty.toLocaleString(),
                        bold: true,
                      },
                    ].map((row, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: `1px solid ${SECONDARY}` }}
                      >
                        <td className="py-2 font-semibold text-gray-700 whitespace-nowrap pr-6">
                          {row.label}
                        </td>
                        <td
                          className={`py-2 text-gray-900 text-right ${
                            (row as any).mono ? "font-mono text-xs" : ""
                          } ${(row as any).bold ? "font-bold" : ""}`}
                        >
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Items table — desktop */}
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
                  {purchaseData.stockIntakePurchaseOrderItems?.map(
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
                          {item.stockName}
                          {item.stockVariantName &&
                          item.stockVariantName !== item.stockName
                            ? ` — ${item.stockVariantName}`
                            : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {item.quantity?.toLocaleString()}
                        </td>
                      </tr>
                    ),
                  )}
                  <tr style={{ borderTop: `2px solid ${SECONDARY}` }}>
                    <td
                      colSpan={2}
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

            {/* Items cards — mobile */}
            <div className="lg:hidden px-4 mb-6 space-y-3">
              <div
                className="flex justify-between items-center px-4 py-2 rounded-t-lg text-white text-xs font-semibold uppercase tracking-wider"
                style={{ backgroundColor: PRIMARY }}
              >
                <span>Item</span>
                <span>Qty</span>
              </div>
              {purchaseData.stockIntakePurchaseOrderItems?.map(
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
                          <span className="text-gray-400 mr-1">
                            {index + 1}.
                          </span>
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
              <div className="flex justify-between items-center px-4 py-3 rounded-lg font-semibold text-sm">
                <span>
                  Total — {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
                <span>{totalQty.toLocaleString()} units</span>
              </div>
            </div>

            {/* Notes */}
            {purchaseData.notes && (
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
                  {purchaseData.notes}
                </p>
              </div>
            )}

            {/* Terms */}
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

            {/* Footer */}
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

          {/* Share link card (no-print) */}
          <Card className="mt-5 print:hidden border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Share Purchase Order</CardTitle>
              <p className="text-sm text-gray-500">
                Copy and send this link directly to your supplier
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <p className="text-sm font-mono text-gray-600 truncate">
                    {shareLink}
                  </p>
                </div>
                <Button onClick={copyShareLink} className="gap-2 flex-shrink-0">
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
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
            @page {
              margin: 0.5in;
            }
          }
        `}</style>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {item ? "Edit Local Purchase" : "New Local Purchase"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Purchase multiple stocks from trusted suppliers
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitData, onInvalid)}
              className="space-y-6"
            >
              {error && <FormError message={error} />}
              {success && <FormSuccess message={success} />}

              {/* Order Summary */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Items
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getTotalItems()}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Quantity
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getTotalQuantity()}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStockItem}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {/* Stock Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Stock Items <span className="text-red-500">*</span>
                </h3>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg"
                  >
                    <div className="md:col-span-7">
                      <FormField
                        control={form.control}
                        name={`stockIntakePurchaseOrderItems.${index}.stockVariantId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Stock Item {fields.length > 1 && `#${index + 1}`}
                            </FormLabel>
                            <FormControl>
                              <StockVariantSelector
                                {...field}
                                value={field.value}
                                isDisabled={isPending || !!item}
                                onChange={field.onChange}
                                placeholder="Select stock item"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <FormField
                        control={form.control}
                        name={`stockIntakePurchaseOrderItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <NumericFormat
                                className="flex h-10 w-full rounded-md border px-3 py-2"
                                value={field.value}
                                disabled={isPending}
                                placeholder="Enter quantity"
                                thousandSeparator={true}
                                allowNegative={false}
                                onValueChange={(values) => {
                                  field.onChange(
                                    Number(values.value.replace(/,/g, "")),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStockItem(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Supplier & Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supplier <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <SupplierSelector
                          {...field}
                          isDisabled={!!item || isPending}
                          placeholder="Select supplier"
                          label="Select supplier"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Expected Delivery Date{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          field={field}
                          date={deliveryDate}
                          setDate={setDeliveryDate}
                          handleTimeChange={handleTimeChange}
                          onDateSelect={handleDeliveryDateSelect}
                          minDate={new Date()}
                          disabled={!!item}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add special instructions..."
                        {...field}
                        disabled={isPending}
                        maxLength={500}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {field.value?.length || 0}/500 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-between gap-3 pt-4">
                <CancelButton />
                <SubmitButton
                  isPending={isPending}
                  label={item ? "Update Purchase" : "Create Purchase Order"}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default StockPurchaseForm;
