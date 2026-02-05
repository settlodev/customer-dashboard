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
import { Copy, Plus, Trash2, CheckCircle, ArrowLeft } from "lucide-react";
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
      notes: item?.notes || "",
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

  const getTotalQuantity = () => {
    const items = form.getValues("stockIntakePurchaseOrderItems");
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getTotalItems = () => {
    return fields.length;
  };

  const onInvalid = useCallback(
    (errors: any) => {
      console.error("Validation errors:", errors);
      const firstError = Object.values(errors)[0] as any;
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: firstError?.message || "Please check all required fields.",
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

              // Scroll to preview
              setTimeout(() => {
                document.getElementById("lpo-preview")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 100);
            } else if (data && data.responseType === "error") {
              setError(data.message);
            }
          })
          .catch((err) => {
            console.error("Error creating stock purchase:", err);
            setError("An unexpected error occurred. Please try again.");
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create stock purchase.",
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

  // If showing preview, show the LPO document
  if (showPreview && purchaseData) {
    return (
      <div
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
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
            {/*<Button variant="outline" onClick={printOrder} className="gap-2">*/}
            {/*  <Printer className="h-4 w-4" />*/}
            {/*  Print*/}
            {/*</Button>*/}
            <Button variant="outline" onClick={copyShareLink} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            <Button onClick={handleBackToList}>View All Purchases</Button>
          </div>
        </div>

        {/* Success Message */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 print:hidden">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-300">
                Purchase Order Created Successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Order #{purchaseData.orderNumber} has been created and is ready
                to share
              </p>
            </div>
          </div>
        </div>

        {/* Professional LPO Document */}
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
                      (item: any, index: number) => (
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
                              {item.quantity}
                            </p>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-6 pt-4 border-t-2 border-gray-300 dark:border-gray-700">
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                        Total Items:
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {totalItems}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                        Total Quantity:
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {totalQuantity}
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
            <div className="px-8 py-4 bg-emerald-500  text-center">
              <p className="text-xs text-white-400">
                Powered by{" "}
                <span className="font-semibold text-white">Settlo</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Link Section */}
        <Card className="mt-6 print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">Share Purchase Order</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share this purchase order with your supplier
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 border rounded-lg p-3">
                <p className="text-sm font-mono truncate">{shareLink}</p>
              </div>
              <Button onClick={copyShareLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Otherwise show the form
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
