"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Info,
  RefreshCcw,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/context/permissionsContext";
import { getSupplierFinancingEligibility } from "@/lib/actions/loan-applications-actions";
import {
  formatFeeRate,
  type SupplierFinancingEligibility,
} from "@/types/loans/supplier-financing";
import { formatTzs } from "@/types/loans/type";
import type {
  ApplicationStatus,
  LoanApplication,
} from "@/types/loans/applications";
import type { Lpo } from "@/types/lpo/type";

import { FinanceFlowModal } from "./finance-flow/finance-flow-modal";

type EligibilityFetch =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "done"; result: SupplierFinancingEligibility }
  | { kind: "failed" };

type ApplicationBucket =
  | "financed"
  | "offerReady"
  | "inProgress"
  | "declined"
  | "reQualify";

/**
 * Exhaustive mapping over the full 9-value `ApplicationStatus` union (spec
 * §7), mirroring the pattern `OfferStep` uses for its own status switch —
 * a `default` arm typed `never` so a future status addition fails to
 * compile here instead of silently falling into the wrong banner state.
 *
 * WITHDRAWN / EXPIRED are terminal but RE-QUALIFIABLE: they bucket as
 * "reQualify" rather than "declined" so the banner falls through to a
 * fresh eligibility check instead of a dead none-state. Critically, they
 * must NOT be treated as resumable (see `resumeApplicationId` below) —
 * `FinanceFlowModal` treats any non-null id as "resume" and skips
 * `startFinancing()`, which is the only path that creates a new
 * application, so handing it a terminal id would dead-end the merchant.
 */
function classifyApplicationStatus(
  status: ApplicationStatus,
): ApplicationBucket {
  switch (status) {
    case "ACCEPTED":
      return "financed";
    case "APPROVED":
      return "offerReady";
    case "DRAFT":
    case "SUBMITTED":
    case "IN_REVIEW":
    case "COMPLIANCE_HOLD":
      return "inProgress";
    case "REJECTED":
      return "declined";
    case "WITHDRAWN":
    case "EXPIRED":
      return "reQualify";
    default: {
      // Defensive fallback for a status this banner doesn't know about.
      // `status` is typed `never` here because every real ApplicationStatus
      // member is handled above — a status added to the union without a
      // case here fails this assignment at compile time, matching the
      // pattern `OfferStep` uses for the same union. At runtime (e.g. an
      // unrecognised wire value from an older/newer LMS build), the raw
      // value passes through untouched — it won't equal any of the five
      // known buckets, so every `applicationBucket === "…"` check below
      // is false and the banner falls through to a fresh eligibility
      // check rather than guessing at resume.
      const exhaustiveCheck: never = status;
      return exhaustiveCheck;
    }
  }
}

/**
 * Whether a raw wire status string (from `eligibility.applicationStatus`,
 * typed loosely as `string | null` since it mirrors the LMS's stateless
 * eligibility response rather than the strict `ApplicationStatus` union) is
 * one of the three terminal, non-accepted outcomes. Used to stop the
 * "in progress" strip from rendering for a dead application, and to pick
 * honest copy for the declined/expired strip — see the fix for the
 * `markFinancingTerminated` collapse below.
 */
function isTerminalApplicationStatus(
  status: string | null | undefined,
): status is "REJECTED" | "WITHDRAWN" | "EXPIRED" {
  return status === "REJECTED" || status === "WITHDRAWN" || status === "EXPIRED";
}

/**
 * Post-acceptance financing banner on the PO detail page (spec §7). The
 * page mounts it only when LOANS_ENABLED and the viewer holds loans:read;
 * the component additionally self-gates on the LPO being supplier-accepted
 * and open (APPROVED / PARTIALLY_RECEIVED). State precedence:
 * financed → live application → declined → live eligibility check.
 * The stateless eligibility endpoint is only called when no application
 * exists — an in-flight application renders from its own status instead.
 */
export function FinancingBanner({
  lpo,
  application,
  canApply,
}: {
  lpo: Lpo;
  application: LoanApplication | null;
  canApply: boolean;
}) {
  // `startLpoFinancing` (the Inventory endpoint `startFinancing()` calls to
  // both first-time initiate AND retry-a-declined-shadow) requires
  // purchasing:approve, NOT loans:apply — `canApply` alone gates a CTA the
  // caller can't actually complete, landing on the modal's error step. Every
  // CTA below that triggers `startFinancing()` (i.e. opens the modal with
  // `resumeApplicationId = null`) needs both permissions; CTAs that only
  // resume an existing application (Review offer / View progress) still use
  // `canApply` alone since they never call that endpoint.
  const { hasPermission } = usePermissions();
  const canStartFinancing = canApply && hasPermission("purchasing:approve");

  const bannerEligible =
    lpo.supplierAcknowledgement === "ACCEPTED" &&
    (lpo.status === "APPROVED" || lpo.status === "PARTIALLY_RECEIVED");

  const financingStatus = lpo.financingStatus ?? "NONE";
  const applicationBucket = application
    ? classifyApplicationStatus(application.status)
    : null;

  const financed = financingStatus === "PAID" || applicationBucket === "financed";
  const offerReady = !financed && applicationBucket === "offerReady";
  const inProgress =
    !financed &&
    !offerReady &&
    (applicationBucket === "inProgress" ||
      // The LPO carries an application we couldn't read (transient LMS
      // failure server-side) — show honest in-progress, not a fresh check.
      (application == null &&
        Boolean(lpo.loanApplicationId) &&
        financingStatus !== "DECLINED"));
  const declined =
    !financed &&
    !offerReady &&
    !inProgress &&
    (applicationBucket === "declined" ||
      (application == null && financingStatus === "DECLINED"));
  // Neither matched above → either no application at all, or one bucketed
  // "reQualify" (WITHDRAWN/EXPIRED — terminal, but the merchant may qualify
  // again): both cases call eligibility fresh (spec §7 point 4).
  const needsEligibility =
    bannerEligible && !financed && !offerReady && !inProgress && !declined;

  // Named `check`, not `fetch`, to avoid shadowing the global fetch.
  const [check, setCheck] = useState<EligibilityFetch>({ kind: "idle" });
  const [rerunNonce, setRerunNonce] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const rerun = useCallback(() => setRerunNonce((n) => n + 1), []);

  useEffect(() => {
    if (!needsEligibility) return;
    let cancelled = false;
    setCheck({ kind: "checking" });
    void (async () => {
      const result = await getSupplierFinancingEligibility(lpo.id);
      if (cancelled) return;
      setCheck(result ? { kind: "done", result } : { kind: "failed" });
    })();
    return () => {
      cancelled = true;
    };
  }, [needsEligibility, lpo.id, rerunNonce]);

  if (!bannerEligible) return null;

  const eligibility = check.kind === "done" ? check.result : null;
  // The LMS's eligibility endpoint reports `eligible: null` whenever
  // Inventory's financing-context still carries a live order/application —
  // including, transiently, one that has ALREADY resolved terminal on the
  // LMS side but whose termination Inventory hasn't finished processing yet
  // (`markFinancingTerminated` nulls the shadow order's `loanApplicationId`
  // asynchronously, off the same `LOAN_APPLICATION_TERMINATED` event this
  // reads live). `applicationStatus` in that response reflects the real,
  // current LMS status, so a terminal value here means "dead," not
  // "in progress" — see `eligibilityTerminal` below.
  const eligibilityTerminal =
    eligibility != null &&
    eligibility.eligible === null &&
    isTerminalApplicationStatus(eligibility.applicationStatus);
  // Resume only a genuinely LIVE application — `FinanceFlowModal` treats
  // any non-null id as "resume" and skips `startFinancing()`, the only path
  // that creates a NEW application. A terminal application (REJECTED /
  // WITHDRAWN / EXPIRED, i.e. `applicationBucket` is "declined" or
  // "reQualify", or `eligibilityTerminal`) must never seed this: handing the
  // modal a dead id would dead-end the merchant on OfferStep's "unavailable"
  // panel with no way to actually start a fresh request (the retry path —
  // Inventory resetting the shadow order and re-publishing
  // SUPPLIER_ORDER_CREATED — only fires from `startFinancing()`, which
  // requires `resumeApplicationId == null`). `lpo.loanApplicationId` is
  // redundant with `application.id` whenever `application` resolved (same
  // source), so it is only consulted as a fallback when the application
  // couldn't be read at all (transient LMS failure — the `inProgress`
  // fail-open case above, presumed live) or when eligibility itself reports
  // a live, NON-terminal application (`existingApplicationId`, set only
  // when `eligible === null`).
  const applicationIsLive =
    applicationBucket === "financed" ||
    applicationBucket === "offerReady" ||
    applicationBucket === "inProgress";
  const resumeApplicationId = application
    ? applicationIsLive
      ? application.id
      : null
    : eligibilityTerminal
      ? null
      : (lpo.loanApplicationId ?? eligibility?.existingApplicationId ?? null);

  let body: React.ReactNode;

  if (financed) {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-pos text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        }
        title={
          financingStatus === "PAID"
            ? "Settlo has paid your supplier"
            : "Financing accepted — Settlo is paying your supplier"
        }
        detail="Track every step in the financing card below."
        tone="pos"
      />
    );
  } else if (offerReady) {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-primary-light text-primary-dark">
            <Sparkles className="h-5 w-5" />
          </span>
        }
        title="Your financing offer is ready"
        detail="Review the amount, fee and term, then accept to have Settlo pay this supplier."
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Review offer
          </Button>
        }
      />
    );
  } else if (
    inProgress ||
    (eligibility && eligibility.eligible === null && !eligibilityTerminal)
  ) {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-warn-tint text-warn">
            <Clock3 className="h-5 w-5" />
          </span>
        }
        title="Financing request in progress"
        detail="Settlo is reviewing this order. You'll be notified when there's a decision."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
          >
            View progress
          </Button>
        }
      />
    );
  } else if (declined || eligibilityTerminal) {
    // The specific terminal reason (REJECTED vs WITHDRAWN vs EXPIRED) is
    // only known here in the narrow window before Inventory processes
    // `LOAN_APPLICATION_TERMINATED`: `markFinancingTerminated` collapses all
    // three into the SAME bare `financingStatus = DECLINED` + nulled
    // `loanApplicationId`, permanently erasing the distinction server-side.
    // Prefer whichever live signal is actually available (the fetched
    // `application`, then a still-live `eligibility.applicationStatus`);
    // once both are gone, fall back to reason-agnostic copy instead of
    // asserting "didn't qualify" — false for an expired-but-never-acted-on
    // offer or a withdrawn request, and unverifiable either way at that
    // point.
    const knownStatus: string | null =
      application?.status ??
      (eligibilityTerminal ? eligibility?.applicationStatus ?? null : null);
    const expired = knownStatus === "EXPIRED";
    const withdrawn = knownStatus === "WITHDRAWN";
    body = (
      <div className="space-y-3">
        <Strip
          icon={
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-canvas text-ink-3">
              <Info className="h-5 w-5" />
            </span>
          }
          title={
            expired
              ? "Your financing offer expired"
              : withdrawn
                ? "Financing request withdrawn"
                : "Financing isn't available for this order"
          }
          detail={
            expired
              ? "The offer window for this order closed before it was accepted. You can pay the supplier directly, or try financing again."
              : withdrawn
                ? "This financing request is no longer active. You can pay the supplier directly, or try financing again."
                : (application?.declineReason ??
                  "This financing request didn't go through. You can pay the supplier directly, or try financing again.")
          }
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalOpen(true)}
              disabled={!canStartFinancing}
              title={
                canStartFinancing
                  ? undefined
                  : "Starting financing needs the loans:apply and purchasing:approve permissions"
              }
            >
              <Wallet className="mr-1.5 h-3.5 w-3.5" />
              Try financing again
            </Button>
          }
        />
        {!canStartFinancing && (
          <p className="text-[11.5px] text-muted-foreground">
            You can see this order&apos;s financing status, but starting a
            new request needs the{" "}
            <b className="font-medium text-ink-2">loans:apply</b> and{" "}
            <b className="font-medium text-ink-2">purchasing:approve</b>{" "}
            permissions.
          </p>
        )}
      </div>
    );
  } else if (check.kind === "checking" || check.kind === "idle") {
    body = (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
      </div>
    );
  } else if (check.kind === "failed") {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-canvas text-ink-3">
            <Info className="h-5 w-5" />
          </span>
        }
        title="Couldn't check financing for this order"
        detail="Something went wrong while checking eligibility."
        action={
          <Button size="sm" variant="outline" onClick={rerun}>
            <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            Re-run check
          </Button>
        }
      />
    );
  } else if (eligibility?.eligible && eligibility.quote) {
    const q = eligibility.quote;
    body = (
      <div className="space-y-3">
        <Strip
          icon={
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-primary-light text-primary-dark">
              <BadgeCheck className="h-5 w-5" />
            </span>
          }
          title="This order qualifies for Settlo financing"
          detail={`Settlo pays ${formatTzs(q.financedAmount, q.currency)} to your supplier; you repay ${formatTzs(q.totalRepayable, q.currency)} over ${q.termDays} days (one-time fee ${formatFeeRate(q.feeRate)}).`}
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={rerun}>
                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                Re-run check
              </Button>
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                disabled={!canStartFinancing}
                title={
                  canStartFinancing
                    ? undefined
                    : "Requesting financing needs the loans:apply and purchasing:approve permissions"
                }
              >
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                Finance this order
              </Button>
            </div>
          }
        />
        {!canStartFinancing && (
          <p className="text-[11.5px] text-muted-foreground">
            You can see this check, but requesting financing needs the{" "}
            <b className="font-medium text-ink-2">loans:apply</b> and{" "}
            <b className="font-medium text-ink-2">purchasing:approve</b>{" "}
            permissions.
          </p>
        )}
      </div>
    );
  } else {
    // Fresh check came back not-eligible — friendly reason from the LMS.
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-canvas text-ink-3">
            <Info className="h-5 w-5" />
          </span>
        }
        title="Financing isn't available for this order"
        detail={
          eligibility?.reason ??
          "This order doesn't qualify for financing right now — you can pay the supplier directly."
        }
        action={
          <Button size="sm" variant="ghost" onClick={rerun}>
            <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            Re-run check
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-5 pb-5">{body}</CardContent>
      </Card>
      <FinanceFlowModal
        lpo={lpo}
        open={modalOpen}
        onOpenChange={setModalOpen}
        canApply={canApply}
        eligibilityQuote={eligibility?.quote ?? null}
        resumeApplicationId={resumeApplicationId}
      />
    </>
  );
}

function Strip({
  icon,
  title,
  detail,
  action,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  action?: React.ReactNode;
  tone?: "pos";
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {icon}
      <div className="min-w-0 flex-1">
        <div
          className={
            tone === "pos"
              ? "text-[14px] font-semibold text-pos"
              : "text-[14px] font-semibold text-ink"
          }
        >
          {title}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
