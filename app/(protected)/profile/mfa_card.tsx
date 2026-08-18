"use client";

import React, { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  Download,
  Check,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import {
  getMfaStatus,
  setupMfa,
  enableMfa,
  disableMfa,
  type MfaSetup,
} from "@/lib/actions/mfa-actions";

type WizardStep = "scan" | "recovery";

/**
 * Self-service two-factor authentication (TOTP) management for the
 * signed-in user. Loads the current MFA state on mount, then offers an
 * enable wizard (QR + manual secret → 6-digit verify → one-time recovery
 * codes) when disabled, or a confirm-then-disable flow when enabled.
 *
 * Mirrors {@link MyPinCard}: a self-contained card that fetches its own
 * state and surfaces backend errors via toast + inline {@link FormError}.
 */
export default function MfaCard() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Enable wizard ────────────────────────────────────────────────
  const [enableOpen, setEnableOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>("scan");
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const [enableCode, setEnableCode] = useState("");
  const [enabling, setEnabling] = useState(false);
  const [enableError, setEnableError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // ── Disable flow ─────────────────────────────────────────────────
  const [disableOpen, setDisableOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await getMfaStatus();
    if (res.responseType === "success" && res.data) {
      setEnabled(res.data.enabled);
    } else {
      setLoadError(res.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // ── Enable: step 1 — fetch a pending secret + provisioning URI ────
  const startEnable = async () => {
    setEnableError(null);
    setEnableCode("");
    setRecoveryCodes([]);
    setCopied(false);
    setStep("scan");
    setSettingUp(true);
    setEnableOpen(true);
    const res = await setupMfa();
    if (res.responseType === "success" && res.data) {
      setSetup(res.data);
    } else {
      setSetup(null);
      setEnableError(res.message);
      toast({ variant: "destructive", title: res.message });
    }
    setSettingUp(false);
  };

  // ── Enable: step 2 — verify the 6-digit code ──────────────────────
  const submitEnable = async (codeOverride?: string) => {
    const code = codeOverride ?? enableCode;
    if (code.length !== 6 || enabling) return;
    setEnableError(null);
    setEnabling(true);
    const res = await enableMfa(code);
    if (res.responseType === "success" && res.data) {
      setRecoveryCodes(res.data.recoveryCodes ?? []);
      setStep("recovery");
      setEnabled(true);
      toast({ variant: "success", title: res.message });
    } else {
      setEnableError(res.message);
      setEnableCode("");
      toast({ variant: "destructive", title: res.message });
    }
    setEnabling(false);
  };

  const recoveryText = recoveryCodes.join("\n");

  const copyRecovery = async () => {
    try {
      await navigator.clipboard.writeText(recoveryText);
      setCopied(true);
      toast({ variant: "success", title: "Recovery codes copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: "Couldn't copy — copy them manually" });
    }
  };

  const downloadRecovery = () => {
    const blob = new Blob([`${recoveryText}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settlo-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const finishEnable = () => {
    setEnableOpen(false);
    setSetup(null);
    setRecoveryCodes([]);
    setEnableCode("");
    setStep("scan");
  };

  // ── Disable ───────────────────────────────────────────────────────
  const submitDisable = async () => {
    const code = disableCode.trim();
    if (!code || disabling) return;
    setDisableError(null);
    setDisabling(true);
    const res = await disableMfa(code);
    if (res.responseType === "success") {
      setEnabled(false);
      setDisableOpen(false);
      setDisableCode("");
      toast({ variant: "success", title: res.message });
    } else {
      setDisableError(res.message);
      toast({ variant: "destructive", title: res.message });
    }
    setDisabling(false);
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading two-factor authentication…
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            {enabled ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <ShieldOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-base font-medium">
              Two-factor authentication (2FA)
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {loadError
                ? loadError
                : enabled
                  ? "2FA is on. You'll be asked for a code from your authenticator app when you sign in."
                  : "Add an extra layer of security by requiring a code from an authenticator app at sign-in."}
            </p>
          </div>
        </div>

        {loadError ? (
          <Button type="button" variant="outline" onClick={() => void loadStatus()}>
            Retry
          </Button>
        ) : enabled ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDisableCode("");
              setDisableError(null);
              setConfirmOpen(true);
            }}
          >
            Disable
          </Button>
        ) : (
          <Button type="button" onClick={startEnable}>
            Enable 2FA
          </Button>
        )}
      </div>

      {/* ── Enable wizard ── */}
      <Dialog
        open={enableOpen}
        onOpenChange={(open) => {
          // While showing recovery codes, force the explicit "I've saved them"
          // button so they aren't dismissed accidentally before being saved.
          if (!open && step === "recovery") return;
          if (!open) finishEnable();
          else setEnableOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {step === "scan" ? (
            <>
              <DialogHeader>
                <DialogTitle>Set up two-factor authentication</DialogTitle>
                <DialogDescription>
                  Scan the QR code with an authenticator app (Google
                  Authenticator, Authy, 1Password…), then enter the 6-digit code
                  it shows.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {settingUp ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : setup ? (
                  <>
                    <div className="flex justify-center">
                      <div className="rounded-lg border bg-white p-4">
                        <QRCodeSVG value={setup.otpAuthUri} size={180} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Can&apos;t scan? Enter this key manually:
                      </p>
                      <code className="block w-full rounded-md border bg-muted px-3 py-2 text-center text-sm font-mono tracking-wider break-all">
                        {setup.secret}
                      </code>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Verification code
                      </label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={enableCode}
                          onChange={(value) => {
                            setEnableCode(value);
                            if (value.length === 6 && !enabling) {
                              void submitEnable(value);
                            }
                          }}
                          disabled={enabling}
                        >
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>

                    {enableError && <FormError message={enableError} />}
                  </>
                ) : (
                  <div className="py-6">
                    {enableError && <FormError message={enableError} />}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={finishEnable}
                  disabled={enabling}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void submitEnable()}
                  disabled={!setup || enableCode.length !== 6 || enabling}
                >
                  {enabling ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    "Verify & enable"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Save your recovery codes</DialogTitle>
                <DialogDescription>
                  Store these somewhere safe. Each code can be used once to sign
                  in if you lose access to your authenticator app.{" "}
                  <span className="font-medium text-foreground">
                    They won&apos;t be shown again.
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Save these now — this is the only time we&apos;ll show them.</span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted p-3">
                  {recoveryCodes.map((code) => (
                    <code
                      key={code}
                      className="text-center text-sm font-mono tracking-wider"
                    >
                      {code}
                    </code>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={copyRecovery}
                  >
                    {copied ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Copy className="h-4 w-4" /> Copy
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={downloadRecovery}
                  >
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4" /> Download
                    </span>
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={finishEnable}>I&apos;ve saved my codes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Disable: confirm first ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the extra layer of security on your account. You can
              re-enable it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep 2FA on</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                setDisableOpen(true);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Disable: enter a current code ── */}
      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          if (disabling) return;
          setDisableOpen(open);
          if (!open) {
            setDisableCode("");
            setDisableError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm it&apos;s you</DialogTitle>
            <DialogDescription>
              Enter a current code from your authenticator app, or one of your
              recovery codes, to turn off 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Authenticator or recovery code
              </label>
              <Input
                autoComplete="one-time-code"
                placeholder="6-digit code or a recovery code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitDisable();
                }}
                disabled={disabling}
              />
            </div>
            {disableError && <FormError message={disableError} />}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDisableOpen(false)}
              disabled={disabling}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void submitDisable()}
              disabled={!disableCode.trim() || disabling}
            >
              {disabling ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disabling…
                </span>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
