"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

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

type FlowStep = "loading" | "terms" | "phone" | "offer" | "error";

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

  const startFinancing = useCallback(async (): Promise<boolean> => {
    const res = await startLpoFinancing(lpo.id);
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
    let cancelled = false;
    setStep("loading");
    setTermsError(null);
    setFlowError(null);

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
      // Fail-open to the phone step when the status read failed — sending
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
    setTermsError(null);
    setTermsSubmitting(true);
    void (async () => {
      const res = await acceptFinancingTerms(terms.currentVersion);
      if (res.responseType === "error") {
        setTermsSubmitting(false);
        if (
          res.errorCode === SUPPLIER_FINANCING_GATE_CODES.TERMS_VERSION_STALE
        ) {
          const fresh = await getFinancingTerms();
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
    step === "terms" ? 0 : step === "phone" ? 1 : step === "offer" ? 2 : -1;

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
              void (async () => {
                const fresh = await getFinancingTerms();
                if (fresh) setTerms(fresh);
                setStep("terms");
              })();
            }}
            onNeedsPhone={() => setStep("phone")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
