"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Smartphone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  type Value as PhoneValue,
} from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import {
  getPhoneStatus,
  setPhone,
  requestPhoneCode,
  confirmPhoneCode,
} from "@/lib/actions/phone-actions";

type WizardStep = "phone" | "code";

/**
 * Self-service management of the user's AUTH phone number — the
 * verifiable number that gates phone-login / password-reset and will
 * gate SMS MFA.
 *
 * Loads the current phone + verified state on mount and shows a
 * Verified/Unverified badge. The "Add"/"Change & re-verify" flow opens a
 * two-step wizard: enter the number (saved UNVERIFIED, then an SMS code
 * is sent) → enter the 6-digit code to verify. Resend respects the
 * backend's send cooldown (the "please wait…" message is surfaced).
 *
 * Mirrors {@link MfaCard}: a self-contained card that fetches its own
 * state and surfaces backend errors via toast + inline {@link FormError}.
 *
 * NOTE: this is the AUTH phone, distinct from the read-only Accounts
 * profile phone in update_profile_form — reconciling the two is a
 * deliberate follow-up.
 */
export default function PhoneCard() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Add / change + verify wizard ──────────────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>("phone");
  const [phoneValue, setPhoneValue] = useState<PhoneValue | undefined>(
    undefined,
  );
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await getPhoneStatus();
    if (res.responseType === "success" && res.data) {
      setPhoneNumber(res.data.phoneNumber || null);
      setVerified(Boolean(res.data.phoneVerified));
    } else {
      setLoadError(res.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // ── Wizard: open ──────────────────────────────────────────────────
  const startWizard = () => {
    setStep("phone");
    // Pre-fill with the current number so a "change" starts from it.
    setPhoneValue((phoneNumber as PhoneValue) || undefined);
    setPhoneError(null);
    setCode("");
    setCodeError(null);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setStep("phone");
    setPhoneValue(undefined);
    setPhoneError(null);
    setCode("");
    setCodeError(null);
  };

  // ── Wizard: step 1 — save the number, then send a code ────────────
  const saveAndSend = async () => {
    if (savingPhone) return;
    const value = phoneValue?.trim();
    if (!value || !isValidPhoneNumber(value)) {
      setPhoneError("Enter a valid phone number, including the country code.");
      return;
    }
    setPhoneError(null);
    setSavingPhone(true);

    const region = parsePhoneNumber(value)?.country;
    const saved = await setPhone(value, region);
    if (saved.responseType !== "success") {
      setPhoneError(saved.message);
      toast({ variant: "destructive", title: saved.message });
      setSavingPhone(false);
      return;
    }

    // Saving replaced the number — it's unverified until confirmed.
    setPhoneNumber(value);
    setVerified(false);

    const sent = await requestPhoneCode();
    setSavingPhone(false);
    if (sent.responseType === "success") {
      setCode("");
      setCodeError(null);
      setStep("code");
      toast({ variant: "success", title: sent.message });
    } else {
      // Number is saved; sending failed (e.g. cooldown). Surface it and
      // let them retry the send from the code step.
      setStep("code");
      setCodeError(sent.message);
      toast({ variant: "destructive", title: sent.message });
    }
  };

  // ── Wizard: step 2 — confirm the SMS code ─────────────────────────
  const submitCode = async (codeOverride?: string) => {
    const value = codeOverride ?? code;
    if (value.length !== 6 || confirming) return;
    setCodeError(null);
    setConfirming(true);
    const res = await confirmPhoneCode(value);
    if (res.responseType === "success") {
      setVerified(true);
      setConfirming(false);
      closeWizard();
      toast({ variant: "success", title: res.message });
    } else {
      setCodeError(res.message);
      setCode("");
      setConfirming(false);
      toast({ variant: "destructive", title: res.message });
    }
  };

  // ── Wizard: resend a code (respects backend cooldown) ─────────────
  const resendCode = async () => {
    if (resending) return;
    setCodeError(null);
    setResending(true);
    const res = await requestPhoneCode();
    setResending(false);
    if (res.responseType === "success") {
      toast({ variant: "success", title: res.message });
    } else {
      setCodeError(res.message);
      toast({ variant: "destructive", title: res.message });
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading phone number…
        </div>
      </div>
    );
  }

  const hasPhone = Boolean(phoneNumber);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium">Phone number</h3>
              {hasPhone &&
                (verified ? (
                  <Badge variant="pos">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warn">
                    <AlertCircle className="h-3 w-3" />
                    Unverified
                  </Badge>
                ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {loadError ? (
                loadError
              ) : hasPhone ? (
                <>
                  <span className="font-medium text-foreground">
                    {phoneNumber}
                  </span>{" "}
                  {verified
                    ? "is verified. It can be used to sign in and reset your password."
                    : "isn't verified yet. Verify it to enable phone sign-in and password reset."}
                </>
              ) : (
                "Add a phone number to enable phone sign-in, password reset, and SMS-based security."
              )}
            </p>
          </div>
        </div>

        {loadError ? (
          <Button type="button" variant="outline" onClick={() => void loadStatus()}>
            Retry
          </Button>
        ) : hasPhone ? (
          verified ? (
            <Button type="button" variant="outline" onClick={startWizard}>
              Change
            </Button>
          ) : (
            <Button type="button" onClick={startWizard}>
              Verify
            </Button>
          )
        ) : (
          <Button type="button" onClick={startWizard}>
            Add phone
          </Button>
        )}
      </div>

      {/* ── Add / change + verify wizard ── */}
      <Dialog
        open={wizardOpen}
        onOpenChange={(open) => {
          if (savingPhone || confirming) return;
          if (!open) closeWizard();
          else setWizardOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {step === "phone" ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {hasPhone ? "Change your phone number" : "Add a phone number"}
                </DialogTitle>
                <DialogDescription>
                  Enter your number with its country code. We&apos;ll text you a
                  6-digit code to verify it.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone number</label>
                  <PhoneInput
                    value={phoneValue}
                    onChange={(value) => {
                      setPhoneValue(value);
                      if (phoneError) setPhoneError(null);
                    }}
                    disabled={savingPhone}
                    placeholder="Enter phone number"
                  />
                </div>
                {phoneError && <FormError message={phoneError} />}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={closeWizard}
                  disabled={savingPhone}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void saveAndSend()}
                  disabled={!phoneValue || savingPhone}
                >
                  {savingPhone ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    "Save & send code"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Enter the verification code</DialogTitle>
                <DialogDescription>
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">
                    {phoneNumber}
                  </span>
                  . Enter it below to verify your number.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification code</label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={(value) => {
                        setCode(value);
                        if (value.length === 6 && !confirming) {
                          void submitCode(value);
                        }
                      }}
                      disabled={confirming}
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <span>Didn&apos;t get it?</span>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => void resendCode()}
                    disabled={resending || confirming}
                  >
                    {resending ? "Resending…" : "Resend code"}
                  </Button>
                </div>

                {codeError && <FormError message={codeError} />}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("phone");
                    setCode("");
                    setCodeError(null);
                  }}
                  disabled={confirming}
                >
                  Back
                </Button>
                <Button
                  onClick={() => void submitCode()}
                  disabled={code.length !== 6 || confirming}
                >
                  {confirming ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
