"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  SlidersHorizontal,
  Boxes,
  AlertTriangle,
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { createStockModification } from "@/lib/actions/stock-modification-actions";
import { getCurrentLocationBalance } from "@/lib/actions/inventory-balance-actions";
import { StockModificationSchema } from "@/types/stock-modification/schema";
import { MODIFICATION_CATEGORY_OPTIONS } from "@/types/stock-modification/type";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import type { VariantMeta } from "@/components/widgets/stock-variant-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { useLocationConfig } from "@/hooks/use-location-config";
import { useInventoryEventRefresh } from "@/hooks/use-inventory-event-refresh";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof StockModificationSchema>;

interface BalanceSnapshot {
  loading: boolean;
  variantName?: string;
  quantityOnHand: number;
  averageCost: number | null;
}

export default function StockModificationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

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
  const { config: locationConfig } = useLocationConfig();

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

  // If an intake / sale / adjustment lands elsewhere while the form is
  // open, refresh every row's displayed balance. Cooldown protects against
  // POS event bursts; loadBalance preserves the prior variantName so the
  // row label doesn't flicker during the refetch.
  useInventoryEventRefresh(locationConfig?.locationId, () => {
    const items = form.getValues("items");
    fields.forEach((field, index) => {
      const variantId = items[index]?.stockVariantId;
      if (variantId) void loadBalance(field.id, variantId);
    });
  });

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
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this stock modification</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}
      <form
        onSubmit={form.handleSubmit(submitData)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Modification details</h3>
                <p className={styles.formCardHeadDesc}>
                  Why and when. Reason is captured against every line.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className={styles.fieldRow}>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Category <span className="req">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
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
                        <FormLabel className={styles.fieldLabel}>
                          Modification date <span className="req">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isPending}
                                className={cn(
                                  "h-10 w-full justify-start text-left font-normal",
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

              <div className={styles.fieldRow} style={{ marginTop: 14 }}>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="col-span-2 min-w-0">
                      <FormLabel className={styles.fieldLabel}>
                        Reason <span className="req">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Why this adjustment?"
                          rows={2}
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className={styles.fieldRow} style={{ marginTop: 14 }}>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2 min-w-0">
                      <FormLabel className={styles.fieldLabel}>
                        Notes
                        <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="References, witnesses, claim numbers."
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Boxes className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Items</h3>
                <p className={styles.formCardHeadDesc}>
                  Quantity changes preview against the live on-hand balance.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ stockVariantId: "", quantityChange: 0 })}
                  disabled={isPending}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add item
                </Button>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const balance = balances[field.id];
                  const change = Number(watchedItems[index]?.quantityChange) || 0;
                  const projected = (balance?.quantityOnHand ?? 0) + change;
                  const projectedNegative = projected < 0;
                  const showPreview =
                    !!watchedItems[index]?.stockVariantId && change !== 0;

                  return (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-3 bg-muted/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
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
                                Leave blank to use the variant&apos;s average cost.
                              </p>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {showPreview &&
                        (balance?.loading ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-md bg-white border px-3 py-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Reading current
                            balance…
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
              </div>
            </div>
          </section>
        </div>

        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                title="Discard changes and go back"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this modification?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.back()}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isPending}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Create modification
          </Button>
        </div>
      </form>
    </Form>
  );
}
