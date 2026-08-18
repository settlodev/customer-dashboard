"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  ControlInput,
  ControlTextarea,
  FieldLabel,
  controlComboboxTriggerClass,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { VendorSelector } from "@/components/widgets/vendor-selector";
import { ExpenseCategorySelector } from "@/components/widgets/expense-category-selector";
import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createExpense, updateExpense } from "@/lib/actions/expense-actions";
import { fetchExchangeRate } from "@/lib/actions/exchange-rate-actions";
import { ExpenseSchema } from "@/types/expense/schema";
import type { Expense } from "@/types/expense/type";

import styles from "./styles/form-shell.module.css";
import { NumericInput } from "@/components/ui/numeric-input";

interface Props {
  item: Expense | null;
  defaultCurrency: string;
  /**
   * Default offset (in days) for the expense due-date when creating a
   * new expense. Sourced from the location's invoicing settings via
   * the accounting service's location-settings cache. Null = leave
   * the due date blank.
   */
  defaultDueDays?: number | null;
}

type FormValues = z.infer<typeof ExpenseSchema>;

export default function ExpenseForm({
  item,
  defaultCurrency,
  defaultDueDays,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  // Resolve the location's base currency on the client so it stays in
  // sync if the merchant switches locations without a full reload.
  // Falls back to the SSR-provided default until the cache warms.
  const locationCurrency = useLocationCurrency() || defaultCurrency || "TZS";

  const isEdit = !!item;
  const today = format(new Date(), "yyyy-MM-dd");
  // Pre-fill due-date with merchant's configured invoice term when
  // present. Edit mode keeps whatever the expense has.
  const seedDueDate = (() => {
    if (item?.dueDate) return item.dueDate;
    if (item) return "";
    if (defaultDueDays && defaultDueDays > 0) {
      const d = new Date();
      d.setDate(d.getDate() + defaultDueDays);
      return format(d, "yyyy-MM-dd");
    }
    return "";
  })();

  // FX state — populated whenever the merchant picks a foreign
  // currency. Stored separately from the form value so we can show the
  // live "1 USD = 2,500 TZS" hint without polluting field state.
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxStale, setFxStale] = useState(false);
  // Track whether the operator has manually overridden the auto rate —
  // once they have, currency-change effects stop overwriting their
  // entry until they pick a new currency.
  const manualFxRef = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      vendorId: item?.vendorId ?? "",
      expenseCategoryId: item?.expenseCategoryId ?? "",
      chartOfAccountId: item?.chartOfAccountId ?? "",
      description: item?.description ?? "",
      reference: item?.reference ?? "",
      amount: item?.amount ?? undefined,
      taxAmount: item?.taxAmount ?? undefined,
      currencyCode: item?.currencyCode ?? defaultCurrency,
      exchangeRate: item?.exchangeRate ?? undefined,
      expenseDate: item?.expenseDate ?? today,
      dueDate: seedDueDate,
    },
  });

  // Auto-resolve FX whenever the picked currency changes. Same-
  // currency: lock at 1.0 and clear FX UI noise. Foreign currency:
  // fetch the system rate via the accounts service and pre-fill the
  // exchange-rate field. Operator can still override.
  const watchedCurrency = form.watch("currencyCode");
  useEffect(() => {
    const code = (watchedCurrency || "").toUpperCase();
    if (!code || !locationCurrency) return;

    if (code === locationCurrency.toUpperCase()) {
      manualFxRef.current = false;
      form.setValue("exchangeRate", 1, { shouldDirty: false });
      setFxError(null);
      setFxStale(false);
      setFxLoading(false);
      return;
    }

    if (manualFxRef.current) return;

    let cancelled = false;
    setFxLoading(true);
    setFxError(null);
    fetchExchangeRate(code, locationCurrency)
      .then((rate) => {
        if (cancelled) return;
        if (!rate) {
          setFxError(
            `No rate for ${code} → ${locationCurrency}. Enter the rate manually.`,
          );
          setFxStale(false);
          return;
        }
        form.setValue("exchangeRate", Number(rate.rate), {
          shouldDirty: false,
        });
        setFxStale(!!rate.stale);
      })
      .catch(() => {
        if (!cancelled) setFxError("Couldn't fetch rate. Enter manually.");
      })
      .finally(() => {
        if (!cancelled) setFxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [watchedCurrency, locationCurrency, form]);

  const watchedRate = form.watch("exchangeRate");
  const watchedAmount = form.watch("amount");
  const watchedTax = form.watch("taxAmount");
  const isForeignCurrency =
    !!watchedCurrency &&
    !!locationCurrency &&
    watchedCurrency.toUpperCase() !== locationCurrency.toUpperCase();
  const convertedTotal =
    watchedRate && (watchedAmount || watchedTax)
      ? (Number(watchedAmount || 0) + Number(watchedTax || 0)) *
        Number(watchedRate)
      : null;

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateExpense(item!.id, values)
        : await createExpense(values);
      if (result?.responseType === "success") {
        toast({
          variant: "success",
          title: "Success",
          description: result.message,
        });
        router.push(isEdit ? `/expenses/${item!.id}` : "/expenses");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result?.message ?? "Could not save expense",
        });
      }
    });
  };

  const isLocked =
    isEdit && item!.status !== "DRAFT" && item!.status !== "REJECTED";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className={styles.formRoot}>
        <div className={styles.formStack}>
          {/* ── 01. Vendor & Description ─────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Vendor &amp; description</h3>
                <p className={styles.formCardHeadDesc}>
                  What was bought, and who did the business pay (or owe)?
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Vendor</FieldLabel>
                      <FormControl>
                        <VendorSelector
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v)}
                          isDisabled={isPending || isLocked}
                          placeholder="Pick vendor"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expenseCategoryId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Category</FieldLabel>
                      <FormControl>
                        <ExpenseCategorySelector
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v)}
                          isDisabled={isPending || isLocked}
                          placeholder="Pick category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 mt-3.5">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Description</FieldLabel>
                      <FormControl>
                        <ControlTextarea
                          {...field}
                          disabled={isPending || isLocked}
                          placeholder="What is this expense for?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 mt-3.5">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Reference / Invoice #</FieldLabel>
                      <FormControl>
                        <ControlInput
                          {...field}
                          disabled={isPending || isLocked}
                          placeholder="INV-2026-0001"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chartOfAccountId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>
                        Expense account
                        <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                          OVERRIDE
                        </span>
                      </FieldLabel>
                      <FormControl>
                        <ChartOfAccountSelector
                          accountType="EXPENSE"
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v)}
                          isDisabled={isPending || isLocked}
                          placeholder="Default from category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          {/* ── 02. Amounts ─────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Amounts</h3>
                <p className={styles.formCardHeadDesc}>
                  Net amount + tax. Payments are recorded separately after
                  approval.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Net amount</FieldLabel>
                      <FormControl>
                        <NumericInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="0.00"
                          disabled={isPending || isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Tax amount</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="number"
                          step="0.0001"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending || isLocked}
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currencyCode"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Currency</FieldLabel>
                      <FormControl>
                        <CurrencySelector
                          value={field.value}
                          onChange={(code) => {
                            // Operator picked a different currency — clear
                            // any prior manual override so the auto-fetch
                            // effect can populate the new pair's rate.
                            manualFxRef.current = false;
                            field.onChange(code);
                          }}
                          isDisabled={isPending || isLocked}
                          placeholder={`Default ${locationCurrency}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {isForeignCurrency && (
                <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-3 mt-3.5">
                  <FormField
                    control={form.control}
                    name="exchangeRate"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-3 space-y-[7px]">
                        <FieldLabel>
                          Exchange rate to {locationCurrency}
                          {fxLoading ? (
                            <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              FETCHING…
                            </span>
                          ) : fxStale ? (
                            <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-amber-600">
                              STALE — VERIFY
                            </span>
                          ) : (
                            <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                              AUTO-FETCHED · OVERRIDE OK
                            </span>
                          )}
                        </FieldLabel>
                        <FormControl>
                          <ControlInput
                            type="number"
                            step="0.000001"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isPending || isLocked || fxLoading}
                            placeholder="0.000000"
                            onChange={(e) => {
                              manualFxRef.current = true;
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground tabular-nums">
                          {fxError ? (
                            <span className="text-red-600">{fxError}</span>
                          ) : watchedRate ? (
                            <>
                              1 {watchedCurrency?.toUpperCase()} ={" "}
                              {Number(watchedRate).toLocaleString(undefined, {
                                maximumFractionDigits: 6,
                              })}{" "}
                              {locationCurrency}
                              {convertedTotal ? (
                                <>
                                  {" · total "}
                                  <span className="font-medium">
                                    {convertedTotal.toLocaleString(undefined, {
                                      maximumFractionDigits: 0,
                                    })}{" "}
                                    {locationCurrency}
                                  </span>
                                </>
                              ) : null}
                            </>
                          ) : (
                            "Pick a non-base currency to fetch a rate."
                          )}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── 03. Dates ───────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Dates</h3>
                <p className={styles.formCardHeadDesc}>
                  When the expense was incurred, and when payment is due.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 03</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Expense date</FieldLabel>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isPending || isLocked}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>
                        Due date
                        <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                          DRIVES AP AGING
                        </span>
                      </FieldLabel>
                      <DatePicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isPending || isLocked}
                        clearable
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div className={styles.formFoot}>
          <span className={styles.formFootSaveState}>
            <CreditCard className="h-3 w-3" />
            {isEdit
              ? `Editing ${item!.expenseNumber}`
              : "Saved as DRAFT — submit for approval after creating"}
          </span>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anything you typed will be lost.
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
          <Button type="submit" disabled={isPending || isLocked}>
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isEdit ? "Save changes" : "Create expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Inline date picker — wraps shadcn Calendar in a Popover and emits
// the canonical YYYY-MM-DD string the schema expects.
// ─────────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  clearable?: boolean;
}

function DatePicker({ value, onChange, disabled, clearable }: DatePickerProps) {
  const date = value ? new Date(value) : undefined;
  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              controlComboboxTriggerClass,
              "justify-start",
              !date && "text-muted-2",
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4 text-muted-2" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) onChange(format(d, "yyyy-MM-dd"));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {clearable && value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => onChange("")}
          className="h-10 w-10 flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
