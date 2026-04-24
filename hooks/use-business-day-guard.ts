"use client";

import { useCallback, useState } from "react";
import type { FormResponse } from "@/types/types";

const ERROR_CODE = "BUSINESS_DAY_CLOSED";

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
      if (response.errorCode !== ERROR_CODE) return false;

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
