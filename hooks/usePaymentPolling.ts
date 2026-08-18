"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPaymentStatus,
  markPaymentTimedOut,
} from "@/lib/actions/payment-actions";
import type { PaymentStatus } from "@/types/billing/types";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 150 * 1_000;

interface UsePaymentPollingReturn {
  status: PaymentStatus | null;
  isPolling: boolean;
  error: string | null;
  /** Manually stop polling */
  stop: () => void;
}

export function usePaymentPolling(
  externalReferenceId: string | null,
): UsePaymentPollingReturn {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!externalReferenceId) {
      setStatus(null);
      setIsPolling(false);
      setError(null);
      return;
    }

    stoppedRef.current = false;
    setIsPolling(true);
    setError(null);
    setStatus("ACCEPTED");

    const poll = async () => {
      if (stoppedRef.current) return;

      try {
        const response = await getPaymentStatus(externalReferenceId);
        // Critical: a slow request that resolves AFTER a terminal state has been
        // set (by a SUCCESS/FAILED poll or the timeout below) must not overwrite
        // it. Without this guard a late "PROCESSING" reverts the modal to the
        // waiting state and, since polling has stopped, it stays stuck there.
        if (stoppedRef.current) return;

        const newStatus = response.paymentStatus;
        setStatus(newStatus);

        if (newStatus === "SUCCESS" || newStatus === "FAILED") {
          stop();
          if (newStatus === "FAILED") {
            setError(
              response.errorMessage || "Payment failed. Please try again.",
            );
          }
        }
      } catch {
        // Network error — keep polling until the timeout closes it out.
      }
    };

    // Dedicated hard timeout: resolve the awaiting UI to FAILED the moment the
    // window expires, independent of the poll cadence (so a stalled poll can't
    // leave the modal spinning forever). Flip the UI first, then notify the
    // server best-effort — the row is left recoverable by a late Selcom webhook.
    const handleTimeout = () => {
      if (stoppedRef.current) return;
      stop();
      setError(
        "Payment verification timed out. We didn't receive a confirmation from your mobile-money provider.",
      );
      setStatus("FAILED");
      markPaymentTimedOut(externalReferenceId).catch(() => {
        // Non-fatal — the server can still receive the late webhook and resolve.
      });
    };

    // Initial poll after a short delay (give the provider time to process).
    const initialTimeout = setTimeout(() => {
      if (stoppedRef.current) return;
      poll();
      intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }, 3_000);

    timeoutRef.current = setTimeout(handleTimeout, POLL_TIMEOUT_MS);

    return () => {
      clearTimeout(initialTimeout);
      stop();
    };
  }, [externalReferenceId, stop]);

  return { status, isPolling, error, stop };
}
