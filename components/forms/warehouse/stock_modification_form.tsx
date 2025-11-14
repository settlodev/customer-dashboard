"use client";

import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { NumericFormat } from "react-number-format";
import { StockModification } from "@/types/stock-modification/type";
import { reasonForStockModification } from "@/types/enums";
import { useRouter, useSearchParams } from "next/navigation";
import SubmitButton from "@/components/widgets/submit-button";
import CancelButton from "@/components/widgets/cancel-button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import StockVariantSelectorForWarehouse from "@/components/widgets/warehouse/stock-variant-selector";
import WarehouseStaffSelectorWidget from "@/components/widgets/warehouse/staff-selector";
import { FormError } from "@/components/widgets/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Package, Copy, AlertTriangle } from "lucide-react";
import { createStockModificationInWarehouse } from "@/lib/actions/warehouse/stock-modification-actions";

// Schema for individual stock modification item
const StockModificationItemSchema = z.object({
  stockVariant: z.string({ message: "Please select stock item" }).uuid(),
  quantity: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") {
        return parseInt(val);
      }
      return val;
    },
    z
      .number({ message: "Quantity is required" })
      .nonnegative({ message: "Quantity cannot be negative" })
      .gt(0, { message: "Quantity cannot be zero" }),
  ),
  reason: z.nativeEnum(reasonForStockModification, {
    message: "Please select a reason",
  }),
  comment: z.string().max(400).optional(),
  staff: z.string({ message: "Please select a staff" }).uuid(),
});

// Schema for multiple stock modifications
const MultiStockModificationSchema = z.object({
  stockModifications: z
    .array(StockModificationItemSchema)
    .min(1, { message: "At least one stock modification must be added" }),
  status: z.boolean().optional(),
});

function WarehouseStockModificationForm({
  item,
}: {
  item: StockModification | null | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockVariantId = searchParams.get("stockItem");

  const reasons: { id: string; label: string }[] = [
    { id: reasonForStockModification.DAMAGE, label: "Damage" },
    { id: reasonForStockModification.INTERNALUSE, label: "Internal Use" },
    {
      id: reasonForStockModification.INVENTORYRECOUNT,
      label: "Inventory Recount",
    },
    { id: reasonForStockModification.THEFT, label: "Theft" },
  ];

  const form = useForm<z.infer<typeof MultiStockModificationSchema>>({
    resolver: zodResolver(MultiStockModificationSchema),
    defaultValues: {
      status: true,
      stockModifications: stockVariantId
        ? [
            {
              stockVariant: stockVariantId,
              quantity: 1,
              reason: reasonForStockModification.DAMAGE,
              comment: "",
              staff: "",
            },
          ]
        : [
            {
              stockVariant: "",
              quantity: 1,
              reason: reasonForStockModification.DAMAGE,
              comment: "",
              staff: "",
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockModifications",
  });

  const addStockModification = () => {
    append({
      stockVariant: "",
      quantity: 1,
      reason: reasonForStockModification.DAMAGE,
      comment: "",
      staff: "",
    });
  };

  const duplicateStockModification = (index: number) => {
    const currentModification = form.getValues(`stockModifications.${index}`);
    append({
      ...currentModification,
      stockVariant: "", // Reset stock variant for new entry
    });
  };

  const removeStockModification = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onInvalid = useCallback(
    (errors: any) => {
      console.log("These errors occurred:", errors);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check all required fields and try again.",
      });
    },
    [toast],
  );

  const submitData = async (
    values: z.infer<typeof MultiStockModificationSchema>,
  ) => {
    // Transform data to array format expected by API
    const payload = values.stockModifications.map((modification) => ({
      stockVariant: modification.stockVariant,
      quantity: modification.quantity,
      reason: modification.reason,
      comment: modification.comment,
      staff: modification.staff,
    }));

    startTransition(async () => {
      if (item) {
        toast({
          variant: "destructive",
          title: "Update Not Supported",
          description:
            "Updating multiple stock modifications is not currently supported.",
        });
        return;
      }

      try {
        const response = await createStockModificationInWarehouse(payload);

        if (response?.responseType === "success") {
          toast({
            title: "Success",
            description: response.message,
          });
          router.push("/warehouse-stock-modifications");
        } else if (response?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
        });
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          className="space-y-4 sm:space-y-6"
        >
          <FormError message={error} />

          {/* Stock Modifications Card */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Stock Modification Items
              </CardTitle>
              <Button
                type="button"
                onClick={addStockModification}
                disabled={isPending}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gray-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span className="text-sm sm:text-base">
                        Modification #{index + 1}
                      </span>
                    </h4>
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateStockModification(index)}
                        disabled={isPending}
                        className="text-blue-600 hover:text-blue-700 p-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStockModification(index)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Item Details - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name={`stockModifications.${index}.stockVariant`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Stock Item *
                            </FormLabel>
                            <FormControl>
                              <StockVariantSelectorForWarehouse
                                {...field}
                                isRequired
                                isDisabled={isPending}
                                placeholder="Select stock item"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`stockModifications.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Quantity *
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              value={field.value}
                              disabled={isPending}
                              placeholder="Enter quantity"
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
                      name={`stockModifications.${index}.staff`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Staff Member *
                          </FormLabel>
                          <FormControl>
                            <WarehouseStaffSelectorWidget
                              {...field}
                              isRequired
                              isDisabled={isPending}
                              placeholder="Select staff member"
                              label="Select staff member"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Reason for Modification */}
                  <FormField
                    control={form.control}
                    name={`stockModifications.${index}.reason`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Reason for Modification *
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Select the reason for this stock adjustment
                        </FormDescription>
                        <FormControl>
                          <RadioGroup
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 gap-2"
                          >
                            {reasons.map((item: any) => (
                              <FormItem
                                key={item.id}
                                className="flex items-center space-x-2"
                              >
                                <FormControl>
                                  <RadioGroupItem value={item.id} />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Comment */}
                  <FormField
                    control={form.control}
                    name={`stockModifications.${index}.comment`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Comment{" "}
                          <span className="text-xs text-gray-500">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional notes or details..."
                            {...field}
                            disabled={isPending}
                            maxLength={400}
                            className="min-h-[80px] text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
            <div className="order-2 sm:order-1">
              <CancelButton />
            </div>
            <div className="order-1 sm:order-2">
              <SubmitButton
                label={
                  item
                    ? "Update stock modification"
                    : "Record stock modifications"
                }
                isPending={isPending}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default WarehouseStockModificationForm;
