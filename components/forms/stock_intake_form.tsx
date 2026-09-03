"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Truck,
  PackagePlus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn, toDateOnlyIso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumericFormat } from "react-number-format";
import {
  ControlBox,
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlComboboxTriggerClass,
  controlInputClass,
  controlSelectTriggerClass,
} from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  createStockIntakeRecord,
  updateStockIntakeRecord,
} from "@/lib/actions/stock-intake-record-actions";
import { StockIntakeRecordSchema } from "@/types/stock-intake-record/schema";
import {
  INTAKE_PAYMENT_TERMS_LABELS,
  type StockIntakeRecord,
} from "@/types/stock-intake-record/type";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import type { VariantMeta } from "@/components/widgets/stock-variant-selector";
import SupplierSelector from "@/components/widgets/supplier-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import CompatibleUnitSelector from "@/components/widgets/compatible-unit-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { useVatRegistrationStatus } from "@/hooks/use-vat-registration-status";
import { BusinessDayClosedDialog } from "@/components/widgets/business-day-closed-dialog";
import { useBusinessDayGuard } from "@/hooks/use-business-day-guard";
import { getCachedTaxTypes } from "@/lib/cache/reference-data";
import type { TaxType } from "@/types/tax-type/type";
import { formatMoney } from "@/lib/helpers";
import { usePurchaseTaxPreview } from "@/hooks/use-purchase-tax-preview";
import {
  computePurchaseTaxPreview,
  findBusinessDefaultTaxTypeId,
  resolveEffectiveTaxTypeId,
  resolveHeaderPricesIncludeTaxDefault,
} from "@/lib/purchase-tax";

import styles from "./styles/form-shell.module.css";

type StockIntakePayload = Parameters<typeof createStockIntakeRecord>[0];

export default function StockIntakeForm({ item }: { item?: StockIntakeRecord }) {
  const router = useRouter();
  const isEditing = !!item;
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();
  const vatRegistered = useVatRegistrationStatus();
  const businessDayGuard = useBusinessDayGuard();

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

  // Seeded from `item` in edit mode so a line that already has recorded
  // serials shows them immediately. `StockVariantSelector` independently
  // re-resolves serialTracked/unitId once its catalogue fetch settles (it
  // emits meta for a pre-filled value on mount — see its onVariantMeta
  // effect), so this seed only needs to cover the serial text itself.
  const [serialTrackedMap, setSerialTrackedMap] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    item?.items?.forEach((line, index) => {
      if (line.serialNumbers && line.serialNumbers.length > 0) map[index] = true;
    });
    return map;
  });
  const [serialInputs, setSerialInputs] = useState<Record<number, string[]>>(() => {
    const map: Record<number, string[]> = {};
    item?.items?.forEach((line, index) => {
      if (line.serialNumbers && line.serialNumbers.length > 0) map[index] = line.serialNumbers;
    });
    return map;
  });
  // Per-row unit facts about the picked variant: the tracking unit (anchors
  // the purchase-pack picker so it only surfaces convertible units) and the
  // parent stock's divisible sub-unit, if any. Keyed by the field array's
  // stable `field.id`, not the index — `remove()` shifts indices without
  // re-keying, and a stale anchor here would both offer the wrong
  // compatibility set and mis-judge the required-unit check below.
  const [variantUnitMetaMap, setVariantUnitMetaMap] = useState<
    Record<string, { unitId?: string; unitName?: string; divisibleUnitId?: string | null; divisibleUnitName?: string | null }>
  >({});
  // The stock item's own default purchase tax type per row, resolved from
  // `StockVariantSelector`'s catalogue metadata (`VariantMeta.stockTaxTypeId`).
  // Keyed by the field array's own stable `field.id` — unlike
  // `serialTrackedMap`/`variantUnitMap` above (index-keyed, and drift on
  // row deletion since `remove()` shifts indices without re-keying those
  // maps), this one feeds the footer's money arithmetic directly, so an
  // index-keyed version would show the wrong tax default for surviving
  // rows after a delete. GRN/LPO/supplier-return already key their
  // equivalent map by field.id for the same reason.
  const [stockTaxTypeIdMap, setStockTaxTypeIdMap] = useState<Record<string, string | null | undefined>>({});
  // The stock item's own `purchaseTaxInclusive` default per row, keyed the
  // same way (field.id) and for the same drift reason — feeds the header
  // toggle's auto-default (Fix 1, 2026-08 fix wave), not just the preview.
  const [stockPurchaseTaxInclusiveMap, setStockPurchaseTaxInclusiveMap] = useState<
    Record<string, boolean | undefined>
  >({});

  const form = useForm<z.infer<typeof StockIntakeRecordSchema>>({
    resolver: zodResolver(StockIntakeRecordSchema),
    defaultValues: item
      ? {
          notes: item.notes ?? "",
          pricesIncludeTax: item.pricesIncludeTax ?? false,
          orderedDate: item.orderedDate ?? "",
          receivedDate: item.receivedDate ?? "",
          supplierId: item.supplierId ?? "",
          supplierReference: item.supplierReference ?? "",
          paymentTerms: item.paymentTerms ?? "CASH",
          items: item.items.length
            ? item.items.map((line) => ({
                stockVariantId: line.stockVariantId,
                // Re-fill what the operator TYPED, not what was stored.
                // `quantity` is in stock units and `unitCost` is post-tax in
                // base currency, but the save path re-runs pack conversion,
                // FX and tax over whatever this form sends. Seeding it with
                // the stored values while also sending `purchaseUnitId` made
                // every edit re-convert: a 12-bottle crate line saved as 24
                // came back as 24 and went out as 288, and a tax-inclusive
                // line lost its tax fraction again on each save.
                quantity: line.purchaseQuantity ?? line.quantity,
                unitCost: line.originalUnitCost ?? line.unitCost,
                purchaseUnitId: line.purchaseUnitId ?? undefined,
                currency: line.originalCurrency ?? line.currency ?? locationCurrency,
                batchNumber: line.batchNumber ?? "",
                expiryDate: line.expiryDate ?? "",
                supplierBatchReference: line.supplierBatchReference ?? "",
                notes: line.notes ?? "",
                serialNumbers: line.serialNumbers ?? undefined,
                taxTypeId: line.taxTypeId ?? null,
              }))
            : [{ stockVariantId: "", quantity: 0, unitCost: 0, currency: locationCurrency }],
        }
      : {
          notes: "",
          pricesIncludeTax: false,
          orderedDate: "",
          receivedDate: "",
          supplierId: "",
          supplierReference: "",
          paymentTerms: "CASH",
          items: [{ stockVariantId: "", quantity: 0, unitCost: 0, currency: locationCurrency }],
        },
  });

  useEffect(() => {
    const items = form.getValues("items") ?? [];
    items.forEach((row, index) => {
      if (!row?.currency) {
        form.setValue(`items.${index}.currency`, locationCurrency, { shouldDirty: false });
      }
    });
  }, [locationCurrency, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const orderedDateValue = form.watch("orderedDate");
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const orderedDateAsDate = useMemo(
    () => (orderedDateValue ? new Date(orderedDateValue) : undefined),
    [orderedDateValue],
  );

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

  // Deliberately NOT memoised on `watchedItems`. react-hook-form mutates its
  // value tree in place, so `watch("items")` returns the same array reference
  // every render — a useMemo keyed on it never re-runs when a quantity or
  // cost changes, which is why this footer used to sit at 0.00 until some
  // unrelated dependency (adding a row, picking a variant) happened to fire.
  // The arithmetic is a handful of multiplications over a few rows; running
  // it per render costs nothing and cannot go stale.
  const estimatedTotals = computePurchaseTaxPreview(
    (watchedItems ?? []).map((row, index) => {
      const fieldId = fields[index]?.id;
      return {
        quantity: Number(row?.quantity || 0),
        cost: Number(row?.unitCost || 0),
        taxTypeOverride: row?.taxTypeId,
        stockDefaultTaxTypeId: fieldId ? stockTaxTypeIdMap[fieldId] : undefined,
        stockPurchaseTaxInclusive: fieldId ? stockPurchaseTaxInclusiveMap[fieldId] : undefined,
      };
    }),
    { pricesIncludeTax, vatRegistered, businessDefaultTaxTypeId, taxTypes },
  );

  // Server-computed figures, from the same pricing pipeline the save runs
  // (pack conversion, then FX, then purchase tax). The local estimate above
  // is only the fallback while this is in flight or unreachable — it cannot
  // convert foreign currency or apply a purchase pack, so it drifts exactly
  // where those apply.
  const { preview, status: previewStatus } = usePurchaseTaxPreview(
    (watchedItems ?? []).map((row) => ({
      stockVariantId: row?.stockVariantId ?? "",
      quantity: Number(row?.quantity || 0),
      unitCost: Number(row?.unitCost || 0),
      purchaseUnitId: row?.purchaseUnitId ?? null,
      currency: row?.currency ?? null,
      taxTypeId: row?.taxTypeId ?? null,
    })),
    // Raw, not coerced: before the operator touches the header toggle this
    // may be undefined, and that is what lets the server fall back to each
    // item's own default rather than forcing "exclusive".
    pricesIncludeTax,
  );

  const isServerPriced = previewStatus === "live" && !!preview;
  const totals = isServerPriced
    ? {
        // netAmount is already gross for a business that cannot reclaim tax,
        // which is what the subtotal row should show in that case.
        subtotal: preview!.netAmount,
        taxAmount: preview!.taxRecoverable
          ? preview!.taxAmount
          : preview!.nonRecoverableTaxAmount,
        totalAmount: preview!.totalAmount,
      }
    : {
        subtotal: estimatedTotals.subtotal,
        taxAmount: estimatedTotals.taxAmount,
        totalAmount: estimatedTotals.totalAmount,
      };

  // Rows the server could not price — an unknown variant, a pack with no
  // conversion, an unstated unit on a pack-tracked item. Worth surfacing:
  // each one is a line that will fail on save.
  const previewLineErrors = isServerPriced
    ? preview!.items
        .filter((line) => !!line.error)
        .map((line) => ({ index: line.index, error: line.error as string }))
    : [];

  // Whether the operator has manually flipped the header toggle — once they
  // have, the auto-default effect below backs off and leaves their choice
  // alone. Only relevant in create mode: in edit mode the toggle is already
  // locked to the intake's stored value (see the isEditing branch below).
  const pricesIncludeTaxTouchedRef = useRef(false);

  // What the header toggle should default to, given the stock items
  // currently on the intake — see resolveHeaderPricesIncludeTaxDefault
  // (Fix 1, 2026-08 fix wave). Only lines with a resolved stock item count;
  // a blank row or one still awaiting its catalogue fetch is ignored.
  const headerPricesIncludeTaxDefault = useMemo(
    () =>
      resolveHeaderPricesIncludeTaxDefault(
        (watchedItems ?? []).map((row, index) => {
          if (!row?.stockVariantId) return undefined;
          const fieldId = fields[index]?.id;
          return fieldId ? stockPurchaseTaxInclusiveMap[fieldId] : undefined;
        }),
      ),
    [watchedItems, fields, stockPurchaseTaxInclusiveMap],
  );

  // Keep the header toggle in sync with the item defaults as lines are
  // added, removed, or their stock variant changes — so an untouched
  // toggle reflects what the server will actually derive (Fix 1). Skipped
  // entirely in edit mode: UpdateStockIntakeRecord has no pricesIncludeTax,
  // the server re-uses the stored value, and the switch is disabled below.
  useEffect(() => {
    if (isEditing) return;
    if (pricesIncludeTaxTouchedRef.current) return;
    form.setValue("pricesIncludeTax", headerPricesIncludeTaxDefault.pricesIncludeTax, {
      shouldDirty: false,
    });
  }, [headerPricesIncludeTaxDefault.pricesIncludeTax, isEditing, form]);

  const handleVariantMeta = useCallback((index: number, fieldId: string, meta: VariantMeta | null) => {
    setSerialTrackedMap((prev) => ({ ...prev, [index]: meta?.serialTracked ?? false }));
    setVariantUnitMetaMap((prev) => ({
      ...prev,
      [fieldId]: {
        unitId: meta?.unitId,
        unitName: meta?.unitName,
        divisibleUnitId: meta?.divisibleUnitId ?? null,
        divisibleUnitName: meta?.divisibleUnitName ?? null,
      },
    }));
    setStockTaxTypeIdMap((prev) => ({ ...prev, [fieldId]: meta?.stockTaxTypeId ?? null }));
    setStockPurchaseTaxInclusiveMap((prev) => ({ ...prev, [fieldId]: meta?.stockPurchaseTaxInclusive }));
    if (!meta?.serialTracked) {
      setSerialInputs((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
    // Variant change can invalidate any picked purchase pack — clear so the
    // operator re-picks against the new anchor.
    if (meta?.unitId) {
      const packTracked = !!meta.divisibleUnitId;
      const current = form.getValues(`items.${index}.purchaseUnitId`);
      if (packTracked && meta.serialTracked) {
        // Serial-tracked stock must be entered one-by-one in its own
        // tracking unit, so the picker below stays disabled — but the
        // backend still demands the unit be stated for a pack-tracked
        // item. Assert the only unit this row can legally be in.
        if (current !== meta.unitId) {
          form.setValue(`items.${index}.purchaseUnitId`, meta.unitId, { shouldDirty: false });
        }
      } else if (!packTracked && current && current === meta.unitId) {
        // Picking the variant's own unit is equivalent to "no pack" — normalize.
        // NOT for pack-tracked stock: there, the tracking unit is a real
        // answer ("yes, cartons") and blanking it is what IntakeUnitGuard
        // rejects on save.
        form.setValue(`items.${index}.purchaseUnitId`, undefined, { shouldDirty: false });
      }
    }
  }, [form]);

  const submitData = (values: z.infer<typeof StockIntakeRecordSchema>) => {
    for (let i = 0; i < values.items.length; i++) {
      // Pack-tracked stock: the backend's IntakeUnitGuard refuses a bare
      // quantity, because "20" against a stock tracked in cartons and also
      // counted in pieces could mean either. Catch it here so the operator
      // is pointed at the Purchase unit field instead of reading it off a
      // failed save.
      const unitMeta = variantUnitMetaMap[fields[i]?.id ?? ""];
      if (values.items[i].stockVariantId && unitMeta?.divisibleUnitId && !values.items[i].purchaseUnitId) {
        form.setError(`items.${i}.purchaseUnitId`, {
          type: "manual",
          message: `Say which unit this quantity is in — ${unitMeta.unitName ?? "the tracking unit"} or ${unitMeta.divisibleUnitName ?? "the sub-unit"}.`,
        });
        toast({
          variant: "destructive",
          title: "Purchase unit required",
          description: `Item ${i + 1} is tracked in ${unitMeta.unitName ?? "one unit"} and also counted in ${unitMeta.divisibleUnitName ?? "another"} — choose the unit you entered the quantity in.`,
        });
        return;
      }
      if (serialTrackedMap[i]) {
        const serials = (serialInputs[i] || []).filter((s) => s.trim() !== "");
        const qty = values.items[i].quantity;
        if (serials.length !== qty) {
          toast({
            variant: "destructive",
            title: "Serial numbers required",
            description: `Item ${i + 1} requires exactly ${qty} serial number${qty !== 1 ? "s" : ""}, but ${serials.length} provided.`,
          });
          return;
        }
      }
    }

    const payload = {
      ...values,
      supplierId: values.supplierId || undefined,
      supplierReference: values.supplierReference?.trim() || undefined,
      items: values.items.map((row, i) => ({
        ...row,
        currency: row.currency ? row.currency.toUpperCase() : locationCurrency,
        serialNumbers: serialTrackedMap[i]
          ? (serialInputs[i] || []).filter((s) => s.trim() !== "")
          : undefined,
      })),
    };

    setResponse(undefined);
    submitPayload(payload as StockIntakePayload);
  };

  const submitPayload = (payload: StockIntakePayload) => {
    startTransition(() => {
      const action = item
        ? updateStockIntakeRecord(item.id, payload)
        : createStockIntakeRecord(payload);
      action.then((data) => {
        if (businessDayGuard.catch(data, () => submitPayload(payload))) return;
        if (data) setResponse(data);
        if (data?.responseType === "success") {
          toast({ variant: "success", title: "Success", description: data.message });
        }
      });
    });
  };

  return (
    <>
      <BusinessDayClosedDialog
        open={businessDayGuard.dialogOpen}
        locationId={businessDayGuard.locationId}
        reason={businessDayGuard.reason}
        onDismiss={businessDayGuard.close}
        onDayOpened={businessDayGuard.onDayOpened}
      />
      <Form {...form}>
        {response?.responseType === "error" && response?.message ? (
          <Alert tone="danger" className="mb-3">
            <AlertIcon>
              <AlertTriangle className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>We couldn&apos;t save this stock intake</AlertTitle>
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
                  <Truck className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Delivery details</h3>
                  <p className={styles.formCardHeadDesc}>
                    Supplier and dates for this intake.
                  </p>
                </div>
                <div className={styles.formCardActions}>
                  <span className={styles.stepBadge}>STEP 01</span>
                </div>
              </header>

              <div className={styles.formBody}>
                <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2 lg:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="orderedDate"
                    render={({ field }) => {
                      const selected = field.value ? new Date(field.value) : undefined;
                      return (
                        <FormItem className="space-y-[7px]">
                          <FieldLabel required>Date ordered</FieldLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isPending}
                                  className={cn(
                                    controlComboboxTriggerClass,
                                    "justify-start",
                                    !selected && "text-muted-2",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-2" />
                                  {selected ? format(selected, "PPP") : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selected}
                                onSelect={(d) => {
                                  field.onChange(d ? toDateOnlyIso(d) : "");
                                  const received = form.getValues("receivedDate");
                                  if (d && received && new Date(received) > d) {
                                    form.setValue("receivedDate", "", { shouldDirty: true });
                                  }
                                }}
                                disabled={(date) => date > today}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="receivedDate"
                    render={({ field }) => {
                      const selected = field.value ? new Date(field.value) : undefined;
                      return (
                        <FormItem className="space-y-[7px]">
                          <FieldLabel required>Date received</FieldLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isPending}
                                  className={cn(
                                    controlComboboxTriggerClass,
                                    "justify-start",
                                    !selected && "text-muted-2",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-2" />
                                  {selected ? format(selected, "PPP") : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selected}
                                onSelect={(d) => field.onChange(d ? toDateOnlyIso(d) : "")}
                                disabled={(date) =>
                                  orderedDateAsDate ? date > orderedDateAsDate : date > today
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel optional>Supplier</FieldLabel>
                        <FormControl>
                          <SupplierSelector
                            label="Supplier"
                            placeholder="Select supplier"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isDisabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierReference"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel optional>Supplier reference</FieldLabel>
                        <FormControl>
                          <ControlInput
                            placeholder="DN / invoice #"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isPending}
                            maxLength={100}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-[15px] grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel>Payment terms</FieldLabel>
                        <Select
                          value={field.value ?? "CASH"}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className={controlSelectTriggerClass}>
                              <SelectValue placeholder="Select terms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(INTAKE_PAYMENT_TERMS_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pricesIncludeTax"
                  render={({ field }) => (
                    <FormItem className="mt-[15px] flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Supplier prices include tax</FormLabel>
                        <FormDescription>
                          {isEditing
                            ? "Set when this intake was created — the server keeps the original value on update, so this can't be changed here."
                            : "Turn this on when the unit costs you are entering are the tax-inclusive amounts from the supplier's invoice or delivery note. Defaults from the items below — override if this delivery differs."}
                        </FormDescription>
                        {!isEditing && headerPricesIncludeTaxDefault.mixed && (
                          <p className="text-[11px] text-amber-600">
                            The items below don&apos;t agree on whether prices normally include tax —
                            defaulted to off. Check each line before saving.
                          </p>
                        )}
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(v) => {
                            pricesIncludeTaxTouchedRef.current = true;
                            field.onChange(v);
                          }}
                          disabled={isPending || isEditing}
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
                          placeholder="Notes about this delivery"
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
                  <h3>Stock items</h3>
                  <p className={styles.formCardHeadDesc}>
                    What was delivered. One row per stock variant.
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
                        quantity: 0,
                        unitCost: 0,
                        currency: locationCurrency,
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
                  {fields.map((field, index) => (
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
                            onClick={() => {
                              remove(index);
                              setSerialTrackedMap((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                              setSerialInputs((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                              setVariantUnitMetaMap((prev) => {
                                const next = { ...prev };
                                delete next[field.id];
                                return next;
                              });
                              setStockTaxTypeIdMap((prev) => {
                                const next = { ...prev };
                                delete next[field.id];
                                return next;
                              });
                              setStockPurchaseTaxInclusiveMap((prev) => {
                                const next = { ...prev };
                                delete next[field.id];
                                return next;
                              });
                            }}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2 lg:grid-cols-6">
                        <FormField
                          control={form.control}
                          name={`items.${index}.stockVariantId`}
                          render={({ field: f }) => (
                            <FormItem className="space-y-[7px] sm:col-span-2">
                              <FieldLabel required>Stock item</FieldLabel>
                              <FormControl>
                                <StockVariantSelector
                                  value={f.value}
                                  onChange={f.onChange}
                                  onVariantMeta={(meta) => handleVariantMeta(index, field.id, meta)}
                                  isDisabled={isPending}
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
                            <FormItem className="space-y-[7px]">
                              <FieldLabel required>Quantity</FieldLabel>
                              <FormControl>
                                <ControlBox>
                                  <NumericFormat
                                    className={cn(controlInputClass, "tabular-nums")}
                                    value={f.value}
                                    onValueChange={(v) =>
                                      f.onChange(v.value ? Number(v.value) : 0)
                                    }
                                    thousandSeparator
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
                          render={({ field: f }) => {
                            const unitMeta = variantUnitMetaMap[field.id];
                            return (
                              <FormItem className="space-y-[7px]">
                                <FieldLabel required>Unit cost</FieldLabel>
                                <FormControl>
                                  <ControlBox>
                                    <NumericFormat
                                      className={cn(controlInputClass, "tabular-nums")}
                                      value={f.value}
                                      onValueChange={(v) =>
                                        f.onChange(v.value ? Number(v.value) : 0)
                                      }
                                      thousandSeparator
                                      placeholder="0"
                                      disabled={isPending}
                                    />
                                  </ControlBox>
                                </FormControl>
                                <FieldHint>
                                  {unitMeta?.unitName
                                    ? `Cost per ${unitMeta.unitName}`
                                    : "Pick a stock item to see its unit"}
                                </FieldHint>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.currency`}
                          render={({ field: f }) => {
                            const active = (f.value || locationCurrency).toUpperCase();
                            const isForeign = active !== locationCurrency.toUpperCase();
                            return (
                              <FormItem className="space-y-[7px]">
                                <FieldLabel>Currency</FieldLabel>
                                <FormControl>
                                  <CurrencySelector
                                    value={active}
                                    onChange={f.onChange}
                                    isDisabled={isPending}
                                  />
                                </FormControl>
                                {isForeign ? (
                                  <p className="text-[11px] text-amber-600">
                                    Will convert to {locationCurrency} at confirm.
                                  </p>
                                ) : (
                                  <FieldHint>Location base currency.</FieldHint>
                                )}
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.taxTypeId`}
                          render={({ field: f }) => {
                            // Same 3-tier chain as the footer preview and the
                            // server's PurchaseTaxResolver: line override →
                            // stock item's default → business default (only
                            // when VAT-registered) → none.
                            const itemDefaultTaxTypeId = stockTaxTypeIdMap[field.id] ?? null;
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
                              <FormItem className="space-y-[7px]">
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

                      <FormField
                        control={form.control}
                        name={`items.${index}.purchaseUnitId`}
                        render={({ field: f }) => {
                          const unitMeta = variantUnitMetaMap[field.id];
                          const anchor = unitMeta?.unitId;
                          const isSerial = !!serialTrackedMap[index];
                          // Tracked in one unit and also counted in another:
                          // a bare number is ambiguous and the backend
                          // refuses it, so the unit is a required answer
                          // here, not an optional refinement.
                          const packTracked = !!unitMeta?.divisibleUnitId;
                          const usingPack = !!f.value && f.value !== anchor;
                          return (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel
                                required={packTracked && !isSerial}
                                optional={!packTracked}
                              >
                                Purchase unit
                              </FieldLabel>
                              <FormControl>
                                <CompatibleUnitSelector
                                  anchorUnitId={anchor}
                                  value={f.value ?? ""}
                                  onChange={(v) => {
                                    f.onChange(v || undefined);
                                    if (v) form.clearErrors(`items.${index}.purchaseUnitId`);
                                  }}
                                  isDisabled={isPending || !anchor || isSerial}
                                  placeholder={
                                    isSerial
                                      ? "Not available for serial-tracked items"
                                      : !anchor
                                        ? "Pick a stock item first"
                                        : packTracked
                                          ? `Choose ${unitMeta?.unitName ?? "unit"} or ${unitMeta?.divisibleUnitName ?? "sub-unit"}`
                                          : "Same as stock unit"
                                  }
                                />
                              </FormControl>
                              <FieldHint>
                                {isSerial
                                  ? "Serial-tracked items must be entered one-by-one in the variant's stock unit."
                                  : packTracked && !f.value
                                    ? `Tracked in ${unitMeta?.unitName ?? "one unit"} and also counted in ${unitMeta?.divisibleUnitName ?? "another"} — say which one the quantity above is in.`
                                    : usingPack
                                      ? "Quantity & unit cost above are interpreted in this pack — converted to stock units on save."
                                      : packTracked
                                        ? `Quantity & unit cost above are in ${unitMeta?.unitName ?? "the tracking unit"}.`
                                        : "Leave blank to enter qty & cost directly in the variant's tracking unit."}
                              </FieldHint>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.batchNumber`}
                          render={({ field: f }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel optional>Batch number</FieldLabel>
                              <FormControl>
                                <ControlInput
                                  placeholder="Optional"
                                  {...f}
                                  value={f.value ?? ""}
                                  disabled={isPending}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.expiryDate`}
                          render={({ field: f }) => {
                            const selected = f.value ? new Date(f.value) : undefined;
                            return (
                              <FormItem className="space-y-[7px]">
                                <FieldLabel optional>Expiry date</FieldLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isPending}
                                        className={cn(
                                          controlComboboxTriggerClass,
                                          "justify-start",
                                          !selected && "text-muted-2",
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-2" />
                                        {selected ? format(selected, "PPP") : "Pick a date"}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={selected}
                                      onSelect={(d) =>
                                        f.onChange(d ? format(d, "yyyy-MM-dd") : "")
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.supplierBatchReference`}
                          render={({ field: f }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel optional>Supplier ref</FieldLabel>
                              <FormControl>
                                <ControlInput
                                  placeholder="Optional"
                                  {...f}
                                  value={f.value ?? ""}
                                  disabled={isPending}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {serialTrackedMap[index] &&
                        (() => {
                          const qty = Math.floor(
                            Number(form.watch(`items.${index}.quantity`)) || 0,
                          );
                          const serials = serialInputs[index] ?? [];
                          const count = serials.filter((s) => s.trim()).length;
                          const isValidCount = qty > 0 && count === qty;
                          return (
                            <div className="space-y-2 border-t border-line pt-3">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-1.5 text-[13px] font-semibold leading-none text-ink">
                                  Serial numbers <span className="text-primary">*</span>
                                  <span
                                    className={`ml-1 font-mono text-[10px] font-medium ${
                                      isValidCount ? "text-emerald-600" : "text-amber-600"
                                    }`}
                                  >
                                    {count}/{qty} entered
                                  </span>
                                </label>
                              </div>
                              <ControlTextarea
                                placeholder={
                                  qty > 0
                                    ? `Enter ${qty} serial number${qty > 1 ? "s" : ""}, one per line`
                                    : "Set quantity first"
                                }
                                rows={Math.min(Math.max(qty, 2) + 1, 8)}
                                value={serials.join("\n")}
                                onChange={(e) => {
                                  const lines = e.target.value.split("\n");
                                  setSerialInputs((prev) => ({ ...prev, [index]: lines }));
                                }}
                                disabled={isPending || qty === 0}
                              />
                              {qty > 0 && !isValidCount && count > 0 && (
                                <p className="text-[11px] text-amber-600">
                                  {count < qty
                                    ? `${qty - count} more serial number${qty - count > 1 ? "s" : ""} needed`
                                    : `Too many — remove ${count - qty}`}
                                </p>
                              )}
                              {qty > 0 && count === 0 && (
                                <p className="text-[11px] text-amber-600">
                                  This item requires serial number tracking. Enter one
                                  serial per line.
                                </p>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1 items-end text-sm mt-2 pt-3 border-t">
                  {previewLineErrors.length > 0 && (
                    <div className="w-64 mb-2 space-y-1">
                      {previewLineErrors.map(({ index, error }) => (
                        <p key={index} className="text-[11px] text-amber-600 text-right">
                          Item {index + 1}: {error}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between w-64">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {formatMoney(
                        totals.subtotal,
                        isServerPriced ? preview!.currency : locationCurrency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between w-64">
                    <span className="text-muted-foreground">
                      {(isServerPriced ? preview!.taxRecoverable : vatRegistered)
                        ? "Tax"
                        : "Tax (included in cost)"}
                    </span>
                    <span>
                      {formatMoney(
                        totals.taxAmount,
                        isServerPriced ? preview!.currency : locationCurrency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between w-64 font-medium border-t pt-1">
                    <span>Total</span>
                    <span>
                      {formatMoney(
                        totals.totalAmount,
                        isServerPriced ? preview!.currency : locationCurrency,
                      )}
                    </span>
                  </div>
                  <p className="w-64 text-[11px] text-muted-foreground text-right">
                    {previewStatus === "live"
                      ? "Confirmed by the server — these are the figures this intake will be saved with."
                      : previewStatus === "loading"
                        ? "Estimated — confirming with the server…"
                        : "Estimated from the tax rates above. The server could not be reached, so foreign-currency and purchase-pack lines may differ on save."}
                  </p>
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
                  <AlertDialogTitle>Discard this intake?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Unsaved entries will be lost.
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
              {isEditing ? "Update intake" : "Record stock intake"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
