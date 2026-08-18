"use client";

import { useCallback, useState } from "react";
import type { FormResponse } from "@/types/types";

/**
 * All three error codes share the same UX — "no active session, prompt
 * the operator to open the day". The server returns each in a slightly
 * different scenario:
 * <ul>
 *   <li>{@code BUSINESS_DAY_CLOSED} — legacy path; service still calls
 *       {@code requireOpenSession} (e.g. internal fallbacks).</li>
 *   <li>{@code BUSINESS_DAY_SESSION_HEADER_MISSING} — the dashboard's
 *       day-session cookie wasn't set (page hadn't loaded the widget yet
 *       or the day was closed locally).</li>
 *   <li>{@code BUSINESS_DAY_SESSION_UNKNOWN} — header carried an id the
 *       server doesn't yet know about. Rare on the online dashboard —
 *       only happens during a brief Kafka lag window.</li>
 * </ul>
 */
const NO_SESSION_ERROR_CODES: ReadonlySet<string> = new Set([
  "BUSINESS_DAY_CLOSED",
  "BUSINESS_DAY_SESSION_HEADER_MISSING",
  "BUSINESS_DAY_SESSION_UNKNOWN",
]);

interface GuardState {
  open: boolean;
  locationId?: string;
  reason?: string;
  pendingRetry?: () => void;
}

/**
 * Catches FormResponses that came back with BUSINESS_DAY_CLOSED, shows the
 * day-open prompt, and re-runs the original submit once the day is open.
 *
 * Usage:
 *   const guard = useBusinessDayGuard();
 *   ...
 *   const result = await createThing(values);
 *   if (guard.catch(result, () => submit(values))) return;
 *   // ...handle normal success/error
 */
export function useBusinessDayGuard() {
  const [state, setState] = useState<GuardState>({ open: false });

  const close = useCallback(() => {
    setState({ open: false });
  }, []);

  const catchClosedDay = useCallback(
    (response: FormResponse | void | undefined | null, retry: () => void): boolean => {
      if (!response || response.responseType !== "error") return false;
      if (!response.errorCode || !NO_SESSION_ERROR_CODES.has(response.errorCode)) return false;

      const locationIds = response.metadata?.locationIds;
      const firstLocationId =
        Array.isArray(locationIds) && typeof locationIds[0] === "string"
          ? (locationIds[0] as string)
          : undefined;

      setState({
        open: true,
        locationId: firstLocationId,
        reason: response.message,
        pendingRetry: retry,
      });
      return true;
    },
    [],
  );

  const onDayOpened = useCallback(() => {
    const retry = state.pendingRetry;
    setState({ open: false });
    retry?.();
  }, [state.pendingRetry]);

  return {
    dialogOpen: state.open,
    locationId: state.locationId,
    reason: state.reason,
    catch: catchClosedDay,
    close,
    onDayOpened,
  };
}
