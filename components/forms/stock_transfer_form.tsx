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
import { Card, CardContent } from "@/components/ui/card";
import { Package, ArrowLeftRight, Hash, MessageSquare } from "lucide-react";
import LocationDepartmentSelector from "@/components/widgets/location-department-selector";

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
  const [, setResponse] = useState<FormResponse | undefined>();
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
      const firstError = Object.values(errors)[0] as any;
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          firstError?.message || "Please check all required fields.",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof StockTransferSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      if (item) {
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        {error && <FormError message={error} />}
        {success && <FormSuccess message={success} />}

        {/* Stock Item Selection */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Item Information
              </h3>
            </div>

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
                        const variant = stocks.find((s) => s.id === value);
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
              <div className="rounded-lg border bg-muted/50 p-4 space-y-1.5">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Current Stock
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Available: </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {Intl.NumberFormat().format(
                        selectedVariant.currentAvailable,
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value: </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {Intl.NumberFormat("en-US").format(
                        selectedVariant.currentTotalValue,
                      )}{" "}
                      TZS
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Transfer quantity cannot exceed available quantity
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer Details */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Transfer Details
              </h3>
            </div>

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
                        placeholder="Select origin"
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
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <LocationDepartmentSelector
                        {...field}
                        value={field.value ?? ""}
                        locationId={form.watch("toLocation")}
                        isDisabled={isPending || !form.watch("toLocation")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quantity & Staff */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Quantity & Staff
              </h3>
            </div>

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
                        className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Additional Notes
              </h3>
            </div>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Add any relevant notes about this transfer..."
                      {...field}
                      disabled={isPending}
                      maxLength={400}
                      className="min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-right">
                    {field.value?.length || 0}/400
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <CancelButton />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update Transfer" : "Create Transfer"}
          />
        </div>
      </form>
    </Form>
  );
}

export default StockTransferForm;
