"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info, Loader2, ShieldCheck } from "lucide-react";
import { NumericFormat } from "react-number-format";

import { cn } from "@/lib/utils";
import { ControlBox, controlInputClass } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { getSupplierFinancingPreview } from "@/lib/actions/lpo-actions";
import { getPreQualification } from "@/lib/actions/loan-applications-actions";
import type { PreQualifiedProduct } from "@/types/loans/applications";
import type { LpoPaymentMethod } from "@/types/lpo/type";
import type { Supplier } from "@/types/supplier/type";

import formStyles from "@/components/forms/styles/form-shell.module.css";

/** The soft eligibility preview — mirrors `getSupplierFinancingPreview`'s resolved shape (minus the `null`-on-failure case, tracked separately). */
type FinancingPreview = NonNullable<
  Awaited<ReturnType<typeof getSupplierFinancingPreview>>
>;

export interface FinancingCardValue {
  paymentMethod: LpoPaymentMethod;
  /** Undefined always means "finance the full order" once paymentMethod is SETTLO_FINANCING — never send 0/blank. */
  financedAmount?: number;
}

interface FinancingOptionCardProps {
  supplier: Supplier | null;
  /** Running order total (sum of line totals) — live; the full-financing default tracks this as items change. */
  orderTotal: number;
  value: FinancingCardValue;
  onChange: (value: FinancingCardValue) => void;
  disabled?: boolean;
}

const money = (n: number) =>
  `TZS ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Picks the pre-qual product to quote as "you're pre-qualified up to" —
 * prefers a STOCK-type product (or one whose name reads as stock/supplier
 * financing), otherwise the highest qualified ceiling across the catalog.
 */
function pickBestPreQualProduct(
  products: PreQualifiedProduct[],
): PreQualifiedProduct | null {
  if (products.length === 0) return null;
  const looksLikeStockFinancing = (p: PreQualifiedProduct) =>
    p.productType === "STOCK" || /stock|supplier/i.test(p.name);
  const preferred = products.find(looksLikeStockFinancing);
  if (preferred) return preferred;
  return products.reduce(
    (best, candidate) =>
      (candidate.qualifiedAmount ?? -Infinity) >
      (best.qualifiedAmount ?? -Infinity)
        ? candidate
        : best,
    products[0],
  );
}

/**
 * The "Pay with Settlo" card embedded in the LPO create form (after the
 * items section). Fully controlled — the form owns `paymentMethod` /
 * `financedAmount` as RHF state and passes them down via `value`; this
 * component only renders and reports intent via `onChange`.
 *
 * Financing eligibility (`supplier?.linkedToSettloSupplier`) gates the
 * radio option itself; the supplier-financing-preview and pre-qualification
 * checks that follow are soft signals only (never block submission — the
 * backend is the authoritative gate).
 */
export default function FinancingOptionCard({
  supplier,
  orderTotal,
  value,
  onChange,
  disabled,
}: FinancingOptionCardProps) {
  const financingEligible = !!supplier?.linkedToSettloSupplier;
  const isFinancing = value.paymentMethod === "SETTLO_FINANCING";

  // Local UI-only state: whether the "finance part of it" switch is on.
  // Kept separate from `financedAmount`'s definedness because a blank
  // partial amount is *also* undefined on the wire (full financing) — the
  // switch must stay visibly on while the user is mid-edit rather than
  // snapping back to "full" the moment the field empties.
  const [isPartial, setIsPartial] = useState(
    value.financedAmount !== undefined,
  );

  const [preview, setPreview] = useState<FinancingPreview | null>(null);
  const [preQual, setPreQual] = useState<PreQualifiedProduct[] | null>(null);
  // Seeded `true` (not `false`) so the very first render right after
  // selecting financing shows the spinner immediately instead of a
  // one-frame flash of the "couldn't check eligibility" fallback before the
  // fetch effect below has had a chance to flip these on. Harmless while
  // `isFinancing` is false (DIRECT) — this whole block only renders once
  // financing is selected, and the effect re-arms both flags on every
  // supplier/financing change anyway.
  const [previewLoading, setPreviewLoading] = useState(true);
  const [preQualLoading, setPreQualLoading] = useState(true);

  useEffect(() => {
    if (!isFinancing || !supplier?.id) return;
    let cancelled = false;
    const supplierId = supplier.id;

    setPreviewLoading(true);
    setPreQualLoading(true);

    void (async () => {
      const [previewRes, preQualRes] = await Promise.all([
        getSupplierFinancingPreview(supplierId),
        getPreQualification(),
      ]);
      if (cancelled) return;
      setPreview(previewRes);
      setPreQual(preQualRes);
      setPreviewLoading(false);
      setPreQualLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isFinancing, supplier?.id]);

  // If the selected supplier stops being financing-eligible (e.g. the user
  // swaps to an unlinked supplier) while financing is selected, fall back
  // to DIRECT rather than leaving a now-disabled option selected.
  useEffect(() => {
    if (isFinancing && !financingEligible) {
      setIsPartial(false);
      onChange({ paymentMethod: "DIRECT", financedAmount: undefined });
    }
  }, [isFinancing, financingEligible, onChange]);

  const bestPreQual = useMemo(
    () => (preQual ? pickBestPreQualProduct(preQual) : null),
    [preQual],
  );

  const effectiveFinanced = isPartial
    ? (value.financedAmount ?? 0)
    : orderTotal;
  // True when a previously-entered partial amount has been stranded above
  // the order total by a later edit (e.g. an item removed/shrunk after the
  // amount was set). The input's own `isAllowed` clamp only fires on
  // keystrokes, so it can't catch drift caused by the total itself moving —
  // this is recomputed every render straight off the current `orderTotal`.
  const overTotal = isFinancing && effectiveFinanced > orderTotal;
  const remainder = Math.max(orderTotal - effectiveFinanced, 0);

  const warnings: { title: string; description: string }[] = [];
  if (overTotal) {
    warnings.push({
      title: "Above the order total",
      description: `Your financed amount now exceeds the order total of ${money(orderTotal)} — reduce it or it will be rejected.`,
    });
  }
  if (
    isFinancing &&
    preview?.maxLoanPerOrder != null &&
    effectiveFinanced > preview.maxLoanPerOrder
  ) {
    warnings.push({
      title: "Above the supplier's financing cap",
      description: `This amount is above the supplier's per-order financing cap of ${money(preview.maxLoanPerOrder)}. You can still submit — approval isn't guaranteed above the cap.`,
    });
  }
  if (
    isFinancing &&
    bestPreQual?.qualifiedAmount != null &&
    effectiveFinanced > bestPreQual.qualifiedAmount
  ) {
    warnings.push({
      title: "Above your pre-qualified estimate",
      description: `This amount is above your pre-qualified estimate of ${money(bestPreQual.qualifiedAmount)}. You can still submit — approval isn't guaranteed above this estimate.`,
    });
  }

  const handleSelectMethod = (method: LpoPaymentMethod) => {
    if (disabled) return;
    if (method === value.paymentMethod) return;
    if (method === "SETTLO_FINANCING" && !financingEligible) return;
    if (method === "DIRECT") {
      setIsPartial(false);
      onChange({ paymentMethod: "DIRECT", financedAmount: undefined });
    } else {
      onChange({
        paymentMethod: "SETTLO_FINANCING",
        financedAmount: undefined,
      });
    }
  };

  const handlePartialToggle = (checked: boolean) => {
    setIsPartial(checked);
    // Seed with the current total (clamped to 2dp) so the field always
    // starts on a valid, positive number the merchant can edit down —
    // never a blank input that would silently mean "full financing" again.
    const seed =
      checked && orderTotal > 0
        ? Math.round(orderTotal * 100) / 100
        : undefined;
    onChange({ paymentMethod: value.paymentMethod, financedAmount: seed });
  };

  const handleAmountChange = (floatValue: number | undefined) => {
    onChange({
      paymentMethod: value.paymentMethod,
      financedAmount: floatValue,
    });
  };

  const showEligibilityFallback =
    !previewLoading &&
    !preQualLoading &&
    (preview === null || preQual === null);

  return (
    <div className="space-y-4">
      <div className={formStyles.radioGrid}>
        <button
          type="button"
          aria-pressed={!isFinancing}
          disabled={disabled}
          onClick={() => handleSelectMethod("DIRECT")}
          className={cn(
            formStyles.radioCard,
            !isFinancing && formStyles.radioCardOn,
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <span className={formStyles.dot} />
          <div>
            <div className={formStyles.l}>Pay supplier directly</div>
            <div className={formStyles.h}>
              You settle this purchase order with the supplier yourself.
            </div>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={isFinancing}
          disabled={disabled || !financingEligible}
          onClick={() => handleSelectMethod("SETTLO_FINANCING")}
          className={cn(
            formStyles.radioCard,
            isFinancing && formStyles.radioCardOn,
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <span className={formStyles.dot} />
          <div>
            <div className={formStyles.l}>Pay with Settlo financing</div>
            <div className={formStyles.h}>
              {financingEligible
                ? "Settlo pays the supplier; you repay Settlo on agreed terms."
                : "Link this supplier to a Settlo-approved supplier to enable financing."}
            </div>
          </div>
        </button>
      </div>

      {isFinancing && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-[10px] border border-line-2 bg-canvas/60 px-3.5 py-3 text-[12.5px]">
            {(previewLoading || preQualLoading) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking eligibility…
              </div>
            )}

            {showEligibilityFallback && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Couldn&apos;t check eligibility — you can still submit.
                </span>
              </div>
            )}

            {!previewLoading && preview && (
              <div
                className={cn(
                  "flex items-start gap-2",
                  preview.financeable
                    ? "text-emerald-600 dark:text-emerald-500"
                    : "text-ink-2",
                )}
              >
                {preview.financeable ? (
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span>
                  {preview.financeable
                    ? "This order is eligible for Settlo financing."
                    : (preview.reason ??
                      "This supplier isn't eligible for financing right now.")}
                </span>
              </div>
            )}

            {!previewLoading && preview?.maxLoanPerOrder != null && (
              <p className="text-ink-2">
                Supplier financing cap:{" "}
                <span className="font-mono tabular-nums">
                  {money(preview.maxLoanPerOrder)}
                </span>
              </p>
            )}

            {!preQualLoading && bestPreQual?.qualifiedAmount != null && (
              <p className="text-ink-2">
                You&apos;re pre-qualified up to{" "}
                <span className="font-mono tabular-nums">
                  {money(bestPreQual.qualifiedAmount)}
                </span>{" "}
                <span className="text-muted-foreground">(estimate)</span>
              </p>
            )}
          </div>

          <div className={formStyles.toggleRow}>
            <div>
              <div className="text-[13px] font-medium text-ink">
                Finance part of it
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Off finances the full order total.
              </div>
            </div>
            <Switch
              checked={isPartial}
              onCheckedChange={handlePartialToggle}
              disabled={disabled}
            />
          </div>

          {isPartial ? (
            <div className="space-y-1.5">
              <ControlBox suffix="TZS">
                <NumericFormat
                  className={cn(controlInputClass, "tabular-nums")}
                  value={value.financedAmount ?? ""}
                  onValueChange={(v) => handleAmountChange(v.floatValue)}
                  thousandSeparator
                  decimalScale={2}
                  allowNegative={false}
                  isAllowed={(v) =>
                    v.floatValue === undefined || v.floatValue <= orderTotal
                  }
                  placeholder="0.00"
                  disabled={disabled}
                />
              </ControlBox>
              {value.financedAmount === undefined ? (
                <p className="text-[11.5px] text-muted-foreground">
                  Leave blank to finance the full order.
                </p>
              ) : overTotal ? null : (
                <p className="text-[11.5px] text-muted-foreground">
                  You&apos;ll pay {money(remainder)} to the supplier directly.
                </p>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              Financing the full order:{" "}
              <span className="font-mono tabular-nums text-ink">
                {money(orderTotal)}
              </span>
            </p>
          )}

          {warnings.map((w) => (
            <Alert key={w.title} tone="warning">
              <AlertIcon>
                <AlertTriangle className="h-3.5 w-3.5" />
              </AlertIcon>
              <AlertBody>
                <AlertTitle>{w.title}</AlertTitle>
                <AlertDescription>{w.description}</AlertDescription>
              </AlertBody>
            </Alert>
          ))}

          <p className="border-t border-line pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
            The supplier reviews and accepts your order first; underwriting
            starts after acceptance. You&apos;ll review and accept the loan
            terms on the Loans page.
          </p>
        </div>
      )}
    </div>
  );
}
