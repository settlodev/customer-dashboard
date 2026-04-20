"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import SupplierSelector from "../widgets/supplier-selector";
import StockVariantSelector from "../widgets/stock-variant-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createSupplierReturn } from "@/lib/actions/supplier-return-actions";
import { CreateSupplierReturnSchema } from "@/types/supplier-return/schema";
import type { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateSupplierReturnSchema>;

export default function SupplierReturnForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateSupplierReturnSchema),
    defaultValues: {
      supplierId: "",
      grnId: "",
      reason: "",
      notes: "",
      items: [
        {
          stockVariantId: "",
          quantity: 0,
          unitCost: undefined,
          currency: "",
          reason: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

  const onInvalid = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Validation failed",
      description: "Please review the highlighted fields.",
    });
  }, [toast]);

  const totalRefund = useMemo(
    () =>
      watchedItems.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0) * Number(item.unitCost || 0),
        0,
      ),
    [watchedItems],
  );

  const filledItemCount = useMemo(
    () =>
      watchedItems.filter(
        (item) => item.stockVariantId && Number(item.quantity) > 0,
      ).length,
    [watchedItems],
  );

  const submitData = (values: FormValues) => {
    setResponse(undefined);
    startTransition(() => {
      createSupplierReturn(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save return",
            description: data.message,
          });
        }
      });
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Return to supplier</h3>
              <p className="text-xs text-muted-foreground">
                Create a Draft first. Stock is only reduced when you dispatch.
                Tie to a GRN if this is a refund against a specific receipt.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Supplier <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <SupplierSelector
                        label="Supplier"
                        placeholder="Select supplier"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isDisabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grnId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related GRN (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="GRN-XXXXX id"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Paste the GRN UUID. Drives supplier-performance tracking.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Damaged on arrival, wrong product, expired"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional — credit note reference, supplier contact, photos…"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Items</h3>
                <p className="text-xs text-muted-foreground">
                  Use the supplier&apos;s invoice currency on each line when the
                  original purchase was foreign so refunds reconcile cleanly.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    stockVariantId: "",
                    quantity: 0,
                    unitCost: undefined,
                    currency: "",
                    reason: "",
                  })
                }
                disabled={isPending}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {fields.map((field, index) => {
              const disabledVariantIds = watchedItems
                .map((i) => i.stockVariantId)
                .filter((id, i) => id && i !== index) as string[];
              const lineCurrency =
                (watchedItems[index]?.currency || locationCurrency).toUpperCase();
              return (
                <div
                  key={field.id}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Item {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.stockVariantId`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[5] min-w-0">
                          <FormLabel className="text-xs">
                            Stock Item <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <StockVariantSelector
                              value={f.value}
                              onChange={f.onChange}
                              isDisabled={isPending}
                              disabledValues={disabledVariantIds}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[2] min-w-0">
                          <FormLabel className="text-xs">
                            Qty <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
                              value={f.value}
                              onValueChange={(v) =>
                                f.onChange(v.value ? Number(v.value) : 0)
                              }
                              thousandSeparator
                              decimalScale={6}
                              allowNegative={false}
                              placeholder="0"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitCost`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[3] min-w-0">
                          <FormLabel className="text-xs">
                            Unit Cost
                            <span className="text-muted-foreground ml-1 font-normal">
                              ({lineCurrency})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
                              value={f.value ?? ""}
                              onValueChange={(v) =>
                                f.onChange(v.value === "" ? undefined : Number(v.value))
                              }
                              thousandSeparator
                              decimalScale={4}
                              allowNegative={false}
                              placeholder="Defaults to batch cost"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.currency`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[2] min-w-0">
                          <FormLabel className="text-xs">Currency</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={locationCurrency}
                              maxLength={3}
                              {...f}
                              value={f.value ?? ""}
                              onChange={(e) => f.onChange(e.target.value.toUpperCase())}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.reason`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Line reason</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Optional — specific reason for this line"
                            {...f}
                            value={f.value ?? ""}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Summary
              </span>
              <span className="font-medium">
                {filledItemCount} item{filledItemCount === 1 ? "" : "s"} to return
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Refund total
              </span>
              <span className="font-mono font-semibold">
                {totalRefund.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Create Return" />
        </div>
      </form>
    </Form>
  );
}
