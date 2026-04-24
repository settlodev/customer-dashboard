"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar as CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { createStockModification } from "@/lib/actions/stock-modification-actions";
import { getCurrentLocationBalance } from "@/lib/actions/inventory-balance-actions";
import { StockModificationSchema } from "@/types/stock-modification/schema";
import { MODIFICATION_CATEGORY_OPTIONS } from "@/types/stock-modification/type";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import type { VariantMeta } from "@/components/widgets/stock-variant-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";

type FormValues = z.infer<typeof StockModificationSchema>;

interface BalanceSnapshot {
  loading: boolean;
  variantName?: string;
  quantityOnHand: number;
  averageCost: number | null;
}

export default function StockModificationForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  // Per-row balance snapshot, keyed by react-hook-form field id so it survives
  // reorders/removals without leaking to neighbours.
  const [balances, setBalances] = useState<Record<string, BalanceSnapshot>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(StockModificationSchema),
    defaultValues: {
      category: "CORRECTION",
      reason: "",
      notes: "",
      modificationDate: new Date().toISOString(),
      items: [{ stockVariantId: "", quantityChange: 0 }],
    },
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

  const loadBalance = useCallback(
    async (fieldId: string, variantId: string, fallbackName?: string) => {
      setBalances((prev) => ({
        ...prev,
        [fieldId]: {
          loading: true,
          variantName: fallbackName ?? prev[fieldId]?.variantName,
          quantityOnHand: 0,
          averageCost: null,
        },
      }));
      try {
        const balance = await getCurrentLocationBalance(variantId);
        setBalances((prev) => ({
          ...prev,
          [fieldId]: {
            loading: false,
            variantName: balance?.variantName ?? fallbackName,
            quantityOnHand: balance ? Number(balance.quantityOnHand) : 0,
            averageCost: balance?.averageCost != null ? Number(balance.averageCost) : null,
          },
        }));
      } catch {
        setBalances((prev) => ({
          ...prev,
          [fieldId]: {
            loading: false,
            variantName: fallbackName,
            quantityOnHand: 0,
            averageCost: null,
          },
        }));
      }
    },
    [],
  );

  const handleVariantChange = useCallback(
    (fieldId: string, index: number, variantId: string) => {
      form.setValue(`items.${index}.stockVariantId`, variantId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (!variantId) {
        setBalances((prev) => {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
        return;
      }
      void loadBalance(fieldId, variantId);
    },
    [form, loadBalance],
  );

  const handleVariantMeta = useCallback(
    (fieldId: string, meta: VariantMeta | null) => {
      if (!meta) return;
      setBalances((prev) => ({
        ...prev,
        [fieldId]: {
          loading: prev[fieldId]?.loading ?? false,
          variantName: meta.displayName ?? prev[fieldId]?.variantName,
          quantityOnHand: prev[fieldId]?.quantityOnHand ?? 0,
          averageCost: prev[fieldId]?.averageCost ?? null,
        },
      }));
    },
    [],
  );

  const removeItem = useCallback(
    (index: number, fieldId: string) => {
      remove(index);
      setBalances((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    },
    [remove],
  );

  const submitData = (values: FormValues) => {
    setResponse(undefined);

    const payload: FormValues = {
      ...values,
      modificationDate: values.modificationDate
        ? new Date(values.modificationDate).toISOString()
        : new Date().toISOString(),
      items: values.items.map((item) => {
        const hasCost = typeof item.unitCost === "number" && !Number.isNaN(item.unitCost);
        return {
          ...item,
          unitCost: hasCost ? item.unitCost : undefined,
        };
      }),
    };

    startTransition(() => {
      createStockModification(payload).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save modification",
            description: data.message,
          });
        }
      });
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData)} className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODIFICATION_CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modificationDate"
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value) : undefined;
                  return (
                    <FormItem>
                      <FormLabel>
                        Modification date <span className="text-red-500">*</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending}
                              className={cn(
                                "h-10 w-full justify-start text-left font-normal border-0 bg-muted hover:bg-muted/80",
                                !selected && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              {selected ? format(selected, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selected}
                            onSelect={(d) => field.onChange(d ? d.toISOString() : "")}
                            disabled={(date) => date > today}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-[11px] text-muted-foreground">
                        Defaults to today; back-date for late entry.
                      </p>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why this adjustment?"
                      rows={3}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
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
                      placeholder="Optional context — references, witnesses, claim numbers…"
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
              <h3 className="text-lg font-medium">Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ stockVariantId: "", quantityChange: 0 })}
                disabled={isPending}
              >
                <Plus className="w-4 h-4 mr-1" /> Add item
              </Button>
            </div>

            {fields.map((field, index) => {
              const balance = balances[field.id];
              const change = Number(watchedItems[index]?.quantityChange) || 0;
              const projected = (balance?.quantityOnHand ?? 0) + change;
              const projectedNegative = projected < 0;
              const showPreview = !!watchedItems[index]?.stockVariantId && change !== 0;

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

                  <div className="flex flex-col md:flex-row gap-3 items-start">
                    <FormField
                      control={form.control}
                      name={`items.${index}.stockVariantId`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[5] min-w-0">
                          <FormLabel className="text-xs">
                            Stock item <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <StockVariantSelector
                              value={f.value}
                              onChange={(v) => handleVariantChange(field.id, index, v)}
                              onVariantMeta={(meta) => handleVariantMeta(field.id, meta)}
                              isDisabled={isPending}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantityChange`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[3] min-w-0">
                          <FormLabel className="text-xs">
                            Qty change <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
                              value={f.value}
                              onValueChange={(v) =>
                                f.onChange(v.value ? Number(v.value) : 0)
                              }
                              thousandSeparator
                              allowNegative
                              placeholder="±0"
                              disabled={isPending}
                            />
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground">
                            Positive to add stock, negative to reduce.
                          </p>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitCost`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[4] min-w-0">
                          <FormLabel className="text-xs">
                            Unit cost
                            <span className="text-muted-foreground ml-1 font-normal">
                              ({locationCurrency}, optional)
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
                              placeholder="Defaults to average cost"
                              disabled={isPending}
                            />
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground">
                            Leave blank to use the variant&apos;s average cost. Override for claim or write-off valuations.
                          </p>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {showPreview &&
                    (balance?.loading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-md bg-white border px-3 py-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Reading current balance…
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-md bg-white border px-3 py-2 flex flex-col">
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Before
                            </span>
                            <span className="font-mono text-lg font-semibold text-gray-700">
                              {(balance?.quantityOnHand ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`rounded-md border px-3 py-2 flex flex-col ${
                              change > 0
                                ? "bg-green-50 border-green-200"
                                : change < 0
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-white"
                            }`}
                          >
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Change
                            </span>
                            <span
                              className={`font-mono text-lg font-semibold ${
                                change > 0
                                  ? "text-green-700"
                                  : change < 0
                                    ? "text-amber-700"
                                    : "text-gray-500"
                              }`}
                            >
                              {change > 0
                                ? `+${change.toLocaleString()}`
                                : change.toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`rounded-md border px-3 py-2 flex flex-col ${
                              projectedNegative
                                ? "bg-red-50 border-red-200"
                                : "bg-white"
                            }`}
                          >
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              After
                            </span>
                            <span
                              className={`font-mono text-lg font-semibold ${
                                projectedNegative
                                  ? "text-red-600"
                                  : change > 0
                                    ? "text-green-700"
                                    : change < 0
                                      ? "text-amber-700"
                                      : "text-gray-700"
                              }`}
                            >
                              {projected.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {(projectedNegative || balance?.averageCost != null) && (
                          <div className="flex items-center justify-between text-[11px]">
                            {projectedNegative ? (
                              <span className="text-red-600 font-medium">
                                Would result in negative stock
                              </span>
                            ) : (
                              <span />
                            )}
                            {balance?.averageCost != null && (
                              <span className="text-muted-foreground">
                                Avg cost {balance.averageCost.toLocaleString()}{" "}
                                {locationCurrency}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                  <FormField
                    control={form.control}
                    name={`items.${index}.notes`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Item notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional — applies to this line only"
                            rows={4}
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

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Create modification" />
        </div>
      </form>
    </Form>
  );
}
