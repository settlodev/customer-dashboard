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
  Banknote,
  Check,
  Landmark,
  Loader2,
  Power,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  createFundingSource,
  updateFundingSource,
} from "@/lib/actions/admin/loans";
import type { FormResponse } from "@/types/types";
import {
  DISBURSEMENT_METHOD_LABELS,
  DISBURSEMENT_METHOD_OPTIONS,
  fmtAmount,
  FUNDING_SOURCE_TYPE_LABELS,
  FUNDING_SOURCE_TYPE_OPTIONS,
  FundingSourceFormSchema,
  type FundingSourceFormValues,
  type FundingSourceResponse,
  type SelectOption,
} from "@/types/admin/loans";

import { cn } from "@/lib/utils";
import {
  ControlBox,
  ControlInput,
  FieldHint,
  FieldLabel,
  controlInputClass,
  controlSelectTriggerClass,
} from "@/components/ui/field";

import styles from "./styles/form-shell.module.css";

type FormType = UseFormReturn<FundingSourceFormValues>;
type Name = FieldPath<FundingSourceFormValues>;

function Section({
  icon,
  title,
  desc,
  step,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  step?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.formCard}>
      <header className={styles.formCardHead}>
        <div className={styles.icoBox}>{icon}</div>
        <div className="min-w-0 flex-1">
          <h3>{title}</h3>
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
  className,
  children,
}: {
  cols?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-[18px] gap-y-[15px]",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

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
  hint,
  prefix,
  placeholder,
  disabled,
}: {
  form: FormType;
  name: Name;
  label: string;
  hint?: string;
  prefix?: string;
  placeholder?: string;
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
            <ControlBox suffix={prefix || undefined}>
              <NumericFormat
                getInputRef={field.ref}
                className={cn(controlInputClass, "tabular-nums")}
                thousandSeparator=","
                allowNegative={false}
                decimalScale={2}
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
}: {
  form: FormType;
  name: Name;
  label: string;
  required?: boolean;
  hint?: string;
  options: SelectOption[];
  disabled?: boolean;
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
                <SelectValue placeholder="Select" />
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

function toFormValues(
  item: FundingSourceResponse | null,
): FundingSourceFormValues {
  return {
    name: item?.name ?? "",
    type: item?.type ?? "OWN_EQUITY",
    currency: item?.currency ?? "TZS",
    disbursementMethod: item?.disbursementMethod ?? "MANUAL",
    bankGatewayKey: item?.bankGatewayKey ?? "",
    capitalLimit: item?.capitalLimit == null ? "" : item.capitalLimit,
    glAccountRef: item?.glAccountRef ?? "",
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

/** Live source summary + readiness checklist, driven by the watched form values. */
function FundingSourcePreview({
  control,
}: {
  control: Control<FundingSourceFormValues>;
}) {
  const v = useWatch({ control }) as Partial<FundingSourceFormValues>;
  const currency = (v.currency || "TZS").toUpperCase();
  const name = v.name?.trim() || "Untitled source";
  const automated = v.disbursementMethod === "AUTOMATED";
  const limit =
    v.capitalLimit === "" || v.capitalLimit == null
      ? undefined
      : Number(v.capitalLimit);

  const checks = [
    { label: "Name", done: Boolean(v.name?.trim()) },
    { label: "Currency", done: /^[A-Za-z]{3}$/.test((v.currency ?? "").trim()) },
    {
      label: "Disbursement setup",
      done: !automated || Boolean(v.bankGatewayKey?.trim()),
    },
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
        <div className={styles.previewMeta}>{currency}</div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {v.type ? <Chip>{FUNDING_SOURCE_TYPE_LABELS[v.type]}</Chip> : null}
          {v.disbursementMethod ? (
            <Chip>{DISBURSEMENT_METHOD_LABELS[v.disbursementMethod]}</Chip>
          ) : null}
        </div>

        <dl className="mt-4 space-y-2 text-xs">
          <PreviewRow label="Capital limit">
            {limit != null ? `${fmtAmount(limit)} ${currency}` : "Unlimited"}
          </PreviewRow>
          <PreviewRow label="GL account">
            {v.glAccountRef?.trim() || "—"}
          </PreviewRow>
          {automated ? (
            <PreviewRow label="Gateway">
              {v.bankGatewayKey?.trim() || "—"}
            </PreviewRow>
          ) : null}
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

interface FundingSourceFormProps {
  item: FundingSourceResponse | null;
  canManage?: boolean;
}

export default function FundingSourceForm({
  item,
  canManage = true,
}: FundingSourceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();

  const isEditing = !!item;
  const readOnly = !canManage;
  const disabled = isPending || readOnly;

  const form = useForm<FundingSourceFormValues>({
    resolver: zodResolver(
      FundingSourceFormSchema,
    ) as unknown as Resolver<FundingSourceFormValues>,
    defaultValues: toFormValues(item),
  });

  const method = form.watch("disbursementMethod");
  const currency = (form.watch("currency") || "TZS").toUpperCase();

  const onSubmit = (values: FundingSourceFormValues) => {
    if (readOnly) return;
    startTransition(async () => {
      const res =
        isEditing && item
          ? await updateFundingSource(item.id, values)
          : await createFundingSource(values);
      if (res.responseType === "error") {
        setResponse(res);
        toast({
          variant: "destructive",
          title: isEditing ? "Couldn't update source" : "Couldn't create source",
          description: res.message,
        });
        return;
      }
      setResponse(undefined);
      toast({
        title: isEditing ? "Funding source updated" : "Funding source created",
      });
      router.push("/loans/funding-sources");
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
                ? "Couldn't update this source"
                : "Couldn't create this source"}
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
          <Section
            icon={<Landmark className="h-3.5 w-3.5" />}
            title="Source identity"
            desc="Where lending capital comes from. Type and currency are fixed after creation."
            step="STEP 01"
          >
            <FieldRow cols={1}>
              <TextField
                form={form}
                name="name"
                label="Name"
                required
                placeholder="e.g. Settlo Equity Pool"
                disabled={disabled}
              />
            </FieldRow>
            <FieldRow cols={2} className="mt-[15px]">
              <SelectField
                form={form}
                name="type"
                label="Source type"
                required
                options={FUNDING_SOURCE_TYPE_OPTIONS}
                disabled={disabled || isEditing}
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

          <Section
            icon={<Banknote className="h-3.5 w-3.5" />}
            title="Disbursement & capital"
            desc="How payouts are made from this source and how much it can lend."
            step="STEP 02"
          >
            <FieldRow cols={2}>
              <SelectField
                form={form}
                name="disbursementMethod"
                label="Disbursement method"
                required
                options={DISBURSEMENT_METHOD_OPTIONS}
                disabled={disabled}
                hint="Automated routes through a bank/mobile gateway."
              />
              {method === "AUTOMATED" ? (
                <TextField
                  form={form}
                  name="bankGatewayKey"
                  label="Gateway key"
                  required
                  placeholder="e.g. NMB_B2C"
                  disabled={disabled}
                  hint="Identifies the payout gateway integration."
                />
              ) : null}
            </FieldRow>
            <FieldRow cols={2} className="mt-[15px]">
              <NumberField
                form={form}
                name="capitalLimit"
                label="Capital limit"
                prefix={currency}
                placeholder="Unlimited"
                hint="Max concurrent exposure. Leave blank for unlimited."
                disabled={disabled}
              />
              <TextField
                form={form}
                name="glAccountRef"
                label="GL account reference"
                placeholder="Optional"
                hint="Links disbursements to your ledger."
                disabled={disabled}
              />
            </FieldRow>
          </Section>

          {isEditing ? (
            <Section
              icon={<Power className="h-3.5 w-3.5" />}
              title="Availability"
              desc="Inactive sources can't be selected for new disbursements."
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
                        Source is available to fund disbursements.
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
              <FundingSourcePreview control={form.control} />
            </div>
          </aside>
        </div>

        {/* Sticky footer (spans full width) */}
        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/loans/funding-sources")}
            disabled={isPending}
          >
            {readOnly ? "Back" : "Cancel"}
          </Button>
          {canManage ? (
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              {isEditing ? "Save changes" : "Create source"}
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
