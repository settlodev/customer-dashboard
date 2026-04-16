"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPaymentStatus } from "@/lib/actions/payment-actions";
import type { PaymentStatus } from "@/types/billing/types";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes

interface UsePaymentPollingReturn {
  status: PaymentStatus | null;
  isPolling: boolean;
  error: string | null;
  /** Manually stop polling */
  stop: () => void;
}

/**
 * Polls payment status until terminal state (SUCCESS/FAILED) or timeout.
 *
 * Pass `null` to disable polling. Pass the `externalReferenceId` from
 * the initiatePayment response to start.
 */
export function usePaymentPolling(
  externalReferenceId: string | null,
): UsePaymentPollingReturn {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const stoppedRef = useRef(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
    startTimeRef.current = Date.now();

    const poll = async () => {
      if (stoppedRef.current) return;

      // Timeout check
      if (Date.now() - startTimeRef.current > POLL_TIMEOUT_MS) {
        setError("Payment verification timed out. Please check your billing history.");
        setStatus("FAILED");
        stop();
        return;
      }

      try {
        const response = await getPaymentStatus(externalReferenceId);
        const newStatus = response.paymentStatus;
        setStatus(newStatus);

        if (newStatus === "SUCCESS" || newStatus === "FAILED") {
          stop();
          if (newStatus === "FAILED") {
            setError("Payment failed. Please try again.");
          }
        }
      } catch {
        // Network error — keep polling, don't fail immediately
      }
    };

    // Initial poll after a short delay (give provider time to process)
    const initialTimeout = setTimeout(() => {
      if (stoppedRef.current) return;
      poll();
      intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }, 3_000);

    return () => {
      clearTimeout(initialTimeout);
      stop();
    };
  }, [externalReferenceId, stop]);

  return { status, isPolling, error, stop };
}
