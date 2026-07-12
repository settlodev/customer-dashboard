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

const ctaClass =
  "inline-flex h-[46px] flex-shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-bold tracking-[-0.01em] text-white shadow-[0_6px_18px_-6px_rgba(235,127,68,0.6)] transition hover:brightness-105";

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
        "rounded-[13px] border px-4 py-3.5 " +
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
          "mt-1.5 text-[18px] font-bold tracking-[-0.02em] " +
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
 * Eligibility hero — Direction D (merged). A single light card with a deep-
 * orange headline amount and a row of stat chips. Adapts to the one-active-loan
 * rule: "available to borrow / Apply" when eligible, "outstanding / View" when
 * repaying. `canApply` hides the Apply CTA (caller passes the loans:apply check).
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
    <div className="relative overflow-hidden rounded-[22px] border border-line bg-card px-5 pb-6 pt-7 sm:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[30%] -right-[8%] h-[150%] w-[44%]"
        style={GLOW}
      />

      {eligibility.hasActiveLoan && activeLoan ? (
        // ── Repaying: one active facility ───────────────────────────────
        <>
          <div className="relative z-[1] flex items-center justify-between gap-4">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-warn-tint px-3 py-[5px] text-xs font-semibold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />1 active
              loan · repaying
            </span>
            <span className="truncate font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
              {activeLoan.productName} · {activeLoan.reference}
            </span>
          </div>

          <div className="relative z-[1] mt-[18px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Outstanding balance
          </div>
          <div className="relative z-[1] mt-2 text-[40px] font-bold leading-[0.95] tracking-[-0.035em] text-primary-dark sm:text-[52px] lg:text-[58px]">
            {currency} {activeLoan.outstanding.toLocaleString()}
            <span className="ml-2.5 text-[19px] font-semibold tracking-[-0.01em] text-muted-foreground">
              of {activeLoan.principal.toLocaleString()}
            </span>
          </div>

          <div className="relative z-[1] mb-0.5 mt-3.5 h-2 max-w-[420px] overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-pos"
              style={{ width: `${activeLoan.paidPct}%` }}
            />
          </div>

          <div className="relative z-[1] mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-[50ch] text-[13.5px] leading-relaxed text-ink-3">
              {activeLoan.paidPct}% repaid · {activeLoan.paidInstallments}/
              {activeLoan.totalInstallments} payments. Apply for new financing
              once this loan is fully cleared — one at a time.
            </p>
            <Link href={`/loans/${activeLoan.id}`} className={ctaClass}>
              View active loan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative z-[1] mt-[22px] grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <>
          <div className="relative z-[1] flex items-center justify-between gap-4">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-primary-light px-3 py-[5px] text-xs font-semibold text-primary-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Pre-qualified
            </span>
            <span className="truncate font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
              Device · Stock · Working capital
            </span>
          </div>

          <div className="relative z-[1] mt-[18px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Available to borrow
          </div>
          <div className="relative z-[1] mt-2 text-[40px] font-bold leading-[0.95] tracking-[-0.035em] text-primary-dark sm:text-[52px] lg:text-[58px]">
            {currency} {formatTzsShort(eligibility.limit)}
            <span className="ml-2.5 text-[19px] font-semibold tracking-[-0.01em] text-muted-foreground">
              / {eligibility.limit.toLocaleString()}
            </span>
          </div>

          <div className="relative z-[1] mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-[50ch] text-[13.5px] leading-relaxed text-ink-3">
              A financing limit from your sales &amp; repayment history on
              Settlo. No paperwork — funds in as little as 24 hours.
            </p>
            {canApply && (
              <Link href="/loans/apply" className={ctaClass}>
                <Zap className="h-4 w-4" /> Apply for financing
              </Link>
            )}
          </div>

          <div className="relative z-[1] mt-[22px] grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        </>
      )}
    </div>
  );
}
