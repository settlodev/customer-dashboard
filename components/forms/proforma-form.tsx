"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  ListPlus,
  Loader2,
  Receipt,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { formatMoney } from "@/lib/helpers";

import CustomerSelector from "@/components/widgets/customer-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCachedTaxTypes } from "@/lib/cache/reference-data";
import type { TaxType } from "@/types/tax-type/type";

import {
  createProforma,
  updateProforma,
} from "@/lib/actions/invoicing-proforma-actions";
import { ProformaSchema, type ProformaFormValues } from "@/types/invoicing/schema";
import {
  computeDocTotals,
  computeLineTotals,
  isProformaEditable,
  type Proforma,
} from "@/types/invoicing/type";

import styles from "./styles/form-shell.module.css";

interface Props {
  item: Proforma | null;
  defaultCurrency: string;
}

const blankLine = {
  productId: "",
  stockVariantId: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
  lineDiscountAmount: 0,
  taxRate: undefined as number | undefined,
  taxInclusive: false,
};

export default function ProformaForm({ item, defaultCurrency }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isEdit = !!item;
  const isLocked = isEdit && !isProformaEditable(item!.status);

  // Proformas must carry an expiry — default a new one to 30 days out. The
  // backend marks any SENT proforma EXPIRED once this date passes unaccepted.
  const defaultValidUntil = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return format(d, "yyyy-MM-dd");
  })();

  const form = useForm<ProformaFormValues>({
    resolver: zodResolver(ProformaSchema),
    defaultValues: {
      customerId: item?.customerId ?? "",
      customerName: item?.customerName ?? "",
      customerPhone: item?.customerPhone ?? "",
      customerEmail: item?.customerEmail ?? "",
      customerTin: item?.customerTin ?? "",
      currencyCode: item?.currencyCode ?? defaultCurrency,
      validUntil: item?.validUntil ?? defaultValidUntil,
      notes: item?.notes ?? "",
      lines:
        item?.lines && item.lines.length > 0
          ? item.lines.map((l) => ({
              productId: l.productId ?? "",
              stockVariantId: l.stockVariantId ?? "",
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineDiscountAmount: l.lineDiscountAmount ?? undefined,
              // Stored as a fraction on the wire; edited as a percentage here.
              taxRate: l.taxRate != null ? Number(l.taxRate) * 100 : undefined,
              taxInclusive: !!l.taxInclusive,
            }))
          : [blankLine],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  // Tax types are configured per-business in the Accounting service (Settings →
  // Tax types). Line tax is picked from these rather than typed free-hand; the
  // chosen type's percentage drives the line's `taxRate`.
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  useEffect(() => {
    let cancelled = false;
    getCachedTaxTypes()
      .then((tx) => {
        if (cancelled) return;
        setTaxTypes(
          (tx ?? [])
            .filter((t) => t.active)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // The "standard" tax type (TRA code "A"), falling back to the business
  // default, then the first active type. New lines default to its rate.
  const defaultTaxRate = useMemo(() => {
    if (!taxTypes.length) return undefined;
    const standard =
      taxTypes.find((t) => t.code === "A") ??
      taxTypes.find((t) => t.isDefault) ??
      taxTypes[0];
    return standard ? Number(standard.ratePercent) : undefined;
  }, [taxTypes]);

  // Default any line that has no tax to the standard rate once the types load.
  // New proformas: every line. Edits: only lines appended after mount (index >=
  // the count we loaded) — existing lines keep their stored rates. Re-runs when
  // a line is added and is idempotent (only fills nulls), so a freshly-appended
  // line still gets the default even if the tax types hadn't loaded yet at the
  // moment it was added.
  const originalLineCount = useRef(item?.lines?.length ?? 0);
  useEffect(() => {
    if (defaultTaxRate == null) return;
    const startIdx = isEdit ? originalLineCount.current : 0;
    (form.getValues("lines") ?? []).forEach((l, i) => {
      if (i >= startIdx && l?.taxRate == null) {
        form.setValue(`lines.${i}.taxRate`, defaultTaxRate, {
          shouldDirty: false,
        });
      }
    });
  }, [defaultTaxRate, isEdit, form, fields.length]);

  const currency = form.watch("currencyCode") || defaultCurrency;
  const watchedLines = form.watch("lines");
  const totals = computeDocTotals(
    (watchedLines ?? []).map((l) => ({
      quantity: l?.quantity,
      unitPrice: l?.unitPrice,
      lineDiscountAmount: l?.lineDiscountAmount,
      taxRate: l?.taxRate != null ? Number(l.taxRate) / 100 : 0,
      taxInclusive: l?.taxInclusive,
    })),
  );

  const submit = (values: ProformaFormValues) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateProforma(item!.id, values)
        : await createProforma(values);
      if (result?.responseType === "success") {
        toast({
          variant: "success",
          title: "Success",
          description: result.message,
        });
        const targetId = result.data?.id ?? item?.id;
        router.push(
          targetId ? `/proforma-invoices/${targetId}` : "/proforma-invoices",
        );
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result?.message ?? "Could not save proforma",
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className={styles.formRoot}>
        <div className={styles.formStack}>
          {/* ── 01. Customer ─────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3>Customer</h3>
                <p className={styles.formCardHeadDesc}>
                  Who is this proforma for? Pick a customer to prefill their
                  details.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={styles.fieldLabel}>
                      Customer <span className="req">*</span>
                    </FormLabel>
                    <FormControl>
                      <CustomerSelector
                        placeholder="Search customers…"
                        value={field.value}
                        isDisabled={isPending || isLocked}
                        onChange={(v) => field.onChange(v)}
                        onSelectCustomer={(c) => {
                          form.setValue(
                            "customerName",
                            c.fullName ||
                              [c.firstName, c.lastName]
                                .filter(Boolean)
                                .join(" "),
                            { shouldValidate: true },
                          );
                          form.setValue("customerPhone", c.phoneNumber ?? "");
                          form.setValue("customerEmail", c.email ?? "");
                          form.setValue("customerTin", c.tinNumber ?? "");
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="mt-3.5 grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Name on document <span className="req">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending || isLocked}
                          placeholder="Customer name"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Phone <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending || isLocked}
                          placeholder="07xx xxx xxx"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Email <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="email"
                          disabled={isPending || isLocked}
                          placeholder="name@example.com"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerTin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        TIN <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending || isLocked}
                          placeholder="Tax identification no."
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          {/* ── 02. Line items ───────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3>Line items</h3>
                <p className={styles.formCardHeadDesc}>
                  Add what you&apos;re quoting. Link a stock item to reserve
                  inventory, or just describe it.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="space-y-3">
                {fields.map((fieldRow, index) => {
                  const line = watchedLines?.[index];
                  const lineTotal = computeLineTotals({
                    quantity: line?.quantity,
                    unitPrice: line?.unitPrice,
                    lineDiscountAmount: line?.lineDiscountAmount,
                    taxRate: line?.taxRate != null ? Number(line.taxRate) / 100 : 0,
                    taxInclusive: line?.taxInclusive,
                  }).lineTotal;

                  return (
                    <div
                      key={fieldRow.id}
                      className="rounded-lg border border-line bg-surface/40 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="grid flex-1 grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-12">
                          {/* Stock link (optional) */}
                          <div className="sm:col-span-5">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.stockVariantId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={styles.fieldLabel}>
                                    Stock item{" "}
                                    <span className="opt">OPTIONAL</span>
                                  </FormLabel>
                                  <FormControl>
                                    <StockVariantSelector
                                      value={field.value || ""}
                                      isDisabled={isPending || isLocked}
                                      placeholder="Link to inventory…"
                                      onChange={(v) => field.onChange(v)}
                                      onVariantMeta={(meta) => {
                                        if (
                                          meta &&
                                          !form.getValues(
                                            `lines.${index}.description`,
                                          )
                                        ) {
                                          form.setValue(
                                            `lines.${index}.description`,
                                            meta.displayName,
                                            { shouldValidate: true },
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          {/* Description */}
                          <div className="sm:col-span-7">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={styles.fieldLabel}>
                                    Description <span className="req">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      disabled={isPending || isLocked}
                                      placeholder="What is being quoted?"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                          {/* Qty */}
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={styles.fieldLabel}>
                                    Qty <span className="req">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <NumericInput
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled={isPending || isLocked}
                                      placeholder="1"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                          {/* Unit price */}
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={styles.fieldLabel}>
                                    Unit price <span className="req">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <NumericInput
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled={isPending || isLocked}
                                      placeholder="0.00"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                          {/* Discount */}
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.lineDiscountAmount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={styles.fieldLabel}>
                                    Discount{" "}
                                    <span className="opt">AMOUNT</span>
                                  </FormLabel>
                                  <FormControl>
                                    <NumericInput
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled={isPending || isLocked}
                                      placeholder="0.00"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                          {/* Tax */}
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.taxRate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={styles.fieldLabel}>
                                    Tax
                                  </FormLabel>
                                  <FormControl>
                                    <TaxTypeSelect
                                      taxTypes={taxTypes}
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled={isPending || isLocked}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                          {/* Tax inclusive + line total */}
                          <div className="flex items-center justify-between gap-3 sm:col-span-12">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.taxInclusive`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={isPending || isLocked}
                                    />
                                  </FormControl>
                                  <FormLabel className="!mt-0 text-xs font-normal text-muted-foreground">
                                    Price includes tax
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                            <div className="font-mono text-xs tabular-nums text-muted-foreground">
                              Line total{" "}
                              <span className="font-semibold text-ink">
                                {formatMoney(lineTotal, currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-5 flex-shrink-0 text-red-500 hover:text-red-600"
                          disabled={isPending || isLocked || fields.length === 1}
                          onClick={() => remove(index)}
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {form.formState.errors.lines?.message && (
                <p className="mt-2 text-xs text-red-600">
                  {form.formState.errors.lines.message as string}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={isPending || isLocked}
                onClick={() => append({ ...blankLine, taxRate: defaultTaxRate })}
              >
                <ListPlus className="mr-1.5 h-3.5 w-3.5" />
                Add line
              </Button>

              {/* Totals preview */}
              <div className="mt-4 flex justify-end">
                <dl className="w-full max-w-xs space-y-1 font-mono text-sm tabular-nums">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Subtotal</dt>
                    <dd>{formatMoney(totals.subtotalAmount, currency)}</dd>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Discount</dt>
                      <dd>−{formatMoney(totals.discountAmount, currency)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Tax</dt>
                    <dd>{formatMoney(totals.taxAmount, currency)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1 text-base font-semibold text-ink">
                    <dt>Total</dt>
                    <dd>{formatMoney(totals.totalAmount, currency)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* ── 03. Details ──────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3>Details</h3>
                <p className={styles.formCardHeadDesc}>
                  Currency, validity, and any notes for the customer.
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
                  name="currencyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Currency <span className="req">*</span>
                      </FormLabel>
                      <FormControl>
                        <CurrencySelector
                          value={field.value}
                          onChange={(code) => field.onChange(code)}
                          isDisabled={isPending || isLocked}
                          placeholder={`Default ${defaultCurrency}`}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Valid until <span className="req">*</span>
                      </FormLabel>
                      <DatePicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isPending || isLocked}
                      />
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-3.5">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Notes <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          rows={3}
                          disabled={isPending || isLocked}
                          placeholder="Terms, delivery notes, anything the customer should see."
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
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
            <FileText className="h-3 w-3" />
            {isEdit
              ? `Editing ${item!.proformaNumber}`
              : "Saved as DRAFT — share it or convert to an invoice next"}
          </span>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Discard
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
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isEdit ? "Save changes" : "Create proforma"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Inline date picker — emits the canonical YYYY-MM-DD string.
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
              "h-10 w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4 opacity-50" />
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

// ─────────────────────────────────────────────────────────────────────
// Tax-type picker for a line — a dropdown of the business's configured tax
// types (Accounting service). The proforma line stores only the rate, so the
// selection maps to/from the line's `taxRate` percentage by matching on the
// type's `ratePercent`. A rate that no longer maps to an active type (e.g. the
// type was archived) still shows as a disabled "custom" row so it's visible.
// ─────────────────────────────────────────────────────────────────────

const CUSTOM_RATE = "__custom_rate__";

function TaxTypeSelect({
  taxTypes,
  value,
  onChange,
  disabled,
}: {
  taxTypes: TaxType[];
  value?: number;
  onChange: (ratePercent: number) => void;
  disabled?: boolean;
}) {
  const valueNum = value == null ? null : Number(value);
  const match =
    valueNum != null
      ? taxTypes.find((t) => Number(t.ratePercent) === valueNum)
      : undefined;
  const selectedId = match
    ? match.id
    : valueNum != null && valueNum > 0
      ? CUSTOM_RATE
      : "";

  return (
    <Select
      value={selectedId}
      disabled={disabled || taxTypes.length === 0}
      onValueChange={(id) => {
        if (id === CUSTOM_RATE) return;
        const t = taxTypes.find((x) => x.id === id);
        onChange(t ? Number(t.ratePercent) : 0);
      }}
    >
      <SelectTrigger className="h-10 w-full">
        <SelectValue
          placeholder={taxTypes.length ? "Select tax" : "No tax types"}
        />
      </SelectTrigger>
      <SelectContent>
        {selectedId === CUSTOM_RATE && (
          <SelectItem value={CUSTOM_RATE} disabled>
            {valueNum}% (custom)
          </SelectItem>
        )}
        {taxTypes.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name} ({Number(t.ratePercent)}%)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
