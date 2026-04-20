"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import StockVariantSelector from "../widgets/stock-variant-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createRfq } from "@/lib/actions/rfq-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import { CreateRfqSchema } from "@/types/rfq/schema";
import type { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateRfqSchema>;

export default function RfqForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  const [supplierOptions, setSupplierOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    fetchAllSuppliers()
      .then((suppliers) => {
        if (cancelled) return;
        setSupplierOptions(
          suppliers.map((s) => ({ label: s.name, value: s.id })),
        );
      })
      .catch(() => {
        if (!cancelled) setSupplierOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateRfqSchema),
    defaultValues: {
      title: "",
      targetCurrency: "",
      submissionDeadline: "",
      requiredByDate: "",
      notes: "",
      items: [
        {
          stockVariantId: "",
          requestedQuantity: 0,
          targetUnitPrice: undefined,
          specifications: "",
        },
      ],
      invitedSupplierIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const invitedIds = form.watch("invitedSupplierIds") ?? [];
  const quoteCurrency =
    (form.watch("targetCurrency") || locationCurrency).toUpperCase();

  const onInvalid = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Validation failed",
      description: "Please review the highlighted fields.",
    });
  }, [toast]);

  const estimatedBudget = useMemo(
    () =>
      watchedItems.reduce(
        (sum, item) =>
          sum + Number(item.requestedQuantity || 0) * Number(item.targetUnitPrice || 0),
        0,
      ),
    [watchedItems],
  );

  const submitData = (values: FormValues) => {
    setResponse(undefined);
    startTransition(() => {
      createRfq(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save RFQ",
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
              <h3 className="text-lg font-medium">Request for Quotation</h3>
              <p className="text-xs text-muted-foreground">
                Draft → Send → suppliers submit quotes → compare → evaluate →
                award. The awarded quote is converted into an LPO for
                receiving.
              </p>
            </div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Q2 raw materials, December alcohol resupply"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="targetCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote currency</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={locationCurrency}
                        maxLength={3}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Defaults to {locationCurrency}. Use the currency you want
                      suppliers to respond in.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="submissionDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission deadline</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      After this, quotes are considered EXPIRED.
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiredByDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Needed by</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="invitedSupplierIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite suppliers</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={supplierOptions}
                      defaultValue={field.value ?? []}
                      onValueChange={field.onChange}
                      placeholder={
                        supplierOptions.length > 0
                          ? "Select suppliers to invite"
                          : "Loading suppliers…"
                      }
                      maxCount={4}
                      disabled={isPending || supplierOptions.length === 0}
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">
                    Pre-seeds quote slots for each invited supplier. Others can
                    still submit quotes once the RFQ is sent.
                  </p>
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
                      placeholder="Optional — delivery terms, payment conditions, certifications required…"
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
                  Target prices are optional anchors — suppliers still quote
                  their own rates. Specifications describe quality, size, or
                  grade.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    stockVariantId: "",
                    requestedQuantity: 0,
                    targetUnitPrice: undefined,
                    specifications: "",
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
                      name={`items.${index}.requestedQuantity`}
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
                      name={`items.${index}.targetUnitPrice`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[3] min-w-0">
                          <FormLabel className="text-xs">
                            Target Price
                            <span className="text-muted-foreground ml-1 font-normal">
                              ({quoteCurrency}, optional)
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
                              placeholder="0.00"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.specifications`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Specifications</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional — grade, dimensions, certifications, brand restrictions…"
                            rows={2}
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
                {watchedItems.length} line{watchedItems.length === 1 ? "" : "s"} ·{" "}
                {invitedIds.length} invited supplier{invitedIds.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Target budget
              </span>
              <span className="font-mono font-semibold">
                {estimatedBudget.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  {quoteCurrency}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Create RFQ" />
        </div>
      </form>
    </Form>
  );
}
