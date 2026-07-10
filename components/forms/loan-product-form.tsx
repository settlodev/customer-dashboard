"use client";

import React, { useEffect, useState, useTransition } from "react";
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
  Info,
  Landmark,
  Loader2,
  Percent,
  Power,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ControlBox,
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlInputClass,
  controlSelectTriggerClass,
} from "@/components/ui/field";
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
import { Switch } from "@/components/ui/switch";
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
  ALLOWED_PAYEE_TYPES_BY_PRODUCT,
  fmtAmount,
  INTEREST_METHOD_DESCRIPTIONS,
  INTEREST_METHOD_OPTIONS,
  LOAN_PRODUCT_TYPE_LABELS,
  LOAN_PRODUCT_TYPE_OPTIONS,
  LoanProductFormSchema,
  PAYEE_TYPE_DESCRIPTIONS,
  PAYEE_TYPE_OPTIONS,
  PRICING_TYPE_DESCRIPTIONS,
  PRICING_TYPE_LABELS,
  PRICING_TYPE_OPTIONS,
  PRODUCT_TYPE_DESCRIPTIONS,
  REPAYMENT_FREQUENCY_LABELS,
  REPAYMENT_FREQUENCY_OPTIONS,
  REPAYMENT_TYPE_DESCRIPTIONS,
  REPAYMENT_TYPE_LABELS,
  REPAYMENT_TYPE_OPTIONS,
  TERMS_TEMPLATE_PRESETS,
  type InterestMethod,
  type LoanProductFormValues,
  type LoanProductResponse,
  type LoanProductType,
  type PayeeType,
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
  const colClass =
    cols >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : cols === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : cols === 2
          ? "sm:grid-cols-2"
          : "";
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-[18px] gap-y-[15px] [&:not(:first-child)]:mt-[15px]",
        colClass,
      )}
    >
      {children}
    </div>
  );
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
        <FormItem className="min-w-0 space-y-[7px]">
          <FieldLabel required={required}>{label}</FieldLabel>
          <FormControl>
            <ControlInput
              prefix={icon}
              placeholder={placeholder}
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              disabled={disabled}
            />
          </FormControl>
          {hint ? <FieldHint>{hint}</FieldHint> : null}
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
        <FormItem className="min-w-0 space-y-[7px]">
          <FieldLabel required={required}>{label}</FieldLabel>
          <FormControl>
            <ControlBox suffix={prefix || undefined}>
              <NumericFormat
                getInputRef={field.ref}
                className={cn(controlInputClass, "tabular-nums")}
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
            </ControlBox>
          </FormControl>
          {hint ? <FieldHint>{hint}</FieldHint> : null}
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
        <FormItem className="min-w-0 space-y-[7px]">
          <FieldLabel required={required}>{label}</FieldLabel>
          <Select
            onValueChange={field.onChange}
            value={(field.value as string) ?? ""}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className={controlSelectTriggerClass}>
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
          {hint ? <FieldHint>{hint}</FieldHint> : null}
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
        <FormItem className="min-w-0 space-y-[7px]">
          <FieldLabel>{label}</FieldLabel>
          <FormControl>
            <ControlTextarea
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
          {hint ? <FieldHint>{hint}</FieldHint> : null}
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

  // ── Watched values for conditional rendering ──────────────────────
  const productType = form.watch("productType") as LoanProductType;
  const pricingType = form.watch("pricingType") as PricingType;
  const interestMethod = form.watch("interestMethod") as InterestMethod;
  const repaymentType = form.watch("repaymentType");
  const payeeTypeValue = form.watch("payeeType") as PayeeType;
  const currency = (form.watch("currency") || "TZS").toUpperCase();

  // ── Payee options filtered by product type ────────────────────────
  const allowedPayeeValues = ALLOWED_PAYEE_TYPES_BY_PRODUCT[productType];
  const filteredPayeeOptions = allowedPayeeValues
    ? PAYEE_TYPE_OPTIONS.filter((o) =>
        allowedPayeeValues.includes(o.value as PayeeType),
      )
    : PAYEE_TYPE_OPTIONS;

  // Auto-reset payeeType when productType changes to an incompatible combination.
  useEffect(() => {
    if (isEditing) return;
    const current = form.getValues("payeeType") as PayeeType;
    const allowed = ALLOWED_PAYEE_TYPES_BY_PRODUCT[productType];
    if (allowed && !allowed.includes(current)) {
      form.setValue("payeeType", allowed[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType]);

  // ── Interest/pricing conflict ─────────────────────────────────────
  // interestMethod=NONE means fee-only pricing — DECLINING_INTEREST is incompatible.
  const interestPricingConflict =
    interestMethod === "NONE" && pricingType === "DECLINING_INTEREST";
  const showInterestRateFields =
    interestMethod !== "NONE" && pricingType === "DECLINING_INTEREST";

  // ── Submit ────────────────────────────────────────────────────────
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
            desc="Name the product and choose who it's for. Code, product type, payee, and currency are fixed once the product is created."
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
                    ? "Code is permanent and cannot be changed."
                    : "A short unique identifier — uppercase, no spaces. Used in API calls and reports."
                }
              />
              <TextField
                form={form}
                name="name"
                label="Display name"
                required
                placeholder="e.g. POS Device — 30 days"
                disabled={disabled}
                hint="The name shown to reviewers and borrowers on their loan offer."
              />
            </FieldRow>
            <FieldRow cols={1}>
              <TextareaField
                form={form}
                name="description"
                label="Description"
                rows={2}
                placeholder="Brief summary — e.g. 30-day device financing for active merchants."
                disabled={disabled}
                hint="Internal notes shown to loan officers during underwriting. Not visible to borrowers."
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
                hint={
                  isEditing
                    ? "Product type is permanent and cannot be changed."
                    : PRODUCT_TYPE_DESCRIPTIONS[productType]
                }
              />
              <SelectField
                form={form}
                name="payeeType"
                label="Who receives the money"
                required
                options={filteredPayeeOptions}
                disabled={disabled || isEditing}
                hint={
                  isEditing
                    ? "Payee type is permanent and cannot be changed."
                    : PAYEE_TYPE_DESCRIPTIONS[payeeTypeValue] ??
                      "Who receives the disbursement when a loan is approved."
                }
              />
              <TextField
                form={form}
                name="currency"
                label="Currency"
                required
                placeholder="TZS"
                disabled={disabled || isEditing}
                hint={
                  isEditing
                    ? "Currency is permanent and cannot be changed."
                    : "3-letter ISO currency code. TZS for Tanzanian Shilling."
                }
              />
            </FieldRow>
          </Section>

          {/* 02 — Pricing */}
          <Section
            icon={<Percent className="h-3.5 w-3.5" />}
            title="Pricing & interest"
            desc="Set how the cost of the loan is calculated. The pricing model and interest method together determine what the borrower pays back."
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
                hint={PRICING_TYPE_DESCRIPTIONS[pricingType]}
              />
              <SelectField
                form={form}
                name="interestMethod"
                label="Interest method"
                required
                options={INTEREST_METHOD_OPTIONS}
                disabled={disabled}
                hint={INTEREST_METHOD_DESCRIPTIONS[interestMethod]}
              />
            </FieldRow>

            {/* Conflict warning: NONE + DECLINING_INTEREST is invalid */}
            {interestPricingConflict ? (
              <Alert tone="danger" className="mt-3">
                <AlertIcon>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </AlertIcon>
                <AlertBody>
                  <AlertTitle>Incompatible combination</AlertTitle>
                  <AlertDescription>
                    "Declining interest" pricing requires interest to be charged.
                    Either change the pricing model to <strong>Flat Fee</strong> or{" "}
                    <strong>Factor Rate</strong>, or change the interest method to{" "}
                    <strong>Flat</strong> or <strong>Reducing balance</strong>.
                  </AlertDescription>
                </AlertBody>
              </Alert>
            ) : null}

            {/* Flat fee rate — only for FLAT_FEE pricing */}
            {pricingType === "FLAT_FEE" ? (
              <FieldRow cols={2}>
                <NumberField
                  form={form}
                  name="flatFeeRate"
                  label="Flat fee rate"
                  decimalScale={4}
                  placeholder="0.08"
                  hint="Fraction of the loan amount charged as a one-time fee. 0.08 = 8% of principal."
                  disabled={disabled}
                />
              </FieldRow>
            ) : null}

            {/* Factor rate — only for FACTOR_RATE pricing */}
            {pricingType === "FACTOR_RATE" ? (
              <FieldRow cols={2}>
                <NumberField
                  form={form}
                  name="factorRate"
                  label="Factor rate"
                  decimalScale={4}
                  placeholder="1.10"
                  hint="Multiplier on the loan amount. 1.10 means the borrower repays 110% of what they borrowed."
                  disabled={disabled}
                />
              </FieldRow>
            ) : null}

            {/* Annual rate + minimum interest — only when interest is actually charged */}
            {showInterestRateFields ? (
              <FieldRow cols={2}>
                <NumberField
                  form={form}
                  name="annualInterestRate"
                  label="Annual interest rate (APR)"
                  decimalScale={4}
                  placeholder="0.24"
                  hint="Yearly interest rate as a decimal. 0.24 = 24% per annum. Interest is prorated over the loan term."
                  disabled={disabled}
                />
                <NumberField
                  form={form}
                  name="minInterestRate"
                  label="Minimum interest guarantee"
                  decimalScale={4}
                  placeholder="0.00"
                  hint="Floor interest as a fraction of principal. Protects against early repayment eating into minimum revenue. 0.03 = at least 3% of principal is always charged."
                  disabled={disabled}
                />
              </FieldRow>
            ) : null}

            <FieldRow cols={2}>
              <NumberField
                form={form}
                name="processingFee"
                label="Processing fee"
                prefix={currency}
                thousands
                decimalScale={2}
                placeholder="0"
                hint={`Flat one-time fee added at disbursement — e.g. TZS 5,000 admin charge. Always in ${currency}, regardless of loan size.`}
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="originationFeeRate"
                label="Origination fee rate"
                decimalScale={4}
                placeholder="0.00"
                hint="Fraction of principal charged upfront as an origination cost. Reserved for future use — not yet applied by the engine."
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* 03 — Principal & term */}
          <Section
            icon={<Coins className="h-3.5 w-3.5" />}
            title="Principal & term"
            desc="Set the minimum and maximum loan amounts and durations this product allows. Applications outside these bounds are rejected automatically."
            step="STEP 03"
          >
            <FieldRow cols={2}>
              <NumberField
                form={form}
                name="minPrincipal"
                label="Minimum loan amount"
                required
                prefix={currency}
                thousands
                decimalScale={2}
                placeholder="0"
                hint="Smallest amount a borrower can request under this product."
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="maxPrincipal"
                label="Maximum loan amount"
                required
                prefix={currency}
                thousands
                decimalScale={2}
                placeholder="0"
                hint="Largest amount a borrower can request. Officer approvals must also stay within this limit."
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
                hint="Shortest allowed loan duration in calendar days."
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="maxTermDays"
                label="Maximum term (days)"
                required
                decimalScale={0}
                placeholder="90"
                hint="Longest allowed loan duration. 30 = one month, 90 = three months, 365 = one year."
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="maxConcurrentLoansPerBorrower"
                label="Max active loans per borrower"
                required
                decimalScale={0}
                placeholder="1"
                hint="How many loans of this product type a single borrower can hold at the same time. Usually 1."
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* 04 — Repayment */}
          <Section
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            title="Repayment"
            desc="How the borrower pays the loan back — schedule structure, frequency, and how incoming payments are applied to the outstanding balance."
            step="STEP 04"
          >
            <FieldRow cols={2}>
              <SelectField
                form={form}
                name="repaymentType"
                label="Repayment structure"
                required
                options={REPAYMENT_TYPE_OPTIONS}
                disabled={disabled || isEditing}
                hint={
                  isEditing
                    ? "Repayment structure is permanent and cannot be changed."
                    : REPAYMENT_TYPE_DESCRIPTIONS[repaymentType as keyof typeof REPAYMENT_TYPE_DESCRIPTIONS]
                }
              />
              <SelectField
                form={form}
                name="repaymentFrequency"
                label="Payment frequency"
                required
                options={REPAYMENT_FREQUENCY_OPTIONS}
                disabled={disabled}
                hint="How often the borrower is expected to make a payment. For bullet loans, set this to Bullet."
              />
            </FieldRow>
            <FieldRow cols={2}>
              {repaymentType === "SALES_HOLDBACK" ? (
                <NumberField
                  form={form}
                  name="holdbackPercent"
                  label="Sales holdback %"
                  decimalScale={4}
                  placeholder="0.20"
                  hint="Share of the borrower's daily sales withheld automatically. 0.20 = 20% of each day's takings go to repayment."
                  disabled={disabled}
                />
              ) : null}
              <TextField
                form={form}
                name="allocationOrder"
                label="Payment allocation order"
                placeholder="PENALTY,INTEREST,PRINCIPAL,FEE"
                hint="Which debt bucket an incoming payment clears first. Leave blank for the default: penalties → interest → principal → fees. Change this only if you have a specific regulatory or commercial reason."
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* 05 — Late fees (optional) */}
          <Section
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            title="Late fees & default"
            desc="Penalties applied when a borrower misses a payment. You can use a one-time flat charge, a daily accruing penalty, or both — or leave them at zero for no late fees."
            optional
          >
            <FieldRow cols={2}>
              <NumberField
                form={form}
                name="gracePeriodDays"
                label="Grace period (days)"
                decimalScale={0}
                placeholder="0"
                hint="Days after a due date before any late charges begin. 0 means penalties start immediately. 3 days is a common grace period."
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="lateFeeFlat"
                label="One-time late fee"
                prefix={currency}
                thousands
                decimalScale={2}
                placeholder="0"
                hint="A fixed charge applied once the first time a payment goes overdue — regardless of the overdue amount. Charged per missed instalment, not per day."
                disabled={disabled}
              />
            </FieldRow>
            <FieldRow cols={2}>
              <NumberField
                form={form}
                name="penaltyRatePerDay"
                label="Daily penalty rate"
                decimalScale={4}
                placeholder="0.00"
                hint="A daily percentage charged on the unpaid overdue balance — accrues every day until settled. 0.001 = 0.1% per day. Can be used alongside the one-time flat fee."
                disabled={disabled}
              />
              <NumberField
                form={form}
                name="defaultThresholdDays"
                label="Auto-default threshold (days)"
                decimalScale={0}
                placeholder="0"
                hint="How many days past a missed instalment's due date before the system automatically classifies the loan as defaulted. Leave blank to require a manual write-off decision."
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {/* 06 — Terms (optional) */}
          <Section
            icon={<FileText className="h-3.5 w-3.5" />}
            title="Terms & conditions template"
            desc="The loan agreement text shown to the borrower on their offer letter. Use {{variable}} placeholders — they are substituted with real values at loan booking time."
            optional
          >
            {/* Template prefill button */}
            {!readOnly ? (
              <div className="mb-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    form.setValue(
                      "termsTemplate",
                      TERMS_TEMPLATE_PRESETS[productType],
                      { shouldDirty: true },
                    )
                  }
                  disabled={disabled}
                >
                  <Wand2 className="h-3 w-3" />
                  Fill from {LOAN_PRODUCT_TYPE_LABELS[productType]} template
                </Button>
                <span className="text-xs text-muted-foreground">
                  Starts you from a standard template — edit freely after.
                </span>
              </div>
            ) : null}

            <FieldRow cols={1}>
              <TextareaField
                form={form}
                name="termsTemplate"
                label="Terms & conditions"
                rows={14}
                placeholder="Click 'Fill from template' above, or write your own terms here…"
                disabled={disabled}
              />
            </FieldRow>

            {/* Available variable reference */}
            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                <strong>Available placeholders:</strong>{" "}
                {"{{applicantName}}"}, {"{{businessName}}"},{" "}
                {"{{businessRegNumber}}"}, {"{{borrowerPhone}}"},{" "}
                {"{{borrowerEmail}}"}, {"{{applicationNumber}}"},{" "}
                {"{{currency}}"}, {"{{loanAmount}}"}, {"{{termDays}}"},{" "}
                {"{{installmentCount}}"}, {"{{installmentAmount}}"},{" "}
                {"{{disbursementDate}}"}, {"{{maturityDate}}"},{" "}
                {"{{gracePeriodDays}}"}, {"{{lateFeeFlat}}"},{" "}
                {"{{penaltyRatePerDay}}"}, {"{{defaultThresholdDays}}"}
              </span>
            </div>
          </Section>

          {/* Availability (edit only) */}
          {isEditing ? (
            <Section
              icon={<Power className="h-3.5 w-3.5" />}
              title="Availability"
              desc="Inactive products are hidden from borrowers and cannot receive new applications. Existing active loans are not affected."
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
