"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/widgets/form-error";
import { cn } from "@/lib/utils";
import {
  acceptFinancingTerms,
  getFinancingTerms,
} from "@/lib/actions/loan-applications-actions";
import { startLpoFinancing } from "@/lib/actions/lpo-actions";
import { getPhoneStatus, type PhoneStatus } from "@/lib/actions/phone-actions";
import {
  SUPPLIER_FINANCING_GATE_CODES,
  type FinancingTermsStatus,
  type SupplierFinancingQuote,
} from "@/types/loans/supplier-financing";
import type { Lpo } from "@/types/lpo/type";

import { TermsStep } from "./terms-step";
import { PhoneStep } from "./phone-step";
import { OfferStep } from "./offer-step";

type FlowStep =
  | "loading"
  | "terms"
  | "phone"
  /**
   * The accept gate said PHONE_NOT_VERIFIED, but a re-read of the Auth
   * phone status (`onNeedsPhone` below) reports it's actually verified —
   * this is the Accounts `PHONE_VERIFIED` projection lagging behind Auth,
   * not a genuinely unverified number. Dropping the merchant into `phone`
   * here would show "Enter the code we sent…" for a code that Auth's
   * anti-enumeration guard never actually sends when the number is already
   * verified (see `validateAndSendPhoneVerification`) — a permanent
   * dead end. This step is an honest "still syncing" state instead, with a
   * way back to retry the accept once the projection catches up.
   */
  | "phone-syncing"
  | "offer"
  | "error";

const STEP_LABELS: { key: Exclude<FlowStep, "loading" | "error">; label: string }[] = [
  { key: "terms", label: "Terms" },
  { key: "phone", label: "Verify phone" },
  { key: "offer", label: "Offer" },
];

/**
 * Finance-this-order modal: Terms → Verify phone → Offer (spec §3).
 * Closing at ANY point is safe — terms acceptance and phone verification
 * are persisted account-level facts, and an in-flight application resumes
 * at the offer step next time (via `resumeApplicationId`).
 *
 * Step skipping on open:
 *  - resume (application exists): no terms, no start-financing — straight
 *    to phone (if unverified) or offer.
 *  - terms already accepted: start-financing fires immediately on open.
 *  - phone already verified: the phone step never mounts.
 */
export function FinanceFlowModal({
  lpo,
  open,
  onOpenChange,
  canApply,
  eligibilityQuote,
  resumeApplicationId,
}: {
  lpo: Lpo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canApply: boolean;
  eligibilityQuote: SupplierFinancingQuote | null;
  resumeApplicationId: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>("loading");
  const [terms, setTerms] = useState<FinancingTermsStatus | null>(null);
  const [phone, setPhone] = useState<PhoneStatus | null>(null);
  const [termsSubmitting, setTermsSubmitting] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [phoneJustVerified, setPhoneJustVerified] = useState(false);
  // True once anything server-side may have changed (financing started,
  // terms accepted, offer accepted) — closing then refreshes the page so
  // the banner and financing card re-render from fresh data.
  const [progressed, setProgressed] = useState(false);

  // Bumped once per modal open (see the entry effect below). The component
  // stays mounted across a close/reopen (only the Dialog's portal content
  // unmounts), so a response from a PREVIOUS open — e.g. a slow
  // startLpoFinancing/acceptFinancingTerms call still in flight when the
  // merchant closed and quickly reopened — must not be allowed to mutate
  // state the new session already computed. `startFinancing` and
  // `handleAgree` each capture the session id in effect at call time and
  // compare it to `sessionRef.current` before acting on their result,
  // mirroring the `cancelled` guard the entry effect already uses for its
  // own continuation.
  const sessionRef = useRef(0);

  const startFinancing = useCallback(async (): Promise<boolean> => {
    const session = sessionRef.current;
    const res = await startLpoFinancing(lpo.id);
    if (session !== sessionRef.current) return false; // superseded by a later open — dropped, no state touched
    if (res.responseType === "error") {
      setFlowError(res.message);
      setStep("error");
      return false;
    }
    setProgressed(true);
    return true;
  }, [lpo.id]);

  // Entry sequencing on every open.
  useEffect(() => {
    if (!open) return;
    sessionRef.current += 1;
    let cancelled = false;
    setStep("loading");
    setTermsError(null);
    setFlowError(null);
    // Per-open resets: neither flag describes anything that happened in
    // THIS session yet. `phoneJustVerified` in particular has a documented
    // this-session-only contract (it unlocks OfferStep's projection-lag
    // retry) that a stale `true` from a previous open would silently break.
    setTermsSubmitting(false);
    setPhoneJustVerified(false);

    void (async () => {
      const [termsRes, phoneRes] = await Promise.all([
        getFinancingTerms(),
        getPhoneStatus(),
      ]);
      if (cancelled) return;
      setTerms(termsRes);
      const phoneStatus =
        phoneRes.responseType === "success" ? (phoneRes.data ?? null) : null;
      setPhone(phoneStatus);

      if (!termsRes) {
        setFlowError(
          "Couldn't load the financing terms. Close this window and try again.",
        );
        setStep("error");
        return;
      }

      const resuming = Boolean(resumeApplicationId);
      if (!resuming && !termsRes.accepted) {
        setStep("terms");
        return;
      }
      if (!resuming) {
        // Terms already accepted → start-financing fires on open (§3.2).
        const started = await startFinancing();
        if (!started || cancelled) return;
      }
      // Fail-closed to the phone step when the status read failed — sending
      // works by userId, and a verified user just re-verifies harmlessly
      // rather than being blocked.
      setStep(phoneStatus?.phoneVerified ? "offer" : "phone");
    })();

    return () => {
      cancelled = true;
    };
    // Rerun only when the modal (re)opens — resume state is read fresh then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAgree = () => {
    if (!terms) return;
    // Captured once, before the first await — if the modal is closed and
    // reopened before this chain settles, `sessionRef.current` moves on and
    // every check below drops the stale continuation instead of mutating
    // the new session's state (same pattern as `startFinancing` above).
    const session = sessionRef.current;
    setTermsError(null);
    setTermsSubmitting(true);
    void (async () => {
      const res = await acceptFinancingTerms(terms.currentVersion);
      if (session !== sessionRef.current) return;
      if (res.responseType === "error") {
        setTermsSubmitting(false);
        if (
          res.errorCode === SUPPLIER_FINANCING_GATE_CODES.TERMS_VERSION_STALE
        ) {
          const fresh = await getFinancingTerms();
          if (session !== sessionRef.current) return;
          if (fresh) setTerms(fresh);
          setTermsError(
            "The terms were updated — please review and accept the latest version.",
          );
          return;
        }
        setTermsError(res.message);
        return;
      }
      setProgressed(true);
      const started = await startFinancing();
      if (session !== sessionRef.current) return;
      setTermsSubmitting(false);
      if (!started) return;
      setStep(phone?.phoneVerified ? "offer" : "phone");
    })();
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen && progressed) {
      router.refresh();
    }
  };

  const activeIndex =
    step === "terms"
      ? 0
      : step === "phone" || step === "phone-syncing"
        ? 1
        : step === "offer"
          ? 2
          : -1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finance this order</DialogTitle>
        </DialogHeader>

        {/* Stepper — Terms / Verify phone / Offer */}
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((s, i) => {
            const state =
              activeIndex === -1
                ? "todo"
                : i < activeIndex
                  ? "done"
                  : i === activeIndex
                    ? "now"
                    : "todo";
            return (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                    state === "done"
                      ? "bg-pos text-white"
                      : state === "now"
                        ? "bg-primary text-white"
                        : "border border-line-2 bg-canvas text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    state === "todo" ? "text-muted-foreground" : "text-ink",
                  )}
                >
                  {s.label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <span className="h-px flex-1 bg-line" />
                )}
              </div>
            );
          })}
        </div>

        {step === "loading" && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking your financing setup…
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 py-2">
            <FormError
              message={flowError ?? "Something went wrong. Please try again."}
            />
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => handleClose(false)}
            >
              Close
            </Button>
          </div>
        )}

        {step === "terms" && terms && (
          <TermsStep
            termsVersion={terms.currentVersion}
            submitting={termsSubmitting}
            error={termsError}
            onAgree={handleAgree}
          />
        )}

        {step === "phone" && (
          <PhoneStep
            phoneNumber={phone?.phoneNumber ?? null}
            onVerified={() => {
              setPhoneJustVerified(true);
              setStep("offer");
            }}
          />
        )}

        {step === "offer" && (
          <OfferStep
            lpoId={lpo.id}
            initialApplicationId={
              resumeApplicationId ?? lpo.loanApplicationId ?? null
            }
            canApply={canApply}
            phoneJustVerified={phoneJustVerified}
            eligibilityQuote={eligibilityQuote}
            onAccepted={() => setProgressed(true)}
            onNeedsTerms={() => {
              // The gate said terms are missing (e.g. version bumped since
              // this account accepted) — reload and re-show the terms step.
              // Same close-mid-flight guard as `startFinancing`/`handleAgree`
              // above — this is the one async chain in the shell that was
              // missing it.
              const session = sessionRef.current;
              void (async () => {
                const fresh = await getFinancingTerms();
                if (session !== sessionRef.current) return;
                if (fresh) setTerms(fresh);
                setStep("terms");
              })();
            }}
            onNeedsPhone={() => {
              // The gate said PHONE_NOT_VERIFIED. Before dropping the
              // merchant into OTP entry, re-read the AUTH phone status:
              // `PhoneStep` is reachable purely off a 409 the LMS derives
              // from the ACCOUNTS projection, which can lag (or have missed
              // a PHONE_VERIFIED event) behind Auth's own record. If Auth
              // already reports verified, sending a code is a silent no-op
              // (anti-enumeration on an already-verified number) and the
              // merchant would sit on a code that was never sent — show the
              // honest syncing state instead. Same close-mid-flight guard as
              // the other async chains in this shell.
              const session = sessionRef.current;
              void (async () => {
                const res = await getPhoneStatus();
                if (session !== sessionRef.current) return;
                const status =
                  res.responseType === "success" ? (res.data ?? null) : null;
                if (status) setPhone(status);
                setStep(status?.phoneVerified ? "phone-syncing" : "phone");
              })();
            }}
          />
        )}

        {step === "phone-syncing" && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-tint p-5 text-warn">
              <Clock3 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <div className="text-[14px] font-semibold text-ink">
                  Your verification is still syncing
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">
                  Your phone is verified, but that hasn&apos;t finished
                  syncing across our systems yet. This usually clears in a
                  few seconds — try again in a moment.
                </p>
              </div>
            </div>
            <Button
              className="w-full justify-center"
              onClick={() => setStep("offer")}
            >
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
