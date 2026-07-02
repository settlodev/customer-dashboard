"use client";

import React, { useState, useTransition } from "react";
import {
  useForm,
  useWatch,
  type Control,
  type FieldPath,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { NumericFormat } from "react-number-format";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Coins,
  FileText,
  Hash,
  Landmark,
  Loader2,
  Percent,
  Power,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { createLoanProduct, updateLoanProduct } from "@/lib/actions/admin/loans";
import type { FormResponse } from "@/types/types";
import {
  fmtAmount,
  INTEREST_METHOD_OPTIONS,
  LOAN_PRODUCT_TYPE_LABELS,
  LOAN_PRODUCT_TYPE_OPTIONS,
  LoanProductFormSchema,
  PAYEE_TYPE_OPTIONS,
  PRICING_TYPE_LABELS,
  PRICING_TYPE_OPTIONS,
  REPAYMENT_FREQUENCY_LABELS,
  REPAYMENT_FREQUENCY_OPTIONS,
  REPAYMENT_TYPE_LABELS,
  REPAYMENT_TYPE_OPTIONS,
  type LoanProductFormValues,
  type LoanProductResponse,
  type PricingType,
  type SelectOption,
} from "@/types/admin/loans";

import styles from "./styles/form-shell.module.css";

type FormType = UseFormReturn<LoanProductFormValues>;
type Name = FieldPath<LoanProductFormValues>;

// ── Layout helpers ────────────────────────────────────────────────────

function Section({
  icon,
  title,
  desc,
  step,
  optional,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  step?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`${styles.formCard}${optional ? ` ${styles.formCardOptional}` : ""}`}
    >
      <header className={styles.formCardHead}>
        <div className={styles.icoBox}>{icon}</div>
        <div className="min-w-0 flex-1">
          <h3>
            {title}
            {optional ? (
              <span className={styles.optionalTag}>OPTIONAL</span>
            ) : null}
          </h3>
          {desc ? <p className={styles.formCardHeadDesc}>{desc}</p> : null}
        </div>
        {step ? (
          <div className={styles.formCardActions}>
            <span className={styles.stepBadge}>{step}</span>
          </div>
        ) : null}
      </header>
      <div className={styles.formBody}>{children}</div>
    </section>
  );
}

function FieldRow({
  cols = 2,
  children,
}: {
  cols?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={styles.fieldRow}
      style={{ ["--cols" as never]: cols } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function ReqMark({ show }: { show?: boolean }) {
  return show ? <span className="text-primary"> *</span> : null;
}

// ── Field helpers ─────────────────────────────────────────────────────

function TextField({
  form,
  name,
  label,
  required,
  hint,
  placeholder,
  disabled,
  icon,
}: {
  form: FormType;
  name: Name;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="min-w-0">
          <FormLabel className={styles.fieldLabel}>
            {label}
            <ReqMark show={required} />
          </FormLabel>
          <FormControl>
            <div className={styles.inputWithPrefix}>
              {icon ? <span className={styles.inputPrefix}>{icon}</span> : null}
              <Input
                placeholder={placeholder}
                value={(field.value as string) ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                disabled={disabled}
              />
            </div>
          </FormControl>
          {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function NumberField({
  form,
  name,
  label,
  required,
  hint,
  prefix,
  placeholder,
  decimalScale,
  thousands,
  disabled,
}: {
  form: FormType;
  name: Name;
  label: string;
  required?: boolean;
  hint?: string;
  prefix?: string;
  placeholder?: string;
  decimalScale?: number;
  thousands?: boolean;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="min-w-0">
          <FormLabel className={styles.fieldLabel}>
            {label}
            <ReqMark show={required} />
          </FormLabel>
          <FormControl>
            <div className={styles.inputWithPrefix}>
              {prefix ? (
                <span className={styles.inputPrefix}>{prefix}</span>
              ) : null}
              <NumericFormat
                getInputRef={field.ref}
                customInput={Input}
                thousandSeparator={thousands ? "," : undefined}
                allowNegative={false}
                decimalScale={decimalScale}
                placeholder={placeholder}
                value={
                  field.value === "" || field.value == null
                    ? ""
                    : (field.value as number)
                }
                onValueChange={(vals) =>
                  field.onChange(vals.value === "" ? "" : (vals.floatValue ?? ""))
                }
                onBlur={field.onBlur}
                name={field.name}
                disabled={disabled}
              />
            </div>
          </FormControl>
          {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({
  form,
  name,
  label,
  required,
  hint,
  options,
  disabled,
  placeholder,
}: {
  form: FormType;
  name: Name;
  label: string;
  required?: boolean;
  hint?: string;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="min-w-0">
          <FormLabel className={styles.fieldLabel}>
            {label}
            <ReqMark show={required} />
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={(field.value as string) ?? ""}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder ?? "Select"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextareaField({
  form,
  name,
  label,
  hint,
  placeholder,
  rows,
  disabled,
}: {
  form: FormType;
  name: Name;
  label: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="min-w-0">
          <FormLabel className={styles.fieldLabel}>{label}</FormLabel>
          <FormControl>
            <Textarea
              rows={rows ?? 5}
              placeholder={placeholder}
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              disabled={disabled}
            />
          </FormControl>
          {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ── Defaults ──────────────────────────────────────────────────────────

function toFormValues(item: LoanProductResponse | null): LoanProductFormValues {
  const num = (n: number | null | undefined): number | "" =>
    n == null ? "" : n;
  return {
    code: item?.code ?? "",
    name: item?.name ?? "",
    description: item?.description ?? "",
    productType: item?.productType ?? "POS_DEVICE",
    payeeType: item?.payeeType ?? "SUPPLIER",
    repaymentType: item?.repaymentType ?? "INSTALLMENTS",
    pricingType: item?.pricingType ?? "FLAT_FEE",
    interestMethod: item?.interestMethod ?? "FLAT",
    repaymentFrequency: item?.repaymentFrequency ?? "MONTHLY",
    currency: item?.currency ?? "TZS",
    flatFeeRate: num(item?.flatFeeRate),
    factorRate: num(item?.factorRate),
    annualInterestRate: num(item?.annualInterestRate),
    originationFeeRate: num(item?.originationFeeRate),
    minInterestRate: num(item?.minInterestRate),
    processingFee: num(item?.processingFee),
    holdbackPercent: num(item?.holdbackPercent),
    minPrincipal: num(item?.minPrincipal),
    maxPrincipal: num(item?.maxPrincipal),
    minTermDays: num(item?.minTermDays),
    maxTermDays: num(item?.maxTermDays),
    maxConcurrentLoansPerBorrower: num(item?.maxConcurrentLoansPerBorrower),
    allocationOrder: item?.allocationOrder ?? "",
    gracePeriodDays: num(item?.gracePeriodDays),
    penaltyRatePerDay: num(item?.penaltyRatePerDay),
    lateFeeFlat: num(item?.lateFeeFlat),
    defaultThresholdDays: num(item?.defaultThresholdDays),
    termsTemplate: item?.termsTemplate ?? "",
    active: item?.active ?? true,
  };
}

// ── Live preview rail ─────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
      {children}
    </span>
  );
}

function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-mono tabular-nums text-ink">{children}</dd>
    </div>
  );
}

function pricingRateLabel(t: PricingType | undefined): string {
  switch (t) {
    case "FACTOR_RATE":
      return "Factor rate";
    case "DECLINING_INTEREST":
      return "Annual rate";
    case "FLAT_FEE":
      return "Flat fee rate";
    default:
      return "Rate";
  }
}

/** Live product summary + readiness checklist, driven by the watched form values. */
function ProductPreview({ control }: { control: Control<LoanProductFormValues> }) {
  const v = useWatch({ control }) as Partial<LoanProductFormValues>;
  const currency = (v.currency || "TZS").toUpperCase();
  const name = v.name?.trim() || "Untitled product";
  const code = v.code?.trim() || "—";

  const toNum = (x: number | "" | undefined): number | undefined =>
    x === "" || x == null ? undefined : Number(x);
  const minP = toNum(v.minPrincipal);
  const maxP = toNum(v.maxPrincipal);
  const minT = toNum(v.minTermDays);
  const maxT = toNum(v.maxTermDays);
  const conc = toNum(v.maxConcurrentLoansPerBorrower);
  const rate =
    v.pricingType === "FLAT_FEE"
      ? toNum(v.flatFeeRate)
      : v.pricingType === "FACTOR_RATE"
        ? toNum(v.factorRate)
        : v.pricingType === "DECLINING_INTEREST"
          ? toNum(v.annualInterestRate)
          : undefined;

  const checks = [
    { label: "Name", done: Boolean(v.name?.trim()) },
    { label: "Code", done: Boolean(v.code?.trim()) },
    { label: "Currency", done: /^[A-Za-z]{3}$/.test((v.currency ?? "").trim()) },
    {
      label: "Principal range",
      done: minP != null && minP > 0 && maxP != null && maxP >= minP,
    },
    {
      label: "Term range",
      done: minT != null && minT > 0 && maxT != null && maxT >= minT,
    },
    { label: "Concurrent limit", done: conc != null && conc > 0 },
    { label: "Pricing rate", done: rate != null && rate > 0 },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const complete = doneCount === checks.length;

  return (
    <div className={styles.previewCard}>
      <div className={styles.previewHead}>
        <span className={styles.liveDot} /> Live preview
      </div>
      <div className={styles.previewBody}>
        <div className={styles.previewName}>{name}</div>
        <div className={styles.previewMeta}>
          {code} · {currency}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {v.productType ? (
            <Chip>{LOAN_PRODUCT_TYPE_LABELS[v.productType]}</Chip>
          ) : null}
          {v.pricingType ? (
            <Chip>{PRICING_TYPE_LABELS[v.pricingType]}</Chip>
          ) : null}
          {v.repaymentType ? (
            <Chip>{REPAYMENT_TYPE_LABELS[v.repaymentType]}</Chip>
          ) : null}
        </div>

        <dl className="mt-4 space-y-2 text-xs">
          <PreviewRow label="Principal">
            {minP != null && maxP != null
              ? `${fmtAmount(minP)} – ${fmtAmount(maxP)} ${currency}`
              : "—"}
          </PreviewRow>
          <PreviewRow label="Term">
            {minT != null && maxT != null ? `${minT} – ${maxT} days` : "—"}
          </PreviewRow>
          <PreviewRow label="Repayment">
            {v.repaymentFrequency
              ? REPAYMENT_FREQUENCY_LABELS[v.repaymentFrequency]
              : "—"}
          </PreviewRow>
          <PreviewRow label={pricingRateLabel(v.pricingType)}>
            {rate != null ? rate : "—"}
          </PreviewRow>
        </dl>

        <div className={styles.readiness}>
          <div className={styles.readinessHead}>
            <span className={styles.readinessLabel}>Readiness</span>
            <span
              className={`${styles.readinessPct}${
                complete ? ` ${styles.readinessPctDone}` : ""
              }`}
            >
              {pct}%
            </span>
          </div>
          <div className={styles.readinessBar}>
            <div
              className={`${styles.readinessBarFill}${
                complete ? ` ${styles.readinessBarFillDone}` : ""
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className={styles.checklist}>
          {checks.map((c) => (
            <div
              key={c.label}
              className={`${styles.checklistItem}${
                c.done ? ` ${styles.checklistItemDone}` : ""
              }`}
            >
              <span className={styles.checklistMark}>
                {c.done ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────

interface LoanProductFormProps {
  item: LoanProductResponse | null;
  /** When false the form renders read-only (view for `loans:read` staff). */
  canManage?: boolean;
}

export default function LoanProductForm({
  item,
  canManage = true,
}: LoanProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();

  const isEditing = !!item;
  const readOnly = !canManage;
  const disabled = isPending || readOnly;

  const form = useForm<LoanProductFormValues>({
    resolver: zodResolver(
      LoanProductFormSchema,
    ) as unknown as Resolver<LoanProductFormValues>,
    defaultValues: toFormValues(item),
  });

  const pricingType = form.watch("pricingType");
  const repaymentType = form.watch("repaymentType");
  const currency = (form.watch("currency") || "TZS").toUpperCase();

  const onSubmit = (values: LoanProductFormValues) => {
    if (readOnly) return;
    startTransition(async () => {
      const res =
        isEditing && item
          ? await updateLoanProduct(item.id, values)
          : await createLoanProduct(values);
      if (res.responseType === "error") {
        setResponse(res);
        toast({
          variant: "destructive",
          title: isEditing
            ? "Couldn't update product"
            : "Couldn't create product",
          description: res.message,
        });
        return;
      }
      setResponse(undefined);
      toast({
        title: isEditing ? "Loan product updated" : "Loan product created",
      });
      router.push("/loans/products");
      router.refresh();
    });
  };

  const onInvalid = () => {
    toast({
      variant: "destructive",
      title: "Check the form",
      description: "Some required fields need attention.",
    });
  };

  return (
    <Form {...form}>
      {response?.responseType === "error" && response.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>
              {isEditing
                ? "Couldn't update this product"
                : "Couldn't create this product"}
            </AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}

      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formGrid}>
          <div className={styles.formStack}>
          {/* 01 — Identity */}
          <Section
            icon={<Landmark className="h-3.5 w-3.5" />}
            title="Product identity"
            desc="How this financing product is identified. Code, type, payee and currency are fixed after creation."
            step="STEP 01"
          >
            <FieldRow cols={2}>
              <TextField
                form={form}
                name="code"
                label="Product code"
                required
                placeholder="e.g. DEVICE-30D"
                disabled={disabled || isEditing}
                icon={<Hash className="h-3.5 w-3.5" />}
                hint={
                  isEditing
                    ? "Code can't be changed."
                    : "Unique short code. Uppercase, no spaces."
                }
              />
              <TextField
                form={form}
                name="name"
                label="Display name"
                required
                placeholder="e.g. POS Device — 30 days"
                disabled={disabled}
              />
            </FieldRow>
            <FieldRow cols={1}>
              <TextareaField
                form={form}
                name="description"
                label="Description"
                rows={2}
                placeholder="Short summary shown to reviewers."
                disabled={disabled}
              />
            </FieldRow>
            <FieldRow cols={3}>
              <SelectField
                form={form}
                name="productType"
                label="Product type"
                required
                options={LOAN_PRODUCT_TYPE_OPTIONS}
                disabled={disabled || isEditing}
              />
              <SelectField
                form={form}
                name="payeeType"
                label="Payee"
                required
                options={PAYEE_TYPE_OPTIONS}
                disabled={disabled || isEditing}
                hint="Who receives the disbursement."
              />
              <TextField
                form={form}
                name="currency"
                label="Currency"
                required
                placeholder="TZS"
                disabled={disabled || isEditing}
                hint="3-letter ISO code."
              />
            </FieldRow>
          </Section>

          {/* 02 — Pricing */}
          <Section
            icon={<Percent className="h-3.5 w-3.5" />}
            title="Pricing & interest"
            desc="How the cost of the loan is calculated."
            step="STEP 02"
          >
            <FieldRow cols={2}>
              <SelectField
                form={form}
                name="pricingType"
                label="Pricing model"
                required
                options={PRICING_TYPE_OPTIONS}
                disabled={disabled}
              />
              <SelectField
                form={form}
                name="interestMethod"
                label="Interest method"
                required
                options={INTEREST_METHOD_OPTIONS}
                disabled={disabled}
              />
            </FieldRow>
            {pricingType === "FLAT_FEE" ? (
              <FieldRow cols={2}>
                <NumberField
                  form={form}
                  name="flatFeeRate"
                  label="Flat fee rate"
                  decimalScale={4}
                  placeholder="0.05"
                  hint="Fraction of principal — 0.05 = 5%."
                  disabled={disabled}
                />
              </FieldRow>
            ) : null}
            {pricingType === "FACTOR_RATE" ? (
              <FieldRow cols={2}>
                <NumberField
                  form={form}
                  name="factorRate"
                  label="Factor rate"
                  decimalScale={4}
                  placeholder="1.15"
                  hint="Multiplier on principal — 1.15 = repay 115%."
                  disabled={disabled}
                />
              </FieldRow>
            ) : null}
            {pricingType === "DECLINING_INTEREST" ? (
              <FieldRow cols={2}>
                <NumberField
                  form={form}
                  name="annualInterestRate"
                  label="Annual interest rate"
                  decimalScale={4}
                  placeholder="0.24"
                  hint="Fraction per year — 0.24 = 24% p.a."
                  disabled={disabled}
                />
                <NumberField
                  form={form}
                  name="minInterestRate"
                  label="Minimum interest rate"
                  decimalScale={4}
                  placeholder="0.00"
                  hint="Floor applied to the computed rate."
                  disabled={disabled}
                />
              </FieldRow>
            ) : null}
            <FieldRow cols={2}>
              <NumberField
                form={form}
                name="originationFeeRate"
                label="Origination fee rate"
                decimalScale={4}
                placeholder="0.01"
                hint="Fraction of principal charged upfront."
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="processingFee"
                label="Processing fee"
                prefix={currency}
                thousands
                decimalScale={2}
                placeholder="0"
                hint="Flat fee added at disbursement."
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* 03 — Principal & term */}
          <Section
            icon={<Coins className="h-3.5 w-3.5" />}
            title="Principal & term"
            desc="The borrowing limits this product allows."
            step="STEP 03"
          >
            <FieldRow cols={2}>
              <NumberField
                form={form}
                name="minPrincipal"
                label="Minimum principal"
                required
                prefix={currency}
                thousands
                decimalScale={2}
                placeholder="0"
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="maxPrincipal"
                label="Maximum principal"
                required
                prefix={currency}
                thousands
                decimalScale={2}
                placeholder="0"
                disabled={disabled}
              />
            </FieldRow>
            <FieldRow cols={3}>
              <NumberField
                form={form}
                name="minTermDays"
                label="Minimum term (days)"
                required
                decimalScale={0}
                placeholder="7"
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="maxTermDays"
                label="Maximum term (days)"
                required
                decimalScale={0}
                placeholder="90"
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="maxConcurrentLoansPerBorrower"
                label="Max active loans / borrower"
                required
                decimalScale={0}
                placeholder="1"
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* 04 — Repayment */}
          <Section
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            title="Repayment"
            desc="How borrowers pay the loan back."
            step="STEP 04"
          >
            <FieldRow cols={2}>
              <SelectField
                form={form}
                name="repaymentType"
                label="Repayment type"
                required
                options={REPAYMENT_TYPE_OPTIONS}
                disabled={disabled || isEditing}
                hint={isEditing ? "Fixed after creation." : undefined}
              />
              <SelectField
                form={form}
                name="repaymentFrequency"
                label="Frequency"
                required
                options={REPAYMENT_FREQUENCY_OPTIONS}
                disabled={disabled}
              />
            </FieldRow>
            <FieldRow cols={2}>
              {repaymentType === "SALES_HOLDBACK" ? (
                <NumberField
                  form={form}
                  name="holdbackPercent"
                  label="Sales holdback"
                  decimalScale={4}
                  placeholder="0.20"
                  hint="Share of daily sales withheld — 0.20 = 20%."
                  disabled={disabled}
                />
              ) : null}
              <TextField
                form={form}
                name="allocationOrder"
                label="Allocation order"
                placeholder="e.g. PENALTY,INTEREST,PRINCIPAL"
                hint="Optional — order repayments are applied."
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* 05 — Late fees (optional) */}
          <Section
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            title="Late fees & default"
            desc="Penalties applied when a borrower falls behind."
            optional
          >
            <FieldRow cols={2}>
              <NumberField
                form={form}
                name="gracePeriodDays"
                label="Grace period (days)"
                decimalScale={0}
                placeholder="0"
                hint="Days before penalties start."
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="penaltyRatePerDay"
                label="Penalty rate / day"
                decimalScale={4}
                placeholder="0.00"
                hint="Fraction of overdue amount per day."
                disabled={disabled}
              />
            </FieldRow>
            <FieldRow cols={2}>
              <NumberField
                form={form}
                name="lateFeeFlat"
                label="Flat late fee"
                prefix={currency}
                thousands
                decimalScale={2}
                placeholder="0"
                hint="One-off fee when a payment is late."
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="defaultThresholdDays"
                label="Default threshold (days)"
                decimalScale={0}
                placeholder="0"
                hint="Days overdue before the loan defaults."
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* 06 — Terms (optional) */}
          <Section
            icon={<FileText className="h-3.5 w-3.5" />}
            title="Terms template"
            desc="Contract text shown to the borrower on the offer."
            optional
          >
            <FieldRow cols={1}>
              <TextareaField
                form={form}
                name="termsTemplate"
                label="Terms & conditions"
                rows={6}
                placeholder="Plain text or a template with placeholders…"
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* Availability (edit only) */}
          {isEditing ? (
            <Section
              icon={<Power className="h-3.5 w-3.5" />}
              title="Availability"
              desc="Inactive products can't be offered to new borrowers."
            >
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <div className={styles.toggleRow}>
                    <div>
                      <div className="text-[13px] font-medium text-ink">
                        Active
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Product is available for new applications.
                      </div>
                    </div>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                  </div>
                )}
              />
            </Section>
          ) : null}

          </div>

          {/* Live preview + readiness rail */}
          <aside className="min-w-0 self-stretch">
            <div className="lg:sticky lg:top-4">
              <ProductPreview control={form.control} />
            </div>
          </aside>
        </div>

        {/* Sticky footer (spans full width) */}
        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/loans/products")}
            disabled={isPending}
          >
            {readOnly ? "Back" : "Cancel"}
          </Button>
          {canManage ? (
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              {isEditing ? "Save changes" : "Create product"}
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
