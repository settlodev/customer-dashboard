"use client";

import { useEffect, useState } from "react";
import { getCurrentBusinessId } from "@/lib/actions/business/get-current-business";
import { getBusinessSettings } from "@/lib/actions/business-settings-actions";

let cachedStatus: boolean | null = null;
let inFlight: Promise<boolean> | null = null;

/**
 * Client hook resolving whether the active business is VAT-registered, for
 * deciding how a purchase document previews tax **before it is saved**:
 * added on top of cost (registered, reclaimable) vs already inside cost
 * (unregistered, memo-only). See "The invariant" in
 * docs/superpowers/specs/2026-08-03-purchase-tax-design.md (Settlo
 * Inventory Service repo).
 *
 * This implements only the DEFAULT half of the backend's resolution rule —
 * `effectiveStatus = vatRegistered_override ?? isNotBlank(vatRegistrationNumber)`
 * — by reading the business's VRN via the same `getBusinessSettings` action
 * the letterhead already calls. The explicit per-business override
 * (`vatRegistrationMode` / `effectivelyVatRegistered` on
 * `BusinessSettingsResponse`) is not yet exposed on the dashboard's
 * `BusinessSettings` type — that lands with Plan 4 Task 4 (the
 * VAT-registration control on the business settings page). Once it does,
 * this hook should read that field directly instead of re-deriving from
 * the VRN.
 *
 * IMPORTANT: this only drives the client-side PREVIEW shown while composing
 * a document. The persisted `taxRecoverable` on a saved line is always
 * resolved and snapshotted server-side at document-write time — this hook
 * never overrides that.
 *
 * Defaults to (and falls back on error to) `true` — "registered" — the
 * more common case for this feature's early adopters, and the safer
 * failure mode: a registered business briefly previewing as unregistered
 * would look like a missing tax line, while the reverse just shows tax
 * that resolves to zero once the item's own tax type is unconfigured.
 */
export function useVatRegistrationStatus(): boolean {
  const [registered, setRegistered] = useState<boolean>(cachedStatus ?? true);

  useEffect(() => {
    if (cachedStatus !== null) {
      setRegistered(cachedStatus);
      return;
    }
    if (!inFlight) {
      inFlight = getCurrentBusinessId()
        .then((businessId) => {
          if (!businessId) return true;
          return getBusinessSettings(businessId).then(
            (settings) => !!settings?.vatRegistrationNumber?.trim(),
          );
        })
        .catch(() => true)
        .then((value) => {
          cachedStatus = value;
          return value;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    let cancelled = false;
    inFlight.then((value) => {
      if (!cancelled) setRegistered(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return registered;
}

export function resetVatRegistrationStatusCache() {
  cachedStatus = null;
  inFlight = null;
}
