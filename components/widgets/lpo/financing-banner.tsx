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
import { getSupplierFinancingEligibility } from "@/lib/actions/loan-applications-actions";
import {
  formatFeeRate,
  type SupplierFinancingEligibility,
} from "@/types/loans/supplier-financing";
import { formatTzs } from "@/types/loans/type";
import type { LoanApplication } from "@/types/loans/applications";
import type { Lpo } from "@/types/lpo/type";

import { FinanceFlowModal } from "./finance-flow/finance-flow-modal";

type EligibilityFetch =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "done"; result: SupplierFinancingEligibility }
  | { kind: "failed" };

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
  const bannerEligible =
    lpo.supplierAcknowledgement === "ACCEPTED" &&
    (lpo.status === "APPROVED" || lpo.status === "PARTIALLY_RECEIVED");

  const financingStatus = lpo.financingStatus ?? "NONE";
  const financed =
    financingStatus === "PAID" || application?.status === "ACCEPTED";
  const offerReady = !financed && application?.status === "APPROVED";
  const inProgress =
    !financed &&
    !offerReady &&
    ((application != null &&
      ["DRAFT", "SUBMITTED", "IN_REVIEW", "COMPLIANCE_HOLD"].includes(
        application.status,
      )) ||
      // The LPO carries an application we couldn't read (transient LMS
      // failure server-side) — show honest in-progress, not a fresh check.
      (application == null &&
        Boolean(lpo.loanApplicationId) &&
        financingStatus !== "DECLINED"));
  const declined =
    !financed &&
    !offerReady &&
    !inProgress &&
    (application?.status === "REJECTED" ||
      (application == null && financingStatus === "DECLINED"));
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
  const resumeApplicationId =
    application?.id ??
    lpo.loanApplicationId ??
    eligibility?.existingApplicationId ??
    null;

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
    (eligibility && eligibility.eligible === null)
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
  } else if (declined) {
    body = (
      <Strip
        icon={
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-canvas text-ink-3">
            <Info className="h-5 w-5" />
          </span>
        }
        title="Financing isn't available for this order"
        detail={
          application?.declineReason ??
          "This order didn't qualify for financing — you can pay the supplier directly."
        }
      />
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
                disabled={!canApply}
                title={
                  canApply
                    ? undefined
                    : "Requesting financing needs the loans:apply permission"
                }
              >
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                Finance this order
              </Button>
            </div>
          }
        />
        {!canApply && (
          <p className="text-[11.5px] text-muted-foreground">
            You can see this check, but requesting financing needs the{" "}
            <b className="font-medium text-ink-2">loans:apply</b> permission.
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
