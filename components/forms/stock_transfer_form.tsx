"use client";

import { useForm } from "react-hook-form";
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
import { StockTransfer } from "@/types/stock-transfer/type";
import { StockTransferSchema } from "@/types/stock-transfer/schema";
import { createStockTransfer } from "@/lib/actions/stock-transfer-actions";
import StaffSelectorWidget from "../widgets/staff_selector_widget";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { Location } from "@/types/location/type";
import LocationSelector from "../widgets/location-selector";
import { FormResponse } from "@/types/types";
import { useRouter, useSearchParams } from "next/navigation";
import { StockVariant } from "@/types/stockVariant/type";
import StockVariantSelector from "../widgets/stock-variant-selector";
import DepartmentSelector from "@/components/widgets/department-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

function StockTransferForm({
  item,
}: {
  item: StockTransfer | null | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [selectedVariant, setSelectedVariant] = useState<StockVariant>();
  const { toast } = useToast();
  const router = useRouter();

  const searchParams = useSearchParams();
  const stockVariantId = searchParams.get("stockItem");

  useEffect(() => {
    const getData = async () => {
      try {
        const [stockResponse, locationResponse] = await Promise.all([
          fetchStock(),
          fetchAllLocations(),
        ]);
        setStocks(stockResponse);
        setLocations(locationResponse || []);
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

  const form = useForm<z.infer<typeof StockTransferSchema>>({
    resolver: zodResolver(StockTransferSchema),
    defaultValues: {
      ...item,
      status: true,
      ...(stockVariantId ? { stockVariant: stockVariantId } : {}),
    },
  });

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

  const submitData = (values: z.infer<typeof StockTransferSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      if (item) {
        // Update logic for existing stock transfer
        console.log("Update logic for existing stock transfer");
      } else {
        createStockTransfer(values)
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              setSuccess(data.message);
              toast({
                title: "Success",
                description: data.message,
              });
              router.push("/stock-transfers");
            } else if (data && data.responseType === "error") {
              setError(data.message);
            }
          })
          .catch((err) => {
            console.error("Error creating stock transfer:", err);
            setError("An unexpected error occurred. Please try again.");
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create stock transfer.",
            });
          });
      }
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Card className="shadow-md">
        <CardHeader className="space-y-1 pb-6">
          <p className="text-sm text-muted-foreground">
            Transfer stock between locations and track inventory movements
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitData, onInvalid)}
              className="space-y-6"
            >
              {/* Error and Success Messages */}
              {error && <FormError message={error} />}
              {success && <FormSuccess message={success} />}

              {/* Stock Item Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Item Information
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="stockVariant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Stock Item <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <StockVariantSelector
                            {...field}
                            value={field.value ?? ""}
                            isDisabled={isPending || !!stockVariantId}
                            onChange={(value) => {
                              field.onChange(value);
                              // Update selected variant when changed
                              const variant = stocks.find(
                                (s) => s.id === value,
                              );
                              if (variant) {
                                setSelectedVariant(variant as any);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedVariant && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                      <InfoIcon className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="ml-2">
                        <div className="space-y-1">
                          <p className="font-medium text-emerald-900">
                            Current Stock Information
                          </p>
                          <div className="text-sm text-emerald-800 space-y-0.5">
                            <p>
                              Available Quantity:{" "}
                              <span className="font-semibold">
                                {Intl.NumberFormat().format(
                                  selectedVariant.currentAvailable,
                                )}
                              </span>
                            </p>
                            <p>
                              Total Value:{" "}
                              <span className="font-semibold">
                                {Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "TZS",
                                }).format(selectedVariant.currentTotalValue)}
                              </span>
                            </p>
                            <p className="text-xs italic mt-1">
                              Note: Transfer quantity cannot exceed available
                              quantity
                            </p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <Separator />

              {/* Location and Department */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transfer Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="fromLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          From Location <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <LocationSelector
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isRequired
                            isDisabled={isPending}
                            label="Location"
                            placeholder="Select origin location"
                            locations={locations}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          To Location <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <LocationSelector
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isRequired
                            isDisabled={isPending}
                            label="To Location"
                            placeholder="Select destination"
                            locations={locations.filter(
                              (location) =>
                                location.id !== form.watch("fromLocation"),
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Department{" "}
                          <span className="text-blue-500">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <DepartmentSelector
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Quantity and Staff */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Quantity & Staff
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Quantity <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value}
                            disabled={isPending}
                            placeholder="Enter transfer quantity"
                            thousandSeparator={true}
                            allowNegative={false}
                            onValueChange={(values) => {
                              const rawValue = Number(
                                values.value.replace(/,/g, ""),
                              );
                              field.onChange(rawValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="staff"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Responsible Staff{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <StaffSelectorWidget
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isRequired
                            isDisabled={isPending}
                            label="Staff"
                            placeholder="Select staff member"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Comment */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any relevant notes or comments about this transfer..."
                          {...field}
                          disabled={isPending}
                          maxLength={400}
                          className="min-h-[100px] resize-none"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/400 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                <CancelButton />
                <Separator
                  orientation="vertical"
                  className="hidden sm:block h-10"
                />
                <SubmitButton
                  isPending={isPending}
                  label={item ? "Update Transfer" : "Create Transfer"}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default StockTransferForm;
