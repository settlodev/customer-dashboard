"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/widgets/form-error";
import { getLpo } from "@/lib/actions/lpo-actions";
import {
  acceptOffer,
  getMyApplication,
} from "@/lib/actions/loan-applications-actions";
import {
  SUPPLIER_FINANCING_GATE_CODES,
  formatFeeRate,
  type SupplierFinancingQuote,
} from "@/types/loans/supplier-financing";
import { formatTzs } from "@/types/loans/type";
import type { LoanApplication } from "@/types/loans/applications";

const POLL_INTERVAL_MS = 1500;
const POLL_BUDGET_MS = 20_000;
/** acceptOffer backoff on retryable gate codes — 2+3+4 = 9s ≤ the spec's 10s cap. */
const ACCEPT_RETRY_DELAYS_MS = [2000, 3000, 4000];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

type OfferPhase =
  | { kind: "locating" }
  | { kind: "deciding" }
  | { kind: "review" }
  | { kind: "offer"; application: LoanApplication }
  | { kind: "declined"; reason: string | null }
  | { kind: "timeout" }
  | { kind: "accepted"; application: LoanApplication };

/**
 * Step 3 of the finance-flow modal. The application is minted ASYNC by the
 * LMS consumer after start-financing publishes SUPPLIER_ORDER_CREATED, so
 * this step first polls the LPO for `loanApplicationId` (~1.5s, ≤20s), then
 * the application itself until a decision state (spec §3.4):
 *  - APPROVED  → real offer from `offerQuote`, Accept button.
 *  - IN_REVIEW → honest "offer being prepared" state (COMPLIANCE_HOLD is
 *                masked to IN_REVIEW on the borrower wire — no-tipping-off).
 *  - REJECTED  → friendly decline (`declineReason`).
 *  - ACCEPTED  → straight to the accepted state (resume after re-open).
 * Timeout is not a failure: closing the modal is safe, the banner resumes.
 */
export function OfferStep({
  lpoId,
  initialApplicationId,
  canApply,
  phoneJustVerified,
  eligibilityQuote,
  onAccepted,
  onNeedsTerms,
  onNeedsPhone,
}: {
  lpoId: string;
  initialApplicationId: string | null;
  canApply: boolean;
  phoneJustVerified: boolean;
  eligibilityQuote: SupplierFinancingQuote | null;
  onAccepted: (application: LoanApplication) => void;
  onNeedsTerms: () => void;
  onNeedsPhone: () => void;
}) {
  const [phase, setPhase] = useState<OfferPhase>({ kind: "locating" });
  const [retryNonce, setRetryNonce] = useState(0);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepting, startAccept] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: "locating" });

    const run = async () => {
      // Phase 1 — locate the application the event loop minted.
      let applicationId = initialApplicationId;
      if (!applicationId) {
        const deadline = Date.now() + POLL_BUDGET_MS;
        while (!cancelled && Date.now() < deadline) {
          const lpo = await getLpo(lpoId).catch(() => null);
          if (lpo?.loanApplicationId) {
            applicationId = lpo.loanApplicationId;
            break;
          }
          await sleep(POLL_INTERVAL_MS);
        }
      }
      if (cancelled) return;
      if (!applicationId) {
        setPhase({ kind: "timeout" });
        return;
      }

      // Phase 2 — wait for a decision state on the application.
      setPhase({ kind: "deciding" });
      const deadline = Date.now() + POLL_BUDGET_MS;
      while (!cancelled) {
        const app = await getMyApplication(applicationId).catch(() => null);
        if (cancelled) return;
        if (app) {
          if (app.status === "APPROVED") {
            setPhase({ kind: "offer", application: app });
            return;
          }
          if (app.status === "ACCEPTED") {
            setPhase({ kind: "accepted", application: app });
            return;
          }
          if (app.status === "REJECTED") {
            setPhase({ kind: "declined", reason: app.declineReason });
            return;
          }
          if (app.status === "IN_REVIEW" || app.status === "COMPLIANCE_HOLD") {
            setPhase({ kind: "review" });
            return;
          }
          // DRAFT/SUBMITTED — auto-decisioning still running; keep polling.
        }
        if (Date.now() >= deadline) {
          setPhase({ kind: "timeout" });
          return;
        }
        await sleep(POLL_INTERVAL_MS);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [lpoId, initialApplicationId, retryNonce]);

  const handleAccept = (application: LoanApplication) => {
    setAcceptError(null);
    startAccept(async () => {
      let res = await acceptOffer(application.id);
      for (const delayMs of ACCEPT_RETRY_DELAYS_MS) {
        if (res.responseType === "success") break;
        const code = res.errorCode;
        const retryable =
          code === SUPPLIER_FINANCING_GATE_CODES.PHONE_VERIFICATION_UNAVAILABLE ||
          // Right after in-modal OTP success, the Accounts PHONE_VERIFIED
          // projection may not have landed yet — the gate then reads
          // phoneVerified=false. Retry instead of bouncing the user back
          // to a step they just completed.
          (code === SUPPLIER_FINANCING_GATE_CODES.PHONE_NOT_VERIFIED &&
            phoneJustVerified);
        if (!retryable) break;
        await sleep(delayMs);
        res = await acceptOffer(application.id);
      }

      if (res.responseType === "success") {
        const accepted =
          res.data ?? { ...application, status: "ACCEPTED" as const };
        setPhase({ kind: "accepted", application: accepted });
        onAccepted(accepted);
        return;
      }
      if (res.errorCode === SUPPLIER_FINANCING_GATE_CODES.TERMS_NOT_ACCEPTED) {
        onNeedsTerms();
        return;
      }
      if (res.errorCode === SUPPLIER_FINANCING_GATE_CODES.PHONE_NOT_VERIFIED) {
        onNeedsPhone();
        return;
      }
      // Everything else (OFFER_EXPIRED, conflicts, transport) — surface the
      // backend's message and re-poll so a stale offer re-renders truthfully.
      setAcceptError(res.message);
      setRetryNonce((n) => n + 1);
    });
  };

  if (phase.kind === "locating" || phase.kind === "deciding") {
    return (
      <WaitingPanel
        title={
          phase.kind === "locating"
            ? "Setting up your financing request…"
            : "Preparing your offer…"
        }
        detail="This usually takes a few seconds. You can close this window — your progress is saved and the order page will show the latest state."
      />
    );
  }

  if (phase.kind === "timeout") {
    return (
      <div className="space-y-4">
        <WaitingPanel
          title="Still working on it"
          detail="Your request was submitted, but the decision is taking longer than usual. Check again, or close this window — the order page tracks progress."
          still
        />
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={() => setRetryNonce((n) => n + 1)}
        >
          Check again
        </Button>
      </div>
    );
  }

  if (phase.kind === "review") {
    return (
      <StatePanel
        icon={<Clock3 className="h-5 w-5" />}
        tone="warn"
        title="Your offer is being prepared"
        detail="This request needs a quick review by the Settlo team. We'll notify you as soon as a decision is ready — you can close this window."
      />
    );
  }

  if (phase.kind === "declined") {
    return (
      <StatePanel
        icon={<XCircle className="h-5 w-5" />}
        tone="neg"
        title="Financing wasn't approved this time"
        detail={
          phase.reason ??
          "This order doesn't qualify for financing right now. You can pay the supplier directly."
        }
      />
    );
  }

  if (phase.kind === "accepted") {
    return (
      <div className="rounded-xl border border-pos/30 bg-pos-tint p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-pos text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[14.5px] font-semibold leading-relaxed text-ink">
              Offer accepted — Settlo is paying your supplier directly.
            </div>
            <p className="mt-1 text-xs text-ink-2">
              You&apos;ll be notified when the payment lands. Track every step
              in the financing card on this order.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // phase.kind === "offer"
  const { application } = phase;
  const quote = application.offerQuote ?? null;
  const totalRepayable = quote?.totalRepayable ?? null;
  const financed = quote?.financedAmount ?? application.approvedAmount;
  const termDays = quote?.termDays ?? application.approvedTermDays;
  const limitAfter = eligibilityQuote?.limitAfter ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary-light text-primary-dark">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">Your offer</div>
          <div className="text-xs text-muted-foreground">
            {quote?.offerExpiresAt
              ? `Valid until ${formatDate(quote.offerExpiresAt)}`
              : "Review the terms and accept to continue"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-canvas/60 p-4 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
          Total repayable
        </div>
        <div className="mt-1 text-[26px] font-bold tracking-tight text-primary-dark">
          {totalRepayable != null ? formatTzs(totalRepayable) : formatTzs(financed)}
        </div>
        {quote?.indicativeDueDate && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            due around {formatDate(quote.indicativeDueDate)}
          </div>
        )}
      </div>

      <div className="divide-y divide-line rounded-xl border border-line">
        <QuoteRow label="Settlo pays your supplier" value={formatTzs(financed)} />
        {quote && (
          <QuoteRow
            label={`One-time fee (${formatFeeRate(quote.feeRate)})`}
            value={formatTzs(quote.feeAmount)}
          />
        )}
        <QuoteRow
          label="Term"
          value={termDays != null ? `${termDays} days` : "—"}
        />
        {limitAfter != null && (
          <QuoteRow
            label="Financing limit after this order"
            value={formatTzs(limitAfter)}
          />
        )}
      </div>

      {acceptError && <FormError message={acceptError} />}

      {canApply ? (
        <>
          <Button
            className="w-full justify-center"
            disabled={accepting}
            onClick={() => handleAccept(application)}
          >
            {accepting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            Accept offer
          </Button>
          <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
            By accepting you agree to repay{" "}
            {totalRepayable != null ? formatTzs(totalRepayable) : "the amount above"}{" "}
            under the supplier financing terms you accepted.
          </p>
        </>
      ) : (
        <div className="flex gap-2.5 rounded-xl bg-canvas p-3.5 text-[12.5px] leading-relaxed text-ink-3">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 text-ink-2" />
          <div>
            You can view this offer, but accepting it needs the{" "}
            <b className="font-semibold text-ink-2">loans:apply</b> permission.
            Ask an account owner to accept it, or request access.
          </div>
        </div>
      )}
    </div>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[12.5px] text-ink-2">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}

function WaitingPanel({
  title,
  detail,
  still,
}: {
  title: string;
  detail: string;
  still?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-8 text-center">
      {still ? (
        <Clock3 className="h-6 w-6 text-ink-3" />
      ) : (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      )}
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  );
}

function StatePanel({
  icon,
  tone,
  title,
  detail,
}: {
  icon: React.ReactNode;
  tone: "warn" | "neg";
  title: string;
  detail: string;
}) {
  return (
    <div
      className={
        tone === "warn"
          ? "flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-tint p-5 text-warn"
          : "flex items-start gap-3 rounded-xl border border-neg/30 bg-neg-tint p-5 text-neg"
      }
    >
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-[14px] font-semibold text-ink">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-ink-2">{detail}</p>
      </div>
    </div>
  );
}
