"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Loader2, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { acceptOffer } from "@/lib/actions/loan-applications-actions";
import { formatTzs } from "@/types/loans/type";
import type { LoanApplication } from "@/types/loans/applications";

/**
 * Offer acceptance panel — mounted by the caller only when
 * `application.status === "APPROVED"` (see `application-detail-client.tsx`).
 * Renders only fields the borrower-safe `LoanApplication` DTO actually
 * exposes (approved amount + term) — no fee/interest/total fields exist on
 * the wire, so none are fabricated here.
 */
export function OfferPanel({
  application,
  canApply,
  loanDetailReady,
}: {
  application: LoanApplication;
  canApply: boolean;
  /** Whether `/loans/{loanId}` resolves to real data yet — see `FINANCING_BACKEND_READY`
   *  in `lib/actions/loans-client.ts`. That module is server-only (reads
   *  `process.env` directly), so the flag is read once in the server
   *  `[id]/page.tsx` and threaded down through `ApplicationDetailClient` as a
   *  prop rather than imported directly into this client component. */
  loanDetailReady: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [agreeAgreement, setAgreeAgreement] = useState(false);
  const [agreeRepayment, setAgreeRepayment] = useState(false);
  const [pending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState<LoanApplication | null>(null);

  const amount = application.approvedAmount ?? application.requestedAmount;
  const termDays = application.approvedTermDays ?? application.requestedTermDays;
  const bothChecked = agreeAgreement && agreeRepayment;

  const onAccept = () => {
    startTransition(async () => {
      const res = await acceptOffer(application.id);
      if (res.responseType === "success") {
        setAccepted(res.data ?? application);
        router.refresh();
        return;
      }
      toast({
        variant: "destructive",
        title: "Couldn't accept offer",
        description: res.message,
      });
      router.refresh();
    });
  };

  if (accepted) {
    return (
      <div className="rounded-xl border border-pos/30 bg-pos-tint p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-pos text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[14.5px] font-semibold leading-relaxed text-ink">
              Your loan is being prepared — Settlo pays your supplier
              directly.
            </div>
            {loanDetailReady && accepted.loanId ? (
              <Link
                href={`/loans/${accepted.loanId}`}
                className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
              >
                View loan
              </Link>
            ) : (
              <Link
                href="/loans/applications"
                className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
              >
                Back to applications
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary-light text-primary-dark">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">Your offer</div>
          <div className="text-xs text-muted-foreground">
            Review the terms and accept to continue
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4">
          <MiniFact label="Approved amount" value={formatTzs(amount)} accent />
          <MiniFact label="Term" value={`${termDays} days`} />
        </div>

        {canApply ? (
          <>
            <div className="space-y-2.5">
              <AcceptanceRow
                checked={agreeAgreement}
                onToggle={() => setAgreeAgreement((v) => !v)}
              >
                I have read and agree to the{" "}
                <b className="font-semibold text-ink">Loan Agreement</b> for
                this facility.
              </AcceptanceRow>
              <AcceptanceRow
                checked={agreeRepayment}
                onToggle={() => setAgreeRepayment((v) => !v)}
              >
                I agree to repay the amount due under the loan agreement for
                this{" "}
                <b className="font-semibold text-ink">{formatTzs(amount)}</b>{" "}
                facility over{" "}
                <b className="font-semibold text-ink">{termDays} days</b>.
              </AcceptanceRow>
            </div>
            <Button
              className="w-full justify-center"
              disabled={!bothChecked || pending}
              onClick={onAccept}
            >
              {pending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Accept offer
            </Button>
          </>
        ) : (
          <div className="flex gap-2.5 rounded-xl bg-canvas p-3.5 text-[12.5px] leading-relaxed text-ink-3">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-ink-2" />
            <div>
              You can view this offer, but accepting it needs the{" "}
              <b className="font-semibold text-ink-2">loans:apply</b>{" "}
              permission. Ask an account owner to accept it, or request
              access.
            </div>
          </div>
        )}
      </div>
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
      <span className="text-[13px] leading-relaxed text-ink-2">
        {children}
      </span>
    </button>
  );
}
