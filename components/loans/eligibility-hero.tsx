import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

import {
  formatTzs,
  formatTzsShort,
  type Loan,
  type LoanEligibility,
} from "@/types/loans/type";

const shortDate = (d?: string | null) =>
  d
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(d),
      )
    : "—";

// Soft orange glow bleeding from the top-right corner (design's .hxd::after).
const GLOW: React.CSSProperties = {
  background:
    "radial-gradient(circle at 80% 25%, hsl(var(--primary) / 0.13), transparent 62%)",
};

// Headline amount — the dominant figure on the card: 50px (42px on mobile),
// deep orange.
const amountClass =
  "text-[42px] font-bold leading-[0.95] tracking-[-0.035em] text-primary-dark sm:text-[50px]";

// Amount denominator ("/ 6,500,000") — design's .hxd-amt .u (15px muted).
const unitClass =
  "ml-2.5 text-[15px] font-semibold tracking-[-0.01em] text-muted-foreground";

// Primary CTA — deliberately compact (40px tall, 13.5px) so it reads as
// subordinate to the headline amount.
const ctaClass =
  "inline-flex h-10 flex-shrink-0 items-center gap-1.5 rounded-[10px] bg-primary px-4 text-[13.5px] font-bold tracking-[-0.01em] text-white shadow-[0_4px_12px_-5px_rgba(235,127,68,0.5)] transition hover:brightness-105";

function Chip({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  tone?: "orange" | "pos";
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-[11px] border px-3.5 py-3 " +
        (highlight
          ? "border-primary/30 bg-primary-light"
          : "border-line bg-canvas")
      }
    >
      <div className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-1.5 text-[16.5px] font-bold tracking-[-0.02em] " +
          (tone === "orange"
            ? "text-primary-dark"
            : tone === "pos"
              ? "text-pos"
              : "text-ink")
        }
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Eligibility hero — a single light card (design's `.hxd`) with a deep-orange
 * headline amount and a row of stat chips. Tuned to the "Settlo Home Dashboard"
 * mock: 12px corners (`rounded-xl`, matching the sibling money cards), a flat
 * 44px amount, and 11px chips/CTA. Adapts to the one-active-loan rule:
 * "available to borrow / Apply" when eligible, "outstanding / View active loan"
 * when repaying. `canApply` hides the Apply CTA (caller passes loans:apply).
 */
export function EligibilityHero({
  eligibility,
  activeLoan,
  canApply = true,
}: {
  eligibility: LoanEligibility;
  activeLoan?: Loan | null;
  /** Whether to show the "Apply" CTA (caller passes the loans:apply check). */
  canApply?: boolean;
}) {
  const currency = eligibility.currencyCode;

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-card px-5 py-5 sm:px-6 sm:py-6">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[8%] -top-[30%] h-[150%] w-[44%]"
        style={GLOW}
      />

      {eligibility.hasActiveLoan && activeLoan ? (
        // ── Repaying: one active facility ───────────────────────────────
        <>
          <div className="relative z-[1] flex items-center justify-between gap-4">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-warn-tint px-[11px] py-1 text-[11.5px] font-semibold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />1 active
              loan · repaying
            </span>
            <span className="truncate font-mono text-[10.5px] tracking-[0.02em] text-muted-foreground">
              {activeLoan.productName} · {activeLoan.reference}
            </span>
          </div>

          <div className="relative z-[1] mt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
            Outstanding balance
          </div>
          <div className={"relative z-[1] mt-2 " + amountClass}>
            {currency} {activeLoan.outstanding.toLocaleString()}
            <span className={unitClass}>
              of {activeLoan.principal.toLocaleString()}
            </span>
          </div>

          <div className="relative z-[1] mb-0.5 mt-3.5 h-2 max-w-[430px] overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-pos"
              style={{ width: `${activeLoan.paidPct}%` }}
            />
          </div>

          <div className="relative z-[1] mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-[46ch] text-[13px] leading-[1.55] text-ink-3">
              {activeLoan.paidPct}% repaid · {activeLoan.paidInstallments}/
              {activeLoan.totalInstallments} payments. Apply for new financing
              once this loan is fully cleared — one at a time.
            </p>
            <Link href={`/loans/${activeLoan.id}`} className={ctaClass}>
              View active loan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative z-[1] mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Chip
              label="Next payment"
              value={formatTzs(activeLoan.nextPaymentAmount, currency)}
              tone="orange"
              highlight
            />
            <Chip label="Due" value={shortDate(activeLoan.nextPaymentDate)} />
            <Chip
              label="Limit when cleared"
              value={`${currency} ${formatTzsShort(eligibility.limit)}`}
            />
            <Chip
              label="On-time rate"
              value={eligibility.onTimeRatePct != null ? `${eligibility.onTimeRatePct}%` : "—"}
              tone="pos"
            />
          </div>
        </>
      ) : (
        // ── Eligible: no active loan, can apply ─────────────────────────
        <div className="relative z-[1] grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
          {/* Left: badge, headline amount, description, actions */}
          <div>
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-primary-light px-[11px] py-1 text-[11.5px] font-semibold text-primary-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Pre-qualified
            </span>

            <div className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              Available to borrow
            </div>
            <div className={"mt-2 " + amountClass}>
              {currency} {formatTzsShort(eligibility.limit)}
              <span className={unitClass}>
                / {eligibility.limit.toLocaleString()}
              </span>
            </div>

            <p className="mt-3 max-w-[46ch] text-[13px] leading-[1.55] text-ink-3">
              A financing limit from your sales &amp; repayment history on
              Settlo. No paperwork — funds in as little as 24 hours.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-[18px] gap-y-3">
              {canApply && (
                <Link href="/loans/apply" className={ctaClass}>
                  <Zap className="h-3.5 w-3.5" /> Apply for financing
                </Link>
              )}
              <Link
                href="/loans"
                className="text-[13px] font-semibold text-primary-dark hover:text-primary"
              >
                See terms &amp; rates →
              </Link>
            </div>
          </div>

          {/* Right: stat chips, 2×2 */}
          <div className="grid grid-cols-2 gap-2.5">
            <Chip
              label="Available now"
              value={formatTzs(eligibility.available, currency)}
              tone="orange"
              highlight
            />
            <Chip label="Active loans" value={eligibility.hasActiveLoan ? "1" : "0"} />
            {eligibility.onTimeRatePct != null && (
              <Chip
                label="Loans repaid"
                value={String(eligibility.loansRepaid)}
              />
            )}
            {eligibility.onTimeRatePct != null && (
              <Chip
                label="On-time rate"
                value={`${eligibility.onTimeRatePct}%`}
                tone="pos"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
