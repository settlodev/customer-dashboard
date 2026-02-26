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
  Building2,
  MapPin,
  Mail,
  Phone,
  Package,
  Calendar,
  Hash,
} from "lucide-react";
import DateTimePicker from "@/components/widgets/datetimepicker";
import { StockPurchaseSchema } from "@/types/stock-purchases/schema";
import { Button } from "@/components/ui/button";
import { createStockPurchase } from "@/lib/actions/stock-purchase-actions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function StockPurchaseForm({
  item,
}: {
  item: StockPurchase | null | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [stocks, setStocks] = useState<Stock[]>([]);
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
    const today = new Date();
    today.setHours(23, 59, 59, 999);

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

    if (type === "hour") {
      newDate.setHours(Number(value));
    } else if (type === "minutes") {
      newDate.setMinutes(Number(value));
    }

    setDeliveryDate(newDate);
    form.setValue("deliveryDate", newDate.toISOString());
  };

  const form = useForm<z.infer<typeof StockPurchaseSchema>>({
    resolver: zodResolver(StockPurchaseSchema),
    defaultValues: {
      supplier: item?.supplier || "",
      stockIntakePurchaseOrderItems: item?.stockIntakePurchaseOrderItems || [
        {
          stockVariantId: stockVariantId || "",
          quantity: 0,
        },
      ],
      deliveryDate: item?.deliveryDate || new Date().toISOString(),
      notes: item?.notes,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockIntakePurchaseOrderItems",
  });

  const addStockItem = () => {
    append({
      stockVariantId: "",
      quantity: 1,
    });
  };

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

  const getTotalItems = () => {
    const items = form.getValues("stockIntakePurchaseOrderItems");
    return items.filter((item) => item.stockVariantId).length;
  };

  const getTotalQuantity = () => {
    const items = form.getValues("stockIntakePurchaseOrderItems");
    return items
      .filter((item) => item.stockVariantId)
      .reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const onInvalid = useCallback(
    (errors: any) => {
      console.error("Validation errors:", errors);

      const getFirstMessage = (obj: any): string | undefined => {
        if (!obj || typeof obj !== "object") return undefined;
        if (typeof obj.message === "string") return obj.message;

        for (const value of Object.values(obj)) {
          const msg = getFirstMessage(value);
          if (msg) return msg;
        }
        return undefined;
      };

      const message =
        getFirstMessage(errors) || "Please check all required fields.";

      toast({
        variant: "destructive",
        title: "Validation Error",
        description: message,
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
    } catch (err) {
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
                title: "Success",
                description: data.message,
              });

              setShowPreview(true);

              const newPurchaseId = purchaseOrder.orderNumber;
              const link = generateShareLink(newPurchaseId);
              setShareLink(link);

              setTimeout(() => {
                document.getElementById("lpo-preview")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
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

  const totalQuantity = getTotalQuantity();
  const totalItems = getTotalItems();

  // Status badge styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // If showing preview, show the LPO document
  if (showPreview && purchaseData) {
    return (
      <div
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        id="lpo-preview"
      >
        {/* Action Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Purchases
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={copyShareLink} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            <Button onClick={handleBackToList}>View All Purchases</Button>
          </div>
        </div>

        {/* Success Banner */}
        <div className="mb-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Purchase Order Created Successfully!
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Order{" "}
                <span className="font-mono font-medium">
                  #{purchaseData.orderNumber}
                </span>{" "}
                is ready to share with your supplier
              </p>
            </div>
          </div>
        </div>

        {/* LPO Document */}
        <Card className="shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none">
          <CardContent className="p-0">
            {/* ── Header ── */}
            <div className="relative bg-gray-900 dark:bg-gray-950 px-8 py-7 overflow-hidden">
              {/* decorative stripe */}
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
                      getStatusStyle(purchaseData.status),
                    )}
                  >
                    {purchaseData.status || "SUBMITTED"}
                  </span>
                  <p className="font-mono text-sm text-gray-400">
                    #{purchaseData.orderNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Meta strip: Order # / Issue Date / Delivery Date ── */}
            <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
              {[
                {
                  icon: <Hash className="h-3.5 w-3.5" />,
                  label: "Order Number",
                  value: purchaseData.orderNumber,
                  mono: true,
                },
                {
                  icon: <Calendar className="h-3.5 w-3.5" />,
                  label: "Issue Date",
                  value: format(new Date(), "MMM dd, yyyy"),
                },
                {
                  icon: <Calendar className="h-3.5 w-3.5" />,
                  label: "Expected Delivery",
                  value: purchaseData.deliveryDate
                    ? format(
                        new Date(purchaseData.deliveryDate),
                        "MMM dd, yyyy",
                      )
                    : "Not specified",
                },
              ].map((m, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    {m.icon}
                    <p className="text-xs font-semibold uppercase tracking-wider">
                      {m.label}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold text-gray-900 dark:text-white",
                      m.mono && "font-mono",
                    )}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Buyer & Supplier ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700">
              {/* Buyer / Business */}
              <div className="px-7 py-6 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Issued By
                  </h2>
                </div>

                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {purchaseData.businessName}
                </p>

                <div className="space-y-2 mt-3">
                  {purchaseData.locationName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <span>{purchaseData.locationName}</span>
                    </div>
                  )}
                  {purchaseData.locationEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <a
                        href={`mailto:${purchaseData.locationEmail}`}
                        className="hover:text-emerald-600 transition-colors"
                      >
                        {purchaseData.locationEmail}
                      </a>
                    </div>
                  )}
                  {purchaseData.locationPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <a
                        href={`tel:${purchaseData.locationPhone}`}
                        className="hover:text-emerald-600 transition-colors"
                      >
                        {purchaseData.locationPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier */}
              <div className="px-7 py-6 bg-gray-50 dark:bg-gray-900/40">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Supplier
                  </h2>
                </div>

                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {purchaseData.supplierName}
                </p>

                <div className="space-y-2 mt-3">
                  {purchaseData.supplierEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <a
                        href={`mailto:${purchaseData.supplierEmail}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {purchaseData.supplierEmail}
                      </a>
                    </div>
                  )}
                  {purchaseData.supplierPhoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <a
                        href={`tel:${purchaseData.supplierPhoneNumber}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {purchaseData.supplierPhoneNumber}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Items Table ── */}
            <div className="px-7 py-6 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                  <Package className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Order Items
                </h2>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                        #
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Variant
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {purchaseData.stockIntakePurchaseOrderItems?.map(
                      (orderItem: any, index: number) => (
                        <tr
                          key={orderItem.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-gray-400 text-xs tabular-nums">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {orderItem.stockName}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                            {orderItem.stockVariantName}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-sm tabular-nums">
                              {orderItem.quantity}
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
                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center divide-x divide-gray-200 dark:divide-gray-700">
                    <div className="px-5 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">
                        Total Items
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                        {purchaseData.stockIntakePurchaseOrderItems?.length ??
                          totalItems}
                      </p>
                    </div>
                    <div className="px-5 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">
                        Total Qty
                      </p>
                      <p className="text-xl font-bold text-emerald-600 tabular-nums">
                        {purchaseData.stockIntakePurchaseOrderItems?.reduce(
                          (sum: number, i: any) => sum + (i.quantity || 0),
                          0,
                        ) ?? totalQuantity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Notes ── */}
            {purchaseData.notes && (
              <div className="px-7 py-5 border-t border-gray-200 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-950/10">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Special Instructions / Notes
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {purchaseData.notes}
                </p>
              </div>
            )}

            {/* ── Terms ── */}
            <div className="px-7 py-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                Terms & Conditions
              </p>
              <ol className="space-y-1.5 list-decimal list-inside">
                {[
                  "Please confirm receipt of this purchase order within 24 hours.",
                  "Delivery must be made on or before the specified delivery date.",
                  "All items must meet the specified quality standards and match the descriptions provided.",
                  "Invoice should reference the purchase order number for processing.",
                ].map((term, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {term}
                  </li>
                ))}
              </ol>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-7 py-3.5 bg-gray-900 dark:bg-gray-950">
              <p className="text-xs text-gray-500">
                Generated {format(new Date(), "MMM dd, yyyy 'at' HH:mm")}
              </p>
              <p className="text-xs text-gray-400">
                Powered by{" "}
                <span className="font-semibold text-emerald-400">Settlo</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Link */}
        <Card className="mt-5 print:hidden border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Share Purchase Order</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Copy and send this link directly to your supplier
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5">
                <p className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
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
    );
  }

  // ── Form ──
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
