"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Truck,
  PackagePlus,
  UserCheck,
  Link2,
  Unlink,
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
import { Badge } from "@/components/ui/badge";
import { NumericFormat } from "react-number-format";
import {
  ControlBox,
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlComboboxTriggerClass,
  controlInputClass,
} from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import SupplierSelector from "../widgets/supplier-selector";

import styles from "./styles/form-shell.module.css";
import StaffSelectorWidget from "../widgets/staff_selector_widget";
import StockVariantSelector from "../widgets/stock-variant-selector";
import type { VariantMeta } from "../widgets/stock-variant-selector";
import CompatibleUnitSelector from "../widgets/compatible-unit-selector";
import { LpoPickerDialog } from "../widgets/grn/lpo-picker";
import type { LpoWithSupplierName } from "../widgets/grn/lpo-picker";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createGrn } from "@/lib/actions/grn-actions";
import { CreateGrnSchema } from "@/types/grn/schema";
import type { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateGrnSchema>;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

interface ItemMeta {
  displayName?: string;
  serialTracked: boolean;
  /** Variant's tracking unit — anchors the purchase-pack picker. */
  unitId?: string;
}

interface GrnFormProps {
  initialLpo?: LpoWithSupplierName | null;
}

export default function GrnForm({ initialLpo = null }: GrnFormProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({});
  const [linkedLpo, setLinkedLpo] = useState<LpoWithSupplierName | null>(null);
  const [loadingItemRows, setLoadingItemRows] = useState<Set<string>>(
    () => new Set(),
  );
  const itemsLoading = loadingItemRows.size > 0;

  const handleItemLoadingChange = useCallback(
    (fieldId: string, loading: boolean) => {
      setLoadingItemRows((prev) => {
        const has = prev.has(fieldId);
        if (loading === has) return prev;
        const next = new Set(prev);
        if (loading) next.add(fieldId);
        else next.delete(fieldId);
        return next;
      });
    },
    [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateGrnSchema),
    defaultValues: {
      supplierId: "",
      receivedBy: "",
      receivedDate: new Date().toISOString(),
      notes: "",
      deliveryPersonName: "",
      deliveryPersonPhone: "",
      deliveryPersonEmail: "",
      lpoId: "",
      items: [{ stockVariantId: "", receivedQuantity: 0, unitCost: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

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
            serialTracked: meta.serialTracked,
            unitId: meta.unitId,
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
      setLoadingItemRows((prev) => {
        if (!prev.has(fieldId)) return prev;
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });
    },
    [remove],
  );

  const applyLpo = useCallback(
    (lpo: LpoWithSupplierName) => {
      setLinkedLpo(lpo);
      form.setValue("lpoId", lpo.id, { shouldDirty: true });
      form.setValue("supplierId", lpo.supplierId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      const items = lpo.items.map((line) => {
        const outstanding = Math.max(
          0,
          Number(line.orderedQuantity || 0) - Number(line.receivedQuantity || 0),
        );
        return {
          stockVariantId: line.stockVariantId,
          receivedQuantity: outstanding,
          unitCost: Number(line.unitCost || 0),
        };
      });
      replace(items.length > 0 ? items : [{ stockVariantId: "", receivedQuantity: 0, unitCost: 0 }]);
      setItemMeta({});
      toast({
        title: "LPO linked",
        description: `Pre-filled ${items.length} item${items.length === 1 ? "" : "s"} from ${lpo.lpoNumber}.`,
      });
    },
    [form, replace, toast],
  );

  const unlinkLpo = useCallback(() => {
    setLinkedLpo(null);
    form.setValue("lpoId", "", { shouldDirty: true });
  }, [form]);

  const initialLpoApplied = useRef(false);
  useEffect(() => {
    if (initialLpoApplied.current) return;
    if (!initialLpo) return;
    initialLpoApplied.current = true;
    applyLpo(initialLpo);
  }, [initialLpo, applyLpo]);

  const submitData = (values: FormValues) => {
    for (let i = 0; i < values.items.length; i++) {
      const item = values.items[i];
      const fieldId = fields[i]?.id;
      const tracked = fieldId ? itemMeta[fieldId]?.serialTracked : false;
      if (!tracked) continue;
      const count = item.serialNumbers?.length ?? 0;
      const qty = Math.trunc(Number(item.receivedQuantity || 0));
      if (count !== qty || count === 0) {
        form.setError(`items.${i}.serialNumbers`, {
          type: "manual",
          message: `Serial-tracked items need exactly ${qty} serial number${qty === 1 ? "" : "s"}`,
        });
        toast({
          variant: "destructive",
          title: "Missing serial numbers",
          description: `Item ${i + 1} is serial-tracked — enter ${qty} serial${qty === 1 ? "" : "s"} before submitting.`,
        });
        return;
      }
    }

    setResponse(undefined);
    startTransition(() => {
      createGrn(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save GRN",
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
            <AlertTitle>We couldn&apos;t save this goods received note</AlertTitle>
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
              <h3>GRN details</h3>
              <p className={styles.formCardHeadDesc}>
                Tie the receipt to a supplier, and optionally to an open LPO.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>STEP 01</span>
              {linkedLpo ? (
                <>
                  <Badge variant="secondary" className="gap-1">
                    <Link2 className="h-3 w-3" />
                    {linkedLpo.lpoNumber}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={unlinkLpo}
                    disabled={isPending}
                  >
                    <Unlink className="h-3.5 w-3.5 mr-1" /> Unlink
                  </Button>
                </>
              ) : (
                <LpoPickerDialog onPick={applyLpo} />
              )}
            </div>
          </header>
          <div className={styles.formBody}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Supplier</FieldLabel>
                    <FormControl>
                      <SupplierSelector
                        label="Supplier"
                        placeholder="Select supplier"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isDisabled={isPending || !!linkedLpo}
                      />
                    </FormControl>
                    {linkedLpo && (
                      <FieldHint>
                        Locked to the linked LPO&apos;s supplier.
                      </FieldHint>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receivedBy"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Received by</FieldLabel>
                    <FormControl>
                      <StaffSelectorWidget
                        label="Received by"
                        placeholder="Select staff"
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
                name="receivedDate"
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value) : undefined;
                  const today = startOfToday();
                  return (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Received date</FieldLabel>
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-[7px]">
                  <FieldLabel>Notes</FieldLabel>
                  <FormControl>
                    <ControlTextarea
                      placeholder="Optional context — reference numbers, shipment condition…"
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
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>
                Delivery person
                <span className={styles.optionalTag}>OPTIONAL</span>
              </h3>
              <p className={styles.formCardHeadDesc}>
                Useful for contact-tracing short deliveries or returns.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>STEP 02</span>
            </div>
          </header>
          <div className={styles.formBody}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="deliveryPersonName"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel>Name</FieldLabel>
                    <FormControl>
                      <ControlInput
                        placeholder="Driver or courier name"
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
                name="deliveryPersonPhone"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel>Phone</FieldLabel>
                    <FormControl>
                      <ControlInput
                        placeholder="e.g. +255 712 345 678"
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
                name="deliveryPersonEmail"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel>Email</FieldLabel>
                    <FormControl>
                      <ControlInput
                        type="email"
                        placeholder="driver@example.com"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                One row per variant. Serial-tracked items require serials
                matching the received quantity.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>STEP 03</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ stockVariantId: "", receivedQuantity: 0, unitCost: 0 })
                }
                disabled={isPending}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add item
              </Button>
            </div>
          </header>
          <div className={styles.formBody}>

            {fields.map((field, index) => {
              const meta = itemMeta[field.id];
              const variantId = watchedItems[index]?.stockVariantId;
              const rowSerialTracked = meta?.serialTracked ?? false;
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
                              onChange={(v) => handleVariantChange(field.id, index, v)}
                              onVariantMeta={(m) => handleVariantMeta(field.id, m)}
                              onLoadingChange={(loading) =>
                                handleItemLoadingChange(field.id, loading)
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
                      name={`items.${index}.receivedQuantity`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[2] min-w-0 space-y-[7px]">
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
                                decimalScale={rowSerialTracked ? 0 : 6}
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
                              ({locationCurrency})
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
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.purchaseUnitId`}
                    render={({ field: f }) => {
                      const anchor = meta?.unitId;
                      const isSerial = !!meta?.serialTracked;
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
                                ? "Quantity & unit cost above are interpreted in this pack — converted to stock units on receive."
                                : "Leave blank to enter qty & cost directly in the variant's tracking unit."}
                          </FieldHint>
                        </FormItem>
                      );
                    }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.batchNumber`}
                      render={({ field: f }) => (
                        <FormItem className="space-y-[7px]">
                          <FieldLabel>Batch number</FieldLabel>
                          <FormControl>
                            <ControlInput
                              placeholder="Auto-generated if blank"
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
                      name={`items.${index}.supplierBatchReference`}
                      render={({ field: f }) => (
                        <FormItem className="space-y-[7px]">
                          <FieldLabel>Supplier ref</FieldLabel>
                          <FormControl>
                            <ControlInput
                              placeholder="Supplier batch reference"
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
                            <FieldLabel>Expiry date</FieldLabel>
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
                                  onSelect={(d) => f.onChange(d ? d.toISOString().split("T")[0] : "")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  {rowSerialTracked && variantId && (
                    <Controller
                      control={form.control}
                      name={`items.${index}.serialNumbers`}
                      render={({ field: f, fieldState }) => {
                        const raw = (f.value ?? []).join("\n");
                        const qty = Number(watchedItems[index]?.receivedQuantity || 0);
                        const count = f.value?.length ?? 0;
                        const mismatch =
                          qty > 0 && count > 0 && count !== Math.trunc(qty);
                        return (
                          <FormItem className="space-y-[7px]">
                            <FieldLabel>
                              Serial numbers <span className="text-primary">*</span>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {count} / {Math.trunc(qty) || 0}
                              </Badge>
                            </FieldLabel>
                            <FormControl>
                              <ControlTextarea
                                placeholder="One serial per line — must match received quantity exactly"
                                rows={Math.min(6, Math.max(3, Math.trunc(qty)))}
                                value={raw}
                                onChange={(e) => {
                                  const lines = e.target.value
                                    .split(/\r?\n/)
                                    .map((s) => s.trim())
                                    .filter((s) => s.length > 0);
                                  f.onChange(lines);
                                }}
                                disabled={isPending}
                              />
                            </FormControl>
                            {mismatch && (
                              <p className="text-[11px] text-red-600">
                                Count doesn&apos;t match quantity — add or remove serials.
                              </p>
                            )}
                            {fieldState.error && (
                              <FormMessage>{fieldState.error.message}</FormMessage>
                            )}
                          </FormItem>
                        );
                      }}
                    />
                  )}
                </div>
              );
            })}
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
                disabled={isPending || itemsLoading}
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
                <AlertDialogTitle>Discard this GRN?</AlertDialogTitle>
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
          <Button type="submit" disabled={isPending || itemsLoading}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {itemsLoading ? "Loading items…" : "Create GRN"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
