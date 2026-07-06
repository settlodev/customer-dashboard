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
  ClipboardEdit,
  Boxes,
  AlertTriangle,
  Building2,
  UserCircle2,
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
import { NumericFormat } from "react-number-format";
import {
  ControlBox,
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
import { createStockUsage } from "@/lib/actions/stock-usage-actions";
import { getCurrentLocationBalance } from "@/lib/actions/inventory-balance-actions";
import { StockUsageSchema } from "@/types/stock-usage/schema";
import { USAGE_CATEGORY_OPTIONS } from "@/types/stock-usage/type";
import type { Department } from "@/types/department/type";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import type { VariantMeta } from "@/components/widgets/stock-variant-selector";
import StaffSelectorWidget from "@/components/widgets/staff_selector_widget";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { useLocationConfig } from "@/hooks/use-location-config";
import { useInventoryEventRefresh } from "@/hooks/use-inventory-event-refresh";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof StockUsageSchema>;

interface BalanceSnapshot {
  loading: boolean;
  variantName?: string;
  serialTracked: boolean;
  quantityOnHand: number;
  averageCost: number | null;
}

interface Props {
  /** Departments visible to the current location. Empty when the plan
   *  has no DEPARTMENTS_MODULE — the form lets the user save without one. */
  departments: Department[];
  /** Pre-selected department: the location's default, or the only one. */
  defaultDepartmentId?: string;
  /** True when the current plan unlocks multiple departments. */
  canPickDepartment: boolean;
}

export default function StockUsageForm({
  departments,
  defaultDepartmentId,
  canPickDepartment,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  const [balances, setBalances] = useState<Record<string, BalanceSnapshot>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(StockUsageSchema),
    defaultValues: {
      category: "STAFF_CONSUMPTION",
      purpose: "",
      recipientId: "",
      departmentId: defaultDepartmentId ?? undefined,
      notes: "",
      usageDate: new Date().toISOString(),
      items: [{ stockVariantId: "", quantity: 0 }],
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
    async (
      fieldId: string,
      variantId: string,
      fallbackName?: string,
      fallbackSerial?: boolean,
    ) => {
      setBalances((prev) => ({
        ...prev,
        [fieldId]: {
          loading: true,
          variantName: fallbackName ?? prev[fieldId]?.variantName,
          serialTracked: fallbackSerial ?? prev[fieldId]?.serialTracked ?? false,
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
            serialTracked:
              fallbackSerial ?? prev[fieldId]?.serialTracked ?? false,
            quantityOnHand: balance ? Number(balance.quantityOnHand) : 0,
            averageCost:
              balance?.averageCost != null ? Number(balance.averageCost) : null,
          },
        }));
      } catch {
        setBalances((prev) => ({
          ...prev,
          [fieldId]: {
            loading: false,
            variantName: fallbackName,
            serialTracked:
              fallbackSerial ?? prev[fieldId]?.serialTracked ?? false,
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
      form.setValue(`items.${index}.serialNumbers`, undefined, {
        shouldDirty: true,
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
          serialTracked: meta.serialTracked ?? false,
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

    // Validate serial counts client-side so users see the issue before the
    // round-trip; the backend re-enforces.
    for (let i = 0; i < values.items.length; i++) {
      const item = values.items[i];
      const fieldId = fields[i]?.id;
      const meta = fieldId ? balances[fieldId] : null;
      if (meta?.serialTracked) {
        const serials = item.serialNumbers ?? [];
        if (!Number.isInteger(item.quantity)) {
          toast({
            variant: "destructive",
            title: "Serial-tracked items need whole quantities",
            description: `Item ${i + 1}: quantity must be a whole number.`,
          });
          return;
        }
        if (serials.length !== item.quantity) {
          toast({
            variant: "destructive",
            title: "Serial count mismatch",
            description: `Item ${i + 1}: provide ${item.quantity} serial number(s).`,
          });
          return;
        }
      }
    }

    const payload: FormValues = {
      ...values,
      usageDate: values.usageDate
        ? new Date(values.usageDate).toISOString()
        : new Date().toISOString(),
      items: values.items.map((item) => ({
        ...item,
        unitCost:
          typeof item.unitCost === "number" && !Number.isNaN(item.unitCost)
            ? item.unitCost
            : undefined,
      })),
    };

    startTransition(() => {
      createStockUsage(payload).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't record usage",
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
            <AlertTitle>We couldn&apos;t save this stock usage</AlertTitle>
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
                <ClipboardEdit className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Usage details</h3>
                <p className={styles.formCardHeadDesc}>
                  What was used, why, when, and who consumed it.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Category</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className={controlSelectTriggerClass}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {USAGE_CATEGORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usageDate"
                  render={({ field }) => {
                    const selected = field.value
                      ? new Date(field.value)
                      : undefined;
                    return (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel required>Usage date</FieldLabel>
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
                          <PopoverContent
                            className="w-[300px] p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(d) =>
                                field.onChange(d ? d.toISOString() : "")
                              }
                              disabled={(date) => date > today}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FieldHint>Defaults to today; back-date for late entry.</FieldHint>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="mt-[15px] grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="recipientId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Recipient</FieldLabel>
                      <FormControl>
                        <StaffSelectorWidget
                          label="Recipient"
                          placeholder="Select staff member"
                          value={field.value}
                          isDisabled={isPending}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isRequired
                        />
                      </FormControl>
                      <FieldHint>Staff member who used or received the stock.</FieldHint>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional={!canPickDepartment}>Department</FieldLabel>
                      {canPickDepartment && departments.length > 1 ? (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(v) =>
                            field.onChange(v === "__none__" ? undefined : v)
                          }
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className={controlSelectTriggerClass}>
                              <SelectValue placeholder="No department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">
                              No department
                            </SelectItem>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                                {d.isDefault ? " (Default)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-gray-800">
                            {departments.find((d) => d.id === field.value)?.name ??
                              "No department"}
                          </span>
                          <span className="ml-auto text-[11px] text-muted-foreground">
                            {canPickDepartment
                              ? "Only one department available"
                              : "Upgrade your plan to track usage by department"}
                          </span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem className="mt-[15px] space-y-[7px]">
                    <FieldLabel required>Purpose</FieldLabel>
                    <FormControl>
                      <ControlTextarea
                        placeholder="Describe why this stock was used — e.g. staff lunch for kitchen shift, demo unit for trade show, calibration of espresso machine."
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
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
                        placeholder="Witnesses, event references, training session id, etc."
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
                <Boxes className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Items consumed</h3>
                <p className={styles.formCardHeadDesc}>
                  Quantities are deducted from the live on-hand balance.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ stockVariantId: "", quantity: 0 })
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
                  const balance = balances[field.id];
                  const quantity =
                    Number(watchedItems[index]?.quantity) || 0;
                  const projected = (balance?.quantityOnHand ?? 0) - quantity;
                  const projectedNegative = projected < 0;
                  const showPreview =
                    !!watchedItems[index]?.stockVariantId && quantity > 0;
                  const isSerial = balance?.serialTracked === true;
                  const serialNumbers =
                    watchedItems[index]?.serialNumbers ?? [];

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
                            <FormItem className="w-full md:flex-[5] min-w-0 space-y-[7px]">
                              <FieldLabel required>Stock item</FieldLabel>
                              <FormControl>
                                <StockVariantSelector
                                  value={f.value}
                                  onChange={(v) =>
                                    handleVariantChange(field.id, index, v)
                                  }
                                  onVariantMeta={(meta) =>
                                    handleVariantMeta(field.id, meta)
                                  }
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
                            <FormItem className="w-full md:flex-[3] min-w-0 space-y-[7px]">
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
                                    allowNegative={false}
                                    decimalScale={isSerial ? 0 : undefined}
                                    placeholder="0"
                                    disabled={isPending}
                                  />
                                </ControlBox>
                              </FormControl>
                              <FieldHint>
                                {isSerial
                                  ? "Whole units only — list the serials below."
                                  : "Amount removed from stock."}
                              </FieldHint>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitCost`}
                          render={({ field: f }) => (
                            <FormItem className="w-full md:flex-[4] min-w-0 space-y-[7px]">
                              <FieldLabel>
                                Unit cost
                                <span className="text-muted-foreground ml-1 font-normal">
                                  ({locationCurrency}, optional)
                                </span>
                              </FieldLabel>
                              <FormControl>
                                <ControlBox>
                                  <NumericFormat
                                    className={cn(controlInputClass, "tabular-nums")}
                                    value={f.value ?? ""}
                                    onValueChange={(v) =>
                                      f.onChange(
                                        v.value === "" ? undefined : Number(v.value),
                                      )
                                    }
                                    thousandSeparator
                                    placeholder="Defaults to average cost"
                                    disabled={isPending}
                                  />
                                </ControlBox>
                              </FormControl>
                              <FieldHint>
                                Leave blank to use the variant&apos;s average cost.
                              </FieldHint>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {isSerial && (
                        <FormField
                          control={form.control}
                          name={`items.${index}.serialNumbers`}
                          render={({ field: f }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel required>Serial numbers</FieldLabel>
                              <FormControl>
                                <ControlTextarea
                                  placeholder="One serial per line"
                                  rows={Math.max(2, Math.min(quantity || 2, 6))}
                                  value={(f.value ?? []).join("\n")}
                                  onChange={(e) =>
                                    f.onChange(
                                      e.target.value
                                        .split(/\r?\n/)
                                        .map((s) => s.trim())
                                        .filter((s) => s.length > 0),
                                    )
                                  }
                                  disabled={isPending}
                                />
                              </FormControl>
                              <FieldHint>
                                Provide exactly {quantity || 0} serial number(s); they must
                                be AVAILABLE at this location.
                                {serialNumbers.length > 0 && (
                                  <span className="ml-2">
                                    Entered: {serialNumbers.length}
                                  </span>
                                )}
                              </FieldHint>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {showPreview &&
                        (balance?.loading ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-md bg-white border px-3 py-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Reading
                            current balance…
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="rounded-md bg-white border px-3 py-2 flex flex-col">
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Before
                                </span>
                                <span className="font-mono text-lg font-semibold text-gray-700">
                                  {(
                                    balance?.quantityOnHand ?? 0
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="rounded-md border px-3 py-2 flex flex-col bg-amber-50 border-amber-200">
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Used
                                </span>
                                <span className="font-mono text-lg font-semibold text-amber-700">
                                  −{quantity.toLocaleString()}
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
                          <FormItem className="space-y-[7px]">
                            <FieldLabel>Item notes</FieldLabel>
                            <FormControl>
                              <ControlTextarea
                                placeholder="Optional — applies to this line only"
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
                <AlertDialogTitle>Discard this usage record?</AlertDialogTitle>
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
            Record usage
          </Button>
        </div>
      </form>
    </Form>
  );
}
