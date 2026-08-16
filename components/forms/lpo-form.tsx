"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  CheckCircle2,
  FileText,
  PackagePlus,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ControlBox,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlInputClass,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
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
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import SupplierSelector from "../widgets/supplier-selector";
import CreateSupplierSheet from "../widgets/create-supplier-sheet";
import StockVariantSelector from "../widgets/stock-variant-selector";
import type { VariantMeta } from "../widgets/stock-variant-selector";
import CurrencySelector from "../widgets/currency-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { useVatRegistrationStatus } from "@/hooks/use-vat-registration-status";
import { createLpo } from "@/lib/actions/lpo-actions";
import { CreateLpoSchema } from "@/types/lpo/schema";
import type { FormResponse } from "@/types/types";
import type { Supplier } from "@/types/supplier/type";
import { getCachedTaxTypes } from "@/lib/cache/reference-data";
import type { TaxType } from "@/types/tax-type/type";
import { formatMoney } from "@/lib/helpers";
import {
  computePurchaseTaxPreview,
  findBusinessDefaultTaxTypeId,
  resolveEffectiveTaxTypeId,
} from "@/lib/purchase-tax";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof CreateLpoSchema>;

interface ItemMeta {
  displayName?: string;
  /** The stock item's own default purchase tax type, if any. */
  stockTaxTypeId?: string | null;
}

export interface LpoFormInitialValues {
  supplierId?: string;
  notes?: string;
  items: Array<{
    stockVariantId: string;
    orderedQuantity: number;
    unitCost: number;
    currency?: string;
  }>;
}

interface LpoFormProps {
  initialValues?: LpoFormInitialValues;
}

export default function LpoForm({ initialValues }: LpoFormProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();
  const vatRegistered = useVatRegistrationStatus();

  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({});
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);

  // Purchase tax types — same source, filter and sort as the GRN form's
  // picker, so the per-line override behaves identically everywhere.
  useEffect(() => {
    getCachedTaxTypes()
      .then((tx) => {
        const activeTaxTypes = ((tx ?? []) as TaxType[])
          .filter((t) => t.active)
          .sort(
            (a, b) =>
              (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
              a.code.localeCompare(b.code),
          );
        setTaxTypes(activeTaxTypes);
      })
      .catch(() => setTaxTypes([]));
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateLpoSchema),
    defaultValues: {
      supplierId: initialValues?.supplierId ?? "",
      pricesIncludeTax: false,
      notes: initialValues?.notes ?? "",
      items:
        initialValues?.items && initialValues.items.length > 0
          ? initialValues.items.map((it) => ({
              stockVariantId: it.stockVariantId,
              orderedQuantity: it.orderedQuantity,
              unitCost: it.unitCost,
              currency: it.currency ?? "",
            }))
          : [
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
  const pricesIncludeTax = form.watch("pricesIncludeTax");

  const taxTypeMap = useMemo(
    () => new Map(taxTypes.map((t) => [t.id, t])),
    [taxTypes],
  );

  const businessDefaultTaxTypeId = useMemo(
    () => findBusinessDefaultTaxTypeId(taxTypes),
    [taxTypes],
  );

  const totals = useMemo(
    () =>
      computePurchaseTaxPreview(
        watchedItems.map((item, i) => {
          const fieldId = fields[i]?.id;
          const meta = fieldId ? itemMeta[fieldId] : undefined;
          return {
            quantity: Number(item?.orderedQuantity || 0),
            cost: Number(item?.unitCost || 0),
            taxTypeOverride: item?.taxTypeId,
            stockDefaultTaxTypeId: meta?.stockTaxTypeId,
          };
        }),
        { pricesIncludeTax, vatRegistered, businessDefaultTaxTypeId, taxTypes },
      ),
    [watchedItems, fields, itemMeta, pricesIncludeTax, vatRegistered, businessDefaultTaxTypeId, taxTypes],
  );

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
          [fieldId]: {
            displayName: meta.displayName,
            stockTaxTypeId: meta.stockTaxTypeId ?? null,
          },
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
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this purchase order</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Purchase order</h3>
                <p className={styles.formCardHeadDesc}>
                  Created as Draft. Submit → Approve → receive via a GRN. Line
                  currency falls back to the location base when blank.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Supplier</FieldLabel>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
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
                      </div>
                      <CreateSupplierSheet
                        disabled={isPending}
                        onCreated={(supplier: Supplier) => {
                          field.onChange(supplier.id);
                        }}
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isPending}
                            // Match the SupplierSelector trigger's box:
                            // 44px tall, same 10px radius.
                            className="h-11 w-11 shrink-0 rounded-[10px]"
                            title="Create a new supplier"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricesIncludeTax"
                render={({ field }) => (
                  <FormItem className="mt-[15px] flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Supplier prices include tax</FormLabel>
                      <FormDescription>
                        Turn this on when the unit costs on this order are
                        tax-inclusive amounts, matching how this supplier
                        normally quotes.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
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
                  <FormItem className="mt-[15px] space-y-[7px]">
                    <FieldLabel optional>Notes</FieldLabel>
                    <FormControl>
                      <ControlTextarea
                        placeholder="Reference numbers, delivery requirements, payment terms."
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <PackagePlus className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Items</h3>
                <p className={styles.formCardHeadDesc}>
                  Per-line currency lets you record a foreign-currency quote
                  accurately. Conversion happens at GRN receive.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
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
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add item
                </Button>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const disabledVariantIds = watchedItems
                    .map((i) => i.stockVariantId)
                    .filter((id, i) => id && i !== index) as string[];
                  const lineCurrency = (
                    watchedItems[index]?.currency || locationCurrency
                  ).toUpperCase();
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

                      <div className="flex flex-col md:flex-row gap-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.stockVariantId`}
                          render={({ field: f }) => (
                            <FormItem className="w-full md:flex-[5] min-w-0 space-y-[7px]">
                              <FieldLabel required>Stock item</FieldLabel>
                              <FormControl>
                                <StockVariantSelector
                                  value={f.value}
                                  onChange={(v) =>
                                    handleVariantChange(field.id, index, v)
                                  }
                                  onVariantMeta={(m) =>
                                    handleVariantMeta(field.id, m)
                                  }
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
                            <FormItem className="w-full md:flex-[2] min-w-0 space-y-[7px]">
                              <FieldLabel required>Qty</FieldLabel>
                              <FormControl>
                                <ControlBox>
                                  <NumericFormat
                                    className={cn(controlInputClass, "tabular-nums")}
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
                                </ControlBox>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitCost`}
                          render={({ field: f }) => (
                            <FormItem className="w-full md:flex-[3] min-w-0 space-y-[7px]">
                              <FieldLabel>
                                Unit cost
                                <span className="text-muted-foreground ml-1 font-normal">
                                  ({lineCurrency})
                                </span>
                              </FieldLabel>
                              <FormControl>
                                <ControlBox>
                                  <NumericFormat
                                    className={cn(controlInputClass, "tabular-nums")}
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
                                </ControlBox>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.currency`}
                          render={({ field: f }) => (
                            <FormItem className="w-full md:flex-[2] min-w-0 space-y-[7px]">
                              <FieldLabel>Currency</FieldLabel>
                              <FormControl>
                                <CurrencySelector
                                  value={f.value || ""}
                                  onChange={(v) => f.onChange(v.toUpperCase())}
                                  isDisabled={isPending}
                                  placeholder={locationCurrency}
                                />
                              </FormControl>
                              <FieldHint>Defaults to {locationCurrency}</FieldHint>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.taxTypeId`}
                          render={({ field: f }) => {
                            // Same 3-tier chain as the footer preview and the
                            // server's PurchaseTaxResolver: line override →
                            // stock item's default → business default (only
                            // when VAT-registered) → none.
                            const itemDefaultTaxTypeId =
                              itemMeta[field.id]?.stockTaxTypeId ?? null;
                            const effectiveTaxTypeId = resolveEffectiveTaxTypeId(
                              f.value,
                              itemDefaultTaxTypeId,
                              vatRegistered,
                              businessDefaultTaxTypeId,
                            );
                            const effectiveTaxType = effectiveTaxTypeId
                              ? taxTypeMap.get(effectiveTaxTypeId)
                              : undefined;
                            const isOverride = !!f.value;
                            const isItemDefault =
                              !isOverride && !!itemDefaultTaxTypeId;
                            const isBusinessDefault =
                              !isOverride && !itemDefaultTaxTypeId && !!effectiveTaxTypeId;
                            return (
                              <FormItem className="w-full md:flex-[3] min-w-0 space-y-[7px]">
                                <FieldLabel optional>Tax</FieldLabel>
                                <FormControl>
                                  <Combobox
                                    options={taxTypes.map((t) => ({
                                      value: t.id,
                                      label: `${t.code} — ${t.name} (${t.ratePercent}%)`,
                                    }))}
                                    value={f.value ?? null}
                                    onChange={(v) => f.onChange(v ?? null)}
                                    placeholder={
                                      effectiveTaxTypeId
                                        ? "Use default"
                                        : taxTypes.length === 0
                                          ? "Loading tax types…"
                                          : "No tax"
                                    }
                                    searchPlaceholder="Search tax types…"
                                    emptyText="No tax types found."
                                    disabled={isPending}
                                    ariaLabel="Tax"
                                  />
                                </FormControl>
                                <FieldHint>
                                  {effectiveTaxType
                                    ? `${effectiveTaxType.name} ${effectiveTaxType.ratePercent}%${
                                        isOverride
                                          ? ""
                                          : isItemDefault
                                            ? " (item default)"
                                            : isBusinessDefault
                                              ? " (business default)"
                                              : ""
                                      }`
                                    : "No tax configured"}
                                </FieldHint>
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-end text-xs text-muted-foreground">
                        Line total:{" "}
                        <span className="ml-1 font-mono font-semibold text-gray-800 dark:text-gray-200">
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

                <div className="flex flex-col gap-1 items-end text-sm mt-2 pt-3 border-t">
                  <div className="flex justify-between w-64">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMoney(totals.subtotal, locationCurrency)}</span>
                  </div>
                  <div className="flex justify-between w-64">
                    <span className="text-muted-foreground">
                      {vatRegistered ? "Tax" : "Tax (included in cost)"}
                    </span>
                    <span>{formatMoney(totals.taxAmount, locationCurrency)}</span>
                  </div>
                  <div className="flex justify-between w-64 font-medium border-t pt-1">
                    <span>Total</span>
                    <span>{formatMoney(totals.totalAmount, locationCurrency)}</span>
                  </div>
                  <p className="w-64 text-[11px] text-muted-foreground text-right">
                    Estimated from the tax rates above — the server confirms
                    the exact figures on save.
                  </p>
                </div>
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
                <AlertDialogTitle>Discard this purchase order?</AlertDialogTitle>
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
            Create purchase order
          </Button>
        </div>
      </form>
    </Form>
  );
}
