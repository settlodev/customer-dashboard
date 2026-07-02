"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Receipt,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { applyForLoan } from "@/lib/actions/loans-actions";
import type { LoanApplicationDraft } from "@/types/loans/schema";
import {
  DISBURSEMENT_LABELS,
  LOAN_PRODUCTS,
  LOAN_PRODUCT_KEYS,
  computeLoanQuote,
  formatTzs,
  formatTzsShort,
  type DisbursementChannel,
  type LoanApplicationResult,
  type LoanEligibility,
  type LoanProductKey,
} from "@/types/loans/type";
import { PRODUCT_ICONS } from "@/components/loans/product-icon";

const PURPOSE_OPTIONS = [
  "Restock & operations",
  "Equipment & devices",
  "Business expansion",
  "Bridge cash flow",
  "Other",
];

const DISBURSE_OPTIONS = Object.keys(
  DISBURSEMENT_LABELS,
) as DisbursementChannel[];

const FLOW = ["Application", "Terms", "Review"];

const productRange = (key: LoanProductKey) => {
  const p = LOAN_PRODUCTS[key];
  const terms = p.termOptionsMonths;
  return `TZS ${formatTzsShort(p.minAmount)} – ${formatTzsShort(p.maxAmount)} · ${terms[0]}–${terms[terms.length - 1]} mo`;
};

const medium = (d: Date) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(d);

// NOTE: the "one active loan at a time" rule is enforced on the loans list
// (disabled Apply) and will be enforced server-side by the financing service.
// The wizard itself stays reachable so the flow can be reviewed end-to-end.
export function LoanApplyClient({
  eligibility,
}: {
  eligibility: LoanEligibility;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, startSubmit] = useTransition();
  const [result, setResult] = useState<LoanApplicationResult | null>(null);

  const form = useForm<LoanApplicationDraft>({
    defaultValues: {
      productKey: "WORKING_CAPITAL",
      amount: 3_000_000,
      termMonths: 12,
      purpose: "",
      disbursementChannel: "MPESA",
      acceptAgreement: false,
      acceptAutoDeduct: false,
      acceptDetails: false,
    },
  });

  const v = form.watch();
  const product = LOAN_PRODUCTS[v.productKey];
  const quote = computeLoanQuote(v.productKey, v.amount, v.termMonths);
  const currency = eligibility.currencyCode;
  const allAccepted =
    v.acceptAgreement && v.acceptAutoDeduct && v.acceptDetails;

  const firstPayment = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return medium(d);
  })();

  const selectProduct = (key: LoanProductKey) => {
    const p = LOAN_PRODUCTS[key];
    form.setValue("productKey", key);
    const clamped = Math.min(Math.max(v.amount, p.minAmount), p.maxAmount);
    form.setValue("amount", Math.round(clamped / 50_000) * 50_000);
    if (!p.termOptionsMonths.includes(v.termMonths)) {
      form.setValue(
        "termMonths",
        p.termOptionsMonths[p.termOptionsMonths.length - 1],
      );
    }
  };

  const goTerms = () => {
    if (!v.purpose.trim()) {
      toast({
        variant: "destructive",
        title: "Add a purpose",
        description: "Tell us what the funds are for.",
      });
      return;
    }
    setStep(1);
  };

  const submit = () => {
    startSubmit(async () => {
      const res = await applyForLoan(form.getValues());
      if (res.responseType === "success" && res.data) {
        setResult(res.data);
        setStep(3);
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't submit",
          description: res.message,
        });
      }
    });
  };

  // ── Submitted ─────────────────────────────────────────────────────
  if (step === 3 && result) {
    return <Submitted result={result} amount={v.amount} termMonths={v.termMonths} productName={product.name} currency={currency} />;
  }

  const headers: { title: string; sub: string }[] = [
    {
      title: "Apply for financing",
      sub: `Pre-qualified for up to ${formatTzs(eligibility.limit, currency)} · one active loan at a time`,
    },
    {
      title: "Financing agreement",
      sub: "Review the terms and accept to continue",
    },
    {
      title: "Review your application",
      sub: "Confirm everything looks right before you submit",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">
            {headers[step].title}
          </h1>
          <p className="mt-1 font-mono text-[13px] text-muted-foreground">
            {headers[step].sub}
          </p>
        </div>
        <FlowSteps current={step} />
      </div>

      {step === 0 && (
        <>
          <Section
            icon={<Wallet className="h-4 w-4" />}
            title="Choose a product"
            sub="What do you need financing for?"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {LOAN_PRODUCT_KEYS.map((key) => {
                const p = LOAN_PRODUCTS[key];
                const Icon = PRODUCT_ICONS[key];
                const on = v.productKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectProduct(key)}
                    className={cn(
                      "relative rounded-xl border p-4 text-left transition-colors",
                      on
                        ? "border-primary bg-primary-light shadow-[inset_0_0_0_1px_hsl(var(--primary))]"
                        : "border-line-2 bg-card hover:border-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute right-3.5 top-3.5 grid h-5 w-5 place-items-center rounded-full border-[1.5px] text-white",
                        on ? "border-primary bg-primary" : "border-line-2",
                      )}
                    >
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-[11px] border",
                        on
                          ? "border-primary bg-primary text-white"
                          : "border-line bg-canvas text-ink-2",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mt-3 text-sm font-semibold text-ink">
                      {p.name}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {p.description}
                    </div>
                    <div className="mt-2.5 border-t border-line pt-2.5 font-mono text-[11px] text-ink-3">
                      {productRange(key)}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section
            icon={<Wallet className="h-4 w-4" />}
            title="Amount & term"
            sub="How much, and over how long?"
          >
            <div>
              <div className="flex items-baseline gap-2 text-[34px] font-bold tracking-tight text-ink">
                {formatTzs(v.amount, currency)}
                <span className="font-mono text-[15px] font-medium text-muted-foreground">
                  requested
                </span>
              </div>
              <input
                type="range"
                min={product.minAmount}
                max={product.maxAmount}
                step={50_000}
                value={v.amount}
                onChange={(e) =>
                  form.setValue("amount", Number(e.target.value))
                }
                className="mt-4 w-full accent-primary"
              />
              <div className="flex justify-between font-mono text-[10.5px] text-muted-2">
                <span>TZS {formatTzsShort(product.minAmount)}</span>
                <span>Limit · TZS {formatTzsShort(product.maxAmount)}</span>
              </div>
            </div>
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-ink-2">
                Repayment term
              </label>
              <div className="flex flex-wrap gap-2">
                {product.termOptionsMonths.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => form.setValue("termMonths", t)}
                    className={cn(
                      "min-w-[70px] flex-1 rounded-lg border px-2 py-2.5 text-center transition-colors",
                      v.termMonths === t
                        ? "border-primary bg-primary-light shadow-[inset_0_0_0_1px_hsl(var(--primary))]"
                        : "border-line-2 bg-card hover:border-primary",
                    )}
                  >
                    <div className="text-base font-bold tracking-tight text-ink">
                      {t}
                    </div>
                    <div className="font-mono text-[10.5px] text-muted-foreground">
                      months
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section
            icon={<Receipt className="h-4 w-4" />}
            title="Your repayment"
            sub="Estimated, based on your selection"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MiniFact label="Monthly" value={formatTzs(quote.monthlyPayment, currency)} />
              <MiniFact label="Facility fee" value={formatTzs(quote.facilityFee, currency)} />
              <MiniFact label="Term" value={`${v.termMonths} mo`} />
              <MiniFact
                label="Total repayable"
                value={formatTzs(quote.totalRepayable, currency)}
                accent
              />
            </div>
          </Section>

          <Section
            icon={<FileText className="h-4 w-4" />}
            title="Purpose & disbursement"
            sub="Tell us how funds will be used and where to send them."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-2">
                  Purpose <span className="text-primary">*</span>
                </label>
                <Select
                  value={v.purpose}
                  onValueChange={(val) => form.setValue("purpose", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSE_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-2">
                  Disburse to <span className="text-primary">*</span>
                </label>
                <Select
                  value={v.disbursementChannel}
                  onValueChange={(val) =>
                    form.setValue(
                      "disbursementChannel",
                      val as DisbursementChannel,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISBURSE_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {DISBURSEMENT_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex gap-2.5 rounded-xl bg-canvas p-3 text-[12.5px] leading-relaxed text-ink-3">
              <Zap className="h-4 w-4 flex-shrink-0 text-ink-2" />
              <div>
                <b className="font-semibold text-ink-2">
                  Auto-deduct from daily sales.
                </b>{" "}
                A small share of each day&apos;s settlement goes toward your
                balance until it&apos;s cleared. You can also pay early or in
                full anytime — no penalty.
              </div>
            </div>
          </Section>

          <FooterBar
            left={
              <Total label="Total repayable" value={quote.totalRepayable} currency={currency} />
            }
          >
            <Button variant="ghost" asChild>
              <Link href="/loans">Cancel</Link>
            </Button>
            <Button onClick={goTerms}>
              Continue to terms <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </FooterBar>
        </>
      )}

      {step === 1 && (
        <>
          <KeyTerms quote={quote} currency={currency} />

          <Section
            icon={<FileText className="h-4 w-4" />}
            title="Terms & conditions"
            sub="Working capital facility · please read in full"
          >
            <div className="max-h-[380px] overflow-y-auto rounded-xl border border-line bg-canvas p-5">
              {clauses(quote, v.termMonths, currency).map((c, i) => (
                <div
                  key={i}
                  className="flex gap-3 border-b border-dashed border-line py-3 first:pt-0 last:border-0 last:pb-0"
                >
                  <span className="w-5 flex-shrink-0 font-mono text-[11px] font-semibold text-primary-dark">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold tracking-tight text-ink">
                      {c.title}
                    </div>
                    <div className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
                      {c.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            icon={<Check className="h-4 w-4" />}
            title="Your acceptance"
            sub="All three are required to continue"
          >
            <div className="space-y-2.5">
              <AcceptanceRow
                checked={v.acceptAgreement}
                onToggle={() =>
                  form.setValue("acceptAgreement", !v.acceptAgreement)
                }
              >
                I have read and agree to the{" "}
                <b className="font-semibold text-ink">Financing Agreement</b> and
                the <b className="font-semibold text-ink">{quote.feeLabel}</b>{" "}
                facility fee ({formatTzs(quote.facilityFee, currency)}).
              </AcceptanceRow>
              <AcceptanceRow
                checked={v.acceptAutoDeduct}
                onToggle={() =>
                  form.setValue("acceptAutoDeduct", !v.acceptAutoDeduct)
                }
              >
                I authorize Settlo to{" "}
                <b className="font-semibold text-ink">auto-deduct repayments</b>{" "}
                from my daily sales settlement until the facility is cleared.
              </AcceptanceRow>
              <AcceptanceRow
                checked={v.acceptDetails}
                onToggle={() =>
                  form.setValue("acceptDetails", !v.acceptDetails)
                }
              >
                I confirm my business and{" "}
                <b className="font-semibold text-ink">disbursement details</b> (
                {DISBURSEMENT_LABELS[v.disbursementChannel]}) are accurate.
              </AcceptanceRow>
            </div>
          </Section>

          <FooterBar
            left={
              <span className="font-mono text-xs text-muted-foreground">
                Step 2 of 3 · Terms
              </span>
            }
          >
            <Button variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button disabled={!allAccepted} onClick={() => setStep(2)}>
              Continue to review <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </FooterBar>
        </>
      )}

      {step === 2 && (
        <>
          <KeyTerms quote={quote} currency={currency} />

          <Section
            icon={<Wallet className="h-4 w-4" />}
            title="Application"
            action={
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                Edit
              </Button>
            }
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <ReviewRow label="Product" value={product.name} />
              <ReviewRow label="Purpose" value={v.purpose || "—"} />
              <ReviewRow label="Amount" value={formatTzs(v.amount, currency)} />
              <ReviewRow label="Term" value={`${v.termMonths} months`} />
            </div>
          </Section>

          <Section
            icon={<Receipt className="h-4 w-4" />}
            title="Repayment"
            sub="Auto-deducted from daily sales"
            action={
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                Edit
              </Button>
            }
          >
            <div className="flex items-baseline justify-between pb-3">
              <span className="text-[12.5px] text-ink-3">Monthly payment</span>
              <span className="text-[22px] font-bold tracking-tight text-ink">
                {formatTzs(quote.monthlyPayment, currency)}
              </span>
            </div>
            <div className="space-y-2.5">
              <SummaryRow label="Principal" value={formatTzs(v.amount, currency)} />
              <SummaryRow
                label={`Facility fee · ${quote.feeLabel}`}
                value={formatTzs(quote.facilityFee, currency)}
              />
              <SummaryRow label="Term" value={`${v.termMonths} months`} />
              <SummaryRow label="First payment" value={firstPayment} />
              <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-sm font-bold text-ink">
                  Total repayable
                </span>
                <span className="font-mono text-[15px] font-bold tabular-nums text-ink">
                  {formatTzs(quote.totalRepayable, currency)}
                </span>
              </div>
            </div>
          </Section>

          <Section
            icon={<Wallet className="h-4 w-4" />}
            title="Disbursement"
            action={
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                Edit
              </Button>
            }
          >
            <div className="grid grid-cols-2 gap-6">
              <ReviewRow
                label="Disburse to"
                value={DISBURSEMENT_LABELS[v.disbursementChannel]}
              />
              <ReviewRow label="Repayment source" value="Auto-deduct from sales" />
            </div>
          </Section>

          <div className="flex items-center gap-3 rounded-xl bg-pos-tint p-3.5">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-pos text-white">
              <Check className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[13.5px] font-semibold text-ink">
                Financing agreement accepted
              </div>
              <div className="text-xs text-ink-3">
                All terms accepted · ready to submit
              </div>
            </div>
          </div>

          <FooterBar
            left={
              <Total label="Total repayable" value={quote.totalRepayable} currency={currency} />
            }
          >
            <Button variant="ghost" onClick={() => setStep(1)} disabled={submitting}>
              Back
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="mr-1.5 h-3.5 w-3.5" />
              )}
              Submit application
            </Button>
          </FooterBar>
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function FlowSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {FLOW.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          {i > 0 && <span className="h-px w-5 bg-line-2" />}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
              i === current
                ? "bg-ink text-white"
                : i < current
                  ? "bg-pos-tint text-pos"
                  : "bg-card text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-4 w-4 place-items-center rounded-full text-[10px] font-semibold",
                i === current
                  ? "bg-white/20"
                  : i < current
                    ? "bg-pos text-white"
                    : "bg-canvas",
              )}
            >
              {i < current ? <Check className="h-2.5 w-2.5" /> : i + 1}
            </span>
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}

function Section({
  icon,
  title,
  sub,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-card">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink">{title}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function MiniFact({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 text-[20px] font-bold tracking-tight",
          accent ? "text-primary-dark" : "text-ink",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function KeyTerms({
  quote,
  currency,
}: {
  quote: ReturnType<typeof computeLoanQuote>;
  currency: string;
}) {
  const cells: { k: string; v: string; accent?: boolean }[] = [
    { k: "Amount", v: formatTzs(quote.amount, currency) },
    { k: `Facility fee · ${quote.feeLabel}`, v: formatTzs(quote.facilityFee, currency) },
    { k: "Term", v: `${quote.termMonths} months` },
    { k: "Total repayable", v: formatTzs(quote.totalRepayable, currency), accent: true },
  ];
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl bg-ink text-white sm:grid-cols-4">
      {cells.map((c, i) => (
        <div
          key={i}
          className="border-b border-white/10 px-4 py-4 sm:border-b-0 sm:border-r sm:last:border-r-0"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/55">
            {c.k}
          </div>
          <div
            className={cn(
              "mt-1.5 text-[19px] font-bold tracking-tight",
              c.accent ? "text-amber-400" : "text-white",
            )}
          >
            {c.v}
          </div>
        </div>
      ))}
    </div>
  );
}

function AcceptanceRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
        checked ? "border-primary bg-primary-light" : "border-line-2",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border-[1.5px] text-white",
          checked ? "border-primary bg-primary" : "border-line-2",
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span className="text-[13px] leading-relaxed text-ink-2">{children}</span>
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[13px]">
      <span className="text-ink-3">{label}</span>
      <span className="font-mono tabular-nums text-ink-2">{value}</span>
    </div>
  );
}

function Total({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[12.5px] text-ink-3">{label}</span>
      <span className="text-lg font-bold tracking-tight text-ink">
        {formatTzs(value, currency)}
      </span>
    </div>
  );
}

function FooterBar({
  left,
  children,
}: {
  left: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-4 py-3">
      {left}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

function clauses(
  quote: ReturnType<typeof computeLoanQuote>,
  termMonths: number,
  currency: string,
) {
  const amount = formatTzs(quote.amount, currency);
  const fee = formatTzs(quote.facilityFee, currency);
  const total = formatTzs(quote.totalRepayable, currency);
  const monthly = formatTzs(quote.monthlyPayment, currency);
  return [
    {
      title: "Facility",
      body: `Settlo provides ${amount} in financing, disbursed to your nominated account on acceptance of this agreement.`,
    },
    {
      title: "Facility fee",
      body: `A one-time facility fee of ${quote.feeLabel} (${fee}) applies and is included in your total repayable of ${total}. No compounding interest is charged.`,
    },
    {
      title: "Repayment",
      body: `Repaid over ${termMonths} monthly installments of ${monthly}. A share of each day's sales settlement is automatically applied toward your balance until the facility is cleared.`,
    },
    {
      title: "Early repayment",
      body: "You may repay early or in full at any time with no penalty. Early payments reduce your outstanding balance and shorten the term.",
    },
    {
      title: "Late & default",
      body: "If auto-deduction does not cover a scheduled installment, the shortfall remains due. Persistent non-payment may affect your eligibility and Settlo standing.",
    },
    {
      title: "One active facility",
      body: "You may hold only one active loan at a time. You become eligible to apply again once this facility is fully repaid.",
    },
    {
      title: "Data & consent",
      body: "You authorize Settlo to use your sales and account data to assess and service this facility, in line with the Settlo privacy policy.",
    },
  ];
}

function Submitted({
  result,
  amount,
  termMonths,
  productName,
  currency,
}: {
  result: LoanApplicationResult;
  amount: number;
  termMonths: number;
  productName: string;
  currency: string;
}) {
  const steps = [
    { state: "done", title: "Submitted", detail: medium(new Date()) },
    { state: "now", title: "Under review", detail: "Usually within 24 hours" },
    { state: "todo", title: "Decision & offer", detail: "Review terms and accept" },
    { state: "todo", title: "Disbursed", detail: "Funds sent on acceptance" },
  ];
  return (
    <div className="mx-auto max-w-[560px] py-6 text-center">
      <div className="mx-auto grid h-[76px] w-[76px] place-items-center rounded-full bg-pos-tint text-pos">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h1 className="mt-5 text-[26px] font-bold tracking-tight text-ink">
        Application submitted
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-ink-3">
        We&apos;ve received your request for{" "}
        <b className="font-semibold text-ink">{formatTzs(amount, currency)}</b>.
        Most applications are reviewed within 24 hours — we&apos;ll notify you
        here and by SMS.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-card text-left">
        {[
          ["Reference", result.reference],
          ["Product", productName],
          ["Amount", formatTzs(amount, currency)],
          ["Term", `${termMonths} months`],
        ].map(([k, val]) => (
          <div
            key={k}
            className="flex items-center justify-between border-b border-line px-4.5 py-3.5 last:border-0"
          >
            <span className="text-[13px] text-ink-3">{k}</span>
            <span className="font-mono text-[13.5px] font-semibold text-ink">
              {val}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-line px-4.5 py-3.5">
          <span className="text-[13px] text-ink-3">Status</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            In review
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-card px-4.5 py-1.5 text-left">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3.5 py-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-full",
                  s.state === "done"
                    ? "bg-pos text-white"
                    : s.state === "now"
                      ? "bg-primary text-white"
                      : "border border-line-2 bg-canvas text-muted-2",
                )}
              >
                {s.state === "done" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : s.state === "now" ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              {i < steps.length - 1 && (
                <span className="my-1 w-px flex-1 bg-line" />
              )}
            </div>
            <div className="pt-0.5">
              <div
                className={cn(
                  "text-[13.5px] font-semibold",
                  s.state === "todo" ? "text-muted-foreground" : "text-ink",
                )}
              >
                {s.title}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {s.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-2.5">
        <Button variant="outline" asChild>
          <Link href="/loans">Back to loans</Link>
        </Button>
        <Button asChild>
          <Link href="/loans">View loans</Link>
        </Button>
      </div>
    </div>
  );
}
