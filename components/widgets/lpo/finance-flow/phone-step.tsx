"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { FormError } from "@/components/widgets/form-error";
import {
  requestPhoneVerificationCode,
  verifyPhoneCode,
} from "@/lib/actions/phone-actions";

/** "+255712345678" → "+255 ••• ••678" — country code + last 3 stay visible. */
function maskPhone(phone: string): string {
  const compact = phone.replace(/\s+/g, "");
  if (compact.length < 8) return phone;
  return `${compact.slice(0, 4)} ••• ••${compact.slice(-3)}`;
}

const RESEND_COOLDOWN_SECONDS = 60; // Auth-service cooldown (ratified D3)

/**
 * Step 2 of the finance-flow modal: verify the EXISTING auth phone via the
 * platform OTP flow (6-digit code, 60s resend cooldown, 10-min expiry —
 * D3). Never collects a number; changing it is the profile flow, linked
 * below. The shell mounts this step only when `phoneVerified` is false.
 */
export function PhoneStep({
  phoneNumber,
  onVerified,
}: {
  phoneNumber: string | null;
  onVerified: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Neither `sendCode` nor `submitCode` had an unmount guard — a merchant
  // closing the modal mid-request (e.g. right after tapping "Send code" or
  // while a code is verifying) let the response go on to call `onVerified()`
  // or touch state on a component that's gone. Same pattern as
  // `OfferStep.mountedRef`.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Tick the resend countdown once a second while it's running.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(
      () => setCooldown((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendCode = async () => {
    if (sending || cooldown > 0) return;
    setError(null);
    setSending(true);
    const res = await requestPhoneVerificationCode();
    if (!mountedRef.current) return;
    setSending(false);
    if (res.responseType === "success") {
      setSent(true);
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } else {
      // A backend RATE_LIMITED "please wait…" message is surfaced verbatim.
      // Throttle identically to a successful send: whether it's the 60s
      // cooldown or the per-phone daily cap being refused, the button must
      // not stay live and inviting an immediate identical retry — the
      // client never contradicts an endpoint the server is rejecting.
      setError(res.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

  const submitCode = async (value: string) => {
    if (value.length !== 6 || verifying) return;
    setError(null);
    setVerifying(true);
    const res = await verifyPhoneCode(value);
    if (!mountedRef.current) return;
    setVerifying(false);
    if (res.responseType === "success") {
      onVerified();
    } else {
      setError(res.message);
      setCode("");
    }
  };

  // No phone on file at all — verification is impossible until one is added
  // via the profile flow. Honest dead-end with a way out.
  if (!phoneNumber) {
    return (
      <div className="space-y-4">
        <Header subtitle="A verified phone number is required before you can accept a financing offer." />
        <div className="rounded-lg border border-line bg-canvas px-3.5 py-3 text-[12.5px] text-ink-2">
          Your account has no phone number yet. Add and verify one in your
          profile, then return here — your progress is saved.
        </div>
        <Button asChild variant="outline" className="w-full justify-center">
          <Link href="/profile">Add a phone number in Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        subtitle={
          sent
            ? `Enter the 6-digit code we sent to ${maskPhone(phoneNumber)}.`
            : `We'll text a 6-digit code to ${maskPhone(phoneNumber)} to confirm it's you.`
        }
      />

      {!sent ? (
        <Button
          className="w-full justify-center"
          onClick={() => void sendCode()}
          disabled={sending}
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </span>
          ) : (
            "Send code"
          )}
        </Button>
      ) : (
        <>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (value.length === 6 && !verifying) {
                  void submitCode(value);
                }
              }}
              disabled={verifying}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {verifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </div>
          )}

          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <span>Didn&apos;t get it?</span>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => void sendCode()}
              disabled={sending || verifying || cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </Button>
          </div>
        </>
      )}

      {error && <FormError message={error} />}

      <p className="text-center text-xs text-muted-foreground">
        Wrong number?{" "}
        <Link
          href="/profile"
          className="font-medium text-primary hover:underline"
        >
          Change it in Profile
        </Link>{" "}
        — then come back; your progress is saved.
      </p>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary-light text-primary-dark">
        <Smartphone className="h-4 w-4" />
      </span>
      <div>
        <div className="text-sm font-semibold text-ink">Verify your phone</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}
