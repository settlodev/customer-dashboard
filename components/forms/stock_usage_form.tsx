"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  Trash2,
  ClipboardEdit,
  Boxes,
  AlertTriangle,
  Building2,
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
import { createStockUsage } from "@/lib/actions/stock-usage-actions";
import { getCurrentLocationBalance } from "@/lib/actions/inventory-balance-actions";
import { StockUsageSchema } from "@/types/stock-usage/schema";
import { STOCK_USAGE_TYPE_OPTIONS } from "@/types/stock-usage/type";
import type { Department } from "@/types/department/type";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { useLocationConfig } from "@/hooks/use-location-config";
import { useInventoryEventRefresh } from "@/hooks/use-inventory-event-refresh";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof StockUsageSchema>;

interface BalanceSnapshot {
  loading: boolean;
  variantName?: string;
  quantityOnHand: number;
  averageCost: number | null;
}

interface Props {
  /** Departments visible to the current location. Empty when the plan
   *  has no DEPARTMENTS_MODULE — the form falls back to the auto-created
   *  Default department in that case. */
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
  const [balance, setBalance] = useState<BalanceSnapshot | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(StockUsageSchema),
    defaultValues: {
      stockVariantId: "",
      quantity: 0,
      usageType: "INTERNAL_USE",
      departmentId: defaultDepartmentId ?? "",
      notes: "",
      usageDate: new Date().toISOString(),
    },
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const watchedVariantId = form.watch("stockVariantId");
  const watchedQty = Number(form.watch("quantity")) || 0;
  const { config: locationConfig } = useLocationConfig();

  const loadBalance = useCallback(async (variantId: string) => {
    setBalance({ loading: true, quantityOnHand: 0, averageCost: null });
    try {
      const data = await getCurrentLocationBalance(variantId);
      setBalance({
        loading: false,
        variantName: data?.variantName,
        quantityOnHand: data ? Number(data.quantityOnHand) : 0,
        averageCost: data?.averageCost != null ? Number(data.averageCost) : null,
      });
    } catch {
      setBalance({ loading: false, quantityOnHand: 0, averageCost: null });
    }
  }, []);

  // If an intake / sale / adjustment lands elsewhere while the form is
  // open, refresh the displayed balance so the merchant doesn't operate on
  // a stale "on hand" figure. The hook applies a 10s cooldown so a POS
  // burst doesn't refetch on every sale.
  useInventoryEventRefresh(locationConfig?.locationId, () => {
    if (watchedVariantId) void loadBalance(watchedVariantId);
  });

  useEffect(() => {
    // Keep a default department selected even when the prop changes after mount
    // (e.g. departments arrive after the user has begun typing).
    if (!form.getValues("departmentId") && defaultDepartmentId) {
      form.setValue("departmentId", defaultDepartmentId, { shouldValidate: true });
    }
  }, [defaultDepartmentId, form]);

  const handleVariantChange = useCallback(
    (variantId: string) => {
      form.setValue("stockVariantId", variantId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (!variantId) {
        setBalance(null);
        return;
      }
      void loadBalance(variantId);
    },
    [form, loadBalance],
  );

  const projected = (balance?.quantityOnHand ?? 0) - watchedQty;
  const projectedNegative = projected < 0;
  const showPreview = !!watchedVariantId && watchedQty > 0;

  const submitData = (values: FormValues) => {
    setResponse(undefined);

    const payload: FormValues = {
      ...values,
      usageDate: values.usageDate
        ? new Date(values.usageDate).toISOString()
        : new Date().toISOString(),
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
                  What was used, why, and which department absorbs the cost.
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
                  name="usageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Usage type <span className="req">*</span>
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
                          {STOCK_USAGE_TYPE_OPTIONS.map((opt) => (
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
                  name="usageDate"
                  render={({ field }) => {
                    const selected = field.value ? new Date(field.value) : undefined;
                    return (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Usage date <span className="req">*</span>
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
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem className="col-span-2 min-w-0">
                      <FormLabel className={styles.fieldLabel}>
                        Department <span className="req">*</span>
                      </FormLabel>
                      {canPickDepartment && departments.length > 1 ? (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                              "Default department"}
                          </span>
                          <span className="ml-auto text-[11px] text-muted-foreground">
                            {canPickDepartment
                              ? "Only one department available"
                              : "Upgrade your plan to track usage by department"}
                          </span>
                        </div>
                      )}
                      <FormMessage className="text-xs" />
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
                <h3>Stock & quantity</h3>
                <p className={styles.formCardHeadDesc}>
                  Pick the variant being used and the amount consumed.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="space-y-3">
                <div className="border rounded-lg p-4 space-y-3 bg-muted/40">
                  <div className="flex flex-col md:flex-row gap-3 items-start">
                    <FormField
                      control={form.control}
                      name="stockVariantId"
                      render={({ field }) => (
                        <FormItem className="w-full md:flex-[5] min-w-0">
                          <FormLabel className="text-xs">
                            Stock variant <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <StockVariantSelector
                              value={field.value}
                              onChange={(v) => handleVariantChange(v)}
                              isDisabled={isPending}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="w-full md:flex-[3] min-w-0">
                          <FormLabel className="text-xs">
                            Quantity <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
                              value={field.value}
                              onValueChange={(v) =>
                                field.onChange(v.value ? Number(v.value) : 0)
                              }
                              thousandSeparator
                              allowNegative={false}
                              placeholder="0"
                              disabled={isPending}
                            />
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground">
                            Amount removed from stock.
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
                          <div className="rounded-md border px-3 py-2 flex flex-col bg-amber-50 border-amber-200">
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Used
                            </span>
                            <span className="font-mono text-lg font-semibold text-amber-700">
                              −{watchedQty.toLocaleString()}
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
                                projectedNegative ? "text-red-600" : "text-gray-700"
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
                                Avg cost {balance.averageCost.toLocaleString()} {locationCurrency}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
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
                          placeholder="Reason, witnesses, event reference, etc."
                          rows={3}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">
                        Add attachments (photos, signed forms) on the next screen after saving.
                      </p>
                    </FormItem>
                  )}
                />
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
