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
import type { VariantMeta } from "../widgets/stock-variant-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createLpo } from "@/lib/actions/lpo-actions";
import { CreateLpoSchema } from "@/types/lpo/schema";
import type { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateLpoSchema>;

interface ItemMeta {
  displayName?: string;
}

export default function LpoForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateLpoSchema),
    defaultValues: {
      supplierId: "",
      notes: "",
      items: [
        {
          stockVariantId: "",
          orderedQuantity: 0,
          unitCost: 0,
          currency: "",
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

  const handleVariantChange = useCallback(
    (fieldId: string, index: number, variantId: string) => {
      form.setValue(`items.${index}.stockVariantId`, variantId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (!variantId) {
        setItemMeta((prev) => {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
      }
    },
    [form],
  );

  const handleVariantMeta = useCallback(
    (fieldId: string, meta: VariantMeta | null) => {
      setItemMeta((prev) => {
        if (!meta) {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        }
        return {
          ...prev,
          [fieldId]: { displayName: meta.displayName },
        };
      });
    },
    [],
  );

  const removeItem = useCallback(
    (index: number, fieldId: string) => {
      remove(index);
      setItemMeta((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    },
    [remove],
  );

  const lineTotals = useMemo(
    () =>
      watchedItems.map(
        (item) =>
          Number(item.orderedQuantity || 0) * Number(item.unitCost || 0),
      ),
    [watchedItems],
  );

  // Group totals by line currency so mixed-currency LPOs read honestly.
  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    watchedItems.forEach((item, index) => {
      const cur = (item.currency || locationCurrency).toUpperCase();
      map.set(cur, (map.get(cur) ?? 0) + (lineTotals[index] ?? 0));
    });
    return map;
  }, [watchedItems, lineTotals, locationCurrency]);

  const filledItemCount = useMemo(
    () =>
      watchedItems.filter(
        (item) =>
          item.stockVariantId && Number(item.orderedQuantity) > 0,
      ).length,
    [watchedItems],
  );

  const submitData = (values: FormValues) => {
    setResponse(undefined);
    startTransition(() => {
      createLpo(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save LPO",
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
        {/* ── Header ─────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Purchase Order</h3>
              <p className="text-xs text-muted-foreground">
                The LPO is created as a Draft. Submit → Approve → receive via a
                GRN. Line currency falls back to the location base currency when
                blank.
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional — reference numbers, delivery requirements, payment terms…"
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

        {/* ── Items ──────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Items</h3>
                <p className="text-xs text-muted-foreground">
                  Per-line currency lets you record a foreign-currency quote
                  accurately; conversion happens at GRN receive time.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    stockVariantId: "",
                    orderedQuantity: 0,
                    unitCost: 0,
                    currency: "",
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
                        onClick={() => removeItem(index, field.id)}
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
                              onChange={(v) => handleVariantChange(field.id, index, v)}
                              onVariantMeta={(m) => handleVariantMeta(field.id, m)}
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
                      name={`items.${index}.orderedQuantity`}
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
                              value={f.value}
                              onValueChange={(v) =>
                                f.onChange(v.value ? Number(v.value) : 0)
                              }
                              thousandSeparator
                              decimalScale={4}
                              allowNegative={false}
                              placeholder="0.00"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
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
                          <p className="text-[10px] text-muted-foreground">
                            Defaults to {locationCurrency}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-end text-xs text-muted-foreground">
                    Line total:{" "}
                    <span className="ml-1 font-mono font-semibold text-gray-800">
                      {(lineTotals[index] ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {lineCurrency}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Summary ────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Summary
              </span>
              <span className="font-medium">
                {filledItemCount} item{filledItemCount === 1 ? "" : "s"} ready to order
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Totals
              </span>
              {Array.from(totalsByCurrency.entries()).map(([cur, amount]) => (
                <span key={cur} className="font-mono font-semibold">
                  {amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xs font-medium text-muted-foreground">
                    {cur}
                  </span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Create LPO" />
        </div>
      </form>
    </Form>
  );
}
