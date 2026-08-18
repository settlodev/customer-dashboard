"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type {
  PurchaseTaxPreview,
  PurchaseTaxPreviewInput,
} from "@/types/purchase-tax-preview/type";

/**
 * Prices a purchase document that is still being composed, using the
 * Inventory Service's own pricing pipeline (pack conversion, then FX, then
 * purchase tax).
 *
 * <p>Replaces the browser-side estimate the purchase forms used to draw
 * their footers from. That estimate multiplied quantity by the entered cost
 * and stamped the location's base currency on the result, so a line entered
 * in USD read as TZS, and it showed tax beside cost for businesses whose
 * tax belongs inside it.
 *
 * <p>Returns `null` rather than throwing on any failure. Callers fall back
 * to the local estimate and label it as such: a preview is a convenience,
 * and a network blip must never block the operator from saving.
 */
export async function previewPurchaseTax(
  input: PurchaseTaxPreviewInput,
): Promise<PurchaseTaxPreview | null> {
  if (!input.items.length) return null;

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl("/api/v1/purchase-tax/preview"),
      {
        // Passed through raw: null means "the operator has not said", which
        // is what lets the server fall back to each item's own default.
        pricesIncludeTax: input.pricesIncludeTax ?? null,
        items: input.items,
      },
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}
