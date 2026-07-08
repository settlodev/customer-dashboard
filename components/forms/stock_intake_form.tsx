"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
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
import { createStockIntakeRecord } from "@/lib/actions/stock-intake-record-actions";
import { StockIntakeRecordSchema } from "@/types/stock-intake-record/schema";
import { INTAKE_PAYMENT_TERMS_LABELS } from "@/types/stock-intake-record/type";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import type { VariantMeta } from "@/components/widgets/stock-variant-selector";
import SupplierSelector from "@/components/widgets/supplier-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import CompatibleUnitSelector from "@/components/widgets/compatible-unit-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { BusinessDayClosedDialog } from "@/components/widgets/business-day-closed-dialog";
import { useBusinessDayGuard } from "@/hooks/use-business-day-guard";

import styles from "./styles/form-shell.module.css";

type StockIntakePayload = Parameters<typeof createStockIntakeRecord>[0];

export default function StockIntakeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();
  const businessDayGuard = useBusinessDayGuard();

  const [serialTrackedMap, setSerialTrackedMap] = useState<Record<number, boolean>>({});
  const [serialInputs, setSerialInputs] = useState<Record<number, string[]>>({});
  // Variant tracking unit per row — anchors the purchase-pack picker so it
  // only surfaces units convertible to the variant's stock unit.
  const [variantUnitMap, setVariantUnitMap] = useState<Record<number, string | undefined>>({});

  const form = useForm<z.infer<typeof StockIntakeRecordSchema>>({
    resolver: zodResolver(StockIntakeRecordSchema),
    defaultValues: {
      notes: "",
      orderedDate: "",
      receivedDate: "",
      supplierId: "",
      supplierReference: "",
      paymentTerms: "CREDIT",
      items: [{ stockVariantId: "", quantity: 0, unitCost: 0, currency: locationCurrency }],
    },
  });

  useEffect(() => {
    const items = form.getValues("items") ?? [];
    items.forEach((item, index) => {
      if (!item?.currency) {
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

  const handleVariantMeta = useCallback((index: number, meta: VariantMeta | null) => {
    setSerialTrackedMap((prev) => ({ ...prev, [index]: meta?.serialTracked ?? false }));
    setVariantUnitMap((prev) => ({ ...prev, [index]: meta?.unitId }));
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
      const current = form.getValues(`items.${index}.purchaseUnitId`);
      if (current && current === meta.unitId) {
        // Picking the variant's own unit is equivalent to "no pack" — normalize.
        form.setValue(`items.${index}.purchaseUnitId`, undefined, { shouldDirty: false });
      }
    }
  }, [form]);

  const submitData = (values: z.infer<typeof StockIntakeRecordSchema>) => {
    for (let i = 0; i < values.items.length; i++) {
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
      items: values.items.map((item, i) => ({
        ...item,
        currency: item.currency ? item.currency.toUpperCase() : locationCurrency,
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
      createStockIntakeRecord(payload).then((data) => {
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
                                  field.onChange(d ? d.toISOString() : "");
                                  const received = form.getValues("receivedDate");
                                  if (d && received && new Date(received) < d) {
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
                                onSelect={(d) => field.onChange(d ? d.toISOString() : "")}
                                disabled={(date) => {
                                  if (date > today) return true;
                                  if (orderedDateAsDate && date < orderedDateAsDate) return true;
                                  return false;
                                }}
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
                          value={field.value ?? "CREDIT"}
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
                              setVariantUnitMap((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2 lg:grid-cols-5">
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
                                  onVariantMeta={(meta) => handleVariantMeta(index, meta)}
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
                          render={({ field: f }) => (
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
                              <FormMessage />
                            </FormItem>
                          )}
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
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.purchaseUnitId`}
                        render={({ field: f }) => {
                          const anchor = variantUnitMap[index];
                          const isSerial = !!serialTrackedMap[index];
                          const usingPack = !!f.value && f.value !== anchor;
                          return (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel optional>Purchase unit</FieldLabel>
                              <FormControl>
                                <CompatibleUnitSelector
                                  anchorUnitId={anchor}
                                  value={f.value ?? ""}
                                  onChange={(v) => f.onChange(v || undefined)}
                                  isDisabled={isPending || !anchor || isSerial}
                                  placeholder={
                                    isSerial
                                      ? "Not available for serial-tracked items"
                                      : anchor
                                        ? "Same as stock unit"
                                        : "Pick a stock item first"
                                  }
                                />
                              </FormControl>
                              <FieldHint>
                                {isSerial
                                  ? "Serial-tracked items must be entered one-by-one in the variant's stock unit."
                                  : usingPack
                                    ? "Quantity & unit cost above are interpreted in this pack — converted to stock units on save."
                                    : "Leave blank to enter qty & cost directly in the variant's tracking unit."}
                              </FieldHint>
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
                                        f.onChange(
                                          d ? d.toISOString().split("T")[0] : "",
                                        )
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
              Record stock intake
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
