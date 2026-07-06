"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  ListPlus,
  Loader2,
  Plus,
  Receipt,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ControlInput,
  ControlTextarea,
  FieldLabel,
  controlComboboxTriggerClass,
  controlSelectTriggerClass,
} from "@/components/ui/field";
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

import CustomerSelector from "@/components/widgets/customer-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import { NumericInput } from "@/components/ui/numeric-input";
import { PhoneInput } from "@/components/ui/phone-input";
import QuickCustomerDialog from "@/components/widgets/quick-customer-dialog";
import type { Customer } from "@/types/customer/type";
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
import { ProformaTotalsRows } from "@/components/invoicing/totals-rows";

import styles from "./styles/form-shell.module.css";

interface Props {
  item: Proforma | null;
  defaultCurrency: string;
  /** Cards injected below the live "Total due" card in the right rail. */
  railExtra?: ReactNode;
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

export default function ProformaForm({ item, defaultCurrency, railExtra }: Props) {
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
  // a line is added and is idempotent (only fills nulls).
  // Derived from the stable `item` prop (not a ref) so it can't go stale across
  // Fast Refresh or a reused form instance — a stale value here would make the
  // effect skip newly-added edit-mode lines and leave their tax blank.
  const originalLineCount = item?.lines?.length ?? 0;
  useEffect(() => {
    if (defaultTaxRate == null) return;
    const startIdx = isEdit ? originalLineCount : 0;
    (form.getValues("lines") ?? []).forEach((l, i) => {
      if (i >= startIdx && l?.taxRate == null) {
        form.setValue(`lines.${i}.taxRate`, defaultTaxRate, {
          shouldDirty: false,
        });
      }
    });
  }, [defaultTaxRate, isEdit, originalLineCount, form, fields.length]);

  // Quick-create customer — bumping `customerListKey` after a create remounts
  // the CustomerSelector so the new customer shows in its list.
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [customerListKey, setCustomerListKey] = useState(0);
  const populateCustomer = (c: Customer) => {
    form.setValue("customerId", c.id, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue(
      "customerName",
      c.fullName || [c.firstName, c.lastName].filter(Boolean).join(" "),
      { shouldValidate: true },
    );
    form.setValue("customerPhone", c.phoneNumber ?? "");
    form.setValue("customerEmail", c.email ?? "");
    form.setValue("customerTin", c.tinNumber ?? "");
  };

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
        <div className={styles.formGrid}>
          <div className={styles.formStack}>
            {/* Customer */}
            <SectionCard
              icon={<User className="h-4 w-4" />}
              title="Customer"
              subtitle="Who is this proforma for?"
            >
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="mb-4 space-y-[7px]">
                    <FieldLabel required>Customer</FieldLabel>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <CustomerSelector
                          key={customerListKey}
                          placeholder="Search customers…"
                          value={field.value}
                          isDisabled={isPending || isLocked}
                          showOnOpen
                          onChange={(v) => field.onChange(v)}
                          onSelectCustomer={populateCustomer}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => setQuickCustomerOpen(true)}
                        disabled={isPending || isLocked}
                        title="Create a new customer"
                        aria-label="Create a new customer"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Name on document</FieldLabel>
                      <FormControl>
                        <ControlInput
                          {...field}
                          disabled={isPending || isLocked}
                          placeholder="Customer name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Phone</FieldLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Enter phone number"
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v ?? "")}
                          disabled={isPending || isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Email</FieldLabel>
                      <FormControl>
                        <ControlInput
                          {...field}
                          value={field.value ?? ""}
                          type="email"
                          disabled={isPending || isLocked}
                          placeholder="name@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerTin"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>TIN</FieldLabel>
                      <FormControl>
                        <ControlInput
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending || isLocked}
                          placeholder="Tax identification no."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            {/* Line items */}
            <SectionCard
              icon={<Receipt className="h-4 w-4" />}
              title="Line items"
              subtitle="Add what you're quoting. Link a stock item to reserve inventory."
            >
              <div className="space-y-3">
                {fields.map((fieldRow, index) => {
                  const line = watchedLines?.[index];
                  const lineTotal = computeLineTotals({
                    quantity: line?.quantity,
                    unitPrice: line?.unitPrice,
                    lineDiscountAmount: line?.lineDiscountAmount,
                    taxRate:
                      line?.taxRate != null ? Number(line.taxRate) / 100 : 0,
                    taxInclusive: line?.taxInclusive,
                  }).lineTotal;

                  return (
                    <div
                      key={fieldRow.id}
                      className="rounded-xl border border-line bg-surface/50 p-4 sm:p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3 border-b border-dashed border-line-2 pb-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                          Line {index + 1}
                        </span>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 px-2 text-xs font-medium text-neg hover:bg-neg/10 hover:text-neg"
                            disabled={isPending || isLocked}
                            onClick={() => remove(index)}
                            aria-label="Remove line"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.stockVariantId`}
                          render={({ field }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel optional>Stock item</FieldLabel>
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
                        <FormField
                          control={form.control}
                          name={`lines.${index}.description`}
                          render={({ field }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel required>Description</FieldLabel>
                              <FormControl>
                                <ControlInput
                                  {...field}
                                  disabled={isPending || isLocked}
                                  placeholder="What is being quoted?"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel required>Qty</FieldLabel>
                              <FormControl>
                                <NumericInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  disabled={isPending || isLocked}
                                  placeholder="1"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`lines.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel required>Unit price</FieldLabel>
                              <FormControl>
                                <NumericInput
                                  value={field.value}
                                  onChange={field.onChange}
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
                          name={`lines.${index}.lineDiscountAmount`}
                          render={({ field }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel>Discount</FieldLabel>
                              <FormControl>
                                <NumericInput
                                  value={field.value}
                                  onChange={field.onChange}
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
                          name={`lines.${index}.taxRate`}
                          render={({ field }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel>Tax</FieldLabel>
                              <FormControl>
                                <TaxTypeSelect
                                  taxTypes={taxTypes}
                                  value={field.value}
                                  onChange={field.onChange}
                                  disabled={isPending || isLocked}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-line-2 pt-3">
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
                        <span className="text-[13px] text-muted-foreground">
                          Line total{" "}
                          <b className="ml-1.5 font-mono text-sm font-semibold tabular-nums text-ink">
                            {fmtMoney(lineTotal, currency)}
                          </b>
                        </span>
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
            </SectionCard>

            {/* Details */}
            <SectionCard
              icon={<FileText className="h-4 w-4" />}
              title="Details"
              subtitle="Currency, validity, and any notes for the customer."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currencyCode"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Currency</FieldLabel>
                      <FormControl>
                        <CurrencySelector
                          value={field.value}
                          onChange={(code) => field.onChange(code)}
                          isDisabled={isPending || isLocked}
                          placeholder={`Default ${defaultCurrency}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Valid until</FieldLabel>
                      <DatePicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isPending || isLocked}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-3.5">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Notes</FieldLabel>
                      <FormControl>
                        <ControlTextarea
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending || isLocked}
                          placeholder="Terms, delivery notes, anything the customer should see."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>
          </div>
          <aside
            className={cn(
              styles.formStack,
              "lg:sticky lg:top-4 lg:self-start",
            )}
          >
            <div className="rounded-xl border border-ink bg-ink p-4 text-white">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-white/55">
                {isEdit ? "Total due" : "Total"}
              </div>
              <ProformaTotalsRows totals={totals} currency={currency} accent />
            </div>
            {railExtra}
          </aside>
        </div>

        {/* Sticky save bar */}
        <div className={styles.formFoot}>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Total
            </span>
            <span className="text-[22px] font-semibold leading-none tracking-tight text-ink">
              {totals.totalAmount.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {currency}
            </span>
          </div>
          <div className={styles.formFootSpacer} />
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
            {isEdit ? `Editing ${item!.proformaNumber}` : "New proforma"}
          </span>
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

      <QuickCustomerDialog
        open={quickCustomerOpen}
        onOpenChange={setQuickCustomerOpen}
        onCreated={(c) => {
          populateCustomer(c);
          setCustomerListKey((k) => k + 1);
        }}
      />
    </Form>
  );
}

// Local money formatter (kept light to avoid a server-action import here).
function fmtMoney(amount: number, currency: string): string {
  return `${(amount ?? 0).toLocaleString()} ${currency}`;
}

// ─────────────────────────────────────────────────────────────────────
// Titled section card — the clean dashboard card (icon + title + subtitle),
// replacing the dated STEP 01/02/03 chrome.
// ─────────────────────────────────────────────────────────────────────
function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-card">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-line bg-canvas text-ink-2">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-ink">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
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

// ─────────────────────────────────────────────────────────────────────
// Tax-type picker for a line — a dropdown of the business's configured tax
// types (Accounting service). The proforma line stores only the rate, so the
// selection maps to/from the line's `taxRate` percentage by matching on the
// type's `ratePercent`. A rate that no longer maps to an active type still
// shows as a disabled "custom" row so it's visible.
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
      <SelectTrigger className={cn(controlSelectTriggerClass, "w-full")}>
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
