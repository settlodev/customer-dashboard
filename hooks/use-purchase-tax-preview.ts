"use client";

import { useEffect, useRef, useState } from "react";
import { previewPurchaseTax } from "@/lib/actions/purchase-tax-preview-actions";
import type {
  PurchaseTaxPreview,
  PurchaseTaxPreviewLineInput,
} from "@/types/purchase-tax-preview/type";

export type PurchaseTaxPreviewStatus =
  /** Nothing priceable on the document yet. */
  | "idle"
  /** A request is in flight; any figures shown are the local estimate. */
  | "loading"
  /** Showing server-computed figures. */
  | "live"
  /** The server could not be reached; the caller should show its estimate. */
  | "error";

export interface UsePurchaseTaxPreviewResult {
  preview: PurchaseTaxPreview | null;
  status: PurchaseTaxPreviewStatus;
}

/**
 * Live server-computed net/tax/total for a purchase document being composed.
 *
 * <p>Why a hook and not a `useMemo` over the form values: react-hook-form
 * mutates its value tree **in place**. `set()` assigns into the existing
 * row object, and `watch("items")` hands back that same array reference
 * every render (its internal spread is shallow). So a `useMemo` keyed on
 * the watched array never invalidates when a quantity or cost changes — it
 * only re-runs when some *other* dependency happens to change identity, e.g.
 * adding a row or picking a variant. That is exactly why every purchase
 * form's footer sat at 0.00: the memo was frozen at the values the rows had
 * when the last unrelated dependency fired.
 *
 * <p>This hook keys on a **serialised** snapshot of the priceable fields
 * instead. A string dependency compares by value, so it changes precisely
 * when the numbers change and never when they do not — which both fixes
 * the staleness and gives natural request de-duplication.
 *
 * <p>Callers keep their local estimate as the fallback and should label it
 * as an estimate whenever `status` is not `"live"`.
 */
export function usePurchaseTaxPreview(
  lines: PurchaseTaxPreviewLineInput[],
  pricesIncludeTax: boolean | null | undefined,
  options?: { debounceMs?: number; enabled?: boolean },
): UsePurchaseTaxPreviewResult {
  const debounceMs = options?.debounceMs ?? 350;
  const enabled = options?.enabled ?? true;

  const [preview, setPreview] = useState<PurchaseTaxPreview | null>(null);
  const [status, setStatus] = useState<PurchaseTaxPreviewStatus>("idle");

  // Only rows with a resolved stock item can be priced; a blank row carries
  // no variant and the server would only reject it.
  const priceable = lines.filter(
    (line) => !!line.stockVariantId && line.stockVariantId.trim() !== "",
  );

  // The value-comparable dependency. Everything the server reads and nothing
  // it does not, so typing in a batch number or a note costs no request.
  const key = JSON.stringify({
    pricesIncludeTax: pricesIncludeTax ?? null,
    items: priceable.map((line) => [
      line.stockVariantId,
      Number(line.quantity) || 0,
      Number(line.unitCost) || 0,
      line.purchaseUnitId ?? null,
      line.currency ?? null,
      line.taxTypeId ?? null,
    ]),
  });

  // Read inside the effect so `key` stays its only value dependency —
  // depending on the array itself would reintroduce the reference problem
  // this hook exists to avoid.
  const payloadRef = useRef({ priceable, pricesIncludeTax });
  payloadRef.current = { priceable, pricesIncludeTax };

  useEffect(() => {
    if (!enabled || payloadRef.current.priceable.length === 0) {
      setPreview(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    // Unconditionally, including when the previous answer was "live": the
    // moment the inputs change, the figures already on screen describe the
    // OLD inputs. Dropping back to "loading" makes the caller show its own
    // instant estimate rather than labelling stale numbers as confirmed.
    setStatus("loading");

    const timer = setTimeout(() => {
      const { priceable: items, pricesIncludeTax: includeTax } = payloadRef.current;

      previewPurchaseTax({ pricesIncludeTax: includeTax ?? null, items })
        .then((result) => {
          // A slower earlier request must not overwrite a newer answer.
          if (cancelled) return;
          if (result) {
            setPreview(result);
            setStatus("live");
          } else {
            setStatus("error");
          }
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, enabled, debounceMs]);

  return { preview, status };
}
