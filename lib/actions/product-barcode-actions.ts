"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ProductVariant } from "@/types/product/type";
import { inventoryUrl } from "./inventory-client";
import { revalidatePath } from "next/cache";

// Mirrors lib/actions/barcode-actions.ts (which targets stock variants).
// Image rendering is shared — call `getBarcodeImageDataUrl` from
// `barcode-actions` for both stock and product barcodes since the
// backend `/api/v1/barcodes/image/{value}` endpoint is value-only.

export async function assignProductBarcode(
  variantId: string,
  barcode?: string,
): Promise<ProductVariant> {
  const apiClient = new ApiClient();
  const params = barcode
    ? `?barcode=${encodeURIComponent(barcode)}`
    : "";
  const data = await apiClient.post(
    inventoryUrl(`/api/v1/product-barcodes/variants/${variantId}${params}`),
    {},
  );
  revalidatePath("/products");
  return parseStringify(data);
}

/**
 * STUB — single round-trip that generates EAN-13 barcodes for every active
 * product variant in the merchant's current location that doesn't already
 * have one. Backend wiring pending: replace the body once the inventory
 * service exposes the location-wide endpoint.
 *
 * Contract the UI assumes:
 *   - One POST per click (no per-variant fan-out from the dashboard).
 *   - Idempotent on the server — variants with an existing barcode are
 *     skipped, not overwritten.
 *   - Returns the updated variants so callers can show "N barcodes
 *     generated" without a follow-up read.
 */
export async function bulkGenerateProductBarcodes(): Promise<ProductVariant[]> {
  const apiClient = new ApiClient();
  const data = await apiClient.post(
    inventoryUrl("/api/v1/product-barcodes/bulk-generate"),
    {},
  );
  revalidatePath("/products");
  return parseStringify(data) as ProductVariant[];
}

/**
 * STUB — single round-trip that generates EAN-13 barcodes for every active
 * variant of {@code productId} that doesn't already have one. Backend
 * wiring pending: replace the body once the inventory service exposes the
 * per-product endpoint.
 *
 * Contract the UI assumes:
 *   - One POST per click (no per-variant fan-out from the dashboard).
 *   - Idempotent on the server.
 *   - Returns the updated variants for the success toast count.
 */
export async function bulkGenerateBarcodesForProduct(
  productId: string,
): Promise<ProductVariant[]> {
  if (!productId) throw new Error("Product ID is required");
  const apiClient = new ApiClient();
  const data = await apiClient.post(
    inventoryUrl(
      `/api/v1/product-barcodes/products/${productId}/bulk-generate`,
    ),
    {},
  );
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return parseStringify(data) as ProductVariant[];
}

export async function lookupProductBarcode(
  barcode: string,
): Promise<ProductVariant | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/product-barcodes/lookup/${encodeURIComponent(barcode)}`,
      ),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}
